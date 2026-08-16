'use client';

import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SubjectScore } from '@/lib/services/studentDashboardService';

interface SubjectRadarChartProps {
  subjectScores: SubjectScore[];
  loading: boolean;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-modal text-xs">
      {payload.map((p) => (
        <div key={`radar-tt-${p.name}`} className="flex items-center gap-2 mb-0.5">
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono-data font-600 text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function SubjectRadarChart({ subjectScores, loading }: SubjectRadarChartProps) {
  if (loading) {
    return <div className="h-[240px] bg-muted rounded-xl animate-pulse" />;
  }

  if (!subjectScores || subjectScores.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
        No subject scores found yet.
      </div>
    );
  }

  // Map to radar chart format
  const chartData = subjectScores.map((s) => ({
    subject: s.subject.length > 12 ? s.subject.slice(0, 12) + '…' : s.subject,
    score: s.score,
    fullMark: s.fullMark,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.2}
          strokeWidth={2.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}