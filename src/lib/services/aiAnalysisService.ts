import { createClient } from '@/lib/supabase/client';

export interface StudentAnalysisData {
  studentId: string;
  studentName: string;
  department: string;
  semester: number;
  attendanceRate: number;
  avgExamMark: number;
  avgAssignmentMark: number;
  submittedAssignments: number;
  totalAssignments: number;
  courses: string[];
  examResults: { examName: string; marks: number; courseName: string }[];
  assignmentResults: { title: string; marks: number; courseName: string }[];
}

export interface AIAnalysisResult {
  studentId: string;
  studentName: string;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  riskLevel: 'low' | 'medium' | 'high';
  savedToDb: boolean;
}

export interface AnalysisRunResult {
  processed: number;
  saved: number;
  errors: number;
  results: AIAnalysisResult[];
}

async function fetchStudentData(studentId: string): Promise<StudentAnalysisData | null> {
  const supabase = createClient();

  const { data: student } = await supabase
    .from('students')
    .select('id, department, semester, users(name)')
    .eq('id', studentId)
    .maybeSingle();

  if (!student) return null;

  const studentName = (student as any).users?.name ?? 'Unknown Student';

  // Attendance
  const { data: attData } = await supabase
    .from('attendance')
    .select('status')
    .eq('student_id', studentId);

  const totalAtt = attData?.length ?? 0;
  const presentAtt = attData?.filter((a) => a.status === 'present' || a.status === 'late').length ?? 0;
  const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100 * 10) / 10 : 0;

  // Enrollments & courses
  const { data: enrollData } = await supabase
    .from('enrollments')
    .select('course_id, courses(course_name)')
    .eq('student_id', studentId);

  const courseIds = enrollData?.map((e) => e.course_id) ?? [];
  const courses = enrollData?.map((e: any) => e.courses?.course_name ?? 'Unknown').filter(Boolean) ?? [];

  // Exam results
  const { data: examResultsRaw } = await supabase
    .from('exam_results')
    .select('marks, exams(exam_name, courses(course_name))')
    .eq('student_id', studentId);

  const examResults = (examResultsRaw ?? [])
    .filter((r) => r.marks !== null)
    .map((r: any) => ({
      examName: r.exams?.exam_name ?? 'Exam',
      marks: Number(r.marks),
      courseName: r.exams?.courses?.course_name ?? 'Unknown',
    }));

  const examMarks = examResults.map((r) => r.marks);
  const avgExamMark =
    examMarks.length > 0
      ? Math.round((examMarks.reduce((a, b) => a + b, 0) / examMarks.length) * 10) / 10
      : 0;

  // Assignment submissions
  let totalAssignments = 0;
  if (courseIds.length > 0) {
    const { count } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .in('course_id', courseIds);
    totalAssignments = count ?? 0;
  }

  const { data: submissionsRaw } = await supabase
    .from('assignment_submissions')
    .select('marks, feedback, assignments(title, courses(course_name))')
    .eq('student_id', studentId);

  const assignmentResults = (submissionsRaw ?? [])
    .filter((s) => s.marks !== null)
    .map((s: any) => ({
      title: s.assignments?.title ?? 'Assignment',
      marks: Number(s.marks),
      courseName: s.assignments?.courses?.course_name ?? 'Unknown',
    }));

  const assignMarks = assignmentResults.map((r) => r.marks);
  const avgAssignmentMark =
    assignMarks.length > 0
      ? Math.round((assignMarks.reduce((a, b) => a + b, 0) / assignMarks.length) * 10) / 10
      : 0;

  return {
    studentId,
    studentName,
    department: student.department,
    semester: student.semester,
    attendanceRate,
    avgExamMark,
    avgAssignmentMark,
    submittedAssignments: submissionsRaw?.length ?? 0,
    totalAssignments,
    courses,
    examResults,
    assignmentResults,
  };
}

export async function fetchAllStudentIds(): Promise<{ id: string; name: string }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('students')
    .select('id, users(name)');
  return (data ?? []).map((s: any) => ({ id: s.id, name: s.users?.name ?? 'Unknown' }));
}

export async function saveAIReport(
  studentId: string,
  strengths: string,
  weaknesses: string,
  recommendations: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('ai_reports').insert({
    student_id: studentId,
    strengths,
    weaknesses,
    recommendations,
    generated_at: new Date().toISOString(),
  });
  return !error;
}

export async function getStudentDataForAnalysis(studentId: string): Promise<StudentAnalysisData | null> {
  return fetchStudentData(studentId);
}

export function buildAnalysisPrompt(data: StudentAnalysisData): string {
  const examSummary =
    data.examResults.length > 0
      ? data.examResults
          .map((e) => `  - ${e.examName} (${e.courseName}): ${e.marks}/100`)
          .join('\n')
      : '  - No exam results available';

  const assignSummary =
    data.assignmentResults.length > 0
      ? data.assignmentResults
          .map((a) => `  - ${a.title} (${a.courseName}): ${a.marks}/100`)
          .join('\n')
      : '  - No assignment submissions available';

  return `You are an educational AI analyst. Analyze the following student performance data and provide actionable insights.

Student: ${data.studentName}
Department: ${data.department} | Semester: ${data.semester}
Enrolled Courses: ${data.courses.join(', ') || 'None'}

Performance Metrics:
- Attendance Rate: ${data.attendanceRate}%
- Average Exam Score: ${data.avgExamMark}/100
- Average Assignment Score: ${data.avgAssignmentMark}/100
- Assignment Completion: ${data.submittedAssignments}/${data.totalAssignments} submitted

Exam Results:
${examSummary}

Assignment Results:
${assignSummary}

Provide a JSON response with exactly these fields:
{
  "strengths": "2-3 sentences highlighting what the student is doing well",
  "weaknesses": "2-3 sentences identifying specific areas of concern",
  "recommendations": "3-4 concrete, actionable steps the student should take to improve",
  "riskLevel": "low" | "medium" | "high"
}

Risk level criteria:
- "high": attendance < 70% OR avg exam score < 50 -"medium": attendance 70-80% OR avg exam score 50-65 -"low": attendance > 80% AND avg exam score > 65

Respond ONLY with valid JSON, no markdown, no extra text.`;
}
