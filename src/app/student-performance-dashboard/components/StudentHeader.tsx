'use client';

import React from 'react';
import type { StudentProfile } from '@/lib/services/studentDashboardService';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';

interface StudentHeaderProps {
  profile: StudentProfile | null;
  loading: boolean;
}

export default function StudentHeader({ profile, loading }: StudentHeaderProps) {
  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ST';

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-start gap-4 flex-wrap">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl gradient-card-indigo flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-800 text-white">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-2">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h1 className="text-xl font-700 text-foreground">{profile?.name ?? 'Student'}</h1>
                <StatusBadge variant="active" label="Active" size="md" />
              </div>
              <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Icon name="AcademicCapIcon" size={14} />
                  {profile?.department ? `${profile.department} · Section ${profile.section}` : 'Student'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="IdentificationIcon" size={14} />
                  <span className="font-mono-data">{profile?.email ?? '—'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="CalendarIcon" size={14} />
                  Semester {profile?.semester ?? '—'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95">
            <Icon name="DocumentArrowDownIcon" size={15} />
            Export Report
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95">
            <Icon name="EnvelopeIcon" size={15} />
            Message
          </button>
          <Link
            href="/admin-dashboard"
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-500 hover:opacity-90 transition-all active:scale-95"
          >
            <Icon name="ChevronLeftIcon" size={15} />
            Admin View
          </Link>
        </div>
      </div>
      {/* Metadata row */}
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`meta-skel-${i}`} className="space-y-1">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            </div>
          ))
        ) : (
          [
            { label: 'Department', value: profile?.department ?? '—' },
            { label: 'Section', value: profile?.section ? `Section ${profile.section}` : '—' },
            { label: 'Semester', value: profile?.semester ? `Semester ${profile.semester}` : '—' },
            { label: 'Email', value: profile?.email ?? '—' },
          ].map((m) => (
            <div key={`meta-${m.label}`}>
              <p className="text-[11px] font-500 uppercase tracking-wider text-muted-foreground mb-0.5">{m.label}</p>
              <p className="text-sm font-500 text-foreground truncate">{m.value}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}