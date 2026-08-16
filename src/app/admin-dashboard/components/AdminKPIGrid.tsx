'use client';

import React from 'react';
import { AdminKPIData } from '@/lib/services/adminDashboardService';

interface AdminKPIGridProps {
  data: AdminKPIData | null;
  loading: boolean;
}

const kpiConfig = [
  {
    id: 'kpi-total-students',
    label: 'Total Students',
    getValue: (d: AdminKPIData | null) => String(d?.totalStudents ?? 0),
    subValue: 'Across all classes',
    icon: '👥',
    gradient: 'gradient-card-indigo',
    lightBg: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-100',
    isAlert: (_d: AdminKPIData | null) => false,
    isWarning: (_d: AdminKPIData | null) => false,
    delta: (_d: AdminKPIData | null) => null,
  },
  {
    id: 'kpi-at-risk',
    label: 'At-Risk Students',
    getValue: (d: AdminKPIData | null) => String(d?.atRiskCount ?? 0),
    subValue: 'Low attendance or grades',
    icon: '⚠️',
    gradient: 'gradient-card-rose',
    lightBg: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-100',
    isAlert: (d: AdminKPIData | null) => (d?.atRiskCount ?? 0) > 0,
    isWarning: (_d: AdminKPIData | null) => false,
    delta: (d: AdminKPIData | null) => d?.atRiskCount ? `${d.atRiskCount} flagged` : null,
  },
  {
    id: 'kpi-attendance',
    label: 'School Attendance',
    getValue: (d: AdminKPIData | null) => `${d?.attendanceRate ?? 0}%`,
    subValue: 'Overall attendance rate',
    icon: '📋',
    gradient: 'gradient-card-amber',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-100',
    isAlert: (_d: AdminKPIData | null) => false,
    isWarning: (d: AdminKPIData | null) => (d?.attendanceRate ?? 0) < 90,
    delta: (d: AdminKPIData | null) => (d?.attendanceRate ?? 0) >= 90 ? '↑ Above 90% target' : '↓ Below 90% target',
  },
  {
    id: 'kpi-avg-grade',
    label: 'Average Grade',
    getValue: (d: AdminKPIData | null) => d?.avgGrade != null ? String(d.avgGrade) : 'N/A',
    subValue: 'School-wide average',
    icon: '📊',
    gradient: 'gradient-card-emerald',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-100',
    isAlert: (_d: AdminKPIData | null) => false,
    isWarning: (d: AdminKPIData | null) => (d?.avgGrade ?? 0) < 60,
    delta: (d: AdminKPIData | null) => (d?.avgGrade ?? 0) >= 60 ? '↑ Above passing' : '↓ Below passing',
  },
  {
    id: 'kpi-courses',
    label: 'Active Courses',
    getValue: (d: AdminKPIData | null) => String(d?.activeCourses ?? 0),
    subValue: 'Currently running',
    icon: '📚',
    gradient: 'gradient-card-cyan',
    lightBg: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-100',
    isAlert: (_d: AdminKPIData | null) => false,
    isWarning: (_d: AdminKPIData | null) => false,
    delta: (_d: AdminKPIData | null) => null,
  },
  {
    id: 'kpi-pending-ai',
    label: 'AI Reports',
    getValue: (d: AdminKPIData | null) => String(d?.pendingAIReviews ?? 0),
    subValue: 'Generated reports',
    icon: '🤖',
    gradient: 'gradient-card-violet',
    lightBg: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-100',
    isAlert: (_d: AdminKPIData | null) => false,
    isWarning: (d: AdminKPIData | null) => (d?.pendingAIReviews ?? 0) > 0,
    delta: (d: AdminKPIData | null) => d?.pendingAIReviews ? `${d.pendingAIReviews} available` : null,
  },
];

export default function AdminKPIGrid({ data, loading }: AdminKPIGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpiConfig.map((kpi, idx) => {
        const isAlert = kpi.isAlert(data);
        const isWarning = kpi.isWarning(data);
        const delta = kpi.delta(data);

        return (
          <div
            key={kpi.id}
            className={`rounded-2xl border p-4 kpi-card-hover relative overflow-hidden ${
              isAlert ? 'border-red-200 bg-red-50/60' : isWarning ? 'border-amber-200 bg-amber-50/40' : `${kpi.borderColor} bg-white`
            }`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${kpi.gradient}`} />
            <div className="flex items-start justify-between mb-3">
              <span className="text-xl">{kpi.icon}</span>
              {isAlert && <span className="w-2 h-2 rounded-full bg-negative animate-pulse mt-1" />}
              {isWarning && !isAlert && <span className="w-2 h-2 rounded-full bg-warning mt-1" />}
            </div>
            <p className="text-[10px] font-600 uppercase tracking-wider text-muted-foreground mb-1.5">{kpi.label}</p>
            {loading ? (
              <div className="h-7 w-14 bg-muted animate-pulse rounded-lg mb-1" />
            ) : (
              <p className={`font-mono-data font-700 text-xl leading-none ${isAlert ? 'text-negative' : isWarning ? 'text-warning' : kpi.textColor}`}>
                {kpi.getValue(data)}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{kpi.subValue}</p>
            {delta && !loading && (
              <p className={`text-[10px] font-500 mt-1.5 ${isAlert ? 'text-negative' : isWarning ? 'text-warning' : 'text-muted-foreground'}`}>
                {delta}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
