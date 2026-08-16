'use client';

import React, { useState } from 'react';

import { teacherDashboardService, type TeacherCourse, type AttendanceEntry, type CourseStudent } from '@/lib/services/teacherDashboardService';

interface Props {
  teacherId: string | null;
  courses: TeacherCourse[];
  attendance: AttendanceEntry[];
  loading: boolean;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-amber-100 text-amber-700',
  excused: 'bg-blue-100 text-blue-700',
};

export default function TeacherAttendance({ teacherId, courses, attendance, loading, onRefresh }: Props) {
  const [mode, setMode] = useState<'view' | 'mark'>('view');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [markDate, setMarkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [courseStudents, setCourseStudents] = useState<CourseStudent[]>([]);
  const [studentStatuses, setStudentStatuses] = useState<Record<string, string>>({});
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('present');

  const loadStudentsForCourse = async (courseId: string) => {
    if (!courseId) return;
    setStudentsLoading(true);
    try {
      const data = await teacherDashboardService.getCourseStudents(courseId);
      setCourseStudents(data);
      const initial: Record<string, string> = {};
      data.forEach((s) => { initial[s.studentId] = 'present'; });
      setStudentStatuses(initial);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (mode === 'mark') loadStudentsForCourse(courseId);
  };

  const handleMarkAttendance = async () => {
    if (!selectedCourseId || courseStudents.length === 0) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const entries = courseStudents.map((s) => ({
        studentId: s.studentId,
        courseId: selectedCourseId,
        date: markDate,
        status: studentStatuses[s.studentId] ?? 'present',
      }));
      await teacherDashboardService.markAttendance(entries);
      setSaveMsg('Attendance marked successfully!');
      onRefresh();
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAttendance = async (id: string) => {
    try {
      await teacherDashboardService.updateAttendance(id, editStatus);
      setEditId(null);
      onRefresh();
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const filteredAttendance = selectedCourseId
    ? attendance.filter((a) => a.courseId === selectedCourseId)
    : attendance;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setMode('view')}
            className={`px-3 py-1.5 rounded-md text-sm font-500 transition-colors ${mode === 'view' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            View History
          </button>
          <button
            onClick={() => { setMode('mark'); if (selectedCourseId) loadStudentsForCourse(selectedCourseId); }}
            className={`px-3 py-1.5 rounded-md text-sm font-500 transition-colors ${mode === 'mark' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Mark Attendance
          </button>
        </div>

        <select
          value={selectedCourseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.courseName}</option>
          ))}
        </select>

        {mode === 'mark' && (
          <input
            type="date"
            value={markDate}
            onChange={(e) => setMarkDate(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        )}
      </div>

      {/* Mark Attendance Mode */}
      {mode === 'mark' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-600 text-foreground">Mark Attendance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Date: {markDate}</p>
          </div>

          {!selectedCourseId ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Select a course to mark attendance.</div>
          ) : studentsLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : courseStudents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No students enrolled in this course.</div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {courseStudents.map((s) => (
                  <div key={s.studentId} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-500 text-foreground text-sm">{s.studentName}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {(['present', 'absent', 'late', 'excused'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setStudentStatuses((prev) => ({ ...prev, [s.studentId]: st }))}
                          className={`px-2.5 py-1 rounded-md text-xs font-500 capitalize transition-colors ${
                            studentStatuses[s.studentId] === st
                              ? STATUS_COLORS[st]
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-border flex items-center gap-3">
                <button
                  onClick={handleMarkAttendance}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save Attendance'}
                </button>
                {saveMsg && (
                  <p className={`text-sm ${saveMsg.startsWith('Error') ? 'text-destructive' : 'text-emerald-600'}`}>
                    {saveMsg}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* View History Mode */}
      {mode === 'view' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-600 text-foreground">Attendance History</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredAttendance.length} records</p>
          </div>
          {filteredAttendance.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No attendance records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 font-500 text-muted-foreground">Student</th>
                    <th className="text-left px-4 py-3 font-500 text-muted-foreground">Course</th>
                    <th className="text-left px-4 py-3 font-500 text-muted-foreground">Date</th>
                    <th className="text-center px-4 py-3 font-500 text-muted-foreground">Status</th>
                    <th className="text-center px-4 py-3 font-500 text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAttendance.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-500 text-foreground">{entry.studentName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.courseName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{entry.date}</td>
                      <td className="px-4 py-3 text-center">
                        {editId === entry.id ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="px-2 py-1 text-xs bg-card border border-border rounded-md"
                          >
                            {['present', 'absent', 'late', 'excused'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-500 capitalize ${STATUS_COLORS[entry.status]}`}>
                            {entry.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editId === entry.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateAttendance(entry.id)}
                              className="text-xs text-emerald-600 hover:underline"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="text-xs text-muted-foreground hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditId(entry.id); setEditStatus(entry.status); }}
                            className="text-xs text-primary hover:underline"
                          >
                            Edit
                          </button>
                        )}
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
