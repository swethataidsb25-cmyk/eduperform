-- ============================================================
-- Teacher Dashboard RLS Policies
-- Migration: 20260816090000_teacher_dashboard_rls.sql
-- ============================================================

-- Helper function: check if current user is a teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'teacher'::public.user_role
)
$$;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'::public.user_role
)
$$;

-- ============================================================
-- COURSES: teachers can manage their own courses
-- ============================================================
DROP POLICY IF EXISTS "teachers_manage_own_courses" ON public.courses;
CREATE POLICY "teachers_manage_own_courses"
ON public.courses
FOR ALL
TO authenticated
USING (
    teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
    OR public.is_admin()
)
WITH CHECK (
    teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
    OR public.is_admin()
);

DROP POLICY IF EXISTS "teachers_read_all_courses" ON public.courses;
CREATE POLICY "teachers_read_all_courses"
ON public.courses
FOR SELECT
TO authenticated
USING (true);

-- ============================================================
-- STUDENTS: teachers can read all students
-- ============================================================
DROP POLICY IF EXISTS "teachers_read_students" ON public.students;
CREATE POLICY "teachers_read_students"
ON public.students
FOR SELECT
TO authenticated
USING (public.is_teacher() OR public.is_admin() OR user_id = auth.uid());

-- ============================================================
-- ENROLLMENTS: teachers can read enrollments for their courses
-- ============================================================
DROP POLICY IF EXISTS "teachers_read_enrollments" ON public.enrollments;
CREATE POLICY "teachers_read_enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

-- ============================================================
-- ATTENDANCE: teachers can manage attendance for their courses
-- ============================================================
DROP POLICY IF EXISTS "teachers_manage_attendance" ON public.attendance;
CREATE POLICY "teachers_manage_attendance"
ON public.attendance
FOR ALL
TO authenticated
USING (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
)
WITH CHECK (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
);

-- ============================================================
-- ASSIGNMENTS: teachers can manage assignments for their courses
-- ============================================================
DROP POLICY IF EXISTS "teachers_manage_assignments" ON public.assignments;
CREATE POLICY "teachers_manage_assignments"
ON public.assignments
FOR ALL
TO authenticated
USING (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
)
WITH CHECK (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
);

DROP POLICY IF EXISTS "students_read_assignments" ON public.assignments;
CREATE POLICY "students_read_assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
    course_id IN (
        SELECT e.course_id FROM public.enrollments e
        JOIN public.students s ON e.student_id = s.id
        WHERE s.user_id = auth.uid()
    )
    OR public.is_teacher()
    OR public.is_admin()
);

-- ============================================================
-- ASSIGNMENT SUBMISSIONS: teachers can grade submissions
-- ============================================================
DROP POLICY IF EXISTS "teachers_manage_submissions" ON public.assignment_submissions;
CREATE POLICY "teachers_manage_submissions"
ON public.assignment_submissions
FOR ALL
TO authenticated
USING (
    assignment_id IN (
        SELECT a.id FROM public.assignments a
        JOIN public.courses c ON a.course_id = c.id
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
)
WITH CHECK (
    assignment_id IN (
        SELECT a.id FROM public.assignments a
        JOIN public.courses c ON a.course_id = c.id
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

-- ============================================================
-- EXAMS: teachers can manage exams for their courses
-- ============================================================
DROP POLICY IF EXISTS "teachers_manage_exams" ON public.exams;
CREATE POLICY "teachers_manage_exams"
ON public.exams
FOR ALL
TO authenticated
USING (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
)
WITH CHECK (
    course_id IN (
        SELECT c.id FROM public.courses c
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
);

DROP POLICY IF EXISTS "students_read_exams" ON public.exams;
CREATE POLICY "students_read_exams"
ON public.exams
FOR SELECT
TO authenticated
USING (
    course_id IN (
        SELECT e.course_id FROM public.enrollments e
        JOIN public.students s ON e.student_id = s.id
        WHERE s.user_id = auth.uid()
    )
    OR public.is_teacher()
    OR public.is_admin()
);

-- ============================================================
-- EXAM RESULTS: teachers can manage results for their exams
-- ============================================================
DROP POLICY IF EXISTS "teachers_manage_exam_results" ON public.exam_results;
CREATE POLICY "teachers_manage_exam_results"
ON public.exam_results
FOR ALL
TO authenticated
USING (
    exam_id IN (
        SELECT ex.id FROM public.exams ex
        JOIN public.courses c ON ex.course_id = c.id
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
)
WITH CHECK (
    exam_id IN (
        SELECT ex.id FROM public.exams ex
        JOIN public.courses c ON ex.course_id = c.id
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
);

-- ============================================================
-- TEACHERS: read access for all authenticated users
-- ============================================================
DROP POLICY IF EXISTS "authenticated_read_teachers" ON public.teachers;
CREATE POLICY "authenticated_read_teachers"
ON public.teachers
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "teachers_manage_own_profile" ON public.teachers;
CREATE POLICY "teachers_manage_own_profile"
ON public.teachers
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- USERS: read access for authenticated users
-- ============================================================
DROP POLICY IF EXISTS "authenticated_read_users" ON public.users;
CREATE POLICY "authenticated_read_users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "users_manage_own" ON public.users;
CREATE POLICY "users_manage_own"
ON public.users
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================================
-- AI REPORTS: teachers can read reports for their students
-- ============================================================
DROP POLICY IF EXISTS "teachers_read_ai_reports" ON public.ai_reports;
CREATE POLICY "teachers_read_ai_reports"
ON public.ai_reports
FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT e.student_id FROM public.enrollments e
        JOIN public.courses c ON e.course_id = c.id
        JOIN public.teachers t ON c.teacher_id = t.id
        WHERE t.user_id = auth.uid()
    )
    OR public.is_admin()
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "admin_manage_ai_reports" ON public.ai_reports;
CREATE POLICY "admin_manage_ai_reports"
ON public.ai_reports
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- MOCK DATA: Demo teacher + courses + students for testing
-- ============================================================
DO $$
DECLARE
    teacher_auth_uuid UUID := gen_random_uuid();
    student1_auth_uuid UUID := gen_random_uuid();
    student2_auth_uuid UUID := gen_random_uuid();
    student3_auth_uuid UUID := gen_random_uuid();
    teacher_profile_id UUID;
    student1_id UUID;
    student2_id UUID;
    student3_id UUID;
    course1_id UUID := gen_random_uuid();
    course2_id UUID := gen_random_uuid();
    assignment1_id UUID := gen_random_uuid();
    assignment2_id UUID := gen_random_uuid();
    exam1_id UUID := gen_random_uuid();
    exam2_id UUID := gen_random_uuid();
BEGIN
    -- Create teacher auth user
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES (
        teacher_auth_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'teacher@eduperform.io', crypt('teacher123', gen_salt('bf', 10)), now(), now(), now(),
        jsonb_build_object('name', 'Dr. James Wilson', 'role', 'teacher'),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
        false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ) ON CONFLICT (id) DO NOTHING;

    -- Create student auth users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
    (
        student1_auth_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'alice@eduperform.io', crypt('student123', gen_salt('bf', 10)), now(), now(), now(),
        jsonb_build_object('name', 'Alice Johnson', 'role', 'student'),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
        false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ),
    (
        student2_auth_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'bob@eduperform.io', crypt('student123', gen_salt('bf', 10)), now(), now(), now(),
        jsonb_build_object('name', 'Bob Martinez', 'role', 'student'),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
        false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ),
    (
        student3_auth_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'carol@eduperform.io', crypt('student123', gen_salt('bf', 10)), now(), now(), now(),
        jsonb_build_object('name', 'Carol Chen', 'role', 'student'),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
        false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    )
    ON CONFLICT (id) DO NOTHING;

    -- Get teacher profile id (created by trigger)
    SELECT id INTO teacher_profile_id FROM public.teachers WHERE user_id = teacher_auth_uuid LIMIT 1;

    -- If teacher profile not yet created by trigger, create it
    IF teacher_profile_id IS NULL THEN
        INSERT INTO public.teachers (id, user_id, specialization)
        VALUES (gen_random_uuid(), teacher_auth_uuid, 'Computer Science')
        ON CONFLICT (user_id) DO NOTHING;
        SELECT id INTO teacher_profile_id FROM public.teachers WHERE user_id = teacher_auth_uuid LIMIT 1;
    END IF;

    -- Get student profile ids
    SELECT id INTO student1_id FROM public.students WHERE user_id = student1_auth_uuid LIMIT 1;
    IF student1_id IS NULL THEN
        INSERT INTO public.students (id, user_id, department, semester, section)
        VALUES (gen_random_uuid(), student1_auth_uuid, 'Computer Science', 3, 'A')
        ON CONFLICT (user_id) DO NOTHING;
        SELECT id INTO student1_id FROM public.students WHERE user_id = student1_auth_uuid LIMIT 1;
    END IF;

    SELECT id INTO student2_id FROM public.students WHERE user_id = student2_auth_uuid LIMIT 1;
    IF student2_id IS NULL THEN
        INSERT INTO public.students (id, user_id, department, semester, section)
        VALUES (gen_random_uuid(), student2_auth_uuid, 'Computer Science', 3, 'A')
        ON CONFLICT (user_id) DO NOTHING;
        SELECT id INTO student2_id FROM public.students WHERE user_id = student2_auth_uuid LIMIT 1;
    END IF;

    SELECT id INTO student3_id FROM public.students WHERE user_id = student3_auth_uuid LIMIT 1;
    IF student3_id IS NULL THEN
        INSERT INTO public.students (id, user_id, department, semester, section)
        VALUES (gen_random_uuid(), student3_auth_uuid, 'Computer Science', 3, 'B')
        ON CONFLICT (user_id) DO NOTHING;
        SELECT id INTO student3_id FROM public.students WHERE user_id = student3_auth_uuid LIMIT 1;
    END IF;

    -- Create courses for teacher
    IF teacher_profile_id IS NOT NULL THEN
        INSERT INTO public.courses (id, course_name, course_code, teacher_id)
        VALUES
            (course1_id, 'Data Structures & Algorithms', 'CS301', teacher_profile_id),
            (course2_id, 'Database Management Systems', 'CS302', teacher_profile_id)
        ON CONFLICT (course_code) DO NOTHING;

        -- Enroll students
        IF student1_id IS NOT NULL THEN
            INSERT INTO public.enrollments (student_id, course_id)
            VALUES (student1_id, course1_id), (student1_id, course2_id)
            ON CONFLICT (student_id, course_id) DO NOTHING;
        END IF;

        IF student2_id IS NOT NULL THEN
            INSERT INTO public.enrollments (student_id, course_id)
            VALUES (student2_id, course1_id), (student2_id, course2_id)
            ON CONFLICT (student_id, course_id) DO NOTHING;
        END IF;

        IF student3_id IS NOT NULL THEN
            INSERT INTO public.enrollments (student_id, course_id)
            VALUES (student3_id, course1_id)
            ON CONFLICT (student_id, course_id) DO NOTHING;
        END IF;

        -- Create assignments
        INSERT INTO public.assignments (id, title, description, due_date, course_id)
        VALUES
            (assignment1_id, 'Binary Search Tree Implementation', 'Implement a BST with insert, delete, and search operations', NOW() + INTERVAL '7 days', course1_id),
            (assignment2_id, 'SQL Query Optimization', 'Write and optimize complex SQL queries for given scenarios', NOW() + INTERVAL '14 days', course2_id)
        ON CONFLICT (id) DO NOTHING;

        -- Create exams
        INSERT INTO public.exams (id, exam_name, course_id, exam_date)
        VALUES
            (exam1_id, 'Midterm Exam - CS301', course1_id, NOW() + INTERVAL '21 days'),
            (exam2_id, 'Midterm Exam - CS302', course2_id, NOW() + INTERVAL '28 days')
        ON CONFLICT (id) DO NOTHING;

        -- Add attendance records
        IF student1_id IS NOT NULL THEN
            INSERT INTO public.attendance (student_id, course_id, date, status)
            VALUES
                (student1_id, course1_id, CURRENT_DATE - 1, 'present'::public.attendance_status),
                (student1_id, course1_id, CURRENT_DATE - 2, 'present'::public.attendance_status),
                (student1_id, course1_id, CURRENT_DATE - 3, 'absent'::public.attendance_status),
                (student1_id, course2_id, CURRENT_DATE - 1, 'present'::public.attendance_status),
                (student1_id, course2_id, CURRENT_DATE - 2, 'late'::public.attendance_status)
            ON CONFLICT (id) DO NOTHING;
        END IF;

        IF student2_id IS NOT NULL THEN
            INSERT INTO public.attendance (student_id, course_id, date, status)
            VALUES
                (student2_id, course1_id, CURRENT_DATE - 1, 'present'::public.attendance_status),
                (student2_id, course1_id, CURRENT_DATE - 2, 'absent'::public.attendance_status),
                (student2_id, course2_id, CURRENT_DATE - 1, 'present'::public.attendance_status)
            ON CONFLICT (id) DO NOTHING;
        END IF;

        -- Add assignment submissions with grades
        IF student1_id IS NOT NULL THEN
            INSERT INTO public.assignment_submissions (assignment_id, student_id, marks, feedback)
            VALUES (assignment1_id, student1_id, 88.5, 'Excellent implementation with good edge case handling')
            ON CONFLICT (assignment_id, student_id) DO NOTHING;
        END IF;

        IF student2_id IS NOT NULL THEN
            INSERT INTO public.assignment_submissions (assignment_id, student_id, marks, feedback)
            VALUES (assignment1_id, student2_id, 72.0, 'Good effort, but missing some edge cases')
            ON CONFLICT (assignment_id, student_id) DO NOTHING;
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Teacher mock data insertion failed: %', SQLERRM;
END $$;
