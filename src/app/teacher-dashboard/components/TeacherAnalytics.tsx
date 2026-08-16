'use client';

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import type { CourseAnalytics, StudentPerformance } from '@/lib/services/teacherDashboardService';

interface Props {
  analytics: CourseAnalytics[];
  studentPerformance: StudentPerformance[];
  loading: boolean;
}

export default function TeacherAnalytics({ analytics, studentPerformance, loading }: Props) {
  const [activeView, setActiveView] = useState<'courses' | 'students'>('courses');

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Course bar chart data
  const courseChartData = analytics.map((c) => ({
    name: c.courseCode,
    Attendance: c.avgAttendance,
    Assignments: c.avgAssignmentGrade ?? 0,
    Exams: c.avgExamGrade ?? 0,
    Submissions: c.submissionRate,
  }));

  // Student radar data (aggregate by student across all courses)
  const studentMap: Record<string, { name: string; attendance: number[]; assignment: number[]; exam: number[] }> = {};
  studentPerformance.forEach((sp) => {
    if (!studentMap[sp.studentId]) {
      studentMap[sp.studentId] = { name: sp.studentName, attendance: [], assignment: [], exam: [] };
    }
    studentMap[sp.studentId].attendance.push(sp.attendanceRate);
    if (sp.avgAssignmentGrade !== null) studentMap[sp.studentId].assignment.push(sp.avgAssignmentGrade);
    if (sp.avgExamGrade !== null) studentMap[sp.studentId].exam.push(sp.avgExamGrade);
  });

  const studentTableData = Object.values(studentMap).map((s) => ({
    name: s.name,
    avgAttendance: s.attendance.length > 0 ? Math.round(s.attendance.reduce((a, b) => a + b, 0) / s.attendance.length) : 0,
    avgAssignment: s.assignment.length > 0 ? Math.round(s.assignment.reduce((a, b) => a + b, 0) / s.assignment.length) : null,
    avgExam: s.exam.length > 0 ? Math.round(s.exam.reduce((a, b) => a + b, 0) / s.exam.length) : null,
  }));

  const radarData = analytics.map((c) => ({
    subject: c.courseCode,
    Attendance: c.avgAttendance,
    Assignments: c.avgAssignmentGrade ?? 0,
    Exams: c.avgExamGrade ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveView('courses')}
          className={`px-4 py-2 rounded-md text-sm font-500 transition-colors ${activeView === 'courses' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Course Statistics
        </button>
        <button
          onClick={() => setActiveView('students')}
          className={`px-4 py-2 rounded-md text-sm font-500 transition-colors ${activeView === 'students' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Student Performance
        </button>
      </div>

      {activeView === 'courses' && (
        <div className="space-y-6">
          {/* Bar Chart */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-600 text-foreground mb-1">Course Performance Overview</h3>
            <p className="text-xs text-muted-foreground mb-4">Attendance, assignment, and exam averages per course</p>
            {courseChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={courseChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="Attendance" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Assignments" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Exams" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Course Stats Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-600 text-foreground">Course Statistics</h3>
            </div>
            {analytics.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No course data available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 font-500 text-muted-foreground">Course</th>
                      <th className="text-center px-4 py-3 font-500 text-muted-foreground">Students</th>
                      <th className="text-center px-4 py-3 font-500 text-muted-foreground">Attendance</th>
                      <th className="text-center px-4 py-3 font-500 text-muted-foreground">Submission Rate</th>
                      <th className="text-center px-4 py-3 font-500 text-muted-foreground">Avg Assignment</th>
                      <th className="text-center px-4 py-3 font-500 text-muted-foreground">Avg Exam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analytics.map((c) => (
                      <tr key={c.courseId} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-500 text-foreground">{c.courseName}</p>
                          <p className="text-xs text-muted-foreground">{c.courseCode}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-500 text-foreground">{c.enrolledCount}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-600 ${c.avgAttendance >= 75 ? 'text-emerald-600' : 'text-destructive'}`}>
                            {c.avgAttendance}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-500 text-foreground">{c.submissionRate}%</td>
                        <td className="px-4 py-3 text-center font-500 text-foreground">
                          {c.avgAssignmentGrade !== null ? `${c.avgAssignmentGrade}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-500 text-foreground">
                          {c.avgExamGrade !== null ? `${c.avgExamGrade}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'students' && (
        <div className="space-y-6">
          {/* Radar Chart */}
          {radarData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-600 text-foreground mb-1">Course Radar Overview</h3>
              <p className="text-xs text-muted-foreground mb-4">Multi-dimensional performance across courses</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <Radar name="Attendance" dataKey="Attendance" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                  <Radar name="Assignments" dataKey="Assignments" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Radar name="Exams" dataKey="Exams" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Student Performance Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-600 text-foreground">Student Performance Analysis</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Aggregated across all your courses</p>
            </div>
            {studentTableData.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No student data available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 font-500 text-muted-foreground">Student</th>
                      <th className="text-center px-4 py-3 font-500 text-muted-foreground">Avg Attendance</th>
                      <th className="text-center px-4 py-3 font-500 text-muted-foreground">Avg Assignment</th>
                      <th className="text-center px-4 py-3 font-500 text-muted-foreground">Avg Exam</th>
                      <th className="text-center px-4 py-3 font-500 text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {studentTableData.map((s, i) => {
                      const scores = [s.avgAssignment, s.avgExam].filter((x) => x !== null) as number[];
                      const overall = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                      const atRisk = s.avgAttendance < 75 || (overall !== null && overall < 50);
                      return (
                        <tr key={i} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3 font-500 text-foreground">{s.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-600 ${s.avgAttendance >= 75 ? 'text-emerald-600' : 'text-destructive'}`}>
                              {s.avgAttendance}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-500 text-foreground">
                            {s.avgAssignment !== null ? `${s.avgAssignment}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-center font-500 text-foreground">
                            {s.avgExam !== null ? `${s.avgExam}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-500 ${atRisk ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {atRisk ? 'At Risk' : 'On Track'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
