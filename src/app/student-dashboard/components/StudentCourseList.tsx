'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { CourseItem } from '@/lib/services/studentDashboardFullService';

interface Props {
  courses: CourseItem[];
  loading: boolean;
}

export default function StudentCourseList({ courses, loading }: Props) {
  const [selected, setSelected] = useState<CourseItem | null>(null);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-card p-5">
        <div className="h-5 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon name="AcademicCapIcon" size={14} className="text-primary" />
        </div>
        <h3 className="text-sm font-600 text-foreground">My Courses</h3>
        <span className="ml-auto text-xs font-600 bg-primary/10 text-primary rounded-full px-2 py-0.5">
          {courses.length}
        </span>
      </div>

      {courses.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No courses enrolled yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {courses.map((course) => (
            <div key={course.id}>
              <button
                onClick={() => setSelected(selected?.id === course.id ? null : course)}
                className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl gradient-card-indigo flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-700 text-white">{course.courseCode.slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-foreground truncate">{course.courseName}</p>
                  <p className="text-xs text-muted-foreground">{course.courseCode} · {course.teacherName}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-500 text-muted-foreground">Attendance</p>
                    <p className={`text-sm font-700 font-mono-data ${course.attendanceRate >= 75 ? 'text-positive' : 'text-negative'}`}>
                      {course.attendanceRate}%
                    </p>
                  </div>
                  <Icon
                    name="ChevronDownIcon"
                    size={16}
                    className={`text-muted-foreground transition-transform ${selected?.id === course.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {selected?.id === course.id && (
                <div className="px-5 pb-4 bg-muted/30">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                    {[
                      { label: 'Course Code', value: course.courseCode },
                      { label: 'Teacher', value: course.teacherName },
                      {
                        label: 'Attendance',
                        value: `${course.attendanceRate}%`,
                        color: course.attendanceRate >= 75 ? 'text-positive' : 'text-negative',
                      },
                      {
                        label: 'Avg Grade',
                        value: course.avgGrade !== null ? `${course.avgGrade}/100` : 'N/A',
                        color:
                          course.avgGrade !== null
                            ? course.avgGrade >= 60
                              ? 'text-positive' :'text-negative' :'text-muted-foreground',
                      },
                    ].map((item) => (
                      <div key={item.label} className="bg-card rounded-lg p-3 border border-border">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                        <p className={`text-sm font-700 font-mono-data ${item.color ?? 'text-foreground'}`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Enrolled: {new Date(course.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
