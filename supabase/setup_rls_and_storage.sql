-- ==========================================
-- 1. STORAGE BUCKETS SETUP & POLICIES
-- ==========================================

-- Create the storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('selfies', 'selfies', false),
  ('avatars', 'avatars', false),
  ('id-cards', 'id-cards', false),
  ('employee-documents', 'employee-documents', false),
  ('helpdesk', 'helpdesk', false),
  ('admin-attachments', 'admin-attachments', true),
  ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (normally enabled by default, comment out if permission error occurs)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplication errors
DROP POLICY IF EXISTS "Allow authenticated uploads to selfies" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read access to selfies" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to id-cards" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read access to id-cards" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to employee-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read access to employee-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to helpdesk" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read access to helpdesk" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin uploads to company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to admin-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to admin-attachments" ON storage.objects;

-- Policies for 'selfies'
CREATE POLICY "Allow authenticated uploads to selfies"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'selfies' AND
  (auth.uid()::text = regexp_replace(name, '/.*$', ''))
);

CREATE POLICY "Allow authenticated read access to selfies"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'selfies' AND (
    auth.uid()::text = regexp_replace(name, '/.*$', '')
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.role IN ('admin', 'super_admin')
    )
  )
);

-- Policies for 'avatars'
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (auth.uid()::text = regexp_replace(name, '/.*$', ''))
);

CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

-- Policies for 'id-cards'
CREATE POLICY "Allow authenticated uploads to id-cards"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'id-cards' AND
  (auth.uid()::text = regexp_replace(name, '/.*$', ''))
);

CREATE POLICY "Allow authenticated read access to id-cards"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'id-cards' AND (
    auth.uid()::text = regexp_replace(name, '/.*$', '')
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.role IN ('admin', 'super_admin')
    )
  )
);

-- Policies for 'employee-documents'
CREATE POLICY "Allow authenticated uploads to employee-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents'
);

CREATE POLICY "Allow authenticated read access to employee-documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'employee-documents' AND (
    auth.uid()::text = regexp_replace(name, '/.*$', '')
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id::text = auth.uid()::text
      AND ur.role IN ('admin', 'super_admin')
    )
  )
);

-- Policies for 'helpdesk'
CREATE POLICY "Allow authenticated uploads to helpdesk"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'helpdesk');

CREATE POLICY "Allow authenticated read access to helpdesk"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'helpdesk');

-- Policies for 'company-assets'
CREATE POLICY "Allow admin uploads to company-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-assets' AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id::text = auth.uid()::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Allow public read access to company-assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'company-assets');

-- Policies for 'admin-attachments'
CREATE POLICY "Allow authenticated uploads to admin-attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'admin-attachments' AND
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id::text = auth.uid()::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Allow public read access to admin-attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'admin-attachments');


-- ==========================================
-- 2. ATTENDANCE & RELATED TABLES POLICIES
-- ==========================================

-- Enable RLS on attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own attendance, and admins can view company attendance" ON public.attendance;
DROP POLICY IF EXISTS "Employees can insert their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Employees can check-out, and admins can update attendance" ON public.attendance;

CREATE POLICY "Users can view their own attendance, and admins can view company attendance"
ON public.attendance FOR SELECT TO authenticated
USING (
  auth.uid()::text = user_id::text
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id::text = auth.uid()::text
    WHERE p.id::text = auth.uid()::text
    AND p.company_id::text = attendance.company_id::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Employees can insert their own attendance"
ON public.attendance FOR INSERT TO authenticated
WITH CHECK (
  auth.uid()::text = user_id::text
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id::text = auth.uid()::text
    AND p.company_id::text = attendance.company_id::text
  )
);

CREATE POLICY "Employees can check-out, and admins can update attendance"
ON public.attendance FOR UPDATE TO authenticated
USING (
  auth.uid()::text = user_id::text
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id::text = auth.uid()::text
    WHERE p.id::text = auth.uid()::text
    AND p.company_id::text = attendance.company_id::text
    AND ur.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  auth.uid()::text = user_id::text
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id::text = auth.uid()::text
    WHERE p.id::text = auth.uid()::text
    AND p.company_id::text = attendance.company_id::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Enable RLS on attendance_corrections
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own corrections, and admins can view company corrections" ON public.attendance_corrections;
DROP POLICY IF EXISTS "Employees can insert corrections" ON public.attendance_corrections;
DROP POLICY IF EXISTS "Admins can update corrections" ON public.attendance_corrections;

CREATE POLICY "Users can view their own corrections, and admins can view company corrections"
ON public.attendance_corrections FOR SELECT TO authenticated
USING (
  auth.uid()::text = user_id::text
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id::text = auth.uid()::text
    WHERE p.id::text = auth.uid()::text
    AND p.company_id::text = attendance_corrections.company_id::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Employees can insert corrections"
ON public.attendance_corrections FOR INSERT TO authenticated
WITH CHECK (
  auth.uid()::text = user_id::text
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id::text = auth.uid()::text
    AND p.company_id::text = attendance_corrections.company_id::text
  )
);

CREATE POLICY "Admins can update corrections"
ON public.attendance_corrections FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id::text = auth.uid()::text
    WHERE p.id::text = auth.uid()::text
    AND p.company_id::text = attendance_corrections.company_id::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Enable RLS on employee_moods
ALTER TABLE public.employee_moods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own moods, and admins can view company moods" ON public.employee_moods;
DROP POLICY IF EXISTS "Employees can insert moods" ON public.employee_moods;

CREATE POLICY "Users can view their own moods, and admins can view company moods"
ON public.employee_moods FOR SELECT TO authenticated
USING (
  auth.uid()::text = user_id::text
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id::text = auth.uid()::text
    WHERE p.id::text = auth.uid()::text
    AND p.company_id::text = employee_moods.company_id::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Employees can insert moods"
ON public.employee_moods FOR INSERT TO authenticated
WITH CHECK (
  auth.uid()::text = user_id::text
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id::text = auth.uid()::text
    AND p.company_id::text = employee_moods.company_id::text
  )
);

-- ==========================================
-- 3. ADDITIONAL TABLES RLS & MULTI-TENANT SECURITY
-- ==========================================

-- Companies Table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read of companies" ON public.companies;
DROP POLICY IF EXISTS "Allow owners/admins to update company" ON public.companies;

CREATE POLICY "Allow public read of companies" ON public.companies 
  FOR SELECT USING (true);

CREATE POLICY "Allow owners/admins to update company" ON public.companies 
  FOR UPDATE TO authenticated 
  USING (
    auth.uid() = owner_id 
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'super_admin'
    )
  );

-- Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users/same-company select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow self insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow self/admin update profiles" ON public.profiles;

CREATE POLICY "Allow users/same-company select profiles" ON public.profiles 
  FOR SELECT TO authenticated 
  USING (
    auth.uid() = id 
    OR company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Allow self insert profiles" ON public.profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow self/admin update profiles" ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (
    auth.uid() = id 
    OR (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

-- User Roles Table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow self/company-admin select roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admin/super-admin manage roles" ON public.user_roles;

CREATE POLICY "Allow self/company-admin select roles" ON public.user_roles 
  FOR SELECT TO authenticated 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = user_roles.user_id 
      AND p.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Allow admin/super-admin manage roles" ON public.user_roles 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = user_roles.user_id 
      AND p.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

-- Company Settings Table
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow same-company read settings" ON public.company_settings;
DROP POLICY IF EXISTS "Allow admin/super-admin update settings" ON public.company_settings;

CREATE POLICY "Allow same-company read settings" ON public.company_settings 
  FOR SELECT TO authenticated 
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Allow admin/super-admin update settings" ON public.company_settings 
  FOR ALL TO authenticated 
  USING (
    (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

-- Company Features Table
ALTER TABLE public.company_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow same-company read features" ON public.company_features;
DROP POLICY IF EXISTS "Allow admin/super-admin update features" ON public.company_features;

CREATE POLICY "Allow same-company read features" ON public.company_features 
  FOR SELECT TO authenticated 
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Allow admin/super-admin update features" ON public.company_features 
  FOR ALL TO authenticated 
  USING (
    (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

-- Tasks Table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow same-company read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow admin assign tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow admin/assignee update tasks" ON public.tasks;

CREATE POLICY "Allow same-company read tasks" ON public.tasks 
  FOR SELECT TO authenticated 
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Allow admin assign tasks" ON public.tasks 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Allow admin/assignee update tasks" ON public.tasks 
  FOR UPDATE TO authenticated 
  USING (
    assigned_to = auth.uid()
    OR (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

-- Loan Targets Table
ALTER TABLE public.loan_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow self/admin read targets" ON public.loan_targets;
DROP POLICY IF EXISTS "Allow admin manage targets" ON public.loan_targets;

CREATE POLICY "Allow self/admin read targets" ON public.loan_targets 
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid()
    OR (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Allow admin manage targets" ON public.loan_targets 
  FOR ALL TO authenticated 
  USING (
    (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
  );

-- Leave Requests Table
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow self/admin read leaves" ON public.leave_requests;
DROP POLICY IF EXISTS "Allow self create leaves" ON public.leave_requests;
DROP POLICY IF EXISTS "Allow self/admin update leaves" ON public.leave_requests;

CREATE POLICY "Allow self/admin read leaves" ON public.leave_requests 
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid()
    OR (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin'))
    )
  );

CREATE POLICY "Allow self create leaves" ON public.leave_requests 
  FOR INSERT TO authenticated 
  WITH CHECK (
    user_id = auth.uid() 
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Allow self/admin update leaves" ON public.leave_requests 
  FOR UPDATE TO authenticated 
  USING (
    user_id = auth.uid()
    OR (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin'))
    )
  );

-- Kudos Table
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow same-company select kudos" ON public.kudos;
DROP POLICY IF EXISTS "Allow self insert kudos" ON public.kudos;

CREATE POLICY "Allow same-company select kudos" ON public.kudos 
  FOR SELECT TO authenticated 
  USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Allow self insert kudos" ON public.kudos 
  FOR INSERT TO authenticated 
  WITH CHECK (
    from_user = auth.uid() 
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Helpdesk Tickets Table
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow self/admin read tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow self insert tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Allow admin/assignee update tickets" ON public.helpdesk_tickets;

CREATE POLICY "Allow self/admin read tickets" ON public.helpdesk_tickets 
  FOR SELECT TO authenticated 
  USING (
    created_by = auth.uid()
    OR assignee_id = auth.uid()
    OR (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
  );

CREATE POLICY "Allow self insert tickets" ON public.helpdesk_tickets 
  FOR INSERT TO authenticated 
  WITH CHECK (
    created_by = auth.uid()
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Allow admin/assignee update tickets" ON public.helpdesk_tickets 
  FOR UPDATE TO authenticated 
  USING (
    assignee_id = auth.uid()
    OR (
      company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
  );

-- Chat Channels Table
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow same-company channels" ON public.chat_channels;

CREATE POLICY "Allow same-company channels" ON public.chat_channels 
  FOR ALL TO authenticated 
  USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Chat Messages Table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow same-company chat messages" ON public.chat_messages;

CREATE POLICY "Allow same-company chat messages" ON public.chat_messages 
  FOR ALL TO authenticated 
  USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Admin Permissions Table
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow same-company admins permissions" ON public.admin_permissions;

CREATE POLICY "Allow same-company admins permissions" ON public.admin_permissions 
  FOR ALL TO authenticated 
  USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Audit Logs Table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow same-company admins read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow insert audit logs" ON public.audit_logs;

CREATE POLICY "Allow same-company admins read audit logs" ON public.audit_logs 
  FOR SELECT TO authenticated 
  USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

CREATE POLICY "Allow insert audit logs" ON public.audit_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Notifications Table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow self read/write notifications" ON public.notifications;

CREATE POLICY "Allow self read/write notifications" ON public.notifications 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid());

