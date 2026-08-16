'use client';

import React, { useEffect, useState } from 'react';
import { adminFullService, AdminAnalytics as AnalyticsData } from '@/lib/services/adminFullService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFullService?.getAnalytics()?.then(setData)?.catch((e) => setError(e?.message))?.finally(() => setLoading(false));
  }, []);

  const kpis = data ? [
    { label: 'Total Students', value: data?.totalStudents, icon: '🎓', color: 'bg-primary/10 text-primary', change: '+12%' },
    { label: 'Total Teachers', value: data?.totalTeachers, icon: '👨‍🏫', color: 'bg-positive/10 text-positive', change: '+3%' },
    { label: 'Total Courses', value: data?.totalCourses, icon: '📚', color: 'bg-accent/10 text-accent', change: '+8%' },
    { label: 'Departments', value: data?.totalDepartments, icon: '🏛️', color: 'bg-warning/10 text-warning', change: '0%' },
    { label: 'Admins', value: data?.totalAdmins, icon: '🛡️', color: 'bg-muted text-muted-foreground', change: '0%' },
    { label: 'Attendance Rate', value: `${data?.attendanceRate}%`, icon: '📋', color: 'bg-positive/10 text-positive', change: '+2%' },
  ] : [];

  const pieData = data ? [
    { name: 'Students', value: data?.totalStudents },
    { name: 'Teachers', value: data?.totalTeachers },
    { name: 'Admins', value: data?.totalAdmins },
  ] : [];

  const barData = data ? [
    { name: 'Students', count: data?.totalStudents },
    { name: 'Teachers', count: data?.totalTeachers },
    { name: 'Courses', count: data?.totalCourses },
    { name: 'Departments', count: data?.totalDepartments },
  ] : [];

  return (
    <div className="space-y-6">
      {error && <div className="bg-negative/10 border border-negative/30 text-negative text-sm rounded-xl px-4 py-3">{error}</div>}
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 })?.map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
                <div className="h-6 bg-muted animate-pulse rounded-md w-16" />
                <div className="h-4 bg-muted animate-pulse rounded-md w-20" />
              </div>
            ))
          : kpis?.map((k, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 hover:shadow-card-hover transition-shadow">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3 ${k?.color}`}>
                  {k?.icon}
                </div>
                <p className="text-2xl font-700 text-foreground font-mono-data">{k?.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k?.label}</p>
                <p className="text-xs text-positive mt-1 font-500">{k?.change} this term</p>
              </div>
            ))}
      </div>
      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-600 text-foreground mb-4">Institution Overview</h3>
          {loading ? (
            <div className="h-48 bg-muted animate-pulse rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-600 text-foreground mb-4">User Distribution</h3>
          {loading ? (
            <div className="h-48 bg-muted animate-pulse rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS?.[index % COLORS?.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-positive/10 flex items-center justify-center text-lg">📋</div>
            <div>
              <p className="text-sm font-600 text-foreground">Attendance Overview</p>
              <p className="text-xs text-muted-foreground">School-wide attendance rate</p>
            </div>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-3xl font-700 text-foreground font-mono-data">{loading ? '—' : `${data?.attendanceRate ?? 0}%`}</p>
            <p className={`text-sm font-500 mb-1 ${(data?.attendanceRate ?? 0) >= 90 ? 'text-positive' : 'text-warning'}`}>
              {(data?.attendanceRate ?? 0) >= 90 ? '↑ Above target' : '↓ Below 90% target'}
            </p>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${(data?.attendanceRate ?? 0) >= 90 ? 'bg-positive' : 'bg-warning'}`}
              style={{ width: `${Math.min(data?.attendanceRate ?? 0, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-lg">📊</div>
            <div>
              <p className="text-sm font-600 text-foreground">Academic Performance</p>
              <p className="text-xs text-muted-foreground">School-wide average grade</p>
            </div>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-3xl font-700 text-foreground font-mono-data">
              {loading ? '—' : data?.avgGrade !== null && data?.avgGrade !== undefined ? `${data?.avgGrade}` : 'N/A'}
            </p>
            <p className={`text-sm font-500 mb-1 ${(data?.avgGrade ?? 0) >= 60 ? 'text-positive' : 'text-negative'}`}>
              {(data?.avgGrade ?? 0) >= 60 ? '↑ Passing' : '↓ Below passing'}
            </p>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${(data?.avgGrade ?? 0) >= 60 ? 'bg-positive' : 'bg-negative'}`}
              style={{ width: `${Math.min(data?.avgGrade ?? 0, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
