'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { ExamItem } from '@/lib/services/studentDashboardFullService';

interface Props {
  exams: ExamItem[];
  loading: boolean;
}

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', color: 'text-primary', bg: 'bg-primary/10' },
  completed: { label: 'Completed', color: 'text-info', bg: 'bg-info/10' },
  graded: { label: 'Graded', color: 'text-positive', bg: 'bg-positive/10' },
};

export default function StudentExams({ exams, loading }: Props) {
  const [tab, setTab] = useState<'schedule' | 'results'>('schedule');

  const upcoming = exams.filter((e) => e.status === 'upcoming');
  const completed = exams.filter((e) => e.status !== 'upcoming');
  const graded = exams.filter((e) => e.status === 'graded' && e.marks !== null);

  const avgScore =
    graded.length > 0
      ? Math.round(graded.reduce((sum, e) => sum + (e.marks ?? 0), 0) / graded.length)
      : null;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-card p-5">
        <div className="h-5 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const displayList = tab === 'schedule' ? upcoming : completed;

  return (
    <div className="bg-card border border-border rounded-xl shadow-card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-info/10 flex items-center justify-center">
            <Icon name="PencilSquareIcon" size={14} className="text-info" />
          </div>
          <h3 className="text-sm font-600 text-foreground">Exams</h3>
          {avgScore !== null && (
            <span className="ml-auto text-xs text-muted-foreground">
              Avg: <span className={`font-700 font-mono-data ${avgScore >= 60 ? 'text-positive' : 'text-negative'}`}>{avgScore}/100</span>
            </span>
          )}
        </div>
        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['schedule', 'results'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs font-600 py-1.5 rounded-md transition-all capitalize ${
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'schedule' ? `Schedule (${upcoming.length})` : `Results (${completed.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {displayList.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === 'schedule' ? 'No upcoming exams.' : 'No exam results yet.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border max-h-96 overflow-y-auto scrollbar-thin">
          {displayList.map((exam) => {
            const cfg = STATUS_CONFIG[exam.status];
            return (
              <div key={exam.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon name="PencilSquareIcon" size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-foreground truncate">{exam.examName}</p>
                  <p className="text-xs text-muted-foreground">{exam.courseName}</p>
                  {exam.examDate && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(exam.examDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  {exam.marks !== null ? (
                    <p className={`text-base font-700 font-mono-data ${exam.marks >= 60 ? 'text-positive' : 'text-negative'}`}>
                      {exam.marks}/100
                    </p>
                  ) : (
                    <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
