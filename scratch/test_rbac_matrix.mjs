/**
 * Matrix Verification Script for 4-Tier Hierarchical RBAC
 * Tiers:
 * 1. super_admin   (Rank 4) - Global Unrestricted
 * 2. administrator (Rank 3) - Company Owner (tenant-scoped)
 * 3. admin         (Rank 2) - Company Admin (tenant-scoped)
 * 4. employee      (Rank 1) - Staff / Self-service (tenant-scoped)
 */

import { 
  ROLE_RANKS, 
  resolveEffectiveRole, 
  getRoleRank, 
  canAccessTenant, 
  canManageUser, 
  canAssignRole 
} from '../src/lib/rbac.ts';

console.log('====================================================');
console.log('🧪 VERIFYING 4-TIER HIERARCHICAL RBAC MATRIX & RULES');
console.log('====================================================\n');

// Mock Users across Company A and Company B
const superadmin = {
  id: 'usr_superadmin',
  role: 'super_admin',
  isOwner: false,
  companyId: null,
  email: 'superadmin@technoml.in'
};

const ownerA = {
  id: 'usr_owner_a',
  role: 'admin',
  isOwner: true, // Administrator (Rank 3)
  companyId: 'comp_technoml_a',
  email: 'administrator@technoml.in'
};

const adminA = {
  id: 'usr_admin_a',
  role: 'admin',
  isOwner: false, // Admin (Rank 2)
  companyId: 'comp_technoml_a',
  email: 'admin@technoml.in'
};

const staffA = {
  id: 'usr_staff_a',
  role: 'employee',
  isOwner: false, // Staff (Rank 1)
  companyId: 'comp_technoml_a',
  email: 'staff@technoml.in'
};

// Users in another tenant (Company B)
const ownerB = {
  id: 'usr_owner_b',
  role: 'admin',
  isOwner: true,
  companyId: 'comp_technoml_b',
  email: 'owner@othercomp.in'
};

const adminB = {
  id: 'usr_admin_b',
  role: 'admin',
  isOwner: false,
  companyId: 'comp_technoml_b',
  email: 'admin@othercomp.in'
};

const staffB = {
  id: 'usr_staff_b',
  role: 'employee',
  isOwner: false,
  companyId: 'comp_technoml_b',
  email: 'staff@othercomp.in'
};

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// 1. Role Resolution & Hierarchy Ranks
console.log('--- 1. Testing Role Resolution & Ranks ---');
assert(resolveEffectiveRole(superadmin) === 'super_admin', 'Superadmin resolves to super_admin');
assert(getRoleRank(superadmin) === 4, 'Superadmin is Rank 4');

assert(resolveEffectiveRole(ownerA) === 'administrator', 'Company Owner resolves to administrator');
assert(getRoleRank(ownerA) === 3, 'Administrator (Owner) is Rank 3');

assert(resolveEffectiveRole(adminA) === 'admin', 'Company Admin resolves to admin');
assert(getRoleRank(adminA) === 2, 'Admin is Rank 2');

assert(resolveEffectiveRole(staffA) === 'employee', 'Staff resolves to employee');
assert(getRoleRank(staffA) === 1, 'Staff is Rank 1');

// 2. Tenant Boundary Isolation
console.log('\n--- 2. Testing Tenant Boundary Isolation ---');
assert(canAccessTenant(superadmin, 'comp_technoml_a') === true, 'Superadmin can access Company A');
assert(canAccessTenant(superadmin, 'comp_technoml_b') === true, 'Superadmin can access Company B');
assert(canAccessTenant(ownerA, 'comp_technoml_a') === true, 'Owner A can access Company A');
assert(canAccessTenant(ownerA, 'comp_technoml_b') === false, 'Owner A CANNOT access Company B');
assert(canAccessTenant(adminA, 'comp_technoml_a') === true, 'Admin A can access Company A');
assert(canAccessTenant(adminA, 'comp_technoml_b') === false, 'Admin A CANNOT access Company B');

// 3. Intracompany Hierarchy Authority (Same Tenant)
console.log('\n--- 3. Testing Same-Tenant Hierarchy Authority ---');
// Superadmin vs All
assert(canManageUser(superadmin, ownerA, 'edit') === true, 'Superadmin CAN manage Administrator');
assert(canManageUser(superadmin, adminA, 'edit') === true, 'Superadmin CAN manage Admin');
assert(canManageUser(superadmin, staffA, 'edit') === true, 'Superadmin CAN manage Staff');

// Administrator (Owner) vs Subordinates
assert(canManageUser(ownerA, adminA, 'edit') === true, 'Administrator CAN manage Admin');
assert(canManageUser(ownerA, staffA, 'edit') === true, 'Administrator CAN manage Staff');
assert(canManageUser(ownerA, superadmin, 'edit') === false, 'Administrator CANNOT manage Superadmin');
assert(canManageUser(ownerA, ownerA, 'change_role') === false, 'Administrator CANNOT demote self');

// Admin vs Subordinates & Superiors
assert(canManageUser(adminA, staffA, 'edit') === true, 'Admin CAN manage Staff');
assert(canManageUser(adminA, adminA, 'suspend') === false, 'Admin CANNOT suspend self / peer');
assert(canManageUser(adminA, ownerA, 'edit') === false, 'Admin CANNOT manage Administrator (Owner)');
assert(canManageUser(adminA, superadmin, 'edit') === false, 'Admin CANNOT manage Superadmin');

// Staff vs All
assert(canManageUser(staffA, staffA, 'delete') === false, 'Staff CANNOT delete self');
assert(canManageUser(staffA, adminA, 'edit') === false, 'Staff CANNOT manage Admin');
assert(canManageUser(staffA, ownerA, 'edit') === false, 'Staff CANNOT manage Administrator');
assert(canManageUser(staffA, superadmin, 'edit') === false, 'Staff CANNOT manage Superadmin');

// 4. Cross-Tenant Management Isolation (Different Tenants)
console.log('\n--- 4. Testing Cross-Tenant Security Isolation ---');
assert(canManageUser(ownerA, staffB, 'edit') === false, 'Owner A CANNOT manage Staff in Company B');
assert(canManageUser(ownerA, adminB, 'edit') === false, 'Owner A CANNOT manage Admin in Company B');
assert(canManageUser(adminA, staffB, 'edit') === false, 'Admin A CANNOT manage Staff in Company B');
assert(canManageUser(superadmin, staffB, 'edit') === true, 'Superadmin CAN manage Staff in Company B (Global)');
assert(canManageUser(superadmin, ownerB, 'edit') === true, 'Superadmin CAN manage Owner in Company B (Global)');

// 5. Privilege Escalation Prevention
console.log('\n--- 5. Testing Role Assignment & Privilege Escalation Prevention ---');
// Superadmin can assign anything
assert(canAssignRole(superadmin, 'administrator') === true, 'Superadmin can assign Administrator');
assert(canAssignRole(superadmin, 'admin') === true, 'Superadmin can assign Admin');
assert(canAssignRole(superadmin, 'employee') === true, 'Superadmin can assign Employee');

// Administrator (Rank 3) can assign Rank < 3 (Admin, Employee) but NOT Superadmin (Rank 4) or Administrator (Rank 3)
assert(canAssignRole(ownerA, 'admin', 'comp_technoml_a') === true, 'Administrator CAN assign Admin in same tenant');
assert(canAssignRole(ownerA, 'employee', 'comp_technoml_a') === true, 'Administrator CAN assign Employee in same tenant');
assert(canAssignRole(ownerA, 'administrator', 'comp_technoml_a') === false, 'Administrator CANNOT assign Administrator (no lateral escalation)');
assert(canAssignRole(ownerA, 'super_admin', 'comp_technoml_a') === false, 'Administrator CANNOT assign Superadmin');
assert(canAssignRole(ownerA, 'employee', 'comp_technoml_b') === false, 'Administrator CANNOT assign roles in another tenant');

// Admin (Rank 2) can assign Rank < 2 (Employee) but NOT Admin (2), Administrator (3), or Superadmin (4)
assert(canAssignRole(adminA, 'employee', 'comp_technoml_a') === true, 'Admin CAN assign Employee in same tenant');
assert(canAssignRole(adminA, 'admin', 'comp_technoml_a') === false, 'Admin CANNOT assign Admin');
assert(canAssignRole(adminA, 'administrator', 'comp_technoml_a') === false, 'Admin CANNOT assign Administrator');
assert(canAssignRole(adminA, 'super_admin', 'comp_technoml_a') === false, 'Admin CANNOT assign Superadmin');

// Staff (Rank 1) cannot assign any role
assert(canAssignRole(staffA, 'employee', 'comp_technoml_a') === false, 'Staff CANNOT assign Employee role');
assert(canAssignRole(staffA, 'admin', 'comp_technoml_a') === false, 'Staff CANNOT assign Admin role');

console.log(`\n====================================================`);
console.log(`🏁 RBAC MATRIX RESULTS: ${passedTests} / ${totalTests} tests passed.`);
console.log(`====================================================`);
