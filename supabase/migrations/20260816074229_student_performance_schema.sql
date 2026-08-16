-- ============================================================
-- Student Performance Management System - Database Schema
-- Migration: 20260816074229_student_performance_schema.sql
-- ============================================================

-- ============================================================
-- STEP 1: ENUM TYPES
-- ============================================================

DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'teacher', 'student');

DROP TYPE IF EXISTS public.attendance_status CASCADE;
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

-- ============================================================
-- STEP 2: CORE TABLES (no foreign key dependencies)
-- ============================================================

-- Users table (mirrors auth.users, managed by trigger)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role public.user_role NOT NULL DEFAULT 'student'::public.user_role,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STEP 3: ROLE PROFILE TABLES
-- ============================================================

-- Students table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    department TEXT NOT NULL DEFAULT '',
    semester INTEGER NOT NULL DEFAULT 1,
    section TEXT NOT NULL DEFAULT 'A',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    specialization TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ============================================================
-- STEP 4: COURSE TABLES
-- ============================================================

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_name TEXT NOT NULL,
    course_code TEXT NOT NULL UNIQUE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STEP 5: ENROLLMENT & ATTENDANCE
-- ============================================================

-- Enrollments table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status public.attendance_status NOT NULL DEFAULT 'present'::public.attendance_status,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STEP 6: ASSIGNMENT TABLES
-- ============================================================

-- Assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Assignment Submissions table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    marks NUMERIC(5, 2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);

-- ============================================================
-- STEP 7: EXAM TABLES
-- ============================================================

-- Exams table
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_name TEXT NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    exam_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Exam Results table
CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    marks NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, student_id)
);

-- ============================================================
-- STEP 8: AI REPORTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    strengths TEXT,
    weaknesses TEXT,
    recommendations TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STEP 9: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON public.students(department);

CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);

CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_code ON public.courses(course_code);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON public.attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_exams_course_id ON public.exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_exam_date ON public.exams(exam_date);

CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON public.exam_results(student_id);

CREATE INDEX IF NOT EXISTS idx_ai_reports_student_id ON public.ai_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_generated_at ON public.ai_reports(generated_at);

-- ============================================================
-- STEP 10: TRIGGER FUNCTION (handle_new_user)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role public.user_role;
BEGIN
    v_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::public.user_role,
        'student'::public.user_role
    );

    INSERT INTO public.users (id, name, email, role, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        v_role,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'handle_new_user failed: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Helper function: get user role from auth metadata (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT COALESCE(
    (SELECT role::TEXT FROM public.users WHERE id = auth.uid()),
    'student'
);
$$;

-- ============================================================
-- STEP 11: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 12: RLS POLICIES
-- ============================================================

-- users: own profile + admin full access
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.users;
CREATE POLICY "users_manage_own_profile"
ON public.users FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_full_access_users" ON public.users;
CREATE POLICY "admin_full_access_users"
ON public.users FOR SELECT TO authenticated
USING (
    public.get_current_user_role() = 'admin'
    OR id = auth.uid()
);

-- students: own record + admin/teacher read
DROP POLICY IF EXISTS "students_manage_own" ON public.students;
CREATE POLICY "students_manage_own"
ON public.students FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_teacher_read_students" ON public.students;
CREATE POLICY "admin_teacher_read_students"
ON public.students FOR SELECT TO authenticated
USING (
    public.get_current_user_role() IN ('admin', 'teacher')
    OR user_id = auth.uid()
);

-- teachers: own record + admin read
DROP POLICY IF EXISTS "teachers_manage_own" ON public.teachers;
CREATE POLICY "teachers_manage_own"
ON public.teachers FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_read_teachers" ON public.teachers;
CREATE POLICY "admin_read_teachers"
ON public.teachers FOR SELECT TO authenticated
USING (
    public.get_current_user_role() IN ('admin', 'student')
    OR user_id = auth.uid()
);

-- courses: all authenticated can read; teachers/admin can write
DROP POLICY IF EXISTS "all_read_courses" ON public.courses;
CREATE POLICY "all_read_courses"
ON public.courses FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "teacher_admin_manage_courses" ON public.courses;
CREATE POLICY "teacher_admin_manage_courses"
ON public.courses FOR INSERT TO authenticated
WITH CHECK (public.get_current_user_role() IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "teacher_admin_update_courses" ON public.courses;
CREATE POLICY "teacher_admin_update_courses"
ON public.courses FOR UPDATE TO authenticated
USING (public.get_current_user_role() IN ('admin', 'teacher'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "admin_delete_courses" ON public.courses;
CREATE POLICY "admin_delete_courses"
ON public.courses FOR DELETE TO authenticated
USING (public.get_current_user_role() = 'admin');

-- enrollments: students see own; admin/teacher see all
DROP POLICY IF EXISTS "students_view_own_enrollments" ON public.enrollments;
CREATE POLICY "students_view_own_enrollments"
ON public.enrollments FOR SELECT TO authenticated
USING (
    public.get_current_user_role() IN ('admin', 'teacher')
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "admin_teacher_manage_enrollments" ON public.enrollments;
CREATE POLICY "admin_teacher_manage_enrollments"
ON public.enrollments FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'teacher'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'teacher'));

-- attendance: students see own; teachers/admin manage
DROP POLICY IF EXISTS "students_view_own_attendance" ON public.attendance;
CREATE POLICY "students_view_own_attendance"
ON public.attendance FOR SELECT TO authenticated
USING (
    public.get_current_user_role() IN ('admin', 'teacher')
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "teacher_admin_manage_attendance" ON public.attendance;
CREATE POLICY "teacher_admin_manage_attendance"
ON public.attendance FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'teacher'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'teacher'));

-- assignments: all authenticated read; teachers/admin write
DROP POLICY IF EXISTS "all_read_assignments" ON public.assignments;
CREATE POLICY "all_read_assignments"
ON public.assignments FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "teacher_admin_manage_assignments" ON public.assignments;
CREATE POLICY "teacher_admin_manage_assignments"
ON public.assignments FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'teacher'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'teacher'));

-- assignment_submissions: students manage own; teachers/admin read all
DROP POLICY IF EXISTS "students_manage_own_submissions" ON public.assignment_submissions;
CREATE POLICY "students_manage_own_submissions"
ON public.assignment_submissions FOR ALL TO authenticated
USING (
    public.get_current_user_role() IN ('admin', 'teacher')
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
)
WITH CHECK (
    public.get_current_user_role() IN ('admin', 'teacher')
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

-- exams: all authenticated read; teachers/admin write
DROP POLICY IF EXISTS "all_read_exams" ON public.exams;
CREATE POLICY "all_read_exams"
ON public.exams FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "teacher_admin_manage_exams" ON public.exams;
CREATE POLICY "teacher_admin_manage_exams"
ON public.exams FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'teacher'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'teacher'));

-- exam_results: students see own; teachers/admin manage
DROP POLICY IF EXISTS "students_view_own_exam_results" ON public.exam_results;
CREATE POLICY "students_view_own_exam_results"
ON public.exam_results FOR SELECT TO authenticated
USING (
    public.get_current_user_role() IN ('admin', 'teacher')
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "teacher_admin_manage_exam_results" ON public.exam_results;
CREATE POLICY "teacher_admin_manage_exam_results"
ON public.exam_results FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'teacher'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'teacher'));

-- ai_reports: students see own; admin/teacher manage
DROP POLICY IF EXISTS "students_view_own_ai_reports" ON public.ai_reports;
CREATE POLICY "students_view_own_ai_reports"
ON public.ai_reports FOR SELECT TO authenticated
USING (
    public.get_current_user_role() IN ('admin', 'teacher')
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "admin_manage_ai_reports" ON public.ai_reports;
CREATE POLICY "admin_manage_ai_reports"
ON public.ai_reports FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'teacher'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'teacher'));

-- ============================================================
-- STEP 13: TRIGGER
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STEP 14: MOCK DATA
-- Demo credentials:
--   Admin:   sarah.admin@eduperform.io   / Admin@2026
--   Teacher: james.teacher@eduperform.io / Teach@2026
--   Student: priya.student@eduperform.io / Study@2026
-- ============================================================

DO $$
DECLARE
    admin_uuid    UUID := gen_random_uuid();
    teacher_uuid  UUID := gen_random_uuid();
    student_uuid  UUID := gen_random_uuid();
    teacher_id    UUID;
    student_id    UUID;
    course1_id    UUID := gen_random_uuid();
    course2_id    UUID := gen_random_uuid();
    course3_id    UUID := gen_random_uuid();
    assign1_id    UUID := gen_random_uuid();
    assign2_id    UUID := gen_random_uuid();
    exam1_id      UUID := gen_random_uuid();
    exam2_id      UUID := gen_random_uuid();
BEGIN
    -- Auth users (trigger will create public.users rows)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous,
        confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at,
        email_change_token_new, email_change, email_change_sent_at,
        email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at,
        phone, phone_change, phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'sarah.admin@eduperform.io', crypt('Admin@2026', gen_salt('bf', 10)),
         now(), now(), now(),
         jsonb_build_object('name', 'Sarah Admin', 'role', 'admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (teacher_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'james.teacher@eduperform.io', crypt('Teach@2026', gen_salt('bf', 10)),
         now(), now(), now(),
         jsonb_build_object('name', 'James Teacher', 'role', 'teacher'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (student_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'priya.student@eduperform.io', crypt('Study@2026', gen_salt('bf', 10)),
         now(), now(), now(),
         jsonb_build_object('name', 'Priya Student', 'role', 'student'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Teacher profile
    INSERT INTO public.teachers (id, user_id, specialization)
    VALUES (gen_random_uuid(), teacher_uuid, 'Computer Science & Data Structures')
    ON CONFLICT (user_id) DO NOTHING;

    SELECT id INTO teacher_id FROM public.teachers WHERE user_id = teacher_uuid LIMIT 1;

    -- Student profile
    INSERT INTO public.students (id, user_id, department, semester, section)
    VALUES (gen_random_uuid(), student_uuid, 'Computer Science', 4, 'A')
    ON CONFLICT (user_id) DO NOTHING;

    SELECT id INTO student_id FROM public.students WHERE user_id = student_uuid LIMIT 1;

    -- Courses
    INSERT INTO public.courses (id, course_name, course_code, teacher_id) VALUES
        (course1_id, 'Data Structures & Algorithms', 'CS301', teacher_id),
        (course2_id, 'Database Management Systems', 'CS302', teacher_id),
        (course3_id, 'Machine Learning Fundamentals', 'CS401', teacher_id)
    ON CONFLICT (course_code) DO NOTHING;

    -- Enrollments
    IF student_id IS NOT NULL THEN
        INSERT INTO public.enrollments (student_id, course_id) VALUES
            (student_id, course1_id),
            (student_id, course2_id),
            (student_id, course3_id)
        ON CONFLICT (student_id, course_id) DO NOTHING;

        -- Attendance records
        INSERT INTO public.attendance (student_id, course_id, date, status) VALUES
            (student_id, course1_id, CURRENT_DATE - 6, 'present'::public.attendance_status),
            (student_id, course1_id, CURRENT_DATE - 5, 'present'::public.attendance_status),
            (student_id, course1_id, CURRENT_DATE - 4, 'absent'::public.attendance_status),
            (student_id, course1_id, CURRENT_DATE - 3, 'present'::public.attendance_status),
            (student_id, course1_id, CURRENT_DATE - 2, 'late'::public.attendance_status),
            (student_id, course2_id, CURRENT_DATE - 6, 'present'::public.attendance_status),
            (student_id, course2_id, CURRENT_DATE - 5, 'present'::public.attendance_status),
            (student_id, course2_id, CURRENT_DATE - 4, 'present'::public.attendance_status),
            (student_id, course3_id, CURRENT_DATE - 3, 'present'::public.attendance_status),
            (student_id, course3_id, CURRENT_DATE - 2, 'absent'::public.attendance_status)
        ON CONFLICT (id) DO NOTHING;

        -- Assignments
        INSERT INTO public.assignments (id, title, description, due_date, course_id) VALUES
            (assign1_id, 'Binary Search Tree Implementation', 'Implement BST with insert, delete, and search operations in Python.', NOW() + INTERVAL '7 days', course1_id),
            (assign2_id, 'ER Diagram Design', 'Design an ER diagram for a hospital management system.', NOW() + INTERVAL '5 days', course2_id)
        ON CONFLICT (id) DO NOTHING;

        -- Assignment Submissions
        INSERT INTO public.assignment_submissions (assignment_id, student_id, marks, feedback) VALUES
            (assign1_id, student_id, 88.5, 'Excellent implementation. Minor edge case missed in deletion.'),
            (assign2_id, student_id, 92.0, 'Very well structured ER diagram with proper normalization.')
        ON CONFLICT (assignment_id, student_id) DO NOTHING;

        -- Exams
        INSERT INTO public.exams (id, exam_name, course_id, exam_date) VALUES
            (exam1_id, 'Mid-Term Exam', course1_id, NOW() - INTERVAL '14 days'),
            (exam2_id, 'Unit Test 1', course2_id, NOW() - INTERVAL '7 days')
        ON CONFLICT (id) DO NOTHING;

        -- Exam Results
        INSERT INTO public.exam_results (exam_id, student_id, marks) VALUES
            (exam1_id, student_id, 76.0),
            (exam2_id, student_id, 84.5)
        ON CONFLICT (exam_id, student_id) DO NOTHING;

        -- AI Report
        INSERT INTO public.ai_reports (student_id, strengths, weaknesses, recommendations, generated_at) VALUES
            (
                student_id,
                'Strong performance in Database Management and Assignment submissions. Consistent attendance in core subjects. High scores in practical assignments.',
                'Missed attendance in CS401 (Machine Learning). Mid-term exam score in CS301 below assignment performance, suggesting exam anxiety.',
                'Focus on exam preparation strategies for CS301. Attend all ML sessions to avoid falling behind. Consider forming a study group for exam revision.',
                NOW()
            )
        ON CONFLICT (id) DO NOTHING;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
