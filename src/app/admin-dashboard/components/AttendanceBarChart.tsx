'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AttendanceByDept } from '@/lib/services/adminDashboardService';

interface AttendanceBarChartProps {
  data: AttendanceByDept[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const isBelowTarget = val < 90;
  return (
    <div className="bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-modal text-xs">
      <p className="font-600 text-foreground mb-1">{label}</p>
      <p className={`font-mono-data font-600 ${isBelowTarget ? 'text-negative' : 'text-positive'}`}>
        {val}% attendance
      </p>
      {isBelowTarget && <p className="text-negative mt-0.5">Below 90% target</p>}
    </div>
  );
};

export default function AttendanceBarChart({ data }: AttendanceBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
        No attendance data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="dept"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[60, 100]}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', radius: 4 }} />
        <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`att-cell-${index}`}
              fill={entry.rate < 90 ? 'var(--negative)' : entry.rate >= 93 ? 'var(--positive)' : 'var(--primary)'}
              opacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}