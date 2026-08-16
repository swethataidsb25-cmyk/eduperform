'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import {
  teacherDashboardService,
  type TeacherCourse,
  type TeacherExam,
  type CourseStudent,
} from '@/lib/services/teacherDashboardService';

interface Props {
  teacherId: string | null;
  courses: TeacherCourse[];
  exams: TeacherExam[];
  loading: boolean;
  onRefresh: () => void;
}

type View = 'list' | 'create' | 'upload';

export default function TeacherExams({ teacherId, courses, exams, loading, onRefresh }: Props) {
  const [view, setView] = useState<View>('list');
  const [selectedExam, setSelectedExam] = useState<TeacherExam | null>(null);
  const [examStudents, setExamStudents] = useState<CourseStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Create form
  const [formName, setFormName] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formDate, setFormDate] = useState('');

  // Results map
  const [resultsMap, setResultsMap] = useState<Record<string, string>>({});

  const openCreate = () => {
    setFormName(''); setFormCourse(courses[0]?.id ?? ''); setFormDate('');
    setMsg(null);
    setView('create');
  };

  const openUpload = async (exam: TeacherExam) => {
    setSelectedExam(exam);
    setStudentsLoading(true);
    setMsg(null);
    setView('upload');
    try {
      const data = await teacherDashboardService.getCourseStudents(exam.courseId);
      setExamStudents(data);
      const initial: Record<string, string> = {};
      data.forEach((s) => { initial[s.studentId] = ''; });
      setResultsMap(initial);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formCourse) return;
    setSaving(true); setMsg(null);
    try {
      await teacherDashboardService.createExam({ examName: formName, courseId: formCourse, examDate: formDate });
      setMsg('Exam created!');
      onRefresh();
      setTimeout(() => setView('list'), 1000);
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadResults = async () => {
    if (!selectedExam) return;
    setSaving(true); setMsg(null);
    try {
      const entries = examStudents
        .filter((s) => resultsMap[s.studentId] !== '' && !isNaN(parseFloat(resultsMap[s.studentId])))
        .map((s) => ({ studentId: s.studentId, marks: parseFloat(resultsMap[s.studentId]) }));

      await Promise.all(
        entries.map((e) => teacherDashboardService.uploadExamResult(selectedExam.id, e.studentId, e.marks))
      );
      setMsg(`Results uploaded for ${entries.length} student(s)!`);
      onRefresh();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Create Form ─────────────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-600 text-foreground">Create Exam</h3>
          <button onClick={() => setView('list')} className="p-1.5 rounded-md hover:bg-muted">
            <Icon name="XMarkIcon" size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-500 text-foreground mb-1.5">Exam Name *</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Midterm Exam"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-500 text-foreground mb-1.5">Course *</label>
              <select
                value={formCourse}
                onChange={(e) => setFormCourse(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.courseName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-500 text-foreground mb-1.5">Exam Date</label>
              <input
                type="datetime-local"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating…' : 'Create Exam'}
            </button>
            <button onClick={() => setView('list')} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-destructive' : 'text-emerald-600'}`}>{msg}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── Upload Results ──────────────────────────────────────────────────────────
  if (view === 'upload' && selectedExam) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-600 text-foreground">Upload Results: {selectedExam.examName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedExam.courseName}</p>
          </div>
          <button onClick={() => setView('list')} className="p-1.5 rounded-md hover:bg-muted">
            <Icon name="XMarkIcon" size={16} className="text-muted-foreground" />
          </button>
        </div>

        {studentsLoading ? (
          <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
        ) : examStudents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No students enrolled in this course.</div>
        ) : (
          <>
            {msg && <div className={`px-5 py-2 text-sm ${msg.startsWith('Error') ? 'text-destructive' : 'text-emerald-600'}`}>{msg}</div>}
            <div className="divide-y divide-border">
              {examStudents.map((s) => (
                <div key={s.studentId} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-500 text-foreground text-sm">{s.studentName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Marks"
                    value={resultsMap[s.studentId] ?? ''}
                    onChange={(e) => setResultsMap((prev) => ({ ...prev, [s.studentId]: e.target.value }))}
                    className="w-24 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-center"
                  />
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-border flex items-center gap-3">
              <button
                onClick={handleUploadResults}
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Uploading…' : 'Upload Results'}
              </button>
              <button onClick={() => setView('list')} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── List View ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-600 text-foreground">Exams ({exams.length})</h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors"
        >
          <Icon name="PlusIcon" size={15} />
          Create Exam
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">
          No exams yet. Create your first exam.
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const isPast = exam.examDate ? new Date(exam.examDate) < new Date() : false;
            return (
              <div key={exam.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h4 className="font-600 text-foreground">{exam.examName}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{exam.courseName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-500 ${isPast ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                      {isPast ? 'Completed' : 'Upcoming'}
                    </span>
                    <button
                      onClick={() => openUpload(exam)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <Icon name="ArrowUpTrayIcon" size={12} />
                      Upload Results
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-5 mt-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Date: </span>
                    <span className="font-500 text-foreground">
                      {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Results: </span>
                    <span className="font-500 text-foreground">{exam.resultsUploaded}/{exam.totalEnrolled}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Score: </span>
                    <span className="font-500 text-foreground">{exam.avgMarks !== null ? `${exam.avgMarks}%` : '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
