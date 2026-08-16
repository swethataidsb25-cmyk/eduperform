import React from 'react';

type BadgeVariant = 'active' | 'inactive' | 'probation' | 'graduated' | 'critical' | 'warning' | 'good' | 'info' | 'present' | 'absent' | 'late' | 'excused' | 'submitted' | 'pending' | 'graded' | 'overdue';

const variantMap: Record<BadgeVariant, string> = {
  active: 'risk-badge-good',
  inactive: 'bg-muted text-muted-foreground border border-border',
  probation: 'risk-badge-warning',
  graduated: 'risk-badge-info',
  critical: 'risk-badge-critical',
  warning: 'risk-badge-warning',
  good: 'risk-badge-good',
  info: 'risk-badge-info',
  present: 'risk-badge-good',
  absent: 'risk-badge-critical',
  late: 'risk-badge-warning',
  excused: 'risk-badge-info',
  submitted: 'risk-badge-good',
  pending: 'risk-badge-warning',
  graded: 'risk-badge-info',
  overdue: 'risk-badge-critical',
};

const labelMap: Record<BadgeVariant, string> = {
  active: 'Active',
  inactive: 'Inactive',
  probation: 'Probation',
  graduated: 'Graduated',
  critical: 'Critical',
  warning: 'Warning',
  good: 'Good',
  info: 'Info',
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
  submitted: 'Submitted',
  pending: 'Pending',
  graded: 'Graded',
  overdue: 'Overdue',
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ variant, label, size = 'sm' }: StatusBadgeProps) {
  const cls = variantMap[variant] ?? 'bg-muted text-muted-foreground';
  const displayLabel = label ?? labelMap[variant];
  return (
    <span
      className={`inline-flex items-center font-500 rounded-full ${cls} ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      {displayLabel}
    </span>
  );
}