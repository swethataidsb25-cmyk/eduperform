'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminFullService, AttendanceReport, ExamReport, AIReport } from '@/lib/services/adminFullService';

type ReportTab = 'attendance' | 'exam' | 'ai';

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('attendance');
  const [attendanceReports, setAttendanceReports] = useState<AttendanceReport[]>([]);
  const [examReports, setExamReports] = useState<ExamReport[]>([]);
  const [aiReports, setAIReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'attendance') {
        setAttendanceReports(await adminFullService.getAttendanceReport());
      } else if (activeTab === 'exam') {
        setExamReports(await adminFullService.getExamReport());
      } else {
        setAIReports(await adminFullService.getAIReports());
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const tabs = [
    { key: 'attendance' as ReportTab, label: 'Attendance Reports', icon: '📋' },
    { key: 'exam' as ReportTab, label: 'Exam Reports', icon: '📝' },
    { key: 'ai' as ReportTab, label: 'AI Reports', icon: '🤖' },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-500 transition-all ${
              activeTab === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {error && <div className="bg-negative/10 border border-negative/30 text-negative text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Attendance Reports */}
      {activeTab === 'attendance' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <h3 className="text-sm font-600 text-foreground">Attendance Summary</h3>
            <span className="text-xs text-muted-foreground">{attendanceReports.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Course</th>
                  <th className="text-center px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Present</th>
                  <th className="text-center px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Absent</th>
                  <th className="text-center px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded-md w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : attendanceReports.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">No attendance records found</td></tr>
                ) : (
                  attendanceReports.map((r, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-500 text-foreground">{r.studentName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.courseName}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{r.totalClasses}</td>
                      <td className="px-4 py-3 text-center text-positive font-500">{r.present}</td>
                      <td className="px-4 py-3 text-center text-negative font-500">{r.absent}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${r.attendanceRate >= 90 ? 'bg-positive/10 text-positive' : r.attendanceRate >= 75 ? 'bg-warning/10 text-warning' : 'bg-negative/10 text-negative'}`}>
                          {r.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Exam Reports */}
      {activeTab === 'exam' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <h3 className="text-sm font-600 text-foreground">Exam Performance Summary</h3>
            <span className="text-xs text-muted-foreground">{examReports.length} exams</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Exam</th>
                  <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="text-center px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Students</th>
                  <th className="text-center px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Avg Marks</th>
                  <th className="text-center px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Pass Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded-md w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : examReports.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">No exam records found</td></tr>
                ) : (
                  examReports.map((r) => (
                    <tr key={r.examId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-500 text-foreground">{r.examName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.courseName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{r.examDate ? new Date(r.examDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{r.totalStudents}</td>
                      <td className="px-4 py-3 text-center font-600 text-foreground font-mono-data">{r.avgMarks}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${r.passRate >= 80 ? 'bg-positive/10 text-positive' : r.passRate >= 60 ? 'bg-warning/10 text-warning' : 'bg-negative/10 text-negative'}`}>
                          {r.passRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Reports */}
      {activeTab === 'ai' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-600 text-foreground">AI-Generated Student Reports</h3>
            <span className="text-xs text-muted-foreground">{aiReports.length} reports</span>
          </div>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="h-5 bg-muted animate-pulse rounded-md w-1/3" />
                <div className="h-4 bg-muted animate-pulse rounded-md w-2/3" />
              </div>
            ))
          ) : aiReports.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <p className="text-muted-foreground text-sm">No AI reports generated yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Use the AI Analysis Panel on the Overview tab to generate reports.</p>
            </div>
          ) : (
            aiReports.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-700 text-primary flex-shrink-0">
                      {r.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-500 text-foreground">{r.studentName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.generatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === r.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedId === r.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/10">
                    {r.strengths && (
                      <div className="pt-3">
                        <p className="text-xs font-600 text-positive uppercase tracking-wide mb-1">Strengths</p>
                        <p className="text-xs text-foreground leading-relaxed">{r.strengths}</p>
                      </div>
                    )}
                    {r.weaknesses && (
                      <div>
                        <p className="text-xs font-600 text-negative uppercase tracking-wide mb-1">Weaknesses</p>
                        <p className="text-xs text-foreground leading-relaxed">{r.weaknesses}</p>
                      </div>
                    )}
                    {r.recommendations && (
                      <div>
                        <p className="text-xs font-600 text-primary uppercase tracking-wide mb-1">Recommendations</p>
                        <p className="text-xs text-foreground leading-relaxed">{r.recommendations}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
