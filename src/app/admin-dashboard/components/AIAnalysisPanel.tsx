'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { fetchAllStudentIds } from '@/lib/services/aiAnalysisService';

interface AnalysisResult {
  studentId: string;
  studentName?: string;
  strengths?: string;
  weaknesses?: string;
  recommendations?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  savedToDb?: boolean;
  error?: string;
}

interface RunResult {
  processed: number;
  saved: number;
  errors: number;
  results: AnalysisResult[];
}

const riskColors: Record<string, string> = {
  low: 'bg-positive/10 text-positive border-positive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-negative/10 text-negative border-negative/20',
};

export default function AIAnalysisPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setIsRunning(true);
    setRunResult(null);
    try {
      // Fetch all student IDs from Supabase
      const students = await fetchAllStudentIds();
      if (students.length === 0) {
        toast.error('No students found in the database.');
        setIsRunning(false);
        return;
      }

      const studentIds = students.map((s) => s.id);

      const response = await fetch('/api/ai/analyze-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? 'Analysis request failed');
      }

      const data: RunResult = await response.json();
      setRunResult(data);

      if (data.errors === 0) {
        toast.success(`Analysis complete — ${data.saved} reports saved to database`);
      } else {
        toast.success(`Analysis complete — ${data.saved} saved, ${data.errors} errors`);
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to run AI analysis');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l-1.57.393M5 14.5l-1.57.393" />
              </svg>
            </div>
            <h2 className="text-base font-600 text-foreground">AI Performance Analysis</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-10">
            Analyze all students with OpenAI · Auto-populate AI Reports table
          </p>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-500 rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
              </svg>
              Run Analysis
            </>
          )}
        </button>
      </div>

      {/* Progress / Stats */}
      {isRunning && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-primary animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-primary">
            Fetching student data and generating AI insights… This may take a moment.
          </p>
        </div>
      )}

      {runResult && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/30 rounded-xl px-4 py-3 text-center">
              <p className="text-xl font-700 text-foreground">{runResult.processed}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Analyzed</p>
            </div>
            <div className="bg-positive/10 rounded-xl px-4 py-3 text-center">
              <p className="text-xl font-700 text-positive">{runResult.saved}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Reports Saved</p>
            </div>
            <div className={`rounded-xl px-4 py-3 text-center ${runResult.errors > 0 ? 'bg-negative/10' : 'bg-muted/30'}`}>
              <p className={`text-xl font-700 ${runResult.errors > 0 ? 'text-negative' : 'text-foreground'}`}>
                {runResult.errors}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Errors</p>
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {runResult.results.map((result) => (
              <div
                key={result.studentId}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === result.studentId ? null : result.studentId)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-600 text-primary flex-shrink-0">
                      {(result.studentName ?? 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-500 text-foreground">
                        {result.studentName ?? result.studentId}
                      </p>
                      {result.error ? (
                        <p className="text-xs text-negative">{result.error}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {result.savedToDb ? '✓ Saved to AI Reports' : '⚠ Not saved'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.riskLevel && (
                      <span className={`text-xs font-500 px-2 py-0.5 rounded-full border ${riskColors[result.riskLevel]}`}>
                        {result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)} Risk
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === result.studentId ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedId === result.studentId && !result.error && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/10">
                    {result.strengths && (
                      <div className="pt-3">
                        <p className="text-xs font-600 text-positive uppercase tracking-wide mb-1">Strengths</p>
                        <p className="text-xs text-foreground leading-relaxed">{result.strengths}</p>
                      </div>
                    )}
                    {result.weaknesses && (
                      <div>
                        <p className="text-xs font-600 text-negative uppercase tracking-wide mb-1">Weaknesses</p>
                        <p className="text-xs text-foreground leading-relaxed">{result.weaknesses}</p>
                      </div>
                    )}
                    {result.recommendations && (
                      <div>
                        <p className="text-xs font-600 text-primary uppercase tracking-wide mb-1">Recommendations</p>
                        <p className="text-xs text-foreground leading-relaxed">{result.recommendations}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!isRunning && !runResult && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <p className="text-sm font-500 text-foreground">Ready to analyze</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Click "Run Analysis" to generate personalized AI insights for all students and save them to the AI Reports table.
          </p>
        </div>
      )}
    </div>
  );
}
