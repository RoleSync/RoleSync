import React from 'react';

/**
 * The 4 distinct tiers of Role-Based Access Control (RBAC):
 * 1. super_admin   (Rank 4): Unrestricted global platform authority across all tenants
 * 2. administrator (Rank 3): Company Owner / Primary Administrator for a specific tenant
 * 3. admin         (Rank 2): Company Operations Admin for a specific tenant
 * 4. employee      (Rank 1): Staff member / Self-service scope only
 */
export type RoleTier = 'super_admin' | 'administrator' | 'admin' | 'employee';

export type RBACAction = 
  | 'view'
  | 'edit'
  | 'delete'
  | 'create'
  | 'reset_password'
  | 'change_role'
  | 'suspend'
  | 'freeze_profile'
  | 'manage_documents'
  | 'assign_id';

export interface RBACSubject {
  id: string;
  role?: string;
  isOwner?: boolean;
  companyId?: string | null;
  company_id?: string | null;
  status?: string;
  email?: string;
  name?: string;
  full_name?: string;
}

export const ROLE_RANKS: Record<RoleTier, number> = {
  super_admin: 4,
  administrator: 3,
  admin: 2,
  employee: 1,
};

export const ROLE_LABELS: Record<RoleTier, string> = {
  super_admin: 'Super Admin',
  administrator: 'Company Administrator',
  admin: 'Admin',
  employee: 'Staff / Employee',
};

/**
 * Resolves the effective RoleTier from a user object considering both role and isOwner status.
 */
export function resolveEffectiveRole(user: RBACSubject | null | undefined): RoleTier {
  if (!user) return 'employee';
  
  const role = (user.role || '').toLowerCase();
  if (role === 'super_admin' || role === 'superadmin') {
    return 'super_admin';
  }
  
  // If the user is flagged as company owner, they have the rank-3 'administrator' tier
  if (user.isOwner) {
    return 'administrator';
  }
  
  if (role === 'admin' || role === 'administrator') {
    return 'admin';
  }
  
  return 'employee';
}

/**
 * Retrieves the numerical hierarchy rank (1-4) for a given user.
 */
export function getRoleRank(user: RBACSubject | null | undefined): number {
  const tier = resolveEffectiveRole(user);
  return ROLE_RANKS[tier] ?? 1;
}

/**
 * Checks whether an actor can access a specific tenant / company.
 * Superadmins can access any company. All other roles must match companyId.
 */
export function canAccessTenant(
  actor: RBACSubject | null | undefined, 
  targetCompanyId: string | null | undefined
): boolean {
  if (!actor) return false;
  const actorTier = resolveEffectiveRole(actor);
  if (actorTier === 'super_admin') return true;
  
  const actorComp = actor.companyId || actor.company_id;
  if (!actorComp || !targetCompanyId) return false;
  return actorComp.toLowerCase() === targetCompanyId.toLowerCase();
}

/**
 * Validates whether an actor can manage a target user based on:
 * 1. Tenant boundary check (actor and target must be in the same company, unless Superadmin).
 * 2. Hierarchy superiority check (actor.rank > target.rank).
 * 3. Self-management restrictions for destructive actions (e.g. cannot demote or delete oneself).
 */
export function canManageUser(
  actor: RBACSubject | null | undefined,
  target: RBACSubject | null | undefined,
  action: RBACAction = 'edit'
): boolean {
  if (!actor || !target) return false;

  const actorRank = getRoleRank(actor);
  const targetRank = getRoleRank(target);
  const isSelf = actor.id === target.id;

  // 1. Superadmin has unrestricted authority
  if (actorRank === 4) {
    // Superadmin cannot delete or demote themselves to prevent lockout
    if (isSelf && (action === 'delete' || action === 'change_role' || action === 'suspend')) {
      return false;
    }
    return true;
  }

  // 2. Tenant isolation check: Actor and Target must share the same companyId
  const actorComp = actor.companyId || actor.company_id;
  const targetComp = target.companyId || target.company_id;
  if (!actorComp || !targetComp || actorComp.toLowerCase() !== targetComp.toLowerCase()) {
    return false;
  }

  // 3. Self actions
  if (isSelf) {
    if (action === 'view' || action === 'edit') return true;
    // Cannot delete, demote, or suspend oneself
    return false;
  }

  // 4. Hierarchy Check: Actor must have strictly higher rank than Target
  // Administrator (3) > Admin (2) > Staff (1)
  // Admin (2) > Staff (1)
  // Staff (1) > Nobody (0)
  return actorRank > targetRank;
}

/**
 * Validates whether an actor is allowed to assign a specific role to another user.
 * An actor can only assign roles that are strictly lower in rank than their own.
 */
export function canAssignRole(
  actor: RBACSubject | null | undefined,
  targetRole: RoleTier,
  targetCompanyId?: string | null
): boolean {
  if (!actor) return false;
  const actorRank = getRoleRank(actor);
  const desiredRank = ROLE_RANKS[targetRole] ?? 1;

  // Superadmin can assign anything
  if (actorRank === 4) return true;

  // Tenant check
  if (targetCompanyId && !canAccessTenant(actor, targetCompanyId)) {
    return false;
  }

  // Privilege escalation check: Actor can only assign roles below their own tier
  return actorRank > desiredRank;
}

/**
 * React Component for declarative RBAC permission gating in UI.
 * 
 * Usage:
 * <Can action="edit" actor={user} target={employee} fallback={<ProtectedBadge />}>
 *   <Button onClick={...}>Edit</Button>
 * </Can>
 */
export interface CanProps {
  action?: RBACAction;
  actor: RBACSubject | null | undefined;
  target: RBACSubject | null | undefined;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ 
  action = 'edit', 
  actor, 
  target, 
  fallback = null, 
  children 
}) => {
  const allowed = canManageUser(actor, target, action);
  return (allowed ? children : fallback) as React.ReactElement | null;
};

/**
 * React Hook for checking RBAC permissions.
 */
export function useRBAC(actor: RBACSubject | null | undefined) {
  return {
    rank: getRoleRank(actor),
    tier: resolveEffectiveRole(actor),
    canManage: (target: RBACSubject | null | undefined, action: RBACAction = 'edit') => 
      canManageUser(actor, target, action),
    canAssign: (targetRole: RoleTier, targetCompanyId?: string | null) => 
      canAssignRole(actor, targetRole, targetCompanyId),
    canAccess: (targetCompanyId: string | null | undefined) => 
      canAccessTenant(actor, targetCompanyId),
  };
}
