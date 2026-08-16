'use client';

import React from 'react';
import type { StudentOverviewKPI } from '@/lib/services/studentDashboardFullService';

interface Props {
  kpi: StudentOverviewKPI | null;
  loading: boolean;
}

const cards = [
  {
    key: 'totalCourses' as const,
    label: 'Total Courses',
    icon: '📚',
    format: (v: any) => String(v ?? 0),
    sub: 'Currently enrolled',
    gradient: 'gradient-card-indigo',
    lightBg: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-100',
  },
  {
    key: 'attendanceRate' as const,
    label: 'Attendance Rate',
    icon: '📋',
    format: (v: any) => `${v ?? 0}%`,
    sub: 'Classes attended',
    gradient: 'gradient-card-emerald',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-100',
  },
  {
    key: 'assignmentCompletion' as const,
    label: 'Assignments Done',
    icon: '✅',
    format: (v: any) => `${v ?? 0}%`,
    sub: 'Completion rate',
    gradient: 'gradient-card-amber',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-100',
  },
  {
    key: 'examAvgScore' as const,
    label: 'Exam Performance',
    icon: '🎯',
    format: (v: any) => (v !== null && v !== undefined ? `${v}/100` : 'N/A'),
    sub: 'Average exam score',
    gradient: 'gradient-card-violet',
    lightBg: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-100',
  },
];

export default function StudentDashboardOverview({ kpi, loading }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const value = kpi ? kpi[card.key] : null;
        const isLow =
          (card.key === 'attendanceRate' && (value as number) < 75) ||
          (card.key === 'assignmentCompletion' && (value as number) < 50) ||
          (card.key === 'examAvgScore' && value !== null && (value as number) < 50);

        return (
          <div
            key={card.key}
            className={`rounded-2xl border ${isLow ? 'border-red-100 bg-red-50/50' : `${card.borderColor} bg-white`} p-5 kpi-card-hover relative overflow-hidden`}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            {/* Subtle gradient accent top bar */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${card.gradient}`} />

            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${isLow ? 'bg-red-100' : card.lightBg} flex items-center justify-center text-xl`}>
                {card.icon}
              </div>
              {isLow && (
                <div className="flex items-center gap-1 bg-red-100 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-negative animate-pulse" />
                  <span className="text-[10px] font-600 text-negative">Low</span>
                </div>
              )}
            </div>

            <p className="text-[11px] font-600 uppercase tracking-wider text-muted-foreground mb-1.5">{card.label}</p>
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded-lg mb-1.5" />
            ) : (
              <p className={`font-mono-data font-700 text-[1.75rem] leading-none ${isLow ? 'text-negative' : card.textColor}`}>
                {card.format(value)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
