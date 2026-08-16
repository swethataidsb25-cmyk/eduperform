'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminFullService, AdminUser } from '@/lib/services/adminFullService';

type UserTab = 'student' | 'teacher' | 'admin';

const roleColors: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border-primary/20',
  teacher: 'bg-positive/10 text-positive border-positive/20',
  student: 'bg-accent/10 text-accent border-accent/20',
};

export default function AdminUserManagement() {
  const [activeTab, setActiveTab] = useState<UserTab>('student');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'student' as UserTab });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFullService.getUsers(activeTab === 'admin' ? 'admin' : activeTab);
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await adminFullService.updateUser(editingId, { name: form.name, email: form.email });
      } else {
        await adminFullService.createUser({ name: form.name, email: form.email, role: activeTab });
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', email: '', role: activeTab });
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await adminFullService.deleteUser(id);
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEdit = (u: AdminUser) => {
    setForm({ name: u.name, email: u.email, role: activeTab });
    setEditingId(u.id);
    setShowForm(true);
  };

  const tabs: { key: UserTab; label: string; icon: string }[] = [
    { key: 'student', label: 'Students', icon: '🎓' },
    { key: 'teacher', label: 'Teachers', icon: '👨‍🏫' },
    { key: 'admin', label: 'Admins', icon: '🛡️' },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setSearch(''); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-500 transition-all ${
              activeTab === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${activeTab}s…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', email: '', role: activeTab }); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-500 rounded-lg hover:opacity-90 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-600 text-foreground">{editingId ? 'Edit' : 'Add'} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Enter full name"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-500 text-muted-foreground mb-1 block">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Enter email"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary text-foreground"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-500 rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-4 py-2 bg-muted text-foreground text-sm font-500 rounded-lg hover:bg-muted/80 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-negative/10 border border-negative/30 text-negative text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Role</th>
                {activeTab === 'student' && (
                  <>
                    <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Semester</th>
                  </>
                )}
                {activeTab === 'teacher' && (
                  <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Specialization</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-600 uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded-md w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    No {activeTab}s found
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-700 text-primary flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-500 text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-500 px-2 py-0.5 rounded-full border ${roleColors[u.role]}`}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    {activeTab === 'student' && (
                      <>
                        <td className="px-4 py-3 text-muted-foreground">{u.department || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.semester ?? '—'}</td>
                      </>
                    )}
                    {activeTab === 'teacher' && (
                      <td className="px-4 py-3 text-muted-foreground">{u.specialization || '—'}</td>
                    )}
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 rounded-md hover:bg-negative/10 transition-colors text-muted-foreground hover:text-negative"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground">
            Showing {filtered.length} of {users.length} {activeTab}s
          </div>
        )}
      </div>
    </div>
  );
}
