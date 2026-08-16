'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudentReport from './components/StudentReport';
import TeacherReport from './components/TeacherReport';
import AttendanceReport from './components/AttendanceReport';
import PerformanceReport from './components/PerformanceReport';
import ReportCharts from './components/ReportCharts';
import {
  reportsService,
  StudentReportRow,
  TeacherReportRow,
  AttendanceReportRow,
  PerformanceReportRow,
  AttendanceTrendPoint,
  SubjectPerformancePoint,
  SemesterAnalysisPoint,
} from '@/lib/services/reportsService';

type ReportTab = 'student' | 'teacher' | 'attendance' | 'performance';

const TABS: { key: ReportTab; label: string; icon: string }[] = [
  { key: 'student', label: 'Student Report', icon: 'AcademicCapIcon' },
  { key: 'teacher', label: 'Teacher Report', icon: 'BookOpenIcon' },
  { key: 'attendance', label: 'Attendance Report', icon: 'ClipboardDocumentCheckIcon' },
  { key: 'performance', label: 'Performance Report', icon: 'ChartBarIcon' },
];

// ── CSV Export Helper ──────────────────────────────────────────────────────────
function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Print Helper ───────────────────────────────────────────────────────────────
function printTable(title: string, tableHtml: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f3f4f6; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
        td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
        tr:hover td { background: #f9fafb; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p style="font-size:12px;color:#6b7280;margin-bottom:16px;">Generated: ${new Date().toLocaleString()}</p>
      ${tableHtml}
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('student');
  const [studentData, setStudentData] = useState<StudentReportRow[]>([]);
  const [teacherData, setTeacherData] = useState<TeacherReportRow[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceReportRow[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceReportRow[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrendPoint[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformancePoint[]>([]);
  const [semesterAnalysis, setSemesterAnalysis] = useState<SemesterAnalysisPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/sign-up-login-screen');
    }
  }, [user, authLoading, router]);

  const fetchCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      const [trends, subjects, semesters] = await Promise.all([
        reportsService.getAttendanceTrends(),
        reportsService.getSubjectPerformance(),
        reportsService.getSemesterAnalysis(),
      ]);
      setAttendanceTrends(trends);
      setSubjectPerformance(subjects);
      setSemesterAnalysis(semesters);
    } catch {
      // charts are non-critical
    } finally {
      setChartsLoading(false);
    }
  }, []);

  const fetchReport = useCallback(async (tab: ReportTab) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'student') {
        const d = await reportsService.getStudentReport();
        setStudentData(d);
      } else if (tab === 'teacher') {
        const d = await reportsService.getTeacherReport();
        setTeacherData(d);
      } else if (tab === 'attendance') {
        const d = await reportsService.getAttendanceReport();
        setAttendanceData(d);
      } else {
        const d = await reportsService.getPerformanceReport();
        setPerformanceData(d);
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  // ── Export Handlers ──────────────────────────────────────────────────────────
  const handleExcelExport = () => {
    if (activeTab === 'student') {
      downloadCSV('student_report.csv',
        ['Student', 'Email', 'Department', 'Semester', 'Courses', 'Attendance %', 'Avg Score', 'Assignments', 'Risk'],
        studentData.map((r) => [r.studentName, r.email, r.department, r.semester, r.totalCourses, r.attendanceRate, r.avgExamScore, r.assignmentsCompleted, r.riskLevel])
      );
    } else if (activeTab === 'teacher') {
      downloadCSV('teacher_report.csv',
        ['Teacher', 'Email', 'Specialization', 'Courses', 'Students', 'Avg Attendance %', 'Avg Score'],
        teacherData.map((r) => [r.teacherName, r.email, r.specialization, r.totalCourses, r.totalStudents, r.avgClassAttendance, r.avgExamScore])
      );
    } else if (activeTab === 'attendance') {
      downloadCSV('attendance_report.csv',
        ['Student', 'Course', 'Code', 'Total', 'Present', 'Absent', 'Late', 'Rate %'],
        attendanceData.map((r) => [r.studentName, r.courseName, r.courseCode, r.totalClasses, r.present, r.absent, r.late, r.attendanceRate])
      );
    } else {
      downloadCSV('performance_report.csv',
        ['Student', 'Course', 'Exam', 'Date', 'Marks', 'Max Marks', 'Percentage', 'Grade'],
        performanceData.map((r) => [r.studentName, r.courseName, r.examName, r.examDate, r.marks, r.maxMarks, r.percentage, r.grade])
      );
    }
  };

  const handlePDFExport = () => {
    const tableEl = tableRef.current?.querySelector('table');
    if (!tableEl) return;
    const title = TABS.find((t) => t.key === activeTab)?.label ?? 'Report';
    printTable(title, tableEl.outerHTML);
  };

  const handlePrint = () => {
    const tableEl = tableRef.current?.querySelector('table');
    if (!tableEl) return;
    const title = TABS.find((t) => t.key === activeTab)?.label ?? 'Report';
    printTable(title, tableEl.outerHTML);
  };

  const handleDownload = () => {
    handleExcelExport();
  };

  const currentCount = activeTab === 'student' ? studentData.length
    : activeTab === 'teacher' ? teacherData.length
    : activeTab === 'attendance' ? attendanceData.length
    : performanceData.length;

  return (
    <AppLayout activeRoute="/reports" pageTitle="Reports">
      <div className="flex flex-col gap-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">Generate and export comprehensive academic reports</p>
          </div>
          {/* Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePDFExport}
              disabled={loading || currentCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-600 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="DocumentArrowDownIcon" size={14} />
              PDF Export
            </button>
            <button
              onClick={handleExcelExport}
              disabled={loading || currentCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="TableCellsIcon" size={14} />
              Excel Export
            </button>
            <button
              onClick={handlePrint}
              disabled={loading || currentCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-600 bg-muted text-muted-foreground hover:bg-border border border-border rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="PrinterIcon" size={14} />
              Print
            </button>
            <button
              onClick={handleDownload}
              disabled={loading || currentCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-600 bg-primary text-white hover:bg-primary/90 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Icon name="ArrowDownTrayIcon" size={14} />
              Download
            </button>
          </div>
        </div>

        {/* Charts Section */}
        <ReportCharts
          attendanceTrends={attendanceTrends}
          subjectPerformance={subjectPerformance}
          semesterAnalysis={semesterAnalysis}
          loading={chartsLoading}
        />

        {/* Report Tabs */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Tab Bar */}
          <div className="flex items-center gap-1 border-b border-border px-4 pt-3 overflow-x-auto scrollbar-thin bg-muted/20">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-600 rounded-t-xl border-b-2 transition-all whitespace-nowrap -mb-px ${
                  activeTab === tab.key
                    ? 'border-primary text-primary bg-white' :'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/60'
                }`}
              >
                <Icon name={tab.icon as Parameters<typeof Icon>[0]['name']} size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Table Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/10">
            <div>
              <h2 className="text-sm font-600 text-foreground">
                {TABS.find((t) => t.key === activeTab)?.label}
              </h2>
              {!loading && (
                <p className="text-xs text-muted-foreground mt-0.5">{currentCount} records found</p>
              )}
            </div>
            <button
              onClick={() => fetchReport(activeTab)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-500 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            >
              <Icon name="ArrowPathIcon" size={13} />
              Refresh
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-negative text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <Icon name="ExclamationTriangleIcon" size={15} className="text-negative flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Table Content */}
          <div ref={tableRef} className="p-0">
            {activeTab === 'student' && <StudentReport data={studentData} loading={loading} />}
            {activeTab === 'teacher' && <TeacherReport data={teacherData} loading={loading} />}
            {activeTab === 'attendance' && <AttendanceReport data={attendanceData} loading={loading} />}
            {activeTab === 'performance' && <PerformanceReport data={performanceData} loading={loading} />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
