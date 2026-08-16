'use client';

import React from 'react';
import { AttendanceReportRow } from '@/lib/services/reportsService';

interface Props {
  data: AttendanceReportRow[];
  loading: boolean;
}

export default function AttendanceReport({ data, loading }: Props) {
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
        <p className="text-sm">No attendance data found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {['Student', 'Course', 'Code', 'Total', 'Present', 'Absent', 'Late', 'Rate'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((r, i) => (
            <tr key={i} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-500 text-foreground whitespace-nowrap">{r.studentName}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.courseName}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{r.courseCode}</td>
              <td className="px-4 py-3 text-center text-muted-foreground">{r.totalClasses}</td>
              <td className="px-4 py-3 text-center text-positive font-500">{r.present}</td>
              <td className="px-4 py-3 text-center text-negative font-500">{r.absent}</td>
              <td className="px-4 py-3 text-center text-warning font-500">{r.late}</td>
              <td className="px-4 py-3 text-center">
                <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${r.attendanceRate >= 90 ? 'bg-positive/10 text-positive' : r.attendanceRate >= 75 ? 'bg-warning/10 text-warning' : 'bg-negative/10 text-negative'}`}>
                  {r.attendanceRate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
