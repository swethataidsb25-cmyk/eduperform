'use client';

import React from 'react';
import { PerformanceReportRow } from '@/lib/services/reportsService';

interface Props {
  data: PerformanceReportRow[];
  loading: boolean;
}

const gradeColor = (g: string) => {
  if (g === 'A+' || g === 'A') return 'bg-positive/10 text-positive';
  if (g === 'B') return 'bg-primary/10 text-primary';
  if (g === 'C') return 'bg-warning/10 text-warning';
  return 'bg-negative/10 text-negative';
};

export default function PerformanceReport({ data, loading }: Props) {
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
        <p className="text-sm">No performance data found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {['Student', 'Course', 'Exam', 'Date', 'Marks', 'Max', 'Percentage', 'Grade'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((r, i) => (
            <tr key={i} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-500 text-foreground whitespace-nowrap">{r.studentName}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.courseName}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.examName}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{r.examDate ? new Date(r.examDate).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-3 text-center font-600 text-foreground font-mono">{r.marks}</td>
              <td className="px-4 py-3 text-center text-muted-foreground font-mono">{r.maxMarks}</td>
              <td className="px-4 py-3 text-center">
                <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${r.percentage >= 80 ? 'bg-positive/10 text-positive' : r.percentage >= 60 ? 'bg-warning/10 text-warning' : 'bg-negative/10 text-negative'}`}>
                  {r.percentage}%
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-700 px-2 py-0.5 rounded-full ${gradeColor(r.grade)}`}>{r.grade}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
