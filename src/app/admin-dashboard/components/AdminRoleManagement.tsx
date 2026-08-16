'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminFullService, AdminRole } from '@/lib/services/adminFullService';

const ALL_PERMISSIONS = [
  { key: 'manage_users', label: 'Manage Users', icon: '👥' },
  { key: 'manage_courses', label: 'Manage Courses', icon: '📚' },
  { key: 'manage_departments', label: 'Manage Departments', icon: '🏛️' },
  { key: 'view_reports', label: 'View Reports', icon: '📊' },
  { key: 'manage_roles', label: 'Manage Roles', icon: '🛡️' },
  { key: 'system_settings', label: 'System Settings', icon: '⚙️' },
  { key: 'mark_attendance', label: 'Mark Attendance', icon: '📋' },
  { key: 'grade_assignments', label: 'Grade Assignments', icon: '✏️' },
  { key: 'view_students', label: 'View Students', icon: '🎓' },
  { key: 'submit_assignments', label: 'Submit Assignments', icon: '📤' },
  { key: 'view_grades', label: 'View Grades', icon: '🏆' },
  { key: 'view_attendance', label: 'View Attendance', icon: '👁️' },
];

export default function AdminRoleManagement() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[] });

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRoles(await adminFullService.getRoles());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const togglePermission = (key: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await adminFullService.updateRole(editingId, form);
      } else {
        await adminFullService.createRole(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', description: '', permissions: [] });
      fetchRoles();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    try {
      await adminFullService.deleteRole(id);
      fetchRoles();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEdit = (r: AdminRole) => {
    setForm({ name: r.name, description: r.description ?? '', permissions: r.permissions });
    setEditingId(r.id);
    setShowForm(true);
  };

  const roleColors = ['bg-primary/10 text-primary', 'bg-positive/10 text-positive', 'bg-warning/10 text-warning', 'bg-accent/10 text-accent'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-600 text-foreground">Role Management</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Define roles and their permissions</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', description: '', permissions: [] }); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-500 rounded-lg hover:opacity-90 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Role
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-600 text-foreground">{editingId ? 'Edit' : 'Create'} Role</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Role Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Department Head" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground" />
            </div>
            <div>
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Role description" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground" />
            </div>
          </div>
          <div>
            <label className="text-xs font-500 text-muted-foreground mb-2 block">Permissions</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {ALL_PERMISSIONS.map((p) => (
                <label key={p.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs ${form.permissions.includes(p.key) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/30'}`}>
                  <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePermission(p.key)} className="sr-only" />
                  <span>{p.icon}</span>
                  <span className="font-500">{p.label}</span>
                </label>
              ))}
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

      {/* Roles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="h-5 bg-muted animate-pulse rounded-md w-1/3" />
              <div className="h-4 bg-muted animate-pulse rounded-md w-2/3" />
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 3 }).map((__, j) => <div key={j} className="h-6 w-20 bg-muted animate-pulse rounded-full" />)}
              </div>
            </div>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">No roles found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r, idx) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-700 ${roleColors[idx % roleColors.length]}`}>
                    🛡️
                  </div>
                  <div>
                    <p className="font-600 text-foreground text-sm">{r.name}</p>
                    {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs font-500 text-muted-foreground mb-2">Permissions ({r.permissions.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.permissions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No permissions assigned</span>
                  ) : (
                    r.permissions.map((p) => {
                      const perm = ALL_PERMISSIONS.find((ap) => ap.key === p);
                      return (
                        <span key={p} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-500">
                          {perm ? `${perm.icon} ${perm.label}` : p}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <button onClick={() => handleEdit(r)} className="flex-1 py-1.5 text-xs font-500 text-primary hover:bg-primary/10 rounded-lg transition-colors">Edit</button>
                <button onClick={() => handleDelete(r.id)} className="flex-1 py-1.5 text-xs font-500 text-negative hover:bg-negative/10 rounded-lg transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
