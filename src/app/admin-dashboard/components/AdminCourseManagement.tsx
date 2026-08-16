'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminFullService, AdminCourse } from '@/lib/services/adminFullService';

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ courseName: '', courseCode: '', description: '', teacherId: '', departmentId: '', status: 'active' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, t, d] = await Promise.all([
        adminFullService.getCourses(),
        adminFullService.getTeachersForSelect(),
        adminFullService.getDepartmentsForSelect(),
      ]);
      setCourses(data);
      setTeachers(t);
      setDepartments(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = courses.filter((c) =>
    c.courseName.toLowerCase().includes(search.toLowerCase()) ||
    c.courseCode.toLowerCase().includes(search.toLowerCase()) ||
    (c.teacherName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.courseName.trim() || !form.courseCode.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await adminFullService.updateCourse(editingId, form);
      } else {
        await adminFullService.createCourse(form);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    try {
      await adminFullService.deleteCourse(id);
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEdit = (c: AdminCourse) => {
    setForm({
      courseName: c.courseName,
      courseCode: c.courseCode,
      description: c.description ?? '',
      teacherId: c.teacherId ?? '',
      departmentId: c.departmentId ?? '',
      status: c.status ?? 'active',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const resetForm = () => setForm({ courseName: '', courseCode: '', description: '', teacherId: '', departmentId: '', status: 'active' });

  const statusColors: Record<string, string> = {
    active: 'bg-positive/10 text-positive border-positive/20',
    inactive: 'bg-muted text-muted-foreground border-border',
    archived: 'bg-warning/10 text-warning border-warning/20',
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-500 rounded-lg hover:opacity-90 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Course
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-600 text-foreground">{editingId ? 'Edit' : 'Add'} Course</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Course Name *</label>
              <input type="text" value={form.courseName} onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))} placeholder="e.g. Introduction to Programming" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground" />
            </div>
            <div>
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Course Code *</label>
              <input type="text" value={form.courseCode} onChange={(e) => setForm((f) => ({ ...f, courseCode: e.target.value }))} placeholder="e.g. CS101" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground" />
            </div>
            <div>
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Assign Teacher</label>
              <select value={form.teacherId} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground">
                <option value="">Unassigned</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Department</label>
              <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground">
                <option value="">General</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Course description…" rows={2} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground resize-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-500 rounded-lg hover:opacity-90 transition-all disabled:opacity-60">
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 bg-muted text-foreground text-sm font-500 rounded-lg hover:bg-muted/80 transition-all">Cancel</button>
          </div>
        </div>
      )}

      {error && <div className="bg-negative/10 border border-negative/30 text-negative text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Course Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="h-5 bg-muted animate-pulse rounded-md w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded-md w-1/2" />
              <div className="h-4 bg-muted animate-pulse rounded-md w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">No courses found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-card-hover transition-shadow space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-600 text-foreground text-sm truncate">{c.courseName}</p>
                  <p className="text-xs text-muted-foreground font-mono-data mt-0.5">{c.courseCode}</p>
                </div>
                <span className={`text-xs font-500 px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColors[c.status ?? 'active']}`}>
                  {(c.status ?? 'active').charAt(0).toUpperCase() + (c.status ?? 'active').slice(1)}
                </span>
              </div>
              {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>👨‍🏫</span>
                  <span>{c.teacherName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>🏛️</span>
                  <span>{c.departmentName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>👥</span>
                  <span>{c.enrollmentCount} enrolled</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <button onClick={() => handleEdit(c)} className="flex-1 py-1.5 text-xs font-500 text-primary hover:bg-primary/10 rounded-lg transition-colors">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="flex-1 py-1.5 text-xs font-500 text-negative hover:bg-negative/10 rounded-lg transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
