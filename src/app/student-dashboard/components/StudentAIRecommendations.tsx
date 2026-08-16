'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useChat } from '@/lib/hooks/useChat';
import toast from 'react-hot-toast';
import type { StudentOverviewKPI } from '@/lib/services/studentDashboardFullService';

interface AIReportData {
  strengths: string | null;
  weaknesses: string | null;
  recommendations: string | null;
  generated_at: string;
}

interface Props {
  aiReport: AIReportData | null;
  kpi: StudentOverviewKPI | null;
  studentName: string;
  loading: boolean;
}

function formatDate(dateStr: string): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateStr);
  return `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export default function StudentAIRecommendations({ aiReport, kpi, studentName, loading }: Props) {
  const [studyTip, setStudyTip] = useState<string>('');
  const [tipLoading, setTipLoading] = useState(false);

  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o-mini', false);

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  useEffect(() => {
    if (response && !isLoading) {
      setStudyTip(response);
      setTipLoading(false);
    }
  }, [response, isLoading]);

  const handleGetStudyTip = () => {
    if (!kpi) return;
    setTipLoading(true);
    setStudyTip('');
    const context = `Student: ${studentName}. Attendance: ${kpi.attendanceRate}%. Assignment completion: ${kpi.assignmentCompletion}%. Exam avg: ${kpi.examAvgScore ?? 'N/A'}/100. Weak areas: ${aiReport?.weaknesses ?? 'unknown'}.`;
    sendMessage([
      {
        role: 'system',
        content: 'You are an academic coach. Give a concise, actionable study tip (2-3 sentences max) based on the student data provided. Be specific and encouraging.',
      },
      { role: 'user', content: `Generate a personalized study tip for this student: ${context}` },
    ], { max_completion_tokens: 150 });
  };

  const weakSubjects = aiReport?.weaknesses
    ? aiReport.weaknesses
        .split(/[,.\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 3 && s.length < 60)
        .slice(0, 4)
    : [];

  const improvements = aiReport?.recommendations
    ? aiReport.recommendations
        .split(/[.\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10)
        .slice(0, 4)
    : [];

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-card p-5">
        <div className="h-5 w-44 bg-muted animate-pulse rounded mb-4" />
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
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon name="SparklesIcon" size={14} className="text-primary" />
        </div>
        <h3 className="text-sm font-600 text-foreground">AI Recommendations</h3>
        <span className="ml-auto text-[10px] font-500 text-muted-foreground">
          {aiReport ? `Updated ${formatDate(aiReport.generated_at)}` : 'No report yet'}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Weak Subjects */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Icon name="ArrowTrendingDownIcon" size={14} className="text-negative" />
            <p className="text-xs font-600 uppercase tracking-wider text-muted-foreground">Weak Areas</p>
          </div>
          {weakSubjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {weakSubjects.map((subject, i) => (
                <span key={i} className="text-xs font-500 px-2.5 py-1 rounded-full bg-negative/10 text-negative border border-negative/20">
                  {subject}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {aiReport ? 'No specific weak areas identified.' : 'Run AI analysis to identify weak areas.'}
            </p>
          )}
        </div>

        {/* Improvement Suggestions */}
        {improvements.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Icon name="ArrowTrendingUpIcon" size={14} className="text-positive" />
              <p className="text-xs font-600 uppercase tracking-wider text-muted-foreground">Improvement Plan</p>
            </div>
            <ul className="space-y-2">
              {improvements.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-positive/10 text-positive text-[10px] font-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-foreground leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strengths */}
        {aiReport?.strengths && (
          <div className="rounded-xl bg-positive/5 border border-positive/20 p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="StarIcon" size={13} className="text-positive" />
              <p className="text-xs font-600 text-positive">Strengths</p>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{aiReport.strengths}</p>
          </div>
        )}

        {/* Study Tip Generator */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon name="LightBulbIcon" size={14} className="text-primary" />
              <p className="text-xs font-600 text-primary">Personalized Study Tip</p>
            </div>
            <button
              onClick={handleGetStudyTip}
              disabled={tipLoading || isLoading || !kpi}
              className="text-[11px] font-600 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              {tipLoading || isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Icon name="SparklesIcon" size={11} className="text-primary-foreground" />
                  Generate
                </>
              )}
            </button>
          </div>
          {studyTip ? (
            <p className="text-xs text-foreground leading-relaxed">{studyTip}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Click Generate to get a personalized study tip based on your performance.
            </p>
          )}
        </div>

        {/* No report fallback */}
        {!aiReport && (
          <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
            <Icon name="SparklesIcon" size={24} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              AI analysis not yet generated. Ask your teacher to run an AI analysis for personalized insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
