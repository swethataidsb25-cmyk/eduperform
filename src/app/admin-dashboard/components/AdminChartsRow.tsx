'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { AttendanceByDept, GradeTrendPoint } from '@/lib/services/adminDashboardService';

const AttendanceBarChart = dynamic(() => import('./AttendanceBarChart'), { ssr: false });
const GradeTrendAreaChart = dynamic(() => import('./GradeTrendAreaChart'), { ssr: false });

interface AdminChartsRowProps {
  attendanceData: AttendanceByDept[];
  gradeTrendData: GradeTrendPoint[];
  loading: boolean;
}

export default function AdminChartsRow({ attendanceData, gradeTrendData, loading }: AdminChartsRowProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
      <AttendanceChartCard data={attendanceData} loading={loading} />
      <GradeTrendChartCard data={gradeTrendData} loading={loading} />
    </div>
  );
}

function AttendanceChartCard({ data, loading }: { data: AttendanceByDept[]; loading: boolean }) {
  const [activeFilter, setActiveFilter] = useState<'week' | 'month'>('week');
  return (
    <div className="bg-card border border-border rounded-xl shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-600 text-foreground">Attendance by Course</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? 'Loading...' : `${data.length} courses`}
          </p>
        </div>
        <div className="flex bg-muted rounded-lg p-0.5">
          {(['week', 'month'] as const).map((f) => (
            <button
              key={`att-filter-${f}`}
              onClick={() => setActiveFilter(f)}
              className={`px-2.5 py-1 text-xs font-500 rounded-md transition-all ${
                activeFilter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="h-[220px] bg-muted animate-pulse rounded-lg" />
        ) : (
          <AttendanceBarChart data={data} />
        )}
      </div>
    </div>
  );
}

function GradeTrendChartCard({ data, loading }: { data: GradeTrendPoint[]; loading: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-600 text-foreground">School-Wide Grade Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? 'Loading...' : `${data.length} exam cycles`}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary/70 inline-block" />
            Avg Grade
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-positive/70 inline-block" />
            Pass Rate
          </div>
        </div>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="h-[220px] bg-muted animate-pulse rounded-lg" />
        ) : (
          <GradeTrendAreaChart data={data} />
        )}
      </div>
    </div>
  );
}