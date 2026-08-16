'use client';

import React from 'react';
import type { KPIData } from '@/lib/services/studentDashboardService';

interface StudentKPIGridProps {
  kpiData: KPIData | null;
  loading: boolean;
}

export default function StudentKPIGrid({ kpiData, loading }: StudentKPIGridProps) {
  const kpis = [
    {
      id: 'skpi-gpa',
      label: 'Overall GPA',
      value: kpiData?.gpa !== null && kpiData?.gpa !== undefined ? kpiData.gpa.toFixed(2) : '—',
      subValue: 'Out of 4.0 scale',
      deltaLabel: kpiData?.gpa !== null && kpiData?.gpa !== undefined ? `${kpiData.gpa.toFixed(2)} / 4.0` : 'No data yet',
      delta: kpiData?.gpa !== null && kpiData?.gpa !== undefined ? (kpiData.gpa >= 2.0 ? 1 : -1) : 0,
      emoji: '📊',
      alert: false,
      warning: kpiData?.gpa !== null && kpiData?.gpa !== undefined && kpiData.gpa < 2.5,
      cardClass:
        kpiData?.gpa !== null && kpiData?.gpa !== undefined && kpiData.gpa < 2.5
          ? 'border-warning/30 bg-warning/5' :'border-border bg-card',
      valueClass:
        kpiData?.gpa !== null && kpiData?.gpa !== undefined && kpiData.gpa < 2.5
          ? 'text-warning' :'text-foreground',
    },
    {
      id: 'skpi-attendance',
      label: 'Attendance Rate',
      value: kpiData ? `${kpiData.attendanceRate}%` : '—',
      subValue: kpiData ? `${kpiData.attendedCount} of ${kpiData.totalClasses} classes attended` : 'No data yet',
      delta: kpiData ? (kpiData.attendanceRate >= 80 ? 1 : -1) : 0,
      deltaLabel: kpiData
        ? kpiData.attendanceRate < 80
          ? `↓ Below 80% threshold`
          : `↑ Above 80% threshold`
        : 'No data yet',
      emoji: '📋',
      alert: kpiData ? kpiData.attendanceRate < 80 : false,
      warning: false,
      cardClass: kpiData && kpiData.attendanceRate < 80 ? 'border-negative/30 bg-negative/5' : 'border-border bg-card',
      valueClass: kpiData && kpiData.attendanceRate < 80 ? 'text-negative' : 'text-foreground',
    },
    {
      id: 'skpi-assignments',
      label: 'Assignment Completion',
      value: kpiData ? `${kpiData.assignmentCompletion}%` : '—',
      subValue: kpiData
        ? `${kpiData.submittedCount} of ${kpiData.totalAssignments} submitted`
        : 'No data yet',
      delta: kpiData ? (kpiData.assignmentCompletion >= 75 ? 1 : -1) : 0,
      deltaLabel: kpiData ? `${kpiData.submittedCount} submitted` : 'No data yet',
      emoji: '✅',
      alert: false,
      warning: false,
      cardClass: 'border-border bg-card',
      valueClass: 'text-foreground',
    },
    {
      id: 'skpi-ai-score',
      label: 'AI Performance Score',
      value: kpiData?.aiScore !== null && kpiData?.aiScore !== undefined ? `${kpiData.aiScore} / 100` : '—',
      subValue:
        kpiData?.aiScore !== null && kpiData?.aiScore !== undefined
          ? kpiData.aiScore >= 75
            ? 'On track'
            : kpiData.aiScore >= 50
            ? 'Moderate risk detected' : 'At risk' : 'No data yet',
      delta: kpiData?.aiScore !== null && kpiData?.aiScore !== undefined ? (kpiData.aiScore >= 60 ? 1 : -1) : 0,
      deltaLabel:
        kpiData?.aiScore !== null && kpiData?.aiScore !== undefined
          ? `Score: ${kpiData.aiScore}/100`
          : 'No data yet',
      emoji: '🤖',
      alert: false,
      warning: kpiData?.aiScore !== null && kpiData?.aiScore !== undefined && kpiData.aiScore < 60,
      cardClass:
        kpiData?.aiScore !== null && kpiData?.aiScore !== undefined && kpiData.aiScore < 60
          ? 'border-warning/30 bg-warning/5' :'border-border bg-card',
      valueClass:
        kpiData?.aiScore !== null && kpiData?.aiScore !== undefined && kpiData.aiScore < 60
          ? 'text-warning' :'text-foreground',
    },
    {
      id: 'skpi-courses',
      label: 'Total Assignments',
      value: kpiData ? String(kpiData.totalAssignments) : '—',
      subValue: kpiData ? `${kpiData.submittedCount} submitted` : 'No data yet',
      delta: 1,
      deltaLabel: kpiData ? `${kpiData.totalAssignments - kpiData.submittedCount} remaining` : 'No data yet',
      emoji: '🏅',
      alert: false,
      warning: false,
      cardClass: 'border-border bg-card',
      valueClass: 'text-foreground',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`kpi-skel-${i}`} className="rounded-xl border border-border p-4 flex flex-col gap-2.5 shadow-card">
            <div className="h-6 w-6 bg-muted rounded animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              <div className="h-3 w-28 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
      {kpis?.map((kpi) => (
        <div
          key={kpi?.id}
          className={`rounded-xl border p-4 flex flex-col gap-2.5 shadow-card hover:shadow-card-hover transition-shadow ${kpi?.cardClass}`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xl">{kpi?.emoji}</span>
            {kpi?.alert && <span className="w-2 h-2 rounded-full bg-negative animate-pulse" />}
            {kpi?.warning && !kpi?.alert && <span className="w-2 h-2 rounded-full bg-warning" />}
          </div>
          <div>
            <p className="text-[11px] font-500 uppercase tracking-wider text-muted-foreground mb-1">{kpi?.label}</p>
            <p className={`font-mono-data font-700 text-xl leading-none ${kpi?.valueClass}`}>{kpi?.value}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">{kpi?.subValue}</p>
          </div>
          <div
            className={`flex items-center gap-1 text-[11px] font-500 ${
              kpi?.delta > 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            <span>{kpi?.delta > 0 ? '↑' : '↓'}</span>
            <span>{kpi?.deltaLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}