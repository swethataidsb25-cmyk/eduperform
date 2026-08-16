'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { AttendanceRecord } from '@/lib/services/studentDashboardFullService';

interface Props {
  records: AttendanceRecord[];
  loading: boolean;
}

const STATUS_CONFIG = {
  present: { label: 'Present', color: 'text-positive', bg: 'bg-positive/10', dot: 'bg-positive' },
  absent: { label: 'Absent', color: 'text-negative', bg: 'bg-negative/10', dot: 'bg-negative' },
  late: { label: 'Late', color: 'text-warning', bg: 'bg-warning/10', dot: 'bg-warning' },
  excused: { label: 'Excused', color: 'text-info', bg: 'bg-info/10', dot: 'bg-info' },
};

export default function StudentAttendance({ records, loading }: Props) {
  const [filter, setFilter] = useState<'all' | AttendanceRecord['status']>('all');

  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter);

  const stats = {
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    excused: records.filter((r) => r.status === 'excused').length,
  };
  const total = records.length;
  const rate = total > 0 ? Math.round(((stats.present + stats.late) / total) * 1000) / 10 : 0;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-card p-5">
        <div className="h-5 w-40 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-warning/10 flex items-center justify-center">
            <Icon name="ClipboardDocumentCheckIcon" size={14} className="text-warning" />
          </div>
          <h3 className="text-sm font-600 text-foreground">Attendance History</h3>
          <span className={`ml-auto text-sm font-700 font-mono-data ${rate >= 75 ? 'text-positive' : 'text-negative'}`}>
            {rate}%
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(stats) as Array<keyof typeof stats>).map((key) => {
            const cfg = STATUS_CONFIG[key];
            return (
              <button
                key={key}
                onClick={() => setFilter(filter === key ? 'all' : key)}
                className={`rounded-lg p-2 text-center transition-all border ${
                  filter === key ? `${cfg.bg} border-current ${cfg.color}` : 'border-border hover:bg-muted'
                }`}
              >
                <p className={`text-base font-700 font-mono-data ${filter === key ? cfg.color : 'text-foreground'}`}>
                  {stats[key]}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize">{key}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No attendance records found.</p>
        </div>
      ) : (
        <div className="divide-y divide-border max-h-96 overflow-y-auto scrollbar-thin">
          {filtered.map((record) => {
            const cfg = STATUS_CONFIG[record.status];
            return (
              <div key={record.id} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-500 text-foreground truncate">{record.courseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
