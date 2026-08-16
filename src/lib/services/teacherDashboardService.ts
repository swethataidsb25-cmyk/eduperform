'use client';

import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeacherKPI {
  totalCourses: number;
  totalStudents: number;
  pendingGrades: number;
  avgAttendanceRate: number;
}

export interface TeacherCourse {
  id: string;
  courseName: string;
  courseCode: string;
  enrolledCount: number;
  avgAttendance: number;
  avgGrade: number | null;
}

export interface CourseStudent {
  studentId: string;
  studentName: string;
  email: string;
  department: string;
  semester: number;
  section: string;
  attendanceRate: number;
  avgGrade: number | null;
}

export interface AttendanceEntry {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface TeacherAssignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  courseId: string;
  courseName: string;
  submittedCount: number;
  totalEnrolled: number;
  avgGrade: number | null;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  marks: number | null;
  feedback: string | null;
}

export interface TeacherExam {
  id: string;
  examName: string;
  courseId: string;
  courseName: string;
  examDate: string | null;
  resultsUploaded: number;
  totalEnrolled: number;
  avgMarks: number | null;
  createdAt: string;
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  courseCode: string;
  enrolledCount: number;
  avgAttendance: number;
  avgAssignmentGrade: number | null;
  avgExamGrade: number | null;
  submissionRate: number;
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  courseName: string;
  attendanceRate: number;
  avgAssignmentGrade: number | null;
  avgExamGrade: number | null;
  overallScore: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Service ──────────────────────────────────────────────────────────────────

export const teacherDashboardService = {

  async getTeacherId(userId: string): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      if (isSchemaError(error)) throw error;
      return null;
    }
    return data?.id ?? null;
  },

  async getKPIs(teacherId: string): Promise<TeacherKPI> {
    const supabase = createClient();

    // Courses taught by this teacher
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('teacher_id', teacherId);

    const courseIds = courses?.map((c) => c.id) ?? [];
    const totalCourses = courseIds.length;

    if (totalCourses === 0) {
      return { totalCourses: 0, totalStudents: 0, pendingGrades: 0, avgAttendanceRate: 0 };
    }

    // Unique enrolled students
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .in('course_id', courseIds);

    const uniqueStudents = new Set(enrollments?.map((e) => e.student_id) ?? []);
    const totalStudents = uniqueStudents.size;

    // Pending grades: submissions without marks
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .in('course_id', courseIds);

    const assignmentIds = assignments?.map((a) => a.id) ?? [];
    let pendingGrades = 0;
    if (assignmentIds.length > 0) {
      const { count } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .in('assignment_id', assignmentIds)
        .is('marks', null);
      pendingGrades = count ?? 0;
    }

    // Avg attendance rate
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('status')
      .in('course_id', courseIds);

    const total = attendanceData?.length ?? 0;
    const present = attendanceData?.filter((a) => a.status === 'present' || a.status === 'late').length ?? 0;
    const avgAttendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { totalCourses, totalStudents, pendingGrades, avgAttendanceRate };
  },

  async getCourses(teacherId: string): Promise<TeacherCourse[]> {
    const supabase = createClient();

    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, course_name, course_code')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      if (isSchemaError(error)) throw error;
      return [];
    }
    if (!courses || courses.length === 0) return [];

    const result: TeacherCourse[] = await Promise.all(
      courses.map(async (course) => {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('course_id', course.id);

        const enrolledCount = enrollments?.length ?? 0;
        const studentIds = enrollments?.map((e) => e.student_id) ?? [];

        // Attendance rate
        const { data: att } = await supabase
          .from('attendance')
          .select('status')
          .eq('course_id', course.id);

        const attTotal = att?.length ?? 0;
        const attPresent = att?.filter((a) => a.status === 'present' || a.status === 'late').length ?? 0;
        const avgAttendance = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

        // Avg grade from assignment submissions
        let avgGrade: number | null = null;
        if (studentIds.length > 0) {
          const { data: assignments } = await supabase
            .from('assignments')
            .select('id')
            .eq('course_id', course.id);

          const assignmentIds = assignments?.map((a) => a.id) ?? [];
          if (assignmentIds.length > 0) {
            const { data: subs } = await supabase
              .from('assignment_submissions')
              .select('marks')
              .in('assignment_id', assignmentIds)
              .not('marks', 'is', null);

            const marks = subs?.map((s) => Number(s.marks)).filter((m) => !isNaN(m)) ?? [];
            avgGrade = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : null;
          }
        }

        return {
          id: course.id,
          courseName: course.course_name,
          courseCode: course.course_code,
          enrolledCount,
          avgAttendance,
          avgGrade,
        };
      })
    );

    return result;
  },

  async getCourseStudents(courseId: string): Promise<CourseStudent[]> {
    const supabase = createClient();

    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('student_id, students(id, department, semester, section, users(name, email))')
      .eq('course_id', courseId);

    if (error) {
      if (isSchemaError(error)) throw error;
      return [];
    }

    const result: CourseStudent[] = await Promise.all(
      (enrollments ?? []).map(async (enr: any) => {
        const student = enr.students;
        const user = student?.users;

        // Attendance rate for this student in this course
        const { data: att } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', student?.id)
          .eq('course_id', courseId);

        const attTotal = att?.length ?? 0;
        const attPresent = att?.filter((a: any) => a.status === 'present' || a.status === 'late').length ?? 0;
        const attendanceRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

        // Avg grade
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .eq('course_id', courseId);

        const assignmentIds = assignments?.map((a: any) => a.id) ?? [];
        let avgGrade: number | null = null;
        if (assignmentIds.length > 0) {
          const { data: subs } = await supabase
            .from('assignment_submissions')
            .select('marks')
            .in('assignment_id', assignmentIds)
            .eq('student_id', student?.id)
            .not('marks', 'is', null);

          const marks = subs?.map((s: any) => Number(s.marks)).filter((m) => !isNaN(m)) ?? [];
          avgGrade = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : null;
        }

        return {
          studentId: student?.id ?? '',
          studentName: user?.name ?? 'Unknown',
          email: user?.email ?? '',
          department: student?.department ?? '',
          semester: student?.semester ?? 1,
          section: student?.section ?? 'A',
          attendanceRate,
          avgGrade,
        };
      })
    );

    return result;
  },

  async getAttendance(teacherId: string, courseId?: string): Promise<AttendanceEntry[]> {
    const supabase = createClient();

    const { data: courses } = await supabase
      .from('courses')
      .select('id, course_name')
      .eq('teacher_id', teacherId);

    const courseIds = courses?.map((c) => c.id) ?? [];
    if (courseIds.length === 0) return [];

    const targetIds = courseId ? [courseId] : courseIds;

    const { data, error } = await supabase
      .from('attendance')
      .select('id, student_id, course_id, date, status, students(users(name)), courses(course_name)')
      .in('course_id', targetIds)
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      if (isSchemaError(error)) throw error;
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.students?.users?.name ?? 'Unknown',
      courseId: row.course_id,
      courseName: row.courses?.course_name ?? '',
      date: row.date,
      status: row.status,
    }));
  },

  async markAttendance(entries: { studentId: string; courseId: string; date: string; status: string }[]): Promise<void> {
    const supabase = createClient();
    const rows = entries.map((e) => ({
      student_id: e.studentId,
      course_id: e.courseId,
      date: e.date,
      status: e.status,
    }));
    const { error } = await supabase.from('attendance').insert(rows);
    if (error) {
      if (isSchemaError(error)) throw error;
      throw new Error(error.message);
    }
  },

  async updateAttendance(id: string, status: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('attendance')
      .update({ status })
      .eq('id', id);
    if (error) {
      if (isSchemaError(error)) throw error;
      throw new Error(error.message);
    }
  },

  async getAssignments(teacherId: string): Promise<TeacherAssignment[]> {
    const supabase = createClient();

    const { data: courses } = await supabase
      .from('courses')
      .select('id, course_name')
      .eq('teacher_id', teacherId);

    const courseIds = courses?.map((c) => c.id) ?? [];
    if (courseIds.length === 0) return [];

    const courseMap = Object.fromEntries(courses?.map((c) => [c.id, c.course_name]) ?? []);

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, title, description, due_date, course_id, created_at')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });

    if (error) {
      if (isSchemaError(error)) throw error;
      return [];
    }

    return await Promise.all(
      (assignments ?? []).map(async (a) => {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id', { count: 'exact' })
          .eq('course_id', a.course_id);

        const totalEnrolled = enrollments?.length ?? 0;

        const { data: subs } = await supabase
          .from('assignment_submissions')
          .select('marks')
          .eq('assignment_id', a.id);

        const submittedCount = subs?.length ?? 0;
        const gradedMarks = subs?.filter((s) => s.marks !== null).map((s) => Number(s.marks)) ?? [];
        let avgGrade = gradedMarks.length > 0
          ? Math.round(gradedMarks.reduce((acc, m) => acc + m, 0) / gradedMarks.length)
          : null;

        return {
          id: a.id,
          title: a.title,
          description: a.description,
          dueDate: a.due_date,
          courseId: a.course_id,
          courseName: courseMap[a.course_id] ?? '',
          submittedCount,
          totalEnrolled,
          avgGrade,
          createdAt: a.created_at,
        };
      })
    );
  },

  async createAssignment(data: { title: string; description: string; dueDate: string; courseId: string }): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('assignments').insert({
      title: data.title,
      description: data.description,
      due_date: data.dueDate || null,
      course_id: data.courseId,
    });
    if (error) {
      if (isSchemaError(error)) throw error;
      throw new Error(error.message);
    }
  },

  async updateAssignment(id: string, data: { title: string; description: string; dueDate: string }): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('assignments')
      .update({ title: data.title, description: data.description, due_date: data.dueDate || null })
      .eq('id', id);
    if (error) {
      if (isSchemaError(error)) throw error;
      throw new Error(error.message);
    }
  },

  async getSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('id, student_id, marks, feedback, submitted_at, students(users(name))')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      if (isSchemaError(error)) throw error;
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.students?.users?.name ?? 'Unknown',
      submittedAt: row.submitted_at,
      marks: row.marks !== null ? Number(row.marks) : null,
      feedback: row.feedback,
    }));
  },

  async gradeSubmission(submissionId: string, marks: number, feedback: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('assignment_submissions')
      .update({ marks, feedback })
      .eq('id', submissionId);
    if (error) {
      if (isSchemaError(error)) throw error;
      throw new Error(error.message);
    }
  },

  async getExams(teacherId: string): Promise<TeacherExam[]> {
    const supabase = createClient();

    const { data: courses } = await supabase
      .from('courses')
      .select('id, course_name')
      .eq('teacher_id', teacherId);

    const courseIds = courses?.map((c) => c.id) ?? [];
    if (courseIds.length === 0) return [];

    const courseMap = Object.fromEntries(courses?.map((c) => [c.id, c.course_name]) ?? []);

    const { data: exams, error } = await supabase
      .from('exams')
      .select('id, exam_name, course_id, exam_date, created_at')
      .in('course_id', courseIds)
      .order('exam_date', { ascending: true });

    if (error) {
      if (isSchemaError(error)) throw error;
      return [];
    }

    return await Promise.all(
      (exams ?? []).map(async (exam) => {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('course_id', exam.course_id);

        const totalEnrolled = enrollments?.length ?? 0;

        const { data: results } = await supabase
          .from('exam_results')
          .select('marks')
          .eq('exam_id', exam.id);

        const resultsUploaded = results?.length ?? 0;
        const marks = results?.filter((r) => r.marks !== null).map((r) => Number(r.marks)) ?? [];
        const avgMarks = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : null;

        return {
          id: exam.id,
          examName: exam.exam_name,
          courseId: exam.course_id,
          courseName: courseMap[exam.course_id] ?? '',
          examDate: exam.exam_date,
          resultsUploaded,
          totalEnrolled,
          avgMarks,
          createdAt: exam.created_at,
        };
      })
    );
  },

  async createExam(data: { examName: string; courseId: string; examDate: string }): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('exams').insert({
      exam_name: data.examName,
      course_id: data.courseId,
      exam_date: data.examDate || null,
    });
    if (error) {
      if (isSchemaError(error)) throw error;
      throw new Error(error.message);
    }
  },

  async uploadExamResult(examId: string, studentId: string, marks: number): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('exam_results')
      .upsert({ exam_id: examId, student_id: studentId, marks }, { onConflict: 'exam_id,student_id' });
    if (error) {
      if (isSchemaError(error)) throw error;
      throw new Error(error.message);
    }
  },

  async getCourseAnalytics(teacherId: string): Promise<CourseAnalytics[]> {
    const supabase = createClient();

    const { data: courses } = await supabase
      .from('courses')
      .select('id, course_name, course_code')
      .eq('teacher_id', teacherId);

    if (!courses || courses.length === 0) return [];

    return await Promise.all(
      courses.map(async (course) => {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('course_id', course.id);

        const enrolledCount = enrollments?.length ?? 0;

        // Attendance
        const { data: att } = await supabase
          .from('attendance')
          .select('status')
          .eq('course_id', course.id);

        const attTotal = att?.length ?? 0;
        const attPresent = att?.filter((a) => a.status === 'present' || a.status === 'late').length ?? 0;
        const avgAttendance = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

        // Assignment grades
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .eq('course_id', course.id);

        const assignmentIds = assignments?.map((a) => a.id) ?? [];
        let avgAssignmentGrade: number | null = null;
        let submissionRate = 0;

        if (assignmentIds.length > 0 && enrolledCount > 0) {
          const { data: subs } = await supabase
            .from('assignment_submissions')
            .select('marks')
            .in('assignment_id', assignmentIds);

          const totalExpected = assignmentIds.length * enrolledCount;
          submissionRate = totalExpected > 0 ? Math.round(((subs?.length ?? 0) / totalExpected) * 100) : 0;

          const gradedMarks = subs?.filter((s) => s.marks !== null).map((s) => Number(s.marks)) ?? [];
          avgAssignmentGrade = gradedMarks.length > 0
            ? Math.round(gradedMarks.reduce((a, b) => a + b, 0) / gradedMarks.length)
            : null;
        }

        // Exam grades
        const { data: exams } = await supabase
          .from('exams')
          .select('id')
          .eq('course_id', course.id);

        const examIds = exams?.map((e) => e.id) ?? [];
        let avgExamGrade: number | null = null;

        if (examIds.length > 0) {
          const { data: results } = await supabase
            .from('exam_results')
            .select('marks')
            .in('exam_id', examIds)
            .not('marks', 'is', null);

          const marks = results?.map((r) => Number(r.marks)) ?? [];
          avgExamGrade = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : null;
        }

        return {
          courseId: course.id,
          courseName: course.course_name,
          courseCode: course.course_code,
          enrolledCount,
          avgAttendance,
          avgAssignmentGrade,
          avgExamGrade,
          submissionRate,
        };
      })
    );
  },

  async getStudentPerformance(teacherId: string): Promise<StudentPerformance[]> {
    const supabase = createClient();

    const { data: courses } = await supabase
      .from('courses')
      .select('id, course_name')
      .eq('teacher_id', teacherId);

    const courseIds = courses?.map((c) => c.id) ?? [];
    if (courseIds.length === 0) return [];

    const courseMap = Object.fromEntries(courses?.map((c) => [c.id, c.course_name]) ?? []);

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, course_id, students(id, users(name))')
      .in('course_id', courseIds);

    if (!enrollments || enrollments.length === 0) return [];

    return await Promise.all(
      enrollments.map(async (enr: any) => {
        const studentId = enr.student_id;
        const courseId = enr.course_id;
        const studentName = enr.students?.users?.name ?? 'Unknown';

        // Attendance
        const { data: att } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', studentId)
          .eq('course_id', courseId);

        const attTotal = att?.length ?? 0;
        const attPresent = att?.filter((a: any) => a.status === 'present' || a.status === 'late').length ?? 0;
        const attendanceRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

        // Assignment avg
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .eq('course_id', courseId);

        const assignmentIds = assignments?.map((a: any) => a.id) ?? [];
        let avgAssignmentGrade: number | null = null;
        if (assignmentIds.length > 0) {
          const { data: subs } = await supabase
            .from('assignment_submissions')
            .select('marks')
            .in('assignment_id', assignmentIds)
            .eq('student_id', studentId)
            .not('marks', 'is', null);

          const marks = subs?.map((s: any) => Number(s.marks)) ?? [];
          avgAssignmentGrade = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : null;
        }

        // Exam avg
        const { data: exams } = await supabase
          .from('exams')
          .select('id')
          .eq('course_id', courseId);

        const examIds = exams?.map((e: any) => e.id) ?? [];
        let avgExamGrade: number | null = null;
        if (examIds.length > 0) {
          const { data: results } = await supabase
            .from('exam_results')
            .select('marks')
            .in('exam_id', examIds)
            .eq('student_id', studentId)
            .not('marks', 'is', null);

          const marks = results?.map((r: any) => Number(r.marks)) ?? [];
          avgExamGrade = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : null;
        }

        const scores = [avgAssignmentGrade, avgExamGrade].filter((s) => s !== null) as number[];
        const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

        return {
          studentId,
          studentName,
          courseName: courseMap[courseId] ?? '',
          attendanceRate,
          avgAssignmentGrade,
          avgExamGrade,
          overallScore,
        };
      })
    );
  },
};
