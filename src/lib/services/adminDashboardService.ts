'use client';

import { createClient } from '@/lib/supabase/client';

export interface AdminKPIData {
  totalStudents: number;
  atRiskCount: number;
  attendanceRate: number;
  avgGrade: number | null;
  activeCourses: number;
  pendingAIReviews: number;
}

export interface AttendanceByDept {
  dept: string;
  rate: number;
  target: number;
}

export interface GradeTrendPoint {
  cycle: string;
  avgGrade: number;
  passRate: number;
}

export interface AtRiskStudent {
  id: string;
  name: string;
  grade: string;
  subject: string;
  aiScore: number;
  attendance: string;
  avgGrade: number;
  lastSeen: string;
  risk: 'critical' | 'warning';
  interventionStatus: 'pending' | 'info';
  teacher: string;
}

function isSchemaError(error: any): boolean {
  if (!error) return false;
  if (error.code && typeof error.code === 'string') {
    const errorClass = error.code.substring(0, 2);
    if (errorClass === '42') return true;
    if (errorClass === '23') return false;
    if (errorClass === '08') return true;
  }
  if (error.message) {
    const schemaErrorPatterns = [
      /relation.*does not exist/i,
      /column.*does not exist/i,
      /function.*does not exist/i,
      /syntax error/i,
    ];
    return schemaErrorPatterns.some((p) => p.test(error.message));
  }
  return false;
}

export const adminDashboardService = {
  async getKPIData(): Promise<AdminKPIData> {
    const supabase = createClient();

    // Run all queries in parallel — single round trip
    const [
      studentsRes,
      coursesRes,
      aiReportsRes,
      allAttRes,
      allExamRes,
    ] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact' }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('ai_reports').select('*', { count: 'exact', head: true }),
      supabase.from('attendance').select('student_id, status'),
      supabase.from('exam_results').select('student_id, marks'),
    ]);

    if (allAttRes.error && isSchemaError(allAttRes.error)) throw allAttRes.error;
    if (allExamRes.error && isSchemaError(allExamRes.error)) throw allExamRes.error;

    const attData = allAttRes.data ?? [];
    const totalAtt = attData.length;
    const presentAtt = attData.filter((a) => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 1000) / 10 : 0;

    const examData = allExamRes.data ?? [];
    let avgGrade: number | null = null;
    const validMarks = examData.filter((e) => e.marks !== null).map((e) => Number(e.marks));
    if (validMarks.length > 0) {
      avgGrade = Math.round((validMarks.reduce((a, b) => a + b, 0) / validMarks.length) * 10) / 10;
    }

    // Compute at-risk count using already-fetched data (no extra queries)
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
      totalStudents: studentsRes.count ?? 0,
      atRiskCount,
      attendanceRate,
      avgGrade,
      activeCourses: coursesRes.count ?? 0,
      pendingAIReviews: aiReportsRes.count ?? 0,
    };
  },

  async getAttendanceByDept(): Promise<AttendanceByDept[]> {
    const supabase = createClient();
    try {
      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('id, course_name');
      if (courseError && isSchemaError(courseError)) throw courseError;
      if (!courses || courses.length === 0) return [];

      const courseIds = courses.map((c) => c.id);
      const { data: allAtt } = await supabase
        .from('attendance')
        .select('course_id, status')
        .in('course_id', courseIds);

      const attByCourse = new Map<string, { total: number; present: number }>();
      for (const row of allAtt ?? []) {
        if (!attByCourse.has(row.course_id)) attByCourse.set(row.course_id, { total: 0, present: 0 });
        const entry = attByCourse.get(row.course_id)!;
        entry.total++;
        if (row.status === 'present' || row.status === 'late') entry.present++;
      }

      const results: AttendanceByDept[] = [];
      for (const course of courses) {
        const att = attByCourse.get(course.id);
        if (!att || att.total === 0) continue;
        const rate = Math.round((att.present / att.total) * 1000) / 10;
        results.push({ dept: course.course_name, rate, target: 90 });
      }

      return results.slice(0, 7);
    } catch (err: any) {
      console.error('getAttendanceByDept error:', err.message);
      return [];
    }
  },

  async getGradeTrend(): Promise<GradeTrendPoint[]> {
    const supabase = createClient();
    try {
      const { data: exams, error: examError } = await supabase
        .from('exams')
        .select('id, exam_name, exam_date')
        .order('exam_date', { ascending: true });
      if (examError && isSchemaError(examError)) throw examError;
      if (!exams || exams.length === 0) return [];

      const examIds = exams.map((e) => e.id);
      const { data: allResults } = await supabase
        .from('exam_results')
        .select('exam_id, marks')
        .in('exam_id', examIds);

      const resultsByExam = new Map<string, number[]>();
      for (const row of allResults ?? []) {
        if (row.marks === null) continue;
        if (!resultsByExam.has(row.exam_id)) resultsByExam.set(row.exam_id, []);
        resultsByExam.get(row.exam_id)!.push(Number(row.marks));
      }

      const results: GradeTrendPoint[] = [];
      for (const exam of exams) {
        const marks = resultsByExam.get(exam.id) ?? [];
        if (marks.length === 0) continue;
        const avg = Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10;
        const passCount = marks.filter((m) => m >= 50).length;
        const passRate = Math.round((passCount / marks.length) * 1000) / 10;
        results.push({ cycle: exam.exam_name, avgGrade: avg, passRate });
      }

      return results;
    } catch (err: any) {
      console.error('getGradeTrend error:', err.message);
      return [];
    }
  },

  async getAtRiskStudents(): Promise<AtRiskStudent[]> {
    const supabase = createClient();
    try {
      const { data: students, error: stuError } = await supabase
        .from('students')
        .select('id, department, section, semester, users(name), enrollments(course_id, courses(course_name, teachers(users(name))))');
      if (stuError && isSchemaError(stuError)) throw stuError;
      if (!students || students.length === 0) return [];

      const studentIds = students.map((s) => s.id);

      // Batch fetch attendance and exam results for all students
      const [allAttRes, allExamRes] = await Promise.all([
        supabase.from('attendance').select('student_id, status, date').in('student_id', studentIds),
        supabase.from('exam_results').select('student_id, marks').in('student_id', studentIds),
      ]);

      // Build per-student attendance map
      const attMap = new Map<string, { total: number; present: number; lastDate: string }>();
      for (const row of allAttRes.data ?? []) {
        if (!attMap.has(row.student_id)) {
          attMap.set(row.student_id, { total: 0, present: 0, lastDate: row.date ?? '' });
        }
        const entry = attMap.get(row.student_id)!;
        entry.total++;
        if (row.status === 'present' || row.status === 'late') entry.present++;
        // Track most recent date
        if (row.date && row.date > entry.lastDate) entry.lastDate = row.date;
      }

      // Build per-student exam marks map
      const examMap = new Map<string, number[]>();
      for (const row of allExamRes.data ?? []) {
        if (row.marks === null) continue;
        if (!examMap.has(row.student_id)) examMap.set(row.student_id, []);
        examMap.get(row.student_id)!.push(Number(row.marks));
      }

      const atRiskList: AtRiskStudent[] = [];

      for (const student of students as any[]) {
        const att = attMap.get(student.id);
        const attRate = att && att.total > 0 ? Math.round((att.present / att.total) * 1000) / 10 : 100;

        const marks = examMap.get(student.id) ?? [];
        const avgMark = marks.length > 0 ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10 : 100;
        const aiScore = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : 100;

        if (attRate >= 75 && avgMark >= 50) continue;

        const firstEnroll = student.enrollments?.[0] as any;
        const subject = firstEnroll?.courses?.course_name ?? 'General';
        const teacherName = firstEnroll?.courses?.teachers?.users?.name ?? 'Teacher';
        const lastSeen = att?.lastDate ?? new Date().toISOString().split('T')[0];

        const risk: 'critical' | 'warning' = aiScore < 40 || attRate < 70 ? 'critical' : 'warning';
        const interventionStatus: 'pending' | 'info' = risk === 'critical' ? 'pending' : 'info';

        atRiskList.push({
          id: student.id,
          name: student.users?.name ?? 'Student',
          grade: `${student.section}${student.semester}`,
          subject,
          aiScore,
          attendance: `${attRate}%`,
          avgGrade: avgMark,
          lastSeen,
          risk,
          interventionStatus,
          teacher: teacherName,
        });
      }

      return atRiskList.sort((a, b) => a.aiScore - b.aiScore).slice(0, 10);
    } catch (err: any) {
      console.error('getAtRiskStudents error:', err.message);
      return [];
    }
  },
};
