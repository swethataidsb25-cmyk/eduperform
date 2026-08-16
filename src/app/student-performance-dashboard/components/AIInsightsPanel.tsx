'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { AIReport, KPIData } from '@/lib/services/studentDashboardService';

interface AIInsightsPanelProps {
  aiReport: AIReport | null;
  kpiData: KPIData | null;
  loading: boolean;
}

export default function AIInsightsPanel({ aiReport, kpiData, loading }: AIInsightsPanelProps) {
  const [expandedRec, setExpandedRec] = useState<string | null>('rec-001');

  const aiScore = kpiData?.aiScore ?? null;
  const attendanceRate = kpiData?.attendanceRate ?? null;

  // Build dynamic recommendations from live AI report data
  const recommendations: Array<{
    id: string;
    priority: string;
    category: string;
    title: string;
    detail: string;
    action: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    badgeColor: string;
    badgeLabel: string;
  }> = [];

  if (aiReport?.weaknesses) {
    recommendations.push({
      id: 'rec-001',
      priority: 'warning',
      category: 'Weaknesses',
      title: 'Areas needing improvement identified',
      detail: aiReport.weaknesses,
      action: 'Review with Teacher',
      icon: 'ArrowTrendingDownIcon',
      iconColor: 'text-warning',
      iconBg: 'bg-warning/10',
      badgeColor: 'risk-badge-warning',
      badgeLabel: 'Warning',
    });
  }

  if (aiReport?.strengths) {
    recommendations.push({
      id: 'rec-002',
      priority: 'positive',
      category: 'Strengths',
      title: 'Strong performance areas detected',
      detail: aiReport.strengths,
      action: 'Keep it up!',
      icon: 'StarIcon',
      iconColor: 'text-positive',
      iconBg: 'bg-positive/10',
      badgeColor: 'risk-badge-good',
      badgeLabel: 'Strength',
    });
  }

  if (aiReport?.recommendations) {
    recommendations.push({
      id: 'rec-003',
      priority: 'info',
      category: 'Recommendations',
      title: 'AI-generated action plan',
      detail: aiReport.recommendations,
      action: 'Follow Plan',
      icon: 'DocumentTextIcon',
      iconColor: 'text-info',
      iconBg: 'bg-info/10',
      badgeColor: 'risk-badge-info',
      badgeLabel: 'Action Needed',
    });
  }

  if (attendanceRate !== null && attendanceRate < 80) {
    recommendations.push({
      id: 'rec-att',
      priority: 'critical',
      category: 'Attendance',
      title: 'Attendance below intervention threshold',
      detail: `Current attendance rate is ${attendanceRate}%, which is below the 80% minimum required. Please attend classes regularly to avoid academic review.`,
      action: 'Schedule Counsellor Meeting',
      icon: 'ExclamationTriangleIcon',
      iconColor: 'text-negative',
      iconBg: 'bg-negative/10',
      badgeColor: 'risk-badge-critical',
      badgeLabel: 'Critical',
    });
  }

  // Fallback if no AI report
  if (recommendations.length === 0 && !loading) {
    recommendations.push({
      id: 'rec-no-data',
      priority: 'info',
      category: 'AI Analysis',
      title: 'No AI report available yet',
      detail: 'AI performance analysis will appear here once your teacher generates a report for your profile.',
      action: 'Request Analysis',
      icon: 'SparklesIcon',
      iconColor: 'text-info',
      iconBg: 'bg-info/10',
      badgeColor: 'risk-badge-info',
      badgeLabel: 'Pending',
    });
  }

  const predictedOutcome =
    aiScore !== null
      ? aiScore >= 75
        ? 'On Track'
        : aiScore >= 50
        ? 'Pass with Conditions' :'At Risk' :'Pending Analysis';

  const confidence = aiScore !== null ? Math.min(95, Math.max(40, aiScore + 15)) : 0;

  const lastUpdated = aiReport?.generatedAt
    ? new Date(aiReport.generatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not yet generated';

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-card flex flex-col h-full">
        <div className="px-5 py-4 border-b border-border flex-shrink-0">
          <div className="h-5 w-40 bg-muted rounded animate-pulse mb-1" />
          <div className="h-3 w-56 bg-muted rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`ai-skel-${i}`} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-card flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="SparklesIcon" size={14} className="text-primary" />
          </div>
          <h3 className="text-sm font-600 text-foreground">AI Performance Insights</h3>
        </div>
        <p className="text-xs text-muted-foreground">Powered by EduPerform AI Engine · Last updated {lastUpdated}</p>
      </div>

      {/* Semester prediction card */}
      <div className="mx-4 mt-4 mb-3 rounded-xl border border-warning/30 bg-warning/5 p-4 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[11px] font-500 uppercase tracking-wider text-muted-foreground mb-0.5">
              Predicted Outcome
            </p>
            <p className="text-base font-700 text-warning">{predictedOutcome}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-500 uppercase tracking-wider text-muted-foreground mb-0.5">Confidence</p>
            <p className="text-base font-mono-data font-700 text-foreground">
              {aiScore !== null ? `${confidence}%` : '—'}
            </p>
          </div>
        </div>

        {/* Confidence bar */}
        {aiScore !== null && (
          <div className="mb-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-warning transition-all duration-700"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            {
              label: 'AI Score',
              value: aiScore !== null ? `${aiScore}/100` : '—',
            },
            {
              label: 'Attendance',
              value: attendanceRate !== null ? `${attendanceRate}%` : '—',
            },
            {
              label: 'Assignments',
              value: kpiData ? `${kpiData.assignmentCompletion}%` : '—',
            },
          ].map((s) => (
            <div key={`pred-${s.label}`} className="bg-card/60 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{s.label}</p>
              <p className="text-xs font-mono-data font-700 text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Score gauge */}
      {aiScore !== null && (
        <div className="px-4 mb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-500 text-muted-foreground">AI Performance Score</span>
            <span
              className={`text-sm font-mono-data font-700 ${
                aiScore >= 75 ? 'text-positive' : aiScore >= 50 ? 'text-warning' : 'text-negative'
              }`}
            >
              {aiScore} / 100
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${aiScore}%`,
                background: 'linear-gradient(90deg, var(--negative) 0%, var(--warning) 60%, var(--positive) 100%)',
                clipPath: `inset(0 ${100 - aiScore}% 0 0)`,
                backgroundSize: '172% 100%',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>At Risk</span>
            <span>Moderate</span>
            <span>On Track</span>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-4 space-y-2">
        <p className="text-[11px] font-600 uppercase tracking-wider text-muted-foreground mb-2">
          Recommendations ({recommendations.length})
        </p>
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`border rounded-xl overflow-hidden transition-all duration-200 ${
              rec.priority === 'critical' ?'border-negative/30'
                : rec.priority === 'warning' ?'border-warning/30'
                : rec.priority === 'positive' ?'border-positive/30' :'border-info/20'
            }`}
          >
            <button
              className="w-full flex items-start gap-2.5 p-3 hover:bg-muted/30 transition-colors text-left"
              onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
            >
              <div
                className={`w-6 h-6 rounded-lg ${rec.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}
              >
                <Icon
                  name={rec.icon as Parameters<typeof Icon>[0]['name']}
                  size={13}
                  className={rec.iconColor}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className={`text-[10px] font-600 px-1.5 py-0.5 rounded-full ${rec.badgeColor}`}>
                    {rec.badgeLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{rec.category}</span>
                </div>
                <p className="text-xs font-500 text-foreground leading-snug">{rec.title}</p>
              </div>
              <Icon
                name={expandedRec === rec.id ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                size={13}
                className="text-muted-foreground flex-shrink-0 mt-1"
              />
            </button>

            {expandedRec === rec.id && (
              <div className="px-3 pb-3 border-t border-border/60 pt-2.5 slide-up">
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{rec.detail}</p>
                <button className="w-full py-1.5 text-xs font-500 border border-primary/30 text-primary rounded-lg hover:bg-primary/10 transition-all active:scale-95">
                  {rec.action}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex-shrink-0">
        <p className="text-[11px] text-muted-foreground text-center leading-snug">
          AI analysis is advisory only. Always consult qualified educators before making academic decisions.
        </p>
      </div>
    </div>
  );
}