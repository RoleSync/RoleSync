-- =========================================================================
-- ROLESYNC MULTI-TENANT HIERARCHICAL RBAC ENGINE & PERMISSION BOUNDARIES
-- =========================================================================

-- 1. Helper function: Get numerical role rank of any user (1 to 4)
-- Rank 4: Superadmin (Global platform wide)
-- Rank 3: Administrator (Company Owner / Primary Administrator)
-- Rank 2: Admin (Company Operations Admin)
-- Rank 1: Staff / Employee (Self Scope)
CREATE OR REPLACE FUNCTION public.get_user_role_rank(p_user_id uuid) 
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_role text;
  v_is_owner boolean := false;
  v_company_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Check user role from user_roles
  SELECT role INTO v_role 
  FROM public.user_roles 
  WHERE user_id = p_user_id 
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      ELSE 3
    END
  LIMIT 1;

  -- Global Superadmin Rank
  IF v_role = 'super_admin' THEN
    RETURN 4;
  END IF;

  -- Check if user is the designated Company Owner in companies table
  SELECT company_id INTO v_company_id FROM public.profiles WHERE id = p_user_id;
  IF v_company_id IS NOT NULL THEN
    SELECT (owner_id = p_user_id) INTO v_is_owner 
    FROM public.companies 
    WHERE id = v_company_id;
  END IF;

  IF v_is_owner THEN
    RETURN 3; -- Administrator (Company Owner)
  END IF;

  IF v_role = 'admin' THEN
    RETURN 2; -- Company Admin
  END IF;

  RETURN 1; -- Staff / Employee
END;
$$;


-- 2. Core RBAC Validation Function: Can Actor Manage Target User?
CREATE OR REPLACE FUNCTION public.rbac_can_manage_user(
  p_actor_id uuid,
  p_target_id uuid,
  p_action text DEFAULT 'edit'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_actor_rank integer;
  v_target_rank integer;
  v_actor_company uuid;
  v_target_company uuid;
BEGIN
  IF p_actor_id IS NULL OR p_target_id IS NULL THEN
    RETURN false;
  END IF;

  v_actor_rank := public.get_user_role_rank(p_actor_id);
  v_target_rank := public.get_user_role_rank(p_target_id);

  -- 1. Superadmin (Rank 4) has unrestricted authority
  IF v_actor_rank = 4 THEN
    IF p_actor_id = p_target_id AND p_action IN ('delete', 'demote', 'suspend') THEN
      RETURN false; -- Prevent self-lockout
    END IF;
    RETURN true;
  END IF;

  -- 2. Tenant isolation check: Actor and Target must share the same company
  SELECT company_id INTO v_actor_company FROM public.profiles WHERE id = p_actor_id;
  SELECT company_id INTO v_target_company FROM public.profiles WHERE id = p_target_id;

  IF v_actor_company IS NULL OR v_target_company IS NULL OR v_actor_company <> v_target_company THEN
    RETURN false; -- Tenant boundary violation (403 Forbidden)
  END IF;

  -- 3. Self actions
  IF p_actor_id = p_target_id THEN
    IF p_action IN ('view', 'edit_profile') THEN
      RETURN true;
    END IF;
    RETURN false; -- Cannot demote, delete, or suspend oneself
  END IF;

  -- 4. Hierarchy superiority check: Actor must have strictly higher rank than Target
  -- Administrator (3) > Admin (2) > Staff (1)
  -- Admin (2) > Staff (1)
  -- Staff (1) > Nobody (0)
  RETURN v_actor_rank > v_target_rank;
END;
$$;


-- 3. Secure Hierarchical Password Reset RPC
CREATE OR REPLACE FUNCTION public.rbac_admin_reset_password(
  p_target_user_id uuid,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_can_manage boolean;
  v_email text;
BEGIN
  -- 1. Verify caller authentication
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'status', 401, 'error', 'Unauthorized: Authentication required.');
  END IF;

  -- 2. Validate password strength
  IF p_new_password IS NULL OR length(trim(p_new_password)) < 6 THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'error', 'Password must be at least 6 characters.');
  END IF;

  -- 3. Verify RBAC hierarchy & tenant boundaries
  v_can_manage := public.rbac_can_manage_user(v_caller_id, p_target_user_id, 'reset_password');
  IF NOT v_can_manage THEN
    RETURN jsonb_build_object('success', false, 'status', 403, 'error', 'Forbidden: Insufficient hierarchical authority or tenant mismatch.');
  END IF;

  -- 4. Fetch target user email
  SELECT email INTO v_email FROM auth.users WHERE id = p_target_user_id;
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'status', 404, 'error', 'Target user account not found.');
  END IF;

  -- 5. Mutate encrypted_password in auth.users
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(trim(p_new_password), extensions.gen_salt('bf')),
      updated_at = NOW()
  WHERE id = p_target_user_id;

  -- 6. Reset profile lockout counters
  UPDATE public.profiles
  SET force_password_change = TRUE,
      failed_login_count = 0,
      locked_until = NULL
  WHERE id = p_target_user_id;

  RETURN jsonb_build_object('success', true, 'status', 200, 'email', v_email, 'message', 'Password updated successfully.');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'status', 500, 'error', SQLERRM);
END;
$$;


-- 4. Secure Hierarchical Role Change RPC (Prevents Privilege Escalation)
CREATE OR REPLACE FUNCTION public.rbac_change_user_role(
  p_target_user_id uuid,
  p_new_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_rank integer;
  v_target_rank integer;
  v_desired_rank integer;
  v_can_manage boolean;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'status', 401, 'error', 'Unauthorized: Authentication required.');
  END IF;

  -- Determine desired role rank
  v_desired_rank := CASE p_new_role
    WHEN 'super_admin' THEN 4
    WHEN 'administrator' THEN 3
    WHEN 'admin' THEN 2
    ELSE 1
  END;

  v_caller_rank := public.get_user_role_rank(v_caller_id);
  v_target_rank := public.get_user_role_rank(p_target_user_id);

  -- Hierarchy check on target
  v_can_manage := public.rbac_can_manage_user(v_caller_id, p_target_user_id, 'change_role');
  IF NOT v_can_manage THEN
    RETURN jsonb_build_object('success', false, 'status', 403, 'error', 'Forbidden: Cannot alter roles for users of equal or higher tier.');
  END IF;

  -- Privilege escalation prevention: Caller cannot grant roles equal to or higher than their own rank
  IF v_caller_rank <> 4 AND v_desired_rank >= v_caller_rank THEN
    RETURN jsonb_build_object('success', false, 'status', 403, 'error', 'Forbidden: Cannot grant roles equal to or higher than your own hierarchy level.');
  END IF;

  -- Apply role updates
  DELETE FROM public.user_roles WHERE user_id = p_target_user_id;
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (p_target_user_id, CASE WHEN p_new_role = 'administrator' THEN 'admin' ELSE p_new_role END::public.app_role);

  -- If promoted to administrator, update companies.owner_id
  IF p_new_role = 'administrator' THEN
    UPDATE public.companies 
    SET owner_id = p_target_user_id 
    WHERE id = (SELECT company_id FROM public.profiles WHERE id = p_target_user_id);
  END IF;

  RETURN jsonb_build_object('success', true, 'status', 200, 'message', 'Role updated successfully.');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'status', 500, 'error', SQLERRM);
END;
$$;
