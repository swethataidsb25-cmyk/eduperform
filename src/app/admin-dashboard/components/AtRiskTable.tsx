'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/AppIcon';
import { AtRiskStudent } from '@/lib/services/adminDashboardService';

interface AtRiskTableProps {
  students: AtRiskStudent[];
  loading: boolean;
}

export default function AtRiskTable({ students, loading }: AtRiskTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortCol, setSortCol] = useState<string>('aiScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === students.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(students.map((s) => s.id)));
  };

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sorted = [...students].sort((a, b) => {
    const aVal = a[sortCol as keyof AtRiskStudent];
    const bVal = b[sortCol as keyof AtRiskStudent];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const SortIcon = ({ col }: { col: string }) => (
    <Icon
      name={sortCol === col ? (sortDir === 'asc' ? 'ChevronUpIcon' : 'ChevronDownIcon') : 'ChevronUpDownIcon'}
      size={13}
      className={sortCol === col ? 'text-primary' : 'text-muted-foreground'}
    />
  );

  return (
    <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-600 text-foreground flex items-center gap-2">
            {!loading && students.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-negative animate-pulse" />
            )}
            At-Risk Students
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? 'Loading...' : `${students.length} total · Showing top ${students.length} by AI risk score`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 text-primary text-xs font-500 rounded-lg px-3 py-1.5 slide-up">
              <span>{selectedRows.size} selected</span>
              <button className="hover:text-primary/70 transition-colors">Assign Counsellor</button>
              <button className="hover:text-negative transition-colors">Send Alert</button>
            </div>
          )}
          <Link
            href="/student-performance-dashboard"
            className="text-xs text-primary hover:underline font-500"
          >
            View all →
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={`skel-${i}`} className="h-10 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No at-risk students found. All students are performing well! 🎉
          </div>
        ) : (
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left w-8">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 accent-primary"
                    checked={selectedRows.size === students.length && students.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                {[
                  { key: 'name', label: 'Student' },
                  { key: 'grade', label: 'Class' },
                  { key: 'subject', label: 'Subject' },
                  { key: 'aiScore', label: 'AI Score' },
                  { key: 'attendance', label: 'Attendance' },
                  { key: 'avgGrade', label: 'Avg Grade' },
                  { key: 'risk', label: 'Risk' },
                  { key: 'interventionStatus', label: 'Intervention' },
                ].map((col) => (
                  <th
                    key={`th-${col.key}`}
                    className="px-4 py-2.5 text-left text-[11px] font-600 uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2.5 text-left text-[11px] font-600 uppercase tracking-wider text-muted-foreground w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((student) => (
                <tr
                  key={student.id}
                  className={`hover:bg-muted/50 transition-colors group ${selectedRows.has(student.id) ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 accent-primary"
                      checked={selectedRows.has(student.id)}
                      onChange={() => toggleRow(student.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-700 text-primary">
                          {student.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-500 text-foreground">{student.name}</p>
                        <p className="text-[11px] text-muted-foreground">{student.teacher}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-mono-data">{student.grade}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{student.subject}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${student.aiScore < 40 ? 'bg-negative' : student.aiScore < 50 ? 'bg-warning' : 'bg-positive'}`}
                          style={{ width: `${student.aiScore}%` }}
                        />
                      </div>
                      <span className={`text-sm font-mono-data font-600 ${student.aiScore < 40 ? 'text-negative' : student.aiScore < 50 ? 'text-warning' : 'text-positive'}`}>
                        {student.aiScore}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-mono-data font-600 ${parseFloat(student.attendance) < 75 ? 'text-negative' : 'text-warning'}`}>
                      {student.attendance}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-mono-data font-600 ${student.avgGrade < 50 ? 'text-negative' : 'text-warning'}`}>
                      {student.avgGrade}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={student.risk} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={student.interventionStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href="/student-performance-dashboard" title="View student profile">
                        <button className="p-1.5 rounded-md hover:bg-primary/10 transition-colors" title="View profile">
                          <Icon name="EyeIcon" size={14} className="text-muted-foreground hover:text-primary" />
                        </button>
                      </Link>
                      <button className="p-1.5 rounded-md hover:bg-warning/10 transition-colors" title="Send intervention alert">
                        <Icon name="BellAlertIcon" size={14} className="text-muted-foreground hover:text-warning" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {!loading && students.length > 0 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing {students.length} at-risk students</p>
        </div>
      )}
    </div>
  );
}