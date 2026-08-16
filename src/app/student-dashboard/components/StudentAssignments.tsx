'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { AssignmentItem } from '@/lib/services/studentDashboardFullService';
import { studentDashboardFullService } from '@/lib/services/studentDashboardFullService';
import toast from 'react-hot-toast';

interface Props {
  assignments: AssignmentItem[];
  studentId: string;
  loading: boolean;
  onRefresh: () => void;
}

const STATUS_CONFIG = {
  graded: { label: 'Graded', color: 'text-positive', bg: 'bg-positive/10' },
  submitted: { label: 'Submitted', color: 'text-info', bg: 'bg-info/10' },
  pending: { label: 'Pending', color: 'text-warning', bg: 'bg-warning/10' },
  overdue: { label: 'Overdue', color: 'text-negative', bg: 'bg-negative/10' },
};

type FilterType = 'all' | AssignmentItem['status'];

export default function StudentAssignments({ assignments, studentId, loading, onRefresh }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === 'all' ? assignments : assignments.filter((a) => a.status === filter);

  const counts = {
    all: assignments.length,
    graded: assignments.filter((a) => a.status === 'graded').length,
    submitted: assignments.filter((a) => a.status === 'submitted').length,
    pending: assignments.filter((a) => a.status === 'pending').length,
    overdue: assignments.filter((a) => a.status === 'overdue').length,
  };

  const handleSubmit = async (assignmentId: string) => {
    setSubmitting(assignmentId);
    try {
      const ok = await studentDashboardFullService.submitAssignment(assignmentId, studentId);
      if (ok) {
        toast.success('Assignment submitted successfully!');
        onRefresh();
      } else {
        toast.error('Failed to submit assignment.');
      }
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-card p-5">
        <div className="h-5 w-36 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
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
          <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon name="DocumentTextIcon" size={14} className="text-accent" />
          </div>
          <h3 className="text-sm font-600 text-foreground">Assignments</h3>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'pending', 'overdue', 'submitted', 'graded'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-600 px-2.5 py-1 rounded-full transition-all capitalize ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? `All (${counts.all})` : `${f} (${counts[f]})`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No assignments found.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((asg) => {
            const cfg = STATUS_CONFIG[asg.status];
            const isExpanded = expanded === asg.id;
            return (
              <div key={asg.id}>
                <div className="px-5 py-3.5 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-600 text-foreground">{asg.title}</p>
                      <span className={`text-[10px] font-600 px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {asg.courseName} · {asg.teacherName}
                    </p>
                    {asg.dueDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Due: {new Date(asg.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    {asg.grade !== null && (
                      <p className={`text-xs font-700 font-mono-data mt-0.5 ${asg.grade >= 60 ? 'text-positive' : 'text-negative'}`}>
                        Grade: {asg.grade}/{asg.maxGrade}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(asg.status === 'pending' || asg.status === 'overdue') && (
                      <button
                        onClick={() => handleSubmit(asg.id)}
                        disabled={submitting === asg.id}
                        className="text-xs font-600 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {submitting === asg.id ? 'Submitting…' : 'Submit'}
                      </button>
                    )}
                    {(asg.description || asg.feedback) && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : asg.id)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Icon
                          name="ChevronDownIcon"
                          size={14}
                          className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-4 bg-muted/30 space-y-2">
                    {asg.description && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                        <p className="text-xs text-foreground leading-relaxed">{asg.description}</p>
                      </div>
                    )}
                    {asg.feedback && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Teacher Feedback</p>
                        <p className="text-xs text-foreground leading-relaxed">{asg.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
