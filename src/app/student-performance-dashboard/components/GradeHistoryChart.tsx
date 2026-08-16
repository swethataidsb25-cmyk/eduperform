'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { GradeHistoryPoint } from '@/lib/services/studentDashboardService';

interface GradeHistoryChartProps {
  gradeHistory: GradeHistoryPoint[];
  loading: boolean;
  studentName: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-modal text-xs">
      <p className="font-600 text-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={`gt-${p.name}`} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono-data font-600 text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function GradeHistoryChart({ gradeHistory, loading, studentName }: GradeHistoryChartProps) {
  if (loading) {
    return <div className="h-[240px] bg-muted rounded-xl animate-pulse" />;
  }

  if (!gradeHistory || gradeHistory.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
        No exam results found yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={gradeHistory} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="studentGrade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="classAvg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="exam"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={50}
          stroke="var(--negative)"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: 'Pass', fontSize: 10, fill: 'var(--negative)', position: 'right' }}
        />
        <Area
          type="monotone"
          dataKey="classAvg"
          name="Class Avg"
          stroke="var(--muted-foreground)"
          strokeWidth={1.5}
          fill="url(#classAvg)"
          strokeDasharray="4 4"
        />
        <Area
          type="monotone"
          dataKey="grade"
          name={`${studentName}'s Grade`}
          stroke="var(--primary)"
          strokeWidth={2.5}
          fill="url(#studentGrade)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}