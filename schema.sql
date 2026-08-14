--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: account_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.account_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'suspended'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'admin',
    'employee'
);


--
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_status AS ENUM (
    'present',
    'late',
    'absent'
);


--
-- Name: plan_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plan_type AS ENUM (
    'basic',
    'pro',
    'enterprise'
);


--
-- Name: admin_delete_company(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_delete_company(p_company_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_role text;
BEGIN
  -- 1. Security Check: Ensure the user calling this is actually a super_admin
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = auth.uid();
  IF v_role != 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only super admins can delete companies';
  END IF;

  -- 2. Manually delete related records first to prevent foreign-key errors 
  -- (We cast to ::text to bypass the text/uuid type mismatch you were getting!)
  DELETE FROM public.company_settings WHERE company_id::text = p_company_id::text;
  DELETE FROM public.company_features WHERE company_id::text = p_company_id::text;
  DELETE FROM public.profiles WHERE company_id::text = p_company_id::text;
  
  -- 3. Finally, delete the company itself
  DELETE FROM public.companies WHERE id = p_company_id;
END;
$$;


--
-- Name: admin_reset_password(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_reset_password(p_user_id uuid, p_new_password text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'extensions'
    AS $$
DECLARE
  v_email TEXT;
  v_caller_role TEXT;
BEGIN
  -- A. Get caller's role
  SELECT role INTO v_caller_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;

  -- B. Security check: only allow if caller is an admin or super_admin
  IF v_caller_role NOT IN ('admin', 'super_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You must be an admin to reset passwords.');
  END IF;

  -- C. Get target user email
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  
  IF v_email IS NULL THEN
     RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- D. Update the password in auth.users
  -- Note: We explicitly prefix with 'extensions' to ensure it finds pgcrypto
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = NOW()
  WHERE id = p_user_id;

  -- E. Update profile status
  UPDATE public.profiles 
  SET force_password_change = TRUE,
      failed_login_count = 0,
      locked_until = NULL
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'email', v_email);
END;
$$;


--
-- Name: check_is_super_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_is_super_admin(p_user_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id AND role = 'super_admin'::public.app_role
  );
$$;


--
-- Name: check_user_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_role(p_user_id uuid, p_role public.app_role) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id AND role = p_role
  );
$$;


--
-- Name: create_company_admin(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_company_admin(p_company_id uuid, p_email text, p_full_name text, p_password text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = auth.uid();
  IF v_role != 'super_admin' THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Only super admins can create company admins.');
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'An account with this email already exists.');
  END IF;

  v_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', p_email, 
    crypt(p_password, gen_salt('bf')),
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}', 
    json_build_object('full_name', p_full_name, 'company_id', p_company_id),
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, v_user_id::text, 
    json_build_object('sub', v_user_id, 'email', p_email),
    'email', now(), now(), now()
  );

  -- FIXED: Removed the invalid 'role' column from the profiles insert!
  INSERT INTO public.profiles (id, company_id, full_name, email, status)
  VALUES (v_user_id, p_company_id, p_full_name, p_email, 'approved')
  ON CONFLICT (id) DO UPDATE 
  SET company_id = EXCLUDED.company_id, status = 'approved';

  -- The role is correctly inserted here in the user_roles table instead
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.companies SET owner_id = v_user_id WHERE id = p_company_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


--
-- Name: get_my_company_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_company_id() RETURNS text
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT company_id::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;


--
-- Name: get_next_employee_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_employee_id(p_company_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
    v_prefix TEXT;
    v_year TEXT;
    v_max_serial INT;
    v_pattern TEXT;
BEGIN
    -- Get the company prefix
    SELECT employee_id_prefix INTO v_prefix
    FROM public.companies WHERE id = p_company_id;

    -- If no prefix configured, use first 3 letters of slug in uppercase
    IF v_prefix IS NULL OR v_prefix = '' THEN
        SELECT UPPER(LEFT(slug, 3)) INTO v_prefix
        FROM public.companies WHERE id = p_company_id;
    END IF;

    -- Current 2-digit year
    v_year := TO_CHAR(NOW(), 'YY');

    -- Pattern to match existing IDs for this year: PREFIX-YY-
    v_pattern := v_prefix || '-' || v_year || '-';

    -- Find the highest serial number for this pattern
    SELECT COALESCE(
        MAX(
            CAST(
                NULLIF(REGEXP_REPLACE(employee_internal_id, '^.*-(\d+)$', '\1'), employee_internal_id)
                AS INT
            )
        ),
        0
    ) INTO v_max_serial
    FROM public.profiles
    WHERE company_id = p_company_id
      AND employee_internal_id ILIKE v_pattern || '%';

    -- Return next ID
    RETURN v_prefix || '-' || v_year || '-' || LPAD((v_max_serial + 1)::TEXT, 3, '0');
END;
$_$;


--
-- Name: get_user_company_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_company_id(p_user_id uuid) RETURNS text
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT company_id::text FROM public.profiles WHERE id = p_user_id;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _company_id uuid;
BEGIN
  -- Extract company_id from signup metadata
  _company_id := NULLIF(NEW.raw_user_meta_data->>'company_id', '')::uuid;

  -- Create the profile record
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    phone, 
    department, 
    job_title, 
    status, 
    company_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
    COALESCE(NEW.raw_user_meta_data->>'job_title', 'Employee'),
    'pending', -- Employees start as pending until admin approves
    _company_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- Assign default employee role
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, 'employee')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;


--
-- Name: has_role(public.app_role, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_role public.app_role, _user_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$;


--
-- Name: i_am_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.i_am_admin() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;


--
-- Name: i_am_super_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.i_am_super_admin() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin');
$$;


--
-- Name: is_approved(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_approved(_user_id text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id::text = _user_id 
    AND status::text = 'approved'
  );
END;
$$;


--
-- Name: is_approved(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_approved(_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND status::text = 'approved'
  );
END;
$$;


--
-- Name: is_super_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'super_admin'::public.app_role
  );
$$;


--
-- Name: resolve_email_by_employee_id(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.resolve_email_by_employee_id(p_employee_id text, p_company_slug text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_email TEXT;
    v_company_id UUID;
BEGIN
    -- Resolve company_id from slug
    SELECT id INTO v_company_id FROM public.companies WHERE slug = p_company_slug;
    
    IF v_company_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Case-insensitive match on employee_internal_id
    SELECT email INTO v_email 
    FROM public.profiles 
    WHERE LOWER(employee_internal_id) = LOWER(p_employee_id) 
      AND company_id = v_company_id;

    RETURN v_email;
END;
$$;


--
-- Name: update_company_admin(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_company_admin(p_user_id uuid, p_email text DEFAULT NULL::text, p_password text DEFAULT NULL::text, p_full_name text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_updates JSONB := '{}'::jsonb;
BEGIN
  IF p_email IS NOT NULL AND p_email <> '' THEN
    UPDATE auth.users SET email = p_email WHERE id = p_user_id;
    UPDATE auth.identities SET identity_data = jsonb_set(identity_data, '{email}', to_jsonb(p_email)) WHERE user_id = p_user_id;
    UPDATE public.profiles SET email = p_email WHERE id = p_user_id;
  END IF;

  IF p_password IS NOT NULL AND p_password <> '' THEN
    UPDATE auth.users SET encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')) WHERE id = p_user_id;
  END IF;

  IF p_full_name IS NOT NULL AND p_full_name <> '' THEN
    UPDATE auth.users SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{full_name}', to_jsonb(p_full_name)) WHERE id = p_user_id;
    UPDATE public.profiles SET full_name = p_full_name WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END;
$$;


--
-- Name: user_company(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_company(_user_id uuid) RETURNS text
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT company_id::text FROM public.profiles WHERE id = _user_id;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_messages (
    id text,
    company_id text,
    sender_id text,
    receiver_id text,
    message_type text,
    subject text,
    body text,
    attachment_url text,
    is_broadcast boolean,
    disable_replies boolean,
    require_acknowledgement boolean,
    scheduled_at text,
    expires_at text,
    read_at timestamp with time zone,
    acknowledged_at text,
    created_at timestamp with time zone,
    group_id text
);


--
-- Name: admin_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_permissions (
    id text DEFAULT gen_random_uuid(),
    company_id text,
    admin_id text,
    can_reset_passwords boolean,
    can_view_chat_history boolean,
    can_manage_payroll boolean,
    can_manage_settings boolean,
    can_approve_leaves boolean,
    updated_at timestamp with time zone
);


--
-- Name: approval_chains; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_chains (
    id text DEFAULT gen_random_uuid() NOT NULL,
    company_id text,
    leave_type text,
    step_order text,
    role_label text,
    approver_user_id text,
    created_at text
);


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id text,
    user_id text,
    date text,
    check_in timestamp with time zone,
    check_out text,
    selfie_path text,
    latitude double precision,
    longitude double precision,
    distance_m bigint,
    location_verified boolean,
    status text,
    notes text,
    created_at timestamp with time zone,
    company_id text
);


--
-- Name: attendance_corrections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_corrections (
    id text,
    company_id uuid,
    user_id text,
    date text,
    requested_check_in text,
    requested_check_out text,
    reason text,
    status text,
    original_attendance_id text,
    admin_notes text,
    reviewed_by text,
    created_at text,
    updated_at text
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text,
    company_id text,
    actor_id text,
    actor_name text,
    action text,
    entity_type text,
    entity_id text,
    details jsonb,
    ip_address text,
    created_at timestamp with time zone
);


--
-- Name: chat_channel_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_channel_members (
    channel_id text,
    user_id text,
    joined_at timestamp with time zone
);


--
-- Name: chat_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_channels (
    id text DEFAULT gen_random_uuid(),
    company_id text,
    name text,
    type text,
    created_by text,
    created_at timestamp with time zone
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id text DEFAULT gen_random_uuid(),
    company_id text,
    name text,
    type text,
    created_by text,
    created_at timestamp with time zone,
    body text DEFAULT ''::text NOT NULL,
    channel_id text,
    author_id text
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    owner_id uuid,
    status text DEFAULT 'active'::text,
    plan_type public.plan_type DEFAULT 'basic'::public.plan_type,
    logo_url text,
    theme_color text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email text,
    phone text,
    address text,
    login_preference text DEFAULT 'both'::text,
    employee_id_prefix text,
    CONSTRAINT companies_login_preference_check CHECK ((login_preference = ANY (ARRAY['email'::text, 'id'::text, 'both'::text])))
);


--
-- Name: company_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_features (
    company_id uuid NOT NULL,
    chat_enabled boolean DEFAULT true,
    tasks_enabled boolean DEFAULT true,
    kudos_enabled boolean DEFAULT true,
    birthdays_enabled boolean DEFAULT true,
    helpdesk_enabled boolean DEFAULT true,
    ai_analytics_enabled boolean DEFAULT false,
    payroll_export_enabled boolean DEFAULT false,
    multi_level_approvals_enabled boolean DEFAULT false,
    ip_whitelist_enabled boolean DEFAULT false,
    mock_gps_detection_enabled boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now(),
    wellbeing_enabled boolean DEFAULT false NOT NULL,
    feature_visibility jsonb DEFAULT '{}'::jsonb
);


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    company_name text,
    office_latitude double precision,
    office_longitude double precision,
    geofence_radius_m bigint,
    work_start_time text,
    work_end_time text,
    late_threshold_minutes bigint,
    annual_leave_quota bigint,
    sick_leave_quota bigint,
    casual_leave_quota bigint,
    updated_at timestamp with time zone,
    company_id text,
    leave_approval_sla_hours bigint,
    face_recognition_sensitivity bigint
);


--
-- Name: employee_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_documents (
    id text,
    employee_id text,
    company_id text,
    document_type text,
    file_name text,
    storage_path text,
    notes text,
    uploaded_by text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: employee_moods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_moods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    mood text NOT NULL,
    score integer DEFAULT 3 NOT NULL,
    note text,
    date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: helpdesk_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.helpdesk_attachments (
    id text,
    ticket_id text,
    company_id text,
    uploaded_by text,
    storage_path text,
    file_name text,
    mime_type text,
    size_bytes text,
    created_at text
);


--
-- Name: helpdesk_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.helpdesk_comments (
    id text,
    ticket_id text,
    company_id text,
    author_id text,
    body text,
    created_at text
);


--
-- Name: helpdesk_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.helpdesk_tickets (
    id text,
    company_id text,
    created_by text,
    assignee_id text,
    title text,
    description text,
    category text,
    priority text,
    status text,
    sla_hours text,
    due_at text,
    resolved_at text,
    created_at text,
    updated_at text
);


--
-- Name: kudos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kudos (
    id text DEFAULT gen_random_uuid(),
    company_id text,
    from_user text,
    to_user text,
    message text,
    badge text,
    created_at text
);


--
-- Name: leave_approval_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_approval_steps (
    id text,
    leave_request_id text,
    company_id text,
    step_order text,
    approver_user_id text,
    role_label text,
    status text,
    notes text,
    decided_at text,
    created_at text
);


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_requests (
    id text,
    user_id text,
    leave_type text,
    start_date text,
    end_date text,
    days bigint,
    reason text,
    status text,
    reviewed_by text,
    reviewed_at text,
    admin_notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    company_id text
);


--
-- Name: loan_target_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_target_history (
    id text,
    loan_target_id text,
    company_id text,
    user_id text,
    bank text,
    month text,
    field text,
    old_value bigint,
    new_value bigint,
    changed_by text,
    changed_at timestamp with time zone
);


--
-- Name: loan_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_targets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    month date NOT NULL,
    bank text NOT NULL,
    target integer DEFAULT 0 NOT NULL,
    achieved integer DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: login_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_logs (
    id text,
    user_id text,
    company_id text,
    email text,
    success boolean,
    ip_address text,
    user_agent text,
    failure_reason text,
    created_at timestamp with time zone
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text,
    user_id text,
    company_id text,
    type text,
    title text,
    body text,
    link text,
    read boolean,
    created_at timestamp with time zone
);


--
-- Name: password_reset_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_audit (
    id text,
    company_id text,
    admin_id text,
    target_user_id text,
    target_email text,
    success text,
    failure_reason text,
    created_at text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    company_id uuid,
    status public.account_status DEFAULT 'pending'::public.account_status,
    avatar_url text,
    department text,
    job_title text,
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    id_card_url text,
    emergency_contact text,
    address text,
    date_of_birth date,
    employee_internal_id text,
    force_password_change boolean DEFAULT false,
    failed_login_count integer DEFAULT 0,
    locked_until timestamp with time zone,
    profile_frozen boolean DEFAULT false
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text,
    description text,
    assigned_to text,
    assigned_by text,
    priority text,
    status text,
    due_date text,
    completed_at text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    company_id text,
    is_target boolean,
    target_month text,
    target_count text,
    progress_count bigint,
    parent_task_id text
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_permissions admin_permissions_company_id_admin_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_company_id_admin_id_key UNIQUE (company_id, admin_id);


--
-- Name: approval_chains approval_chains_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_chains
    ADD CONSTRAINT approval_chains_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: companies companies_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_slug_key UNIQUE (slug);


--
-- Name: company_features company_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_features
    ADD CONSTRAINT company_features_pkey PRIMARY KEY (company_id);


--
-- Name: company_settings company_settings_company_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_company_id_unique UNIQUE (company_id);


--
-- Name: employee_moods employee_moods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_moods
    ADD CONSTRAINT employee_moods_pkey PRIMARY KEY (id);


--
-- Name: loan_targets loan_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_targets
    ADD CONSTRAINT loan_targets_pkey PRIMARY KEY (id);


--
-- Name: loan_targets loan_targets_user_id_month_bank_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_targets
    ADD CONSTRAINT loan_targets_user_id_month_bank_key UNIQUE (user_id, month, bank);


--
-- Name: profiles profiles_employee_internal_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_employee_internal_id_company_id_key UNIQUE (employee_internal_id, company_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: loan_targets update_loan_targets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_loan_targets_updated_at BEFORE UPDATE ON public.loan_targets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: attendance_corrections attendance_corrections_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_corrections
    ADD CONSTRAINT attendance_corrections_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: company_features company_features_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_features
    ADD CONSTRAINT company_features_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: employee_moods employee_moods_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_moods
    ADD CONSTRAINT employee_moods_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: profiles profiles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: loan_targets Admins can delete loan targets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete loan targets" ON public.loan_targets FOR DELETE USING (((((company_id)::text = public.get_my_company_id()) AND public.i_am_admin()) OR public.i_am_super_admin()));


--
-- Name: audit_logs Admins can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())
 LIMIT 1)) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))));


--
-- Name: company_settings Admins can insert company settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert company settings" ON public.company_settings FOR INSERT WITH CHECK ((((company_id = public.get_my_company_id()) AND public.i_am_admin()) OR public.i_am_super_admin()));


--
-- Name: loan_targets Admins can insert loan targets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert loan targets" ON public.loan_targets FOR INSERT WITH CHECK (((((company_id)::text = public.get_my_company_id()) AND public.i_am_admin()) OR public.i_am_super_admin()));


--
-- Name: employee_documents Admins can manage employee documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage employee documents" ON public.employee_documents USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.company_id)::text = employee_documents.company_id) AND (EXISTS ( SELECT 1
           FROM public.user_roles
          WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role]))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.company_id)::text = employee_documents.company_id) AND (EXISTS ( SELECT 1
           FROM public.user_roles
          WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])))))))));


--
-- Name: companies Admins can update companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update companies" ON public.companies FOR UPDATE USING (((((id)::text = public.get_my_company_id()) AND public.i_am_admin()) OR public.i_am_super_admin()));


--
-- Name: company_settings Admins can update company settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update company settings" ON public.company_settings FOR UPDATE USING ((((company_id = public.get_my_company_id()) AND public.i_am_admin()) OR public.i_am_super_admin()));


--
-- Name: tasks Admins can update company tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update company tasks" ON public.tasks FOR UPDATE USING ((((company_id IN ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text))) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND (user_roles.role = 'admin'::public.app_role))))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND (user_roles.role = 'super_admin'::public.app_role)))))) WITH CHECK ((((company_id IN ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text))) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND (user_roles.role = 'admin'::public.app_role))))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND (user_roles.role = 'super_admin'::public.app_role))))));


--
-- Name: attendance_corrections Admins can update corrections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update corrections" ON public.attendance_corrections FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.user_roles ur ON (((ur.user_id)::text = (auth.uid())::text)))
  WHERE (((p.id)::text = (auth.uid())::text) AND ((p.company_id)::text = (attendance_corrections.company_id)::text) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role]))))));


--
-- Name: loan_targets Admins can update loan targets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update loan targets" ON public.loan_targets FOR UPDATE USING (((((company_id)::text = public.get_my_company_id()) AND public.i_am_admin()) OR public.i_am_super_admin()));


--
-- Name: companies Allow public inserts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public inserts" ON public.companies FOR INSERT TO anon WITH CHECK (true);


--
-- Name: companies Allow public read access to active companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to active companies" ON public.companies FOR SELECT USING ((status = 'active'::text));


--
-- Name: company_features Allow super_admins full access to company_features; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow super_admins full access to company_features" ON public.company_features USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role)))));


--
-- Name: company_settings Allow super_admins full access to company_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow super_admins full access to company_settings" ON public.company_settings USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role)))));


--
-- Name: profiles Allow super_admins full access to profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow super_admins full access to profiles" ON public.profiles USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::public.app_role)))));


--
-- Name: attendance Employees can check-out, and admins can update attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can check-out, and admins can update attendance" ON public.attendance FOR UPDATE TO authenticated USING ((((auth.uid())::text = user_id) OR (EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.user_roles ur ON (((ur.user_id)::text = (auth.uid())::text)))
  WHERE (((p.id)::text = (auth.uid())::text) AND ((p.company_id)::text = attendance.company_id) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role]))))))) WITH CHECK ((((auth.uid())::text = user_id) OR (EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.user_roles ur ON (((ur.user_id)::text = (auth.uid())::text)))
  WHERE (((p.id)::text = (auth.uid())::text) AND ((p.company_id)::text = attendance.company_id) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])))))));


--
-- Name: attendance_corrections Employees can insert corrections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can insert corrections" ON public.attendance_corrections FOR INSERT TO authenticated WITH CHECK ((((auth.uid())::text = user_id) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE (((p.id)::text = (auth.uid())::text) AND ((p.company_id)::text = (attendance_corrections.company_id)::text))))));


--
-- Name: employee_moods Employees can insert moods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can insert moods" ON public.employee_moods FOR INSERT TO authenticated WITH CHECK ((((auth.uid())::text = (user_id)::text) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE (((p.id)::text = (auth.uid())::text) AND ((p.company_id)::text = (employee_moods.company_id)::text))))));


--
-- Name: attendance Employees can insert their own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can insert their own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK ((((auth.uid())::text = user_id) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE (((p.id)::text = (auth.uid())::text) AND ((p.company_id)::text = attendance.company_id))))));


--
-- Name: tasks Employees can update assigned tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can update assigned tasks" ON public.tasks FOR UPDATE USING ((assigned_to = (auth.uid())::text)) WITH CHECK ((assigned_to = (auth.uid())::text));


--
-- Name: tasks Employees can update their assigned tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can update their assigned tasks" ON public.tasks FOR UPDATE USING ((assigned_to = (auth.uid())::text)) WITH CHECK ((assigned_to = (auth.uid())::text));


--
-- Name: employee_documents Employees can view own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can view own documents" ON public.employee_documents FOR SELECT USING (((auth.uid())::text = employee_id));


--
-- Name: chat_channel_members Users can delete channel members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete channel members" ON public.chat_channel_members FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.chat_channels
  WHERE ((chat_channels.id = chat_channel_members.channel_id) AND ((chat_channels.company_id = public.get_my_company_id()) OR public.i_am_super_admin())))));


--
-- Name: chat_channel_members Users can insert channel members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert channel members" ON public.chat_channel_members FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.chat_channels
  WHERE ((chat_channels.id = chat_channel_members.channel_id) AND ((chat_channels.company_id = public.get_my_company_id()) OR public.i_am_super_admin())))));


--
-- Name: chat_channels Users can insert channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert channels" ON public.chat_channels FOR INSERT WITH CHECK (((company_id = public.get_my_company_id()) OR public.i_am_super_admin()));


--
-- Name: chat_messages Users can insert messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert messages" ON public.chat_messages FOR INSERT WITH CHECK (((company_id = public.get_my_company_id()) OR public.i_am_super_admin()));


--
-- Name: employee_moods Users can insert own moods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own moods" ON public.employee_moods FOR INSERT WITH CHECK (((company_id)::text = public.get_my_company_id()));


--
-- Name: chat_channel_members Users can read channel members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read channel members" ON public.chat_channel_members FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chat_channels
  WHERE ((chat_channels.id = chat_channel_members.channel_id) AND ((chat_channels.company_id = public.get_my_company_id()) OR public.i_am_super_admin())))));


--
-- Name: companies Users can read companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read companies" ON public.companies FOR SELECT USING ((((id)::text = public.get_my_company_id()) OR public.i_am_super_admin()));


--
-- Name: company_settings Users can read company settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read company settings" ON public.company_settings FOR SELECT USING (((company_id = public.get_my_company_id()) OR public.i_am_super_admin()));


--
-- Name: chat_messages Users can read messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read messages" ON public.chat_messages FOR SELECT USING (((company_id = public.get_my_company_id()) OR public.i_am_super_admin()));


--
-- Name: chat_channels Users can read own channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own channels" ON public.chat_channels FOR SELECT USING (((company_id = public.get_my_company_id()) OR public.i_am_super_admin()));


--
-- Name: employee_moods Users can read own company moods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own company moods" ON public.employee_moods FOR SELECT USING ((((company_id)::text = public.get_my_company_id()) OR public.i_am_super_admin()));


--
-- Name: loan_targets Users can read own loan targets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own loan targets" ON public.loan_targets FOR SELECT USING ((((company_id)::text = public.get_my_company_id()) OR public.i_am_super_admin()));


--
-- Name: chat_channels Users can update channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update channels" ON public.chat_channels FOR UPDATE USING (((company_id = public.get_my_company_id()) OR public.i_am_super_admin()));


--
-- Name: chat_messages Users can update messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update messages" ON public.chat_messages FOR UPDATE USING (((company_id = public.get_my_company_id()) OR public.i_am_super_admin()));


--
-- Name: attendance Users can view their own attendance, and admins can view compan; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own attendance, and admins can view compan" ON public.attendance FOR SELECT TO authenticated USING ((((auth.uid())::text = user_id) OR (EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.user_roles ur ON (((ur.user_id)::text = (auth.uid())::text)))
  WHERE (((p.id)::text = (auth.uid())::text) AND ((p.company_id)::text = attendance.company_id) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])))))));


--
-- Name: attendance_corrections Users can view their own corrections, and admins can view compa; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own corrections, and admins can view compa" ON public.attendance_corrections FOR SELECT TO authenticated USING ((((auth.uid())::text = user_id) OR (EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.user_roles ur ON (((ur.user_id)::text = (auth.uid())::text)))
  WHERE (((p.id)::text = (auth.uid())::text) AND ((p.company_id)::text = (attendance_corrections.company_id)::text) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])))))));


--
-- Name: employee_moods Users can view their own moods, and admins can view company moo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own moods, and admins can view company moo" ON public.employee_moods FOR SELECT TO authenticated USING ((((auth.uid())::text = (user_id)::text) OR (EXISTS ( SELECT 1
   FROM (public.profiles p
     JOIN public.user_roles ur ON (((ur.user_id)::text = (auth.uid())::text)))
  WHERE (((p.id)::text = (auth.uid())::text) AND ((p.company_id)::text = (employee_moods.company_id)::text) AND (ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])))))));


--
-- Name: admin_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_messages admin_messages_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_messages_insert ON public.admin_messages FOR INSERT TO authenticated WITH CHECK (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND (sender_id = (auth.uid())::text) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])))))));


--
-- Name: admin_messages admin_messages_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_messages_select ON public.admin_messages FOR SELECT TO authenticated USING (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND ((sender_id = (auth.uid())::text) OR (receiver_id = (auth.uid())::text) OR (is_broadcast = true))));


--
-- Name: admin_messages admin_messages_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_messages_update ON public.admin_messages FOR UPDATE TO authenticated USING (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND ((receiver_id = (auth.uid())::text) OR (sender_id = (auth.uid())::text))));


--
-- Name: admin_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_permissions admin_permissions_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_permissions_insert ON public.admin_permissions FOR INSERT TO authenticated WITH CHECK (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])))))));


--
-- Name: admin_permissions admin_permissions_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_permissions_select ON public.admin_permissions FOR SELECT TO authenticated USING (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])))))));


--
-- Name: admin_permissions admin_permissions_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_permissions_update ON public.admin_permissions FOR UPDATE TO authenticated USING (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role]))))))) WITH CHECK ((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)));


--
-- Name: approval_chains; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.approval_chains ENABLE ROW LEVEL SECURITY;

--
-- Name: approval_chains approval_chains_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY approval_chains_delete ON public.approval_chains FOR DELETE TO authenticated USING (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND ((user_roles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));


--
-- Name: approval_chains approval_chains_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY approval_chains_insert ON public.approval_chains FOR INSERT TO authenticated WITH CHECK (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND ((user_roles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));


--
-- Name: approval_chains approval_chains_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY approval_chains_select ON public.approval_chains FOR SELECT TO authenticated USING ((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)));


--
-- Name: approval_chains approval_chains_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY approval_chains_update ON public.approval_chains FOR UPDATE TO authenticated USING (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND ((user_roles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));


--
-- Name: attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: attendance_corrections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_channel_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_channels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_channels chat_channels_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chat_channels_delete ON public.chat_channels FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role]))))));


--
-- Name: chat_channels chat_channels_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chat_channels_insert ON public.chat_channels FOR INSERT TO authenticated WITH CHECK (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND (created_by = (auth.uid())::text) AND public.is_approved(auth.uid())));


--
-- Name: chat_channels chat_channels_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chat_channels_select ON public.chat_channels FOR SELECT TO authenticated USING (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND public.is_approved(auth.uid())));


--
-- Name: chat_channels chat_channels_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chat_channels_update ON public.chat_channels FOR UPDATE TO authenticated USING (((created_by = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND (user_roles.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])))))));


--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages chat_messages_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chat_messages_insert ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND (author_id = (auth.uid())::text) AND public.is_approved(auth.uid())));


--
-- Name: chat_messages chat_messages_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chat_messages_select ON public.chat_messages FOR SELECT TO authenticated USING (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND public.is_approved(auth.uid())));


--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: companies companies_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY companies_select_policy ON public.companies FOR SELECT USING (((public.get_user_company_id(auth.uid()) = (id)::text) OR public.check_is_super_admin(auth.uid())));


--
-- Name: companies companies_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY companies_update_policy ON public.companies FOR UPDATE USING (((public.check_user_role(auth.uid(), 'admin'::public.app_role) AND (public.get_user_company_id(auth.uid()) = (id)::text)) OR public.check_is_super_admin(auth.uid()))) WITH CHECK (((public.check_user_role(auth.uid(), 'admin'::public.app_role) AND (public.get_user_company_id(auth.uid()) = (id)::text)) OR public.check_is_super_admin(auth.uid())));


--
-- Name: company_features; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_features ENABLE ROW LEVEL SECURITY;

--
-- Name: company_features company_features_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY company_features_delete ON public.company_features FOR DELETE TO authenticated USING ((((company_id)::text = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND ((user_roles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.companies
  WHERE (((companies.id)::text = (company_features.company_id)::text) AND ((companies.owner_id)::text = (auth.uid())::text)))))));


--
-- Name: company_features company_features_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY company_features_insert ON public.company_features FOR INSERT TO authenticated WITH CHECK ((((company_id)::text = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND ((user_roles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.companies
  WHERE (((companies.id)::text = (company_features.company_id)::text) AND ((companies.owner_id)::text = (auth.uid())::text)))))));


--
-- Name: company_features company_features_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY company_features_select ON public.company_features FOR SELECT TO authenticated USING (((company_id)::text = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)));


--
-- Name: company_features company_features_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY company_features_update ON public.company_features FOR UPDATE TO authenticated USING ((((company_id)::text = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE (((user_roles.user_id)::text = (auth.uid())::text) AND ((user_roles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.companies
  WHERE (((companies.id)::text = (company_features.company_id)::text) AND ((companies.owner_id)::text = (auth.uid())::text)))))));


--
-- Name: company_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: company_settings company_settings_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY company_settings_insert_policy ON public.company_settings FOR INSERT WITH CHECK (((public.check_user_role(auth.uid(), 'admin'::public.app_role) AND (public.get_user_company_id(auth.uid()) = company_id)) OR public.check_is_super_admin(auth.uid())));


--
-- Name: company_settings company_settings_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY company_settings_select_policy ON public.company_settings FOR SELECT USING (((public.get_user_company_id(auth.uid()) = company_id) OR public.check_is_super_admin(auth.uid())));


--
-- Name: company_settings company_settings_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY company_settings_update_policy ON public.company_settings FOR UPDATE USING (((public.check_user_role(auth.uid(), 'admin'::public.app_role) AND (public.get_user_company_id(auth.uid()) = company_id)) OR public.check_is_super_admin(auth.uid()))) WITH CHECK (((public.check_user_role(auth.uid(), 'admin'::public.app_role) AND (public.get_user_company_id(auth.uid()) = company_id)) OR public.check_is_super_admin(auth.uid())));


--
-- Name: employee_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_moods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_moods ENABLE ROW LEVEL SECURITY;

--
-- Name: helpdesk_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.helpdesk_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: helpdesk_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.helpdesk_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: helpdesk_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: kudos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;

--
-- Name: kudos kudos_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kudos_insert ON public.kudos FOR INSERT TO authenticated WITH CHECK (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND (from_user = (auth.uid())::text) AND public.is_approved(auth.uid())));


--
-- Name: kudos kudos_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kudos_select ON public.kudos FOR SELECT TO authenticated USING (((company_id = ( SELECT (profiles.company_id)::text AS company_id
   FROM public.profiles
  WHERE ((profiles.id)::text = (auth.uid())::text)
 LIMIT 1)) AND public.is_approved(auth.uid())));


--
-- Name: leave_approval_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leave_approval_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: leave_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_target_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_target_history ENABLE ROW LEVEL SECURITY;

--
-- Name: loan_targets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loan_targets ENABLE ROW LEVEL SECURITY;

--
-- Name: login_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: password_reset_audit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_reset_audit ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_delete_policy ON public.profiles FOR DELETE USING (((public.check_user_role(auth.uid(), 'admin'::public.app_role) AND (public.get_user_company_id(auth.uid()) = (company_id)::text)) OR public.check_is_super_admin(auth.uid())));


--
-- Name: profiles profiles_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insert_policy ON public.profiles FOR INSERT WITH CHECK (((auth.uid() = id) OR (public.check_user_role(auth.uid(), 'admin'::public.app_role) AND (public.get_user_company_id(auth.uid()) = (company_id)::text)) OR public.check_is_super_admin(auth.uid())));


--
-- Name: profiles profiles_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_policy ON public.profiles FOR SELECT USING (((auth.uid() = id) OR (public.get_user_company_id(auth.uid()) = (company_id)::text) OR public.check_is_super_admin(auth.uid())));


--
-- Name: profiles profiles_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_policy ON public.profiles FOR UPDATE USING ((((auth.uid() = id) AND (NOT profile_frozen)) OR (public.check_user_role(auth.uid(), 'admin'::public.app_role) AND (public.get_user_company_id(auth.uid()) = (company_id)::text)) OR public.check_is_super_admin(auth.uid()))) WITH CHECK ((((auth.uid() = id) AND (NOT profile_frozen)) OR (public.check_user_role(auth.uid(), 'admin'::public.app_role) AND (public.get_user_company_id(auth.uid()) = (company_id)::text)) OR public.check_is_super_admin(auth.uid())));


--
-- Name: loan_targets self read loan targets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "self read loan targets" ON public.loan_targets FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks tasks_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tasks_delete ON public.tasks FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.companies
  WHERE ((companies.owner_id = auth.uid()) AND (companies.id = (tasks.company_id)::uuid))))));


--
-- Name: tasks tasks_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tasks_insert ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: tasks tasks_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tasks_select ON public.tasks FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.companies
  WHERE ((companies.owner_id = auth.uid()) AND ((companies.id = (tasks.company_id)::uuid) OR (tasks.company_id IS NULL))))) OR ((assigned_to)::uuid = auth.uid())));


--
-- Name: tasks tasks_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tasks_update ON public.tasks FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.companies
  WHERE ((companies.owner_id = auth.uid()) AND (companies.id = (tasks.company_id)::uuid)))) OR ((assigned_to)::uuid = auth.uid()))) WITH CHECK (((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY (ARRAY['admin'::text, 'super_admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM public.companies
  WHERE ((companies.owner_id = auth.uid()) AND (companies.id = (tasks.company_id)::uuid)))) OR (((assigned_to)::uuid = auth.uid()) AND true)));


--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles user_roles_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_select_policy ON public.user_roles FOR SELECT USING (((auth.uid() = user_id) OR (public.get_user_company_id(auth.uid()) = public.get_user_company_id(user_id)) OR public.check_is_super_admin(auth.uid())));


--
-- Name: user_roles user_roles_write_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_write_policy ON public.user_roles USING (((public.check_user_role(auth.uid(), 'admin'::public.app_role) AND (public.get_user_company_id(auth.uid()) = public.get_user_company_id(user_id))) OR public.check_is_super_admin(auth.uid()))) WITH CHECK (((public.check_user_role(auth.uid(), 'admin'::public.app_role) AND (public.get_user_company_id(auth.uid()) = public.get_user_company_id(user_id))) OR public.check_is_super_admin(auth.uid())));


--
-- PostgreSQL database dump complete
--

