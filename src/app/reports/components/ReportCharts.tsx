'use client';

import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { AttendanceTrendPoint, SubjectPerformancePoint, SemesterAnalysisPoint } from '@/lib/services/reportsService';

interface Props {
  attendanceTrends: AttendanceTrendPoint[];
  subjectPerformance: SubjectPerformancePoint[];
  semesterAnalysis: SemesterAnalysisPoint[];
  loading: boolean;
}

const COLORS = {
  primary: '#6366f1',
  positive: '#22c55e',
  negative: '#ef4444',
  warning: '#f59e0b',
  secondary: '#8b5cf6',
};

function ChartSkeleton() {
  return <div className="h-64 bg-muted animate-pulse rounded-xl" />;
}

export default function ReportCharts({ attendanceTrends, subjectPerformance, semesterAnalysis, loading }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      {/* Attendance Trends */}
      <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2 xl:col-span-2">
        <div className="mb-4">
          <h3 className="text-sm font-600 text-foreground">Attendance Trends</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Monthly attendance breakdown over time</p>
        </div>
        {loading ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={attendanceTrends} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.positive} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.positive} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.negative} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.negative} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="present" name="Present" stroke={COLORS.positive} fill="url(#gradPresent)" strokeWidth={2} />
              <Area type="monotone" dataKey="absent" name="Absent" stroke={COLORS.negative} fill="url(#gradAbsent)" strokeWidth={2} />
              <Area type="monotone" dataKey="late" name="Late" stroke={COLORS.warning} fill="none" strokeWidth={2} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Attendance Rate Line */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-600 text-foreground">Attendance Rate %</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Monthly attendance rate trend</p>
        </div>
        {loading ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={attendanceTrends} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`${v}%`, 'Rate']}
              />
              <Line type="monotone" dataKey="rate" name="Rate %" stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.primary }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Subject Performance */}
      <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2 xl:col-span-2">
        <div className="mb-4">
          <h3 className="text-sm font-600 text-foreground">Subject Performance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Average score and pass rate by subject</p>
        </div>
        {loading ? <ChartSkeleton /> : subjectPerformance.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No exam data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={subjectPerformance} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="avgScore" name="Avg Score" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="passRate" name="Pass Rate %" fill={COLORS.positive} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Semester Analysis */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-600 text-foreground">Semester Analysis</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Performance across semesters</p>
        </div>
        {loading ? <ChartSkeleton /> : semesterAnalysis.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No semester data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={semesterAnalysis} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="semester" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="avgScore" name="Avg Score" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="attendanceRate" name="Attendance %" fill={COLORS.positive} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
