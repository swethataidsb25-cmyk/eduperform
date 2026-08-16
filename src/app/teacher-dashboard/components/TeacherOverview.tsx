'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import type { TeacherKPI, TeacherCourse } from '@/lib/services/teacherDashboardService';

interface Props {
  kpi: TeacherKPI | null;
  courses: TeacherCourse[];
  loading: boolean;
}

const kpiConfig = [
  {
    key: 'totalCourses' as const,
    label: 'My Courses',
    icon: 'AcademicCapIcon',
    gradient: 'gradient-card-indigo',
    lightBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-100',
    format: (v: any) => String(v ?? 0),
    sub: 'Active this semester',
  },
  {
    key: 'totalStudents' as const,
    label: 'Total Students',
    icon: 'UsersIcon',
    gradient: 'gradient-card-cyan',
    lightBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-100',
    format: (v: any) => String(v ?? 0),
    sub: 'Across all courses',
  },
  {
    key: 'pendingGrades' as const,
    label: 'Pending Grades',
    icon: 'ClipboardDocumentCheckIcon',
    gradient: 'gradient-card-amber',
    lightBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-100',
    format: (v: any) => String(v ?? 0),
    sub: 'Ungraded submissions',
  },
  {
    key: 'avgAttendanceRate' as const,
    label: 'Avg Attendance',
    icon: 'ChartBarIcon',
    gradient: 'gradient-card-emerald',
    lightBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-100',
    format: (v: any) => `${v ?? 0}%`,
    sub: 'Class average rate',
  },
];

function Skeleton() {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 animate-pulse">
      <div className="w-11 h-11 bg-muted rounded-xl mb-4" />
      <div className="h-4 bg-muted rounded w-24 mb-2" />
      <div className="h-8 bg-muted rounded w-16 mb-2" />
      <div className="h-3 bg-muted rounded w-28" />
    </div>
  );
}

export default function TeacherOverview({ kpi, courses, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiConfig.map((card, idx) => {
          const value = kpi ? (kpi as any)[card.key] : null;
          return (
            <div
              key={card.key}
              className={`rounded-2xl border ${card.borderColor} bg-white p-5 kpi-card-hover relative overflow-hidden`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${card.gradient}`} />
              <div className={`w-11 h-11 rounded-xl ${card.lightBg} flex items-center justify-center mb-4`}>
                <Icon name={card.icon as Parameters<typeof Icon>[0]['name']} size={20} className={card.iconColor} />
              </div>
              <p className="text-[11px] font-600 uppercase tracking-wider text-muted-foreground mb-1.5">{card.label}</p>
              <p className={`font-mono-data font-700 text-[1.75rem] leading-none ${card.textColor}`}>
                {card.format(value)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Course Summary */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-600 text-foreground">My Courses</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Quick overview of all your courses</p>
          </div>
          <span className="text-xs font-600 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2.5 py-1">
            {courses.length} courses
          </span>
        </div>
        {courses.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Icon name="AcademicCapIcon" size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No courses assigned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {courses.map((course, i) => (
              <div key={course.id} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl gradient-card-indigo flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-700 text-xs">{course.courseCode?.slice(0, 2) ?? String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div>
                    <p className="font-600 text-foreground text-sm">{course.courseName}</p>
                    <p className="text-xs text-muted-foreground">{course.courseCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-700 text-foreground">{course.enrolledCount}</p>
                    <p className="text-[11px] text-muted-foreground">Students</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-700 ${course.avgAttendance < 75 ? 'text-negative' : 'text-positive'}`}>{course.avgAttendance}%</p>
                    <p className="text-[11px] text-muted-foreground">Attendance</p>
                  </div>
                  <div className="text-center">
                    <p className="font-700 text-foreground">{course.avgGrade !== null ? `${course.avgGrade}%` : '—'}</p>
                    <p className="text-[11px] text-muted-foreground">Avg Grade</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
