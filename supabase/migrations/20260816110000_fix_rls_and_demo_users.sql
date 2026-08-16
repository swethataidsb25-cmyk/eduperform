-- Migration: Fix RLS policies and add demo auth users
-- Timestamp: 20260816110000

-- ─── Helper function: get user role from public.users ─────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::TEXT FROM public.users WHERE id = user_id LIMIT 1;
$$;

-- ─── Helper function: check if current user is admin or teacher ───────────────
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  );
$$;

-- ─── Helper function: check if current user is admin ─────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── users table RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_all_authenticated" ON public.users;
CREATE POLICY "users_read_all_authenticated"
ON public.users FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "users_manage_own" ON public.users;
CREATE POLICY "users_manage_own"
ON public.users FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_users" ON public.users;
CREATE POLICY "admin_manage_all_users"
ON public.users FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── students table RLS ───────────────────────────────────────────────────────
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_read_authenticated" ON public.students;
CREATE POLICY "students_read_authenticated"
ON public.students FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "students_manage_own" ON public.students;
CREATE POLICY "students_manage_own"
ON public.students FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_teacher_manage_students" ON public.students;
CREATE POLICY "admin_teacher_manage_students"
ON public.students FOR ALL
TO authenticated
USING (public.is_admin_or_teacher())
WITH CHECK (public.is_admin_or_teacher());

-- ─── teachers table RLS ───────────────────────────────────────────────────────
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teachers_read_authenticated" ON public.teachers;
CREATE POLICY "teachers_read_authenticated"
ON public.teachers FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "teachers_manage_own" ON public.teachers;
CREATE POLICY "teachers_manage_own"
ON public.teachers FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_teachers" ON public.teachers;
CREATE POLICY "admin_manage_teachers"
ON public.teachers FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── courses table RLS ────────────────────────────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_read_authenticated" ON public.courses;
CREATE POLICY "courses_read_authenticated"
ON public.courses FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_teacher_manage_courses" ON public.courses;
CREATE POLICY "admin_teacher_manage_courses"
ON public.courses FOR ALL
TO authenticated
USING (public.is_admin_or_teacher())
WITH CHECK (public.is_admin_or_teacher());

-- ─── enrollments table RLS ────────────────────────────────────────────────────
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollments_read_authenticated" ON public.enrollments;
CREATE POLICY "enrollments_read_authenticated"
ON public.enrollments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_teacher_manage_enrollments" ON public.enrollments;
CREATE POLICY "admin_teacher_manage_enrollments"
ON public.enrollments FOR ALL
TO authenticated
USING (public.is_admin_or_teacher())
WITH CHECK (public.is_admin_or_teacher());

-- ─── attendance table RLS ─────────────────────────────────────────────────────
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_read_authenticated" ON public.attendance;
CREATE POLICY "attendance_read_authenticated"
ON public.attendance FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_teacher_manage_attendance" ON public.attendance;
CREATE POLICY "admin_teacher_manage_attendance"
ON public.attendance FOR ALL
TO authenticated
USING (public.is_admin_or_teacher())
WITH CHECK (public.is_admin_or_teacher());

-- ─── assignments table RLS ────────────────────────────────────────────────────
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_read_authenticated" ON public.assignments;
CREATE POLICY "assignments_read_authenticated"
ON public.assignments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_teacher_manage_assignments" ON public.assignments;
CREATE POLICY "admin_teacher_manage_assignments"
ON public.assignments FOR ALL
TO authenticated
USING (public.is_admin_or_teacher())
WITH CHECK (public.is_admin_or_teacher());

-- ─── assignment_submissions table RLS ────────────────────────────────────────
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submissions_read_authenticated" ON public.assignment_submissions;
CREATE POLICY "submissions_read_authenticated"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "students_manage_own_submissions" ON public.assignment_submissions;
CREATE POLICY "students_manage_own_submissions"
ON public.assignment_submissions FOR ALL
TO authenticated
USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  OR public.is_admin_or_teacher()
)
WITH CHECK (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  OR public.is_admin_or_teacher()
);

-- ─── exams table RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exams_read_authenticated" ON public.exams;
CREATE POLICY "exams_read_authenticated"
ON public.exams FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_teacher_manage_exams" ON public.exams;
CREATE POLICY "admin_teacher_manage_exams"
ON public.exams FOR ALL
TO authenticated
USING (public.is_admin_or_teacher())
WITH CHECK (public.is_admin_or_teacher());

-- ─── exam_results table RLS ───────────────────────────────────────────────────
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exam_results_read_authenticated" ON public.exam_results;
CREATE POLICY "exam_results_read_authenticated"
ON public.exam_results FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_teacher_manage_exam_results" ON public.exam_results;
CREATE POLICY "admin_teacher_manage_exam_results"
ON public.exam_results FOR ALL
TO authenticated
USING (public.is_admin_or_teacher())
WITH CHECK (public.is_admin_or_teacher());

-- ─── ai_reports table RLS ─────────────────────────────────────────────────────
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_reports_read_authenticated" ON public.ai_reports;
CREATE POLICY "ai_reports_read_authenticated"
ON public.ai_reports FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_teacher_manage_ai_reports" ON public.ai_reports;
CREATE POLICY "admin_teacher_manage_ai_reports"
ON public.ai_reports FOR ALL
TO authenticated
USING (public.is_admin_or_teacher())
WITH CHECK (public.is_admin_or_teacher());

-- ─── departments table RLS ────────────────────────────────────────────────────
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_read_authenticated" ON public.departments;
CREATE POLICY "departments_read_authenticated"
ON public.departments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_manage_departments" ON public.departments;
CREATE POLICY "admin_manage_departments"
ON public.departments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── roles table RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_read_authenticated" ON public.roles;
CREATE POLICY "roles_read_authenticated"
ON public.roles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_manage_roles" ON public.roles;
CREATE POLICY "admin_manage_roles"
ON public.roles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── Demo auth users ──────────────────────────────────────────────────────────
DO $$
DECLARE
  admin_uuid UUID;
  teacher_uuid UUID;
  student_uuid UUID;
  teacher_record_id UUID;
  student_record_id UUID;
  course1_id UUID;
  course2_id UUID;
  dept_id UUID;
BEGIN
  -- Check if demo users already exist
  SELECT id INTO admin_uuid FROM auth.users WHERE email = 'sarah.admin@eduperform.io' LIMIT 1;
  SELECT id INTO teacher_uuid FROM auth.users WHERE email = 'james.teacher@eduperform.io' LIMIT 1;
  SELECT id INTO student_uuid FROM auth.users WHERE email = 'priya.student@eduperform.io' LIMIT 1;

  -- Create admin auth user if not exists
  IF admin_uuid IS NULL THEN
    admin_uuid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current, email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at, phone, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'sarah.admin@eduperform.io', crypt('Admin@2026', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'Sarah Admin', 'role', 'admin'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Create teacher auth user if not exists
  IF teacher_uuid IS NULL THEN
    teacher_uuid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current, email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at, phone, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      teacher_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'james.teacher@eduperform.io', crypt('Teach@2026', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'James Teacher', 'role', 'teacher'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Create student auth user if not exists
  IF student_uuid IS NULL THEN
    student_uuid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current, email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at, phone, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      student_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'priya.student@eduperform.io', crypt('Study@2026', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'Priya Student', 'role', 'student'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Upsert into public.users
  INSERT INTO public.users (id, name, email, role)
  VALUES (admin_uuid, 'Sarah Admin', 'sarah.admin@eduperform.io', 'admin')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role;

  INSERT INTO public.users (id, name, email, role)
  VALUES (teacher_uuid, 'James Teacher', 'james.teacher@eduperform.io', 'teacher')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role;

  INSERT INTO public.users (id, name, email, role)
  VALUES (student_uuid, 'Priya Student', 'priya.student@eduperform.io', 'student')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role;

  -- Get a department id
  SELECT id INTO dept_id FROM public.departments LIMIT 1;

  -- Ensure teacher record exists
  SELECT id INTO teacher_record_id FROM public.teachers WHERE user_id = teacher_uuid LIMIT 1;
  IF teacher_record_id IS NULL THEN
    teacher_record_id := gen_random_uuid();
    INSERT INTO public.teachers (id, user_id, specialization)
    VALUES (teacher_record_id, teacher_uuid, 'Mathematics')
    ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO teacher_record_id FROM public.teachers WHERE user_id = teacher_uuid LIMIT 1;
  END IF;

  -- Ensure student record exists
  SELECT id INTO student_record_id FROM public.students WHERE user_id = student_uuid LIMIT 1;
  IF student_record_id IS NULL THEN
    student_record_id := gen_random_uuid();
    INSERT INTO public.students (id, user_id, department, semester, section, department_id)
    VALUES (student_record_id, student_uuid, 'Computer Science', 3, 'A', dept_id)
    ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO student_record_id FROM public.students WHERE user_id = student_uuid LIMIT 1;
  END IF;

  -- Ensure courses exist and are assigned to teacher
  SELECT id INTO course1_id FROM public.courses WHERE teacher_id = teacher_record_id LIMIT 1;
  IF course1_id IS NULL THEN
    -- Assign existing courses to teacher if available
    UPDATE public.courses SET teacher_id = teacher_record_id WHERE id IN (SELECT id FROM public.courses WHERE teacher_id IS NULL LIMIT 2);
    SELECT id INTO course1_id FROM public.courses WHERE teacher_id = teacher_record_id LIMIT 1;
  END IF;

  -- Enroll student in courses
  IF course1_id IS NOT NULL AND student_record_id IS NOT NULL THEN
    INSERT INTO public.enrollments (id, student_id, course_id)
    VALUES (gen_random_uuid(), student_record_id, course1_id)
    ON CONFLICT DO NOTHING;

    -- Add some attendance records
    INSERT INTO public.attendance (id, student_id, course_id, date, status)
    VALUES
      (gen_random_uuid(), student_record_id, course1_id, CURRENT_DATE - 1, 'present'),
      (gen_random_uuid(), student_record_id, course1_id, CURRENT_DATE - 2, 'present'),
      (gen_random_uuid(), student_record_id, course1_id, CURRENT_DATE - 3, 'absent'),
      (gen_random_uuid(), student_record_id, course1_id, CURRENT_DATE - 4, 'present'),
      (gen_random_uuid(), student_record_id, course1_id, CURRENT_DATE - 5, 'late')
    ON CONFLICT DO NOTHING;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Demo data setup error: %', SQLERRM;
END $$;
