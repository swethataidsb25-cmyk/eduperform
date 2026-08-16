'use client';

import React from 'react';
import { TeacherReportRow } from '@/lib/services/reportsService';

interface Props {
  data: TeacherReportRow[];
  loading: boolean;
}

export default function TeacherReport({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">No teacher data found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {['Teacher', 'Email', 'Specialization', 'Courses', 'Students', 'Avg Attendance', 'Avg Exam Score'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((r) => (
            <tr key={r.teacherId} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-500 text-foreground whitespace-nowrap">{r.teacherName}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{r.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.specialization || '—'}</td>
              <td className="px-4 py-3 text-center text-muted-foreground">{r.totalCourses}</td>
              <td className="px-4 py-3 text-center text-muted-foreground">{r.totalStudents}</td>
              <td className="px-4 py-3 text-center">
                <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${r.avgClassAttendance >= 80 ? 'bg-positive/10 text-positive' : r.avgClassAttendance >= 65 ? 'bg-warning/10 text-warning' : 'bg-negative/10 text-negative'}`}>
                  {r.avgClassAttendance}%
                </span>
              </td>
              <td className="px-4 py-3 text-center font-600 text-foreground font-mono">{r.avgExamScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
