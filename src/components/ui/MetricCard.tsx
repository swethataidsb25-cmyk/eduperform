import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  delta?: number;
  deltaLabel?: string;
  icon: string;
  iconBg?: string;
  alert?: boolean;
  warning?: boolean;
  colSpan?: number;
}

export default function MetricCard({
  label,
  value,
  subValue,
  delta,
  deltaLabel,
  icon,
  iconBg = 'bg-primary/10',
  alert = false,
  warning = false,
  colSpan,
}: MetricCardProps) {
  const cardBg = alert
    ? 'bg-card border-negative/30 shadow-card'
    : warning
    ? 'bg-card border-warning/30 shadow-card'
    : 'bg-card border-border shadow-card';

  const isPositive = delta !== undefined && delta >= 0;
  const isNegative = delta !== undefined && delta < 0;

  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${cardBg} ${colSpan ? `col-span-${colSpan}` : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon
            name={icon as Parameters<typeof Icon>[0]['name']}
            size={18}
            className={alert ? 'text-negative' : warning ? 'text-warning' : 'text-primary'}
          />
        </div>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-500 ${isPositive ? 'text-positive' : 'text-negative'}`}>
            <Icon name={isPositive ? 'ArrowUpIcon' : 'ArrowDownIcon'} size={12} />
            <span>{Math.abs(delta)}%</span>
          </div>
        )}
        {alert && (
          <span className="w-2 h-2 rounded-full bg-negative animate-pulse" />
        )}
      </div>
      <div>
        <p className="text-[12px] font-500 uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <p className={`font-mono-data font-700 leading-none ${alert ? 'text-negative' : warning ? 'text-warning' : 'text-foreground'} text-2xl`}>
          {value}
        </p>
        {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        {deltaLabel && (
          <p className={`text-xs mt-1 ${isPositive ? 'text-positive' : isNegative ? 'text-negative' : 'text-muted-foreground'}`}>
            {deltaLabel}
          </p>
        )}
      </div>
    </div>
  );
}