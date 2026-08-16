'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminFullService, AdminDepartment } from '@/lib/services/adminFullService';

export default function AdminDepartmentManagement() {
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDepartments(await adminFullService.getDepartments());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await adminFullService.updateDepartment(editingId, form);
      } else {
        await adminFullService.createDepartment(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', code: '', description: '' });
      fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    try {
      await adminFullService.deleteDepartment(id);
      fetchData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEdit = (d: AdminDepartment) => {
    setForm({ name: d.name, code: d.code, description: d.description ?? '' });
    setEditingId(d.id);
    setShowForm(true);
  };

  const deptColors = ['bg-primary/10 text-primary', 'bg-positive/10 text-positive', 'bg-warning/10 text-warning', 'bg-accent/10 text-accent', 'bg-negative/10 text-negative', 'bg-muted text-muted-foreground'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-600 text-foreground">Departments</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{departments.length} departments configured</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', code: '', description: '' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-500 rounded-lg hover:opacity-90 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Department
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-600 text-foreground">{editingId ? 'Edit' : 'Add'} Department</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Department Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Science" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground" />
            </div>
            <div>
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Department Code *</label>
              <input type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. CS" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Department description…" rows={2} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground resize-none" />
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

      {/* Department Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="h-5 bg-muted animate-pulse rounded-md w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">No departments found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((d, idx) => (
            <div key={d.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-700 ${deptColors[idx % deptColors.length]}`}>
                    {d.code}
                  </div>
                  <div>
                    <p className="font-600 text-foreground text-sm">{d.name}</p>
                    {d.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.description}</p>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted/30 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg font-700 text-foreground">{d.courseCount}</p>
                  <p className="text-xs text-muted-foreground">Courses</p>
                </div>
                <div className="bg-muted/30 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg font-700 text-foreground">{d.studentCount}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
              </div>
              {d.headTeacherName && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <span>👨‍🏫 Head:</span>
                  <span className="font-500 text-foreground">{d.headTeacherName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <button onClick={() => handleEdit(d)} className="flex-1 py-1.5 text-xs font-500 text-primary hover:bg-primary/10 rounded-lg transition-colors">Edit</button>
                <button onClick={() => handleDelete(d.id)} className="flex-1 py-1.5 text-xs font-500 text-negative hover:bg-negative/10 rounded-lg transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
