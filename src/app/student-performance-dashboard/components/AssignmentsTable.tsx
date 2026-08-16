'use client';

import React, { useState } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import Icon from '@/components/ui/AppIcon';
import type { AssignmentRow } from '@/lib/services/studentDashboardService';

interface AssignmentsTableProps {
  assignments: AssignmentRow[];
  loading: boolean;
}

const subjectFilters = ['All'];
const statusFilters = ['All', 'Graded', 'Submitted', 'Pending', 'Overdue'];

export default function AssignmentsTable({ assignments, loading }: AssignmentsTableProps) {
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Build dynamic subject filters from live data
  const dynamicSubjects = ['All', ...Array.from(new Set(assignments.map((a) => a.subject)))];

  const filtered = assignments.filter((a) => {
    const matchSubject = subjectFilter === 'All' || a.subject === subjectFilter;
    const matchStatus = statusFilter === 'All' || a.status === statusFilter.toLowerCase();
    return matchSubject && matchStatus;
  });

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="h-5 w-32 bg-muted rounded animate-pulse mb-1" />
          <div className="h-3 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`asgn-skel-${i}`} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 className="text-sm font-600 text-foreground">Assignments</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {assignments.length} total · {assignments.filter((a) => a.status === 'overdue').length} overdue
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-500 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95">
            <Icon name="FunnelIcon" size={13} />
            Filter
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">Subject:</span>
            {dynamicSubjects.map((f) => (
              <button
                key={`subj-filter-${f}`}
                onClick={() => setSubjectFilter(f)}
                className={`px-2.5 py-1 text-xs rounded-full font-500 transition-all ${
                  subjectFilter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">Status:</span>
            {statusFilters.map((f) => (
              <button
                key={`status-filter-${f}`}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 text-xs rounded-full font-500 transition-all ${
                  statusFilter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {[
                { key: 'title', label: 'Assignment' },
                { key: 'subject', label: 'Subject' },
                { key: 'teacher', label: 'Teacher' },
                { key: 'dueDate', label: 'Due Date' },
                { key: 'submittedDate', label: 'Submitted' },
                { key: 'grade', label: 'Grade' },
                { key: 'status', label: 'Status' },
              ].map((col) => (
                <th
                  key={`asgn-th-${col.key}`}
                  className="px-4 py-2.5 text-left text-[11px] font-600 uppercase tracking-wider text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2.5 text-left text-[11px] font-600 uppercase tracking-wider text-muted-foreground w-16">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {assignments.length === 0 ? 'No assignments found for this student.' : 'No assignments match the selected filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((asgn) => (
                <React.Fragment key={asgn.id}>
                  <tr
                    className={`hover:bg-muted/50 transition-colors group ${
                      asgn.status === 'overdue' ? 'bg-negative/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-500 text-foreground max-w-[220px] truncate" title={asgn.title}>
                        {asgn.title}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2.5 py-1 font-500">
                        {asgn.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{asgn.teacher}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-mono-data ${
                          asgn.status === 'overdue' ? 'text-negative font-600' : 'text-foreground'
                        }`}
                      >
                        {asgn.dueDate ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono-data text-muted-foreground">
                        {asgn.submittedDate ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {asgn.grade !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                asgn.grade >= 75
                                  ? 'bg-positive'
                                  : asgn.grade >= 50
                                  ? 'bg-warning' :'bg-negative'
                              }`}
                              style={{ width: `${asgn.grade}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-mono-data font-600 ${
                              asgn.grade >= 75
                                ? 'text-positive'
                                : asgn.grade >= 50
                                ? 'text-warning' :'text-negative'
                            }`}
                          >
                            {asgn.grade}/{asgn.maxGrade}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={asgn.status} />
                    </td>
                    <td className="px-4 py-3">
                      {asgn.feedback && (
                        <button
                          onClick={() => setExpandedRow(expandedRow === asgn.id ? null : asgn.id)}
                          className="p-1.5 rounded-md hover:bg-primary/10 transition-colors"
                          title="View teacher feedback"
                        >
                          <Icon
                            name={expandedRow === asgn.id ? 'ChevronUpIcon' : 'ChatBubbleLeftIcon'}
                            size={14}
                            className="text-muted-foreground hover:text-primary"
                          />
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedRow === asgn.id && asgn.feedback && (
                    <tr key={`${asgn.id}-feedback`} className="bg-primary/5">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <Icon
                            name="ChatBubbleLeftEllipsisIcon"
                            size={15}
                            className="text-primary mt-0.5 flex-shrink-0"
                          />
                          <div>
                            <p className="text-xs font-600 text-primary mb-0.5">
                              Teacher Feedback — {asgn.teacher}
                            </p>
                            <p className="text-sm text-foreground">{asgn.feedback}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {assignments.length} assignments
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-positive inline-block" />
            {assignments.filter((a) => a.status === 'graded').length} Graded
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning inline-block" />
            {assignments.filter((a) => a.status === 'pending').length} Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-negative inline-block" />
            {assignments.filter((a) => a.status === 'overdue').length} Overdue
          </span>
        </div>
      </div>
    </div>
  );
}