'use client';

import { createClient } from '@/lib/supabase/client';

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  section: string;
}

export interface AssignmentRow {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  submittedDate: string | null;
  grade: number | null;
  maxGrade: number;
  status: 'graded' | 'submitted' | 'pending' | 'overdue';
  feedback: string | null;
  subject: string;
  teacher: string;
}

export interface KPIData {
  gpa: number | null;
  attendanceRate: number;
  attendedCount: number;
  totalClasses: number;
  assignmentCompletion: number;
  submittedCount: number;
  totalAssignments: number;
  aiScore: number | null;
}

export interface GradeHistoryPoint {
  exam: string;
  grade: number;
  classAvg: number;
}

export interface SubjectScore {
  subject: string;
  score: number;
  fullMark: number;
}

export interface AIReport {
  strengths: string | null;
  weaknesses: string | null;
  recommendations: string | null;
  generatedAt: string;
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

export const studentDashboardService = {
  async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, user_id, department, semester, section, users(name, email)')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        if (isSchemaError(error)) throw error;
        return null;
      }
      if (!data) return null;
      const u = (data as any).users;
      return {
        id: data.id,
        userId: data.user_id,
        name: u?.name ?? 'Student',
        email: u?.email ?? '',
        department: data.department,
        semester: data.semester,
        section: data.section,
      };
    } catch (err: any) {
      console.error('getStudentProfile error:', err.message);
      throw err;
    }
  },

  async getKPIData(studentId: string): Promise<KPIData> {
    const supabase = createClient();

    // Attendance
    const { data: attData, error: attError } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId);
    if (attError && isSchemaError(attError)) throw attError;

    const totalClasses = attData?.length ?? 0;
    const attendedCount = attData?.filter((a) => a.status === 'present' || a.status === 'late').length ?? 0;
    const attendanceRate = totalClasses > 0 ? Math.round((attendedCount / totalClasses) * 100 * 10) / 10 : 0;

    // Assignments
    const { data: asgData, error: asgError } = await supabase
      .from('assignment_submissions')
      .select('marks, assignments(course_id)')
      .eq('student_id', studentId);
    if (asgError && isSchemaError(asgError)) throw asgError;

    // Total assignments for enrolled courses
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

    const submittedCount = asgData?.length ?? 0;
    const assignmentCompletion =
      totalAssignments > 0 ? Math.round((submittedCount / totalAssignments) * 100 * 10) / 10 : 0;

    // GPA from exam results (average marks / 100 * 4.0)
    const { data: examData, error: examError } = await supabase
      .from('exam_results')
      .select('marks')
      .eq('student_id', studentId);
    if (examError && isSchemaError(examError)) throw examError;

    let gpa: number | null = null;
    if (examData && examData.length > 0) {
      const validMarks = examData.filter((e) => e.marks !== null).map((e) => Number(e.marks));
      if (validMarks.length > 0) {
        const avg = validMarks.reduce((a, b) => a + b, 0) / validMarks.length;
        gpa = Math.round((avg / 100) * 4.0 * 100) / 100;
      }
    }

    // AI Score from latest ai_report (use a simple heuristic: avg of exam marks)
    const { data: aiData } = await supabase
      .from('ai_reports')
      .select('strengths, weaknesses, recommendations')
      .eq('student_id', studentId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Derive AI score from exam average (0-100)
    let aiScore: number | null = null;
    if (examData && examData.length > 0) {
      const validMarks = examData.filter((e) => e.marks !== null).map((e) => Number(e.marks));
      if (validMarks.length > 0) {
        aiScore = Math.round(validMarks.reduce((a, b) => a + b, 0) / validMarks.length);
      }
    }

    return {
      gpa,
      attendanceRate,
      attendedCount,
      totalClasses,
      assignmentCompletion,
      submittedCount,
      totalAssignments,
      aiScore,
    };
  },

  async getAssignments(studentId: string): Promise<AssignmentRow[]> {
    const supabase = createClient();
    try {
      // Get enrollments to find course ids
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('course_id, courses(course_name, teacher_id, teachers(users(name)))')
        .eq('student_id', studentId);

      if (!enrollData || enrollData.length === 0) return [];

      const courseIds = enrollData.map((e) => e.course_id);

      // Build course info map
      const courseMap: Record<string, { subject: string; teacher: string }> = {};
      enrollData.forEach((e: any) => {
        const course = e.courses;
        if (course) {
          const teacherName = course.teachers?.users?.name ?? 'Teacher';
          courseMap[e.course_id] = {
            subject: course.course_name ?? 'Unknown',
            teacher: teacherName,
          };
        }
      });

      // Get assignments for enrolled courses
      const { data: assignments, error: asgError } = await supabase
        .from('assignments')
        .select('id, title, description, due_date, course_id')
        .in('course_id', courseIds)
        .order('due_date', { ascending: false });

      if (asgError) {
        if (isSchemaError(asgError)) throw asgError;
        return [];
      }

      if (!assignments || assignments.length === 0) return [];

      // Get submissions for this student
      const assignmentIds = assignments.map((a) => a.id);
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('assignment_id, marks, feedback, submitted_at')
        .eq('student_id', studentId)
        .in('assignment_id', assignmentIds);

      const submissionMap: Record<string, any> = {};
      submissions?.forEach((s) => {
        submissionMap[s.assignment_id] = s;
      });

      const now = new Date();

      return assignments.map((a) => {
        const sub = submissionMap[a.id];
        const dueDate = a.due_date ? new Date(a.due_date) : null;
        const courseInfo = courseMap[a.course_id] ?? { subject: 'Unknown', teacher: 'Teacher' };

        let status: AssignmentRow['status'] = 'pending';
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
          subject: courseInfo.subject,
          teacher: courseInfo.teacher,
        };
      });
    } catch (err: any) {
      console.error('getAssignments error:', err.message);
      throw err;
    }
  },

  async getGradeHistory(studentId: string): Promise<GradeHistoryPoint[]> {
    const supabase = createClient();
    try {
      const { data: results, error } = await supabase
        .from('exam_results')
        .select('marks, exams(exam_name, exam_date)')
        .eq('student_id', studentId)
        .order('exams(exam_date)', { ascending: true });

      if (error) {
        if (isSchemaError(error)) throw error;
        return [];
      }

      if (!results || results.length === 0) return [];

      return results.map((r: any, i: number) => ({
        exam: r.exams?.exam_name ?? `Exam ${i + 1}`,
        grade: r.marks !== null ? Number(r.marks) : 0,
        classAvg: 70, // fallback since we don't have class-wide aggregation per exam
      }));
    } catch (err: any) {
      console.error('getGradeHistory error:', err.message);
      return [];
    }
  },

  async getSubjectScores(studentId: string): Promise<SubjectScore[]> {
    const supabase = createClient();
    try {
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('course_id, courses(course_name)')
        .eq('student_id', studentId);

      if (!enrollData || enrollData.length === 0) return [];

      const results: SubjectScore[] = [];

      for (const enroll of enrollData as any[]) {
        const courseId = enroll.course_id;
        const courseName = enroll.courses?.course_name ?? 'Unknown';

        // Get exam results for this course
        const { data: examResults } = await supabase
          .from('exam_results')
          .select('marks, exams!inner(course_id)')
          .eq('student_id', studentId)
          .eq('exams.course_id', courseId);

        // Get assignment submissions for this course
        const { data: asgSubs } = await supabase
          .from('assignment_submissions')
          .select('marks, assignments!inner(course_id)')
          .eq('student_id', studentId)
          .eq('assignments.course_id', courseId);

        const allMarks = [
          ...(examResults?.filter((r) => r.marks !== null).map((r) => Number(r.marks)) ?? []),
          ...(asgSubs?.filter((s) => s.marks !== null).map((s) => Number(s.marks)) ?? []),
        ];

        if (allMarks.length > 0) {
          const avg = Math.round(allMarks.reduce((a, b) => a + b, 0) / allMarks.length);
          results.push({ subject: courseName, score: avg, fullMark: 100 });
        }
      }

      return results;
    } catch (err: any) {
      console.error('getSubjectScores error:', err.message);
      return [];
    }
  },

  async getAIReport(studentId: string): Promise<AIReport | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('ai_reports')
        .select('strengths, weaknesses, recommendations, generated_at')
        .eq('student_id', studentId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (isSchemaError(error)) throw error;
        return null;
      }

      if (!data) return null;

      return {
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        recommendations: data.recommendations,
        generatedAt: data.generated_at,
      };
    } catch (err: any) {
      console.error('getAIReport error:', err.message);
      return null;
    }
  },
};
