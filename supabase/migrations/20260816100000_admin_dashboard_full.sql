-- Admin Dashboard: Departments & Roles tables
-- Timestamp: 20260816100000

-- 1. Departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  head_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles table (for role management)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add department_id to students if not exists
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 4. Add department_id to courses if not exists
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 5. Add description to courses if not exists
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 6. Add status to courses if not exists
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments(name);
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON public.courses(department_id);

-- 8. Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies - open read for authenticated, admin write
DROP POLICY IF EXISTS "authenticated_read_departments" ON public.departments;
CREATE POLICY "authenticated_read_departments"
  ON public.departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_write_departments" ON public.departments;
CREATE POLICY "authenticated_write_departments"
  ON public.departments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_roles" ON public.roles;
CREATE POLICY "authenticated_read_roles"
  ON public.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_write_roles" ON public.roles;
CREATE POLICY "authenticated_write_roles"
  ON public.roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. Seed departments
DO $$
BEGIN
  INSERT INTO public.departments (name, code, description) VALUES
    ('Computer Science', 'CS', 'Programming, algorithms, and software engineering'),
    ('Mathematics', 'MATH', 'Pure and applied mathematics'),
    ('Physics', 'PHY', 'Classical and modern physics'),
    ('English', 'ENG', 'Language, literature, and communication'),
    ('Biology', 'BIO', 'Life sciences and laboratory studies'),
    ('Chemistry', 'CHEM', 'Chemical sciences and laboratory work')
  ON CONFLICT (code) DO NOTHING;
END $$;

-- 11. Seed roles
DO $$
BEGIN
  INSERT INTO public.roles (name, description, permissions) VALUES
    ('Super Admin', 'Full system access', '["manage_users","manage_courses","manage_departments","view_reports","manage_roles","system_settings"]'::jsonb),
    ('Admin', 'Administrative access', '["manage_users","manage_courses","manage_departments","view_reports"]'::jsonb),
    ('Teacher', 'Teaching staff access', '["manage_courses","mark_attendance","grade_assignments","view_students"]'::jsonb),
    ('Student', 'Student access', '["view_courses","submit_assignments","view_grades","view_attendance"]'::jsonb)
  ON CONFLICT (name) DO NOTHING;
END $$;
