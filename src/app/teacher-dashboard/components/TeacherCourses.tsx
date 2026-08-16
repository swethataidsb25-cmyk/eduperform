'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { teacherDashboardService, type TeacherCourse, type CourseStudent } from '@/lib/services/teacherDashboardService';

interface Props {
  teacherId: string | null;
  courses: TeacherCourse[];
  loading: boolean;
  onRefresh: () => void;
}

export default function TeacherCourses({ teacherId, courses, loading, onRefresh }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<TeacherCourse | null>(null);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const handleViewStudents = async (course: TeacherCourse) => {
    setSelectedCourse(course);
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const data = await teacherDashboardService.getCourseStudents(course.id);
      setStudents(data);
    } catch (err: any) {
      setStudentsError(err.message);
    } finally {
      setStudentsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
            <div className="h-5 bg-muted rounded w-48 mb-2" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.length === 0 ? (
          <div className="col-span-2 bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">
            No courses assigned. Contact your administrator.
          </div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-600 text-foreground">{course.courseName}</h3>
                  <span className="inline-block mt-1 text-xs font-500 bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                    {course.courseCode}
                  </span>
                </div>
                <button
                  onClick={() => handleViewStudents(course)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Icon name="UsersIcon" size={13} />
                  View Students
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-700 text-foreground">{course.enrolledCount}</p>
                  <p className="text-xs text-muted-foreground">Enrolled</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-700 text-foreground">{course.avgAttendance}%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-700 text-foreground">{course.avgGrade !== null ? `${course.avgGrade}%` : '—'}</p>
                  <p className="text-xs text-muted-foreground">Avg Grade</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Students Panel */}
      {selectedCourse && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-600 text-foreground">Students — {selectedCourse.courseName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedCourse.courseCode}</p>
            </div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <Icon name="XMarkIcon" size={16} className="text-muted-foreground" />
            </button>
          </div>

          {studentsLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : studentsError ? (
            <div className="p-6 text-sm text-destructive">{studentsError}</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No students enrolled.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 font-500 text-muted-foreground">Student</th>
                    <th className="text-left px-4 py-3 font-500 text-muted-foreground">Dept / Sem</th>
                    <th className="text-center px-4 py-3 font-500 text-muted-foreground">Attendance</th>
                    <th className="text-center px-4 py-3 font-500 text-muted-foreground">Avg Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s) => (
                    <tr key={s.studentId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-500 text-foreground">{s.studentName}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.department} · Sem {s.semester}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-600 ${s.attendanceRate >= 75 ? 'text-emerald-600' : 'text-destructive'}`}>
                          {s.attendanceRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-600 text-foreground">
                        {s.avgGrade !== null ? `${s.avgGrade}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
