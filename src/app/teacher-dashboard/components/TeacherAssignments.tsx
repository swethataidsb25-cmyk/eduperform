'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import {
  teacherDashboardService,
  type TeacherCourse,
  type TeacherAssignment,
  type AssignmentSubmission,
} from '@/lib/services/teacherDashboardService';

interface Props {
  teacherId: string | null;
  courses: TeacherCourse[];
  assignments: TeacherAssignment[];
  loading: boolean;
  onRefresh: () => void;
}

type View = 'list' | 'create' | 'edit' | 'grade';

export default function TeacherAssignments({ teacherId, courses, assignments, loading, onRefresh }: Props) {
  const [view, setView] = useState<View>('list');
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDue, setFormDue] = useState('');
  const [formCourse, setFormCourse] = useState('');

  // Grade state
  const [gradeMap, setGradeMap] = useState<Record<string, { marks: string; feedback: string }>>({});

  const openCreate = () => {
    setFormTitle(''); setFormDesc(''); setFormDue(''); setFormCourse(courses[0]?.id ?? '');
    setMsg(null);
    setView('create');
  };

  const openEdit = (a: TeacherAssignment) => {
    setSelectedAssignment(a);
    setFormTitle(a.title);
    setFormDesc(a.description ?? '');
    setFormDue(a.dueDate ? a.dueDate.split('T')[0] : '');
    setMsg(null);
    setView('edit');
  };

  const openGrade = async (a: TeacherAssignment) => {
    setSelectedAssignment(a);
    setSubsLoading(true);
    setView('grade');
    try {
      const data = await teacherDashboardService.getSubmissions(a.id);
      setSubmissions(data);
      const initial: Record<string, { marks: string; feedback: string }> = {};
      data.forEach((s) => {
        initial[s.id] = { marks: s.marks !== null ? String(s.marks) : '', feedback: s.feedback ?? '' };
      });
      setGradeMap(initial);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setSubsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formTitle.trim() || !formCourse) return;
    setSaving(true); setMsg(null);
    try {
      await teacherDashboardService.createAssignment({ title: formTitle, description: formDesc, dueDate: formDue, courseId: formCourse });
      setMsg('Assignment created!');
      onRefresh();
      setTimeout(() => setView('list'), 1000);
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAssignment || !formTitle.trim()) return;
    setSaving(true); setMsg(null);
    try {
      await teacherDashboardService.updateAssignment(selectedAssignment.id, { title: formTitle, description: formDesc, dueDate: formDue });
      setMsg('Assignment updated!');
      onRefresh();
      setTimeout(() => setView('list'), 1000);
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGrade = async (submissionId: string) => {
    const entry = gradeMap[submissionId];
    if (!entry) return;
    const marks = parseFloat(entry.marks);
    if (isNaN(marks)) return;
    try {
      await teacherDashboardService.gradeSubmission(submissionId, marks, entry.feedback);
      setMsg('Grade saved!');
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
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

  // ── Create / Edit Form ──────────────────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-600 text-foreground">{view === 'create' ? 'Create Assignment' : 'Edit Assignment'}</h3>
          <button onClick={() => setView('list')} className="p-1.5 rounded-md hover:bg-muted">
            <Icon name="XMarkIcon" size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-500 text-foreground mb-1.5">Title *</label>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Assignment title"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-500 text-foreground mb-1.5">Description</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              placeholder="Assignment description"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-500 text-foreground mb-1.5">Due Date</label>
              <input
                type="date"
                value={formDue}
                onChange={(e) => setFormDue(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {view === 'create' && (
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
            )}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={view === 'create' ? handleCreate : handleEdit}
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : view === 'create' ? 'Create Assignment' : 'Save Changes'}
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

  // ── Grade View ──────────────────────────────────────────────────────────────
  if (view === 'grade' && selectedAssignment) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-600 text-foreground">Grade: {selectedAssignment.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedAssignment.courseName}</p>
          </div>
          <button onClick={() => setView('list')} className="p-1.5 rounded-md hover:bg-muted">
            <Icon name="XMarkIcon" size={16} className="text-muted-foreground" />
          </button>
        </div>
        {subsLoading ? (
          <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No submissions yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {msg && <div className={`px-5 py-2 text-sm ${msg.startsWith('Error') ? 'text-destructive' : 'text-emerald-600'}`}>{msg}</div>}
            {submissions.map((sub) => (
              <div key={sub.id} className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-500 text-foreground text-sm">{sub.studentName}</p>
                    <p className="text-xs text-muted-foreground">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                  </div>
                  {sub.marks !== null && (
                    <span className="text-sm font-600 text-primary">{sub.marks}/100</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Marks (0–100)"
                    value={gradeMap[sub.id]?.marks ?? ''}
                    onChange={(e) => setGradeMap((prev) => ({ ...prev, [sub.id]: { ...prev[sub.id], marks: e.target.value } }))}
                    className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    placeholder="Feedback"
                    value={gradeMap[sub.id]?.feedback ?? ''}
                    onChange={(e) => setGradeMap((prev) => ({ ...prev, [sub.id]: { ...prev[sub.id], feedback: e.target.value } }))}
                    className="sm:col-span-2 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button
                  onClick={() => handleGrade(sub.id)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-500 hover:bg-primary/90 transition-colors"
                >
                  Save Grade
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── List View ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-600 text-foreground">Assignments ({assignments.length})</h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:bg-primary/90 transition-colors"
        >
          <Icon name="PlusIcon" size={15} />
          Create Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">
          No assignments yet. Create your first assignment.
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h4 className="font-600 text-foreground">{a.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.courseName}</p>
                  {a.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(a)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <Icon name="PencilIcon" size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => openGrade(a)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Icon name="StarIcon" size={12} />
                    Grade
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-5 mt-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Due: </span>
                  <span className="font-500 text-foreground">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Submissions: </span>
                  <span className="font-500 text-foreground">{a.submittedCount}/{a.totalEnrolled}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Grade: </span>
                  <span className="font-500 text-foreground">{a.avgGrade !== null ? `${a.avgGrade}%` : '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
