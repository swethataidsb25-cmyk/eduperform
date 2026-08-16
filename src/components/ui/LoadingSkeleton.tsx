import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-muted rounded-md ${className}`} />;
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 shadow-card">
      <div className="flex items-start justify-between">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="w-10 h-4 rounded" />
      </div>
      <div>
        <Skeleton className="w-20 h-3 rounded mb-2" />
        <Skeleton className="w-24 h-7 rounded" />
        <Skeleton className="w-32 h-3 rounded mt-2" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={`skel-col-${i}`} className="px-4 py-3">
          <Skeleton className="h-4 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return <Skeleton className={`w-full rounded-xl`} style={{ height: `${height}px` }} />;
}