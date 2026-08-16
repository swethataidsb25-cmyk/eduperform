'use client';

import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  createdAt: string;
  department?: string;
  specialization?: string;
  semester?: number;
  section?: string;
}

export interface AdminCourse {
  id: string;
  courseName: string;
  courseCode: string;
  teacherName?: string;
  teacherId?: string;
  departmentName?: string;
  departmentId?: string;
  description?: string;
  status?: string;
  enrollmentCount: number;
  createdAt: string;
}

export interface AdminDepartment {
  id: string;
  name: string;
  code: string;
  description?: string;
  headTeacherName?: string;
  headTeacherId?: string;
  courseCount: number;
  studentCount: number;
  createdAt: string;
}

export interface AdminAnalytics {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalDepartments: number;
  totalAdmins: number;
  attendanceRate: number;
  avgGrade: number | null;
  atRiskCount: number;
}

export interface AttendanceReport {
  studentId: string;
  studentName: string;
  courseName: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

export interface ExamReport {
  examId: string;
  examName: string;
  courseName: string;
  examDate: string;
  totalStudents: number;
  avgMarks: number;
  passCount: number;
  failCount: number;
  passRate: number;
}

export interface AIReport {
  id: string;
  studentName: string;
  strengths?: string;
  weaknesses?: string;
  recommendations?: string;
  riskLevel?: string;
  generatedAt: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminFullService = {
  // ── Analytics ──────────────────────────────────────────────────────────────
  async getAnalytics(): Promise<AdminAnalytics> {
    const supabase = createClient();

    const [
      studentsRes,
      teachersRes,
      coursesRes,
      departmentsRes,
      adminsRes,
      allAttRes,
      allExamRes,
    ] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact' }),
      supabase.from('teachers').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('departments').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('attendance').select('student_id, status'),
      supabase.from('exam_results').select('student_id, marks'),
    ]);

    const totalStudents = studentsRes.count ?? 0;
    const totalTeachers = teachersRes.count ?? 0;
    const totalCourses = coursesRes.count ?? 0;
    const totalDepartments = departmentsRes.count ?? 0;
    const totalAdmins = adminsRes.count ?? 0;

    const attData = allAttRes.data ?? [];
    const totalAtt = attData.length;
    const presentAtt = attData.filter((a) => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 1000) / 10 : 0;

    const examData = allExamRes.data ?? [];
    let avgGrade: number | null = null;
    const allValidMarks = examData.filter((e) => e.marks !== null).map((e) => Number(e.marks));
    if (allValidMarks.length > 0) {
      avgGrade = Math.round((allValidMarks.reduce((a, b) => a + b, 0) / allValidMarks.length) * 10) / 10;
    }

    // Compute at-risk count using already-fetched data
    let atRiskCount = 0;
    if (studentsRes.data && studentsRes.data.length > 0) {
      const attMap = new Map<string, { total: number; present: number }>();
      for (const row of attData) {
        if (!attMap.has(row.student_id)) attMap.set(row.student_id, { total: 0, present: 0 });
        const entry = attMap.get(row.student_id)!;
        entry.total++;
        if (row.status === 'present' || row.status === 'late') entry.present++;
      }

      const examMap = new Map<string, number[]>();
      for (const row of examData) {
        if (row.marks === null) continue;
        if (!examMap.has(row.student_id)) examMap.set(row.student_id, []);
        examMap.get(row.student_id)!.push(Number(row.marks));
      }

      for (const student of studentsRes.data) {
        const att = attMap.get(student.id);
        const rate = att && att.total > 0 ? (att.present / att.total) * 100 : 100;
        const marks = examMap.get(student.id) ?? [];
        const avg = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 100;
        if (rate < 75 || avg < 50) atRiskCount++;
      }
    }

    return {
      totalStudents,
      totalTeachers,
      totalCourses,
      totalDepartments,
      totalAdmins,
      attendanceRate,
      avgGrade,
      atRiskCount,
    };
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  async getUsers(role?: 'admin' | 'teacher' | 'student'): Promise<AdminUser[]> {
    const supabase = createClient();
    let query = supabase.from('users').select('id, name, email, role, created_at').order('created_at', { ascending: false });
    if (role) query = query.eq('role', role);
    const { data, error } = await query;
    if (error) throw error;

    const users: AdminUser[] = (data ?? []).map((u: any) => ({
      id: u.id,
      name: u.name ?? '',
      email: u.email ?? '',
      role: u.role,
      createdAt: u.created_at,
    }));

    // Enrich students
    if (!role || role === 'student') {
      const { data: students } = await supabase
        .from('students')
        .select('user_id, department, semester, section');
      const studentMap = new Map((students ?? []).map((s: any) => [s.user_id, s]));
      users.forEach((u) => {
        if (u.role === 'student') {
          const s = studentMap.get(u.id) as any;
          if (s) {
            u.department = s.department;
            u.semester = s.semester;
            u.section = s.section;
          }
        }
      });
    }

    // Enrich teachers
    if (!role || role === 'teacher') {
      const { data: teachers } = await supabase
        .from('teachers')
        .select('user_id, specialization');
      const teacherMap = new Map((teachers ?? []).map((t: any) => [t.user_id, t]));
      users.forEach((u) => {
        if (u.role === 'teacher') {
          const t = teacherMap.get(u.id) as any;
          if (t) u.specialization = t.specialization;
        }
      });
    }

    return users;
  },

  async createUser(payload: { name: string; email: string; role: 'admin' | 'teacher' | 'student' }): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('users').insert({
      id: crypto.randomUUID(),
      name: payload.name,
      email: payload.email,
      role: payload.role,
    });
    if (error) throw error;
  },

  async updateUser(id: string, payload: { name?: string; email?: string; role?: string }): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('users').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteUser(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Courses ────────────────────────────────────────────────────────────────
  async getCourses(): Promise<AdminCourse[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('courses')
      .select('id, course_name, course_code, description, status, created_at, teacher_id, department_id, teachers(users(name)), departments(name), enrollments(id)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((c: any) => ({
      id: c.id,
      courseName: c.course_name,
      courseCode: c.course_code,
      description: c.description,
      status: c.status ?? 'active',
      teacherName: c.teachers?.users?.name ?? 'Unassigned',
      teacherId: c.teacher_id,
      departmentName: c.departments?.name ?? 'General',
      departmentId: c.department_id,
      enrollmentCount: Array.isArray(c.enrollments) ? c.enrollments.length : 0,
      createdAt: c.created_at,
    }));
  },

  async createCourse(payload: { courseName: string; courseCode: string; description?: string; teacherId?: string; departmentId?: string }): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('courses').insert({
      course_name: payload.courseName,
      course_code: payload.courseCode,
      description: payload.description,
      teacher_id: payload.teacherId || null,
      department_id: payload.departmentId || null,
      status: 'active',
    });
    if (error) throw error;
  },

  async updateCourse(id: string, payload: { courseName?: string; courseCode?: string; description?: string; teacherId?: string; departmentId?: string; status?: string }): Promise<void> {
    const supabase = createClient();
    const update: any = {};
    if (payload.courseName) update.course_name = payload.courseName;
    if (payload.courseCode) update.course_code = payload.courseCode;
    if (payload.description !== undefined) update.description = payload.description;
    if (payload.teacherId !== undefined) update.teacher_id = payload.teacherId || null;
    if (payload.departmentId !== undefined) update.department_id = payload.departmentId || null;
    if (payload.status) update.status = payload.status;
    const { error } = await supabase.from('courses').update(update).eq('id', id);
    if (error) throw error;
  },

  async deleteCourse(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Departments ────────────────────────────────────────────────────────────
  async getDepartments(): Promise<AdminDepartment[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code, description, head_teacher_id, created_at, teachers(users(name))')
      .order('name', { ascending: true });
    if (error) throw error;

    const depts = data ?? [];

    // Get course counts per department
    const { data: courses } = await supabase.from('courses').select('department_id');
    const courseCountMap = new Map<string, number>();
    (courses ?? []).forEach((c: any) => {
      if (c.department_id) courseCountMap.set(c.department_id, (courseCountMap.get(c.department_id) ?? 0) + 1);
    });

    // Get student counts per department
    const { data: students } = await supabase.from('students').select('department_id');
    const studentCountMap = new Map<string, number>();
    (students ?? []).forEach((s: any) => {
      if (s.department_id) studentCountMap.set(s.department_id, (studentCountMap.get(s.department_id) ?? 0) + 1);
    });

    return depts.map((d: any) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      headTeacherName: d.teachers?.users?.name,
      headTeacherId: d.head_teacher_id,
      courseCount: courseCountMap.get(d.id) ?? 0,
      studentCount: studentCountMap.get(d.id) ?? 0,
      createdAt: d.created_at,
    }));
  },

  async createDepartment(payload: { name: string; code: string; description?: string }): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('departments').insert({
      name: payload.name,
      code: payload.code.toUpperCase(),
      description: payload.description,
    });
    if (error) throw error;
  },

  async updateDepartment(id: string, payload: { name?: string; code?: string; description?: string }): Promise<void> {
    const supabase = createClient();
    const update: any = {};
    if (payload.name) update.name = payload.name;
    if (payload.code) update.code = payload.code.toUpperCase();
    if (payload.description !== undefined) update.description = payload.description;
    const { error } = await supabase.from('departments').update(update).eq('id', id);
    if (error) throw error;
  },

  async deleteDepartment(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  async getAttendanceReport(): Promise<AttendanceReport[]> {
    const supabase = createClient();
    const { data: attData, error } = await supabase
      .from('attendance')
      .select('student_id, course_id, status, students(users(name)), courses(course_name)');
    if (error) throw error;

    const grouped = new Map<string, any>();
    (attData ?? []).forEach((a: any) => {
      const key = `${a.student_id}_${a.course_id}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          studentId: a.student_id,
          studentName: a.students?.users?.name ?? 'Unknown',
          courseName: a.courses?.course_name ?? 'Unknown',
          totalClasses: 0, present: 0, absent: 0, late: 0,
        });
      }
      const entry = grouped.get(key);
      entry.totalClasses++;
      if (a.status === 'present') entry.present++;
      else if (a.status === 'absent') entry.absent++;
      else if (a.status === 'late') entry.late++;
    });

    return Array.from(grouped.values()).map((e) => ({
      ...e,
      attendanceRate: e.totalClasses > 0 ? Math.round(((e.present + e.late) / e.totalClasses) * 1000) / 10 : 0,
    }));
  },

  async getExamReport(): Promise<ExamReport[]> {
    const supabase = createClient();
    const { data: exams, error } = await supabase
      .from('exams')
      .select('id, exam_name, exam_date, courses(course_name), exam_results(marks)')
      .order('exam_date', { ascending: false });
    if (error) throw error;

    return (exams ?? []).map((e: any) => {
      const results = (e.exam_results ?? []).filter((r: any) => r.marks !== null);
      const marks = results.map((r: any) => Number(r.marks));
      const avg = marks.length > 0 ? Math.round((marks.reduce((a: number, b: number) => a + b, 0) / marks.length) * 10) / 10 : 0;
      const passCount = marks.filter((m: number) => m >= 50).length;
      return {
        examId: e.id,
        examName: e.exam_name,
        courseName: e.courses?.course_name ?? 'Unknown',
        examDate: e.exam_date ?? '',
        totalStudents: marks.length,
        avgMarks: avg,
        passCount,
        failCount: marks.length - passCount,
        passRate: marks.length > 0 ? Math.round((passCount / marks.length) * 1000) / 10 : 0,
      };
    });
  },

  async getAIReports(): Promise<AIReport[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('ai_reports')
      .select('id, strengths, weaknesses, recommendations, generated_at, students(users(name))')
      .order('generated_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      id: r.id,
      studentName: r.students?.users?.name ?? 'Unknown',
      strengths: r.strengths,
      weaknesses: r.weaknesses,
      recommendations: r.recommendations,
      generatedAt: r.generated_at,
    }));
  },

  // ── Roles ──────────────────────────────────────────────────────────────────
  async getRoles(): Promise<AdminRole[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('roles').select('*').order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: Array.isArray(r.permissions) ? r.permissions : [],
      createdAt: r.created_at,
    }));
  },

  async createRole(payload: { name: string; description?: string; permissions: string[] }): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('roles').insert({
      name: payload.name,
      description: payload.description,
      permissions: payload.permissions,
    });
    if (error) throw error;
  },

  async updateRole(id: string, payload: { name?: string; description?: string; permissions?: string[] }): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('roles').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteRole(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Helpers ────────────────────────────────────────────────────────────────
  async getTeachersForSelect(): Promise<{ id: string; name: string }[]> {
    const supabase = createClient();
    const { data } = await supabase.from('teachers').select('id, users(name)');
    return (data ?? []).map((t: any) => ({ id: t.id, name: t.users?.name ?? 'Teacher' }));
  },

  async getDepartmentsForSelect(): Promise<{ id: string; name: string }[]> {
    const supabase = createClient();
    const { data } = await supabase.from('departments').select('id, name').order('name');
    return (data ?? []).map((d: any) => ({ id: d.id, name: d.name }));
  },
};
