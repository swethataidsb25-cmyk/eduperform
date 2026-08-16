'use client';

import React from 'react';
import { StudentReportRow } from '@/lib/services/reportsService';

interface Props {
  data: StudentReportRow[];
  loading: boolean;
}

export default function StudentReport({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">No student data found.</p>
      </div>
    );
  }

  const riskColor = (r: string) =>
    r === 'High' ? 'bg-negative/10 text-negative' : r === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-positive/10 text-positive';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {['Student', 'Email', 'Department', 'Sem', 'Courses', 'Attendance', 'Avg Score', 'Assignments', 'Risk'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((r) => (
            <tr key={r.studentId} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-500 text-foreground whitespace-nowrap">{r.studentName}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{r.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.department || '—'}</td>
              <td className="px-4 py-3 text-center text-muted-foreground">{r.semester}</td>
              <td className="px-4 py-3 text-center text-muted-foreground">{r.totalCourses}</td>
              <td className="px-4 py-3 text-center">
                <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${r.attendanceRate >= 90 ? 'bg-positive/10 text-positive' : r.attendanceRate >= 75 ? 'bg-warning/10 text-warning' : 'bg-negative/10 text-negative'}`}>
                  {r.attendanceRate}%
                </span>
              </td>
              <td className="px-4 py-3 text-center font-600 text-foreground font-mono">{r.avgExamScore}</td>
              <td className="px-4 py-3 text-center text-muted-foreground">{r.assignmentsCompleted}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${riskColor(r.riskLevel)}`}>{r.riskLevel}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
