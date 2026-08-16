'use client';

import { createClient } from '@/lib/supabase/client';

export interface CourseItem {
  id: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  enrolledAt: string;
  attendanceRate: number;
  avgGrade: number | null;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  courseName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface AssignmentItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  submittedDate: string | null;
  grade: number | null;
  maxGrade: number;
  status: 'graded' | 'submitted' | 'pending' | 'overdue';
  feedback: string | null;
  courseName: string;
  teacherName: string;
  courseId: string;
}

export interface ExamItem {
  id: string;
  examName: string;
  courseName: string;
  examDate: string | null;
  marks: number | null;
  status: 'upcoming' | 'completed' | 'graded';
}

export interface StudentOverviewKPI {
  totalCourses: number;
  attendanceRate: number;
  assignmentCompletion: number;
  examAvgScore: number | null;
}

function isSchemaError(error: any): boolean {
  if (!error) return false;
  if (error.code && typeof error.code === 'string') {
    const ec = error.code.substring(0, 2);
    if (ec === '42') return true;
  }
  if (error.message) {
    return /relation.*does not exist|column.*does not exist|function.*does not exist|syntax error/i.test(error.message);
  }
  return false;
}

export const studentDashboardFullService = {
  async getStudentId(userId: string): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      if (isSchemaError(error)) throw error;
      return null;
    }
    return data?.id ?? null;
  },

  async getOverviewKPIs(studentId: string): Promise<StudentOverviewKPI> {
    const supabase = createClient();

    // Total courses
    const { count: totalCourses } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId);

    // Attendance
    const { data: attData } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId);
    const total = attData?.length ?? 0;
    const attended = attData?.filter((a) => a.status === 'present' || a.status === 'late').length ?? 0;
    const attendanceRate = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;

    // Assignment completion
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId);
    const courseIds = enrollData?.map((e) => e.course_id) ?? [];

    let totalAssignments = 0;
    if (courseIds.length > 0) {
      const { count } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds);
      totalAssignments = count ?? 0;
    }
    const { count: submittedCount } = await supabase
      .from('assignment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId);
    const assignmentCompletion =
      totalAssignments > 0 ? Math.round(((submittedCount ?? 0) / totalAssignments) * 1000) / 10 : 0;

    // Exam avg
    const { data: examData } = await supabase
      .from('exam_results')
      .select('marks')
      .eq('student_id', studentId);
    let examAvgScore: number | null = null;
    if (examData && examData.length > 0) {
      const valid = examData.filter((e) => e.marks !== null).map((e) => Number(e.marks));
      if (valid.length > 0) {
        examAvgScore = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
      }
    }

    return {
      totalCourses: totalCourses ?? 0,
      attendanceRate,
      assignmentCompletion,
      examAvgScore,
    };
  },

  async getCourses(studentId: string): Promise<CourseItem[]> {
    const supabase = createClient();
    const { data: enrollData, error } = await supabase
      .from('enrollments')
      .select('course_id, enrolled_at, courses(id, course_name, course_code, teacher_id, teachers(users(name)))')
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      if (isSchemaError(error)) throw error;
      return [];
    }
    if (!enrollData || enrollData.length === 0) return [];

    const results: CourseItem[] = [];
    for (const enroll of enrollData as any[]) {
      const course = enroll.courses;
      if (!course) continue;

      // Per-course attendance
      const { data: attData } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId)
        .eq('course_id', course.id);
      const total = attData?.length ?? 0;
      const attended = attData?.filter((a: any) => a.status === 'present' || a.status === 'late').length ?? 0;
      const attendanceRate = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;

      // Per-course avg grade
      const { data: examResults } = await supabase
        .from('exam_results')
        .select('marks, exams!inner(course_id)')
        .eq('student_id', studentId)
        .eq('exams.course_id', course.id);
      const { data: asgSubs } = await supabase
        .from('assignment_submissions')
        .select('marks, assignments!inner(course_id)')
        .eq('student_id', studentId)
        .eq('assignments.course_id', course.id);

      const allMarks = [
        ...(examResults?.filter((r: any) => r.marks !== null).map((r: any) => Number(r.marks)) ?? []),
        ...(asgSubs?.filter((s: any) => s.marks !== null).map((s: any) => Number(s.marks)) ?? []),
      ];
      const avgGrade =
        allMarks.length > 0 ? Math.round(allMarks.reduce((a, b) => a + b, 0) / allMarks.length) : null;

      results.push({
        id: course.id,
        courseName: course.course_name ?? 'Unknown',
        courseCode: course.course_code ?? '',
        teacherName: course.teachers?.users?.name ?? 'Teacher',
        enrolledAt: enroll.enrolled_at,
        attendanceRate,
        avgGrade,
      });
    }
    return results;
  },

  async getAttendanceHistory(studentId: string): Promise<AttendanceRecord[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('attendance')
      .select('id, date, status, courses(course_name)')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      if (isSchemaError(error)) throw error;
      return [];
    }
    if (!data) return [];

    return data.map((r: any) => ({
      id: r.id,
      date: r.date,
      courseName: r.courses?.course_name ?? 'Unknown',
      status: r.status as AttendanceRecord['status'],
    }));
  },

  async getAssignments(studentId: string): Promise<AssignmentItem[]> {
    const supabase = createClient();
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select('course_id, courses(id, course_name, teachers(users(name)))')
      .eq('student_id', studentId);

    if (!enrollData || enrollData.length === 0) return [];
    const courseIds = enrollData.map((e) => e.course_id);

    const courseMap: Record<string, { courseName: string; teacherName: string }> = {};
    (enrollData as any[]).forEach((e) => {
      const c = e.courses;
      if (c) {
        courseMap[e.course_id] = {
          courseName: c.course_name ?? 'Unknown',
          teacherName: c.teachers?.users?.name ?? 'Teacher',
        };
      }
    });

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, title, description, due_date, course_id')
      .in('course_id', courseIds)
      .order('due_date', { ascending: false });

    if (error || !assignments) return [];

    const assignmentIds = assignments.map((a) => a.id);
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, marks, feedback, submitted_at')
      .eq('student_id', studentId)
      .in('assignment_id', assignmentIds);

    const subMap: Record<string, any> = {};
    submissions?.forEach((s) => { subMap[s.assignment_id] = s; });

    const now = new Date();
    return assignments.map((a) => {
      const sub = subMap[a.id];
      const dueDate = a.due_date ? new Date(a.due_date) : null;
      const info = courseMap[a.course_id] ?? { courseName: 'Unknown', teacherName: 'Teacher' };

      let status: AssignmentItem['status'] = 'pending';
      if (sub) {
        status = sub.marks !== null ? 'graded' : 'submitted';
      } else if (dueDate && dueDate < now) {
        status = 'overdue';
      }

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        dueDate: a.due_date ? a.due_date.split('T')[0] : null,
        submittedDate: sub?.submitted_at ? sub.submitted_at.split('T')[0] : null,
        grade: sub?.marks !== null && sub?.marks !== undefined ? Number(sub.marks) : null,
        maxGrade: 100,
        status,
        feedback: sub?.feedback ?? null,
        courseName: info.courseName,
        teacherName: info.teacherName,
        courseId: a.course_id,
      };
    });
  },

  async submitAssignment(assignmentId: string, studentId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('assignment_submissions')
      .upsert(
        { assignment_id: assignmentId, student_id: studentId, submitted_at: new Date().toISOString() },
        { onConflict: 'assignment_id,student_id' }
      );
    return !error;
  },

  async getExams(studentId: string): Promise<ExamItem[]> {
    const supabase = createClient();
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId);

    if (!enrollData || enrollData.length === 0) return [];
    const courseIds = enrollData.map((e) => e.course_id);

    const { data: exams, error } = await supabase
      .from('exams')
      .select('id, exam_name, exam_date, course_id, courses(course_name)')
      .in('course_id', courseIds)
      .order('exam_date', { ascending: false });

    if (error || !exams) return [];

    const examIds = exams.map((e) => e.id);
    const { data: results } = await supabase
      .from('exam_results')
      .select('exam_id, marks')
      .eq('student_id', studentId)
      .in('exam_id', examIds);

    const resultMap: Record<string, number | null> = {};
    results?.forEach((r) => { resultMap[r.exam_id] = r.marks !== null ? Number(r.marks) : null; });

    const now = new Date();
    return exams.map((e: any) => {
      const examDate = e.exam_date ? new Date(e.exam_date) : null;
      const hasResult = e.id in resultMap;
      let status: ExamItem['status'] = 'upcoming';
      if (hasResult) {
        status = resultMap[e.id] !== null ? 'graded' : 'completed';
      } else if (examDate && examDate < now) {
        status = 'completed';
      }

      return {
        id: e.id,
        examName: e.exam_name,
        courseName: e.courses?.course_name ?? 'Unknown',
        examDate: e.exam_date ? e.exam_date.split('T')[0] : null,
        marks: hasResult ? resultMap[e.id] : null,
        status,
      };
    });
  },

  async getAIReport(studentId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from('ai_reports')
      .select('strengths, weaknesses, recommendations, generated_at')
      .eq('student_id', studentId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  },
};
