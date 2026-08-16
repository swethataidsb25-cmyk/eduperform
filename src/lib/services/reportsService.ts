'use client';

import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentReportRow {
  studentId: string;
  studentName: string;
  email: string;
  department: string;
  semester: number;
  section: string;
  totalCourses: number;
  attendanceRate: number;
  avgExamScore: number;
  assignmentsCompleted: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface TeacherReportRow {
  teacherId: string;
  teacherName: string;
  email: string;
  specialization: string;
  totalCourses: number;
  totalStudents: number;
  avgClassAttendance: number;
  avgExamScore: number;
}

export interface AttendanceReportRow {
  studentId: string;
  studentName: string;
  courseName: string;
  courseCode: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
  month: string;
}

export interface PerformanceReportRow {
  studentId: string;
  studentName: string;
  courseName: string;
  courseCode: string;
  examName: string;
  examDate: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
}

export interface AttendanceTrendPoint {
  month: string;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

export interface SubjectPerformancePoint {
  subject: string;
  avgScore: number;
  passRate: number;
  totalStudents: number;
}

export interface SemesterAnalysisPoint {
  semester: string;
  avgScore: number;
  attendanceRate: number;
  students: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGrade(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function getRisk(attendanceRate: number, avgScore: number): 'Low' | 'Medium' | 'High' {
  if (attendanceRate < 60 || avgScore < 40) return 'High';
  if (attendanceRate < 75 || avgScore < 55) return 'Medium';
  return 'Low';
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const reportsService = {
  // ── Student Report ─────────────────────────────────────────────────────────
  async getStudentReport(): Promise<StudentReportRow[]> {
    const supabase = createClient();

    const { data: students, error } = await supabase
      .from('students')
      .select('id, user_id, department, semester, section, users(name, email)');
    if (error) throw error;

    const rows: StudentReportRow[] = [];

    for (const s of students ?? []) {
      const user = (s as any).users;

      const [enrollRes, attRes, examRes, assignRes] = await Promise.all([
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('student_id', s.id),
        supabase.from('attendance').select('status').eq('student_id', s.id),
        supabase.from('exam_results').select('marks').eq('student_id', s.id),
        supabase.from('assignment_submissions').select('id', { count: 'exact', head: true }).eq('student_id', s.id),
      ]);

      const attData = attRes.data ?? [];
      const totalAtt = attData.length;
      const presentAtt = attData.filter((a: any) => a.status === 'present' || a.status === 'late').length;
      const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 1000) / 10 : 0;

      const examData = examRes.data ?? [];
      const validMarks = examData.filter((e: any) => e.marks !== null).map((e: any) => Number(e.marks));
      let avgExamScore = validMarks.length > 0
        ? Math.round((validMarks.reduce((a: number, b: number) => a + b, 0) / validMarks.length) * 10) / 10
        : 0;

      rows.push({
        studentId: s.id,
        studentName: user?.name ?? 'Unknown',
        email: user?.email ?? '',
        department: (s as any).department ?? '',
        semester: (s as any).semester ?? 1,
        section: (s as any).section ?? 'A',
        totalCourses: enrollRes.count ?? 0,
        attendanceRate,
        avgExamScore,
        assignmentsCompleted: assignRes.count ?? 0,
        riskLevel: getRisk(attendanceRate, avgExamScore),
      });
    }

    return rows;
  },

  // ── Teacher Report ─────────────────────────────────────────────────────────
  async getTeacherReport(): Promise<TeacherReportRow[]> {
    const supabase = createClient();

    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('id, user_id, specialization, users(name, email)');
    if (error) throw error;

    const rows: TeacherReportRow[] = [];

    for (const t of teachers ?? []) {
      const user = (t as any).users;

      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', t.id);

      const courseIds = (courses ?? []).map((c: any) => c.id);
      let totalStudents = 0;
      let avgClassAttendance = 0;
      let avgExamScore = 0;

      if (courseIds.length > 0) {
        const [enrollRes, attRes] = await Promise.all([
          supabase.from('enrollments').select('student_id').in('course_id', courseIds),
          supabase.from('attendance').select('status').in('course_id', courseIds),
        ]);

        const uniqueStudents = new Set((enrollRes.data ?? []).map((e: any) => e.student_id));
        totalStudents = uniqueStudents.size;

        const attData = attRes.data ?? [];
        const totalAtt = attData.length;
        const presentAtt = attData.filter((a: any) => a.status === 'present' || a.status === 'late').length;
        avgClassAttendance = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 1000) / 10 : 0;

        // Get exam results via exams join (exam_results has no course_id column)
        const { data: exams } = await supabase
          .from('exams')
          .select('id')
          .in('course_id', courseIds);
        const examIds = (exams ?? []).map((e: any) => e.id);
        if (examIds.length > 0) {
          const { data: examData } = await supabase
            .from('exam_results')
            .select('marks')
            .in('exam_id', examIds);
          const validMarks = (examData ?? []).filter((e: any) => e.marks !== null).map((e: any) => Number(e.marks));
          avgExamScore = validMarks.length > 0
            ? Math.round((validMarks.reduce((a: number, b: number) => a + b, 0) / validMarks.length) * 10) / 10
            : 0;
        }
      }

      rows.push({
        teacherId: t.id,
        teacherName: user?.name ?? 'Unknown',
        email: user?.email ?? '',
        specialization: (t as any).specialization ?? '',
        totalCourses: courseIds.length,
        totalStudents,
        avgClassAttendance,
        avgExamScore,
      });
    }

    return rows;
  },

  // ── Attendance Report ──────────────────────────────────────────────────────
  async getAttendanceReport(): Promise<AttendanceReportRow[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('attendance')
      .select('student_id, course_id, status, date, students(users(name)), courses(course_name, course_code)')
      .order('date', { ascending: false });
    if (error) throw error;

    // Group by student + course
    const map = new Map<string, AttendanceReportRow>();
    for (const row of data ?? []) {
      const key = `${(row as any).student_id}__${(row as any).course_id}`;
      const studentName = (row as any).students?.users?.name ?? 'Unknown';
      const courseName = (row as any).courses?.course_name ?? 'Unknown';
      const courseCode = (row as any).courses?.course_code ?? '';
      // Use ISO date string to avoid locale-dependent formatting (hydration safe)
      const rawDate = (row as any).date;
      let month = '';
      if (rawDate) {
        const d = new Date(rawDate);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        month = `${monthNames[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
      }

      if (!map.has(key)) {
        map.set(key, {
          studentId: (row as any).student_id,
          studentName,
          courseName,
          courseCode,
          totalClasses: 0,
          present: 0,
          absent: 0,
          late: 0,
          attendanceRate: 0,
          month,
        });
      }
      const entry = map.get(key)!;
      entry.totalClasses++;
      if ((row as any).status === 'present') entry.present++;
      else if ((row as any).status === 'absent') entry.absent++;
      else if ((row as any).status === 'late') entry.late++;
    }

    return Array.from(map.values()).map((r) => ({
      ...r,
      attendanceRate: r.totalClasses > 0 ? Math.round(((r.present + r.late) / r.totalClasses) * 1000) / 10 : 0,
    }));
  },

  // ── Performance Report ─────────────────────────────────────────────────────
  async getPerformanceReport(): Promise<PerformanceReportRow[]> {
    const supabase = createClient();

    // exam_results has no course_id — join through exams
    const { data, error } = await supabase
      .from('exam_results')
      .select('student_id, exam_id, marks, students(users(name)), exams(exam_name, exam_date, course_id, courses(course_name, course_code))')
      .order('exam_id', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row: any) => {
      const marks = Number(row.marks ?? 0);
      const maxMarks = 100;
      const percentage = Math.round((marks / maxMarks) * 1000) / 10;
      return {
        studentId: row.student_id,
        studentName: row.students?.users?.name ?? 'Unknown',
        courseName: row.exams?.courses?.course_name ?? 'Unknown',
        courseCode: row.exams?.courses?.course_code ?? '',
        examName: row.exams?.exam_name ?? 'Unknown',
        examDate: row.exams?.exam_date ?? '',
        marks,
        maxMarks,
        percentage,
        grade: getGrade(percentage),
      };
    });
  },

  // ── Chart Data ─────────────────────────────────────────────────────────────
  async getAttendanceTrends(): Promise<AttendanceTrendPoint[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('attendance')
      .select('status, date')
      .order('date', { ascending: true });
    if (error) throw error;

    const monthMap = new Map<string, { present: number; absent: number; late: number }>();
    for (const row of data ?? []) {
      if (!(row as any).date) continue;
      const d = new Date((row as any).date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) monthMap.set(key, { present: 0, absent: 0, late: 0 });
      const entry = monthMap.get(key)!;
      if ((row as any).status === 'present') entry.present++;
      else if ((row as any).status === 'absent') entry.absent++;
      else if ((row as any).status === 'late') entry.late++;
    }

    return Array.from(monthMap.entries())
      .slice(-8)
      .map(([key, v]) => {
        const [year, month] = key.split('-');
        const label = new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
        const total = v.present + v.absent + v.late;
        return {
          month: label,
          present: v.present,
          absent: v.absent,
          late: v.late,
          rate: total > 0 ? Math.round(((v.present + v.late) / total) * 1000) / 10 : 0,
        };
      });
  },

  async getSubjectPerformance(): Promise<SubjectPerformancePoint[]> {
    const supabase = createClient();
    // Join exam_results → exams → courses (no direct course_id on exam_results)
    const { data, error } = await supabase
      .from('exam_results')
      .select('marks, exams(courses(course_name))');
    if (error) throw error;

    const subjectMap = new Map<string, { scores: number[]; pass: number }>();
    for (const row of data ?? []) {
      const subject = (row as any).exams?.courses?.course_name ?? 'Unknown';
      const marks = Number((row as any).marks ?? 0);
      const pct = marks; // marks already out of 100
      if (!subjectMap.has(subject)) subjectMap.set(subject, { scores: [], pass: 0 });
      const entry = subjectMap.get(subject)!;
      entry.scores.push(pct);
      if (pct >= 50) entry.pass++;
    }

    return Array.from(subjectMap.entries()).map(([subject, v]) => ({
      subject: subject.length > 15 ? subject.slice(0, 14) + '…' : subject,
      avgScore: v.scores.length > 0 ? Math.round((v.scores.reduce((a, b) => a + b, 0) / v.scores.length) * 10) / 10 : 0,
      passRate: v.scores.length > 0 ? Math.round((v.pass / v.scores.length) * 1000) / 10 : 0,
      totalStudents: v.scores.length,
    }));
  },

  async getSemesterAnalysis(): Promise<SemesterAnalysisPoint[]> {
    const supabase = createClient();

    const { data: students } = await supabase
      .from('students')
      .select('id, semester');

    const semMap = new Map<number, { studentIds: string[] }>();
    for (const s of students ?? []) {
      const sem = (s as any).semester ?? 1;
      if (!semMap.has(sem)) semMap.set(sem, { studentIds: [] });
      semMap.get(sem)!.studentIds.push((s as any).id);
    }

    const result: SemesterAnalysisPoint[] = [];
    for (const [sem, semData] of Array.from(semMap.entries()).sort((a, b) => a[0] - b[0])) {
      const studentIds = semData.studentIds;
      const [examRes, attRes] = await Promise.all([
        supabase.from('exam_results').select('marks').in('student_id', studentIds),
        supabase.from('attendance').select('status').in('student_id', studentIds),
      ]);

      const validMarks = (examRes.data ?? []).filter((e: any) => e.marks !== null).map((e: any) => Number(e.marks));
      const avgScore = validMarks.length > 0
        ? Math.round((validMarks.reduce((a: number, b: number) => a + b, 0) / validMarks.length) * 10) / 10
        : 0;

      const attData = attRes.data ?? [];
      const totalAtt = attData.length;
      const presentAtt = attData.filter((a: any) => a.status === 'present' || a.status === 'late').length;
      const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 1000) / 10 : 0;

      result.push({ semester: `Sem ${sem}`, avgScore, attendanceRate, students: studentIds.length });
    }

    return result;
  },
};
