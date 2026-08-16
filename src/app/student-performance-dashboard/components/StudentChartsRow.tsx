'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { GradeHistoryPoint, SubjectScore } from '@/lib/services/studentDashboardService';

const SubjectRadarChart = dynamic(() => import('./SubjectRadarChart'), { ssr: false });
const GradeHistoryChart = dynamic(() => import('./GradeHistoryChart'), { ssr: false });

interface StudentChartsRowProps {
  gradeHistory: GradeHistoryPoint[];
  subjectScores: SubjectScore[];
  loading: boolean;
  studentName: string;
}

export default function StudentChartsRow({ gradeHistory, subjectScores, loading, studentName }: StudentChartsRowProps) {
  const [activeChart, setActiveChart] = useState<'radar' | 'history'>('history');

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setActiveChart('history')}
              className={`px-3 py-1.5 text-xs font-500 rounded-md transition-all ${
                activeChart === 'history' ?'bg-card text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Grade History
            </button>
            <button
              onClick={() => setActiveChart('radar')}
              className={`px-3 py-1.5 text-xs font-500 rounded-md transition-all ${
                activeChart === 'radar' ?'bg-card text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Subject Breakdown
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {activeChart === 'history'
              ? `${gradeHistory.length} exam periods · ${studentName}`
              : `Performance across ${subjectScores.length} subjects`}
          </p>
        </div>
        <div className="p-5">
          {activeChart === 'history' ? (
            <GradeHistoryChart gradeHistory={gradeHistory} loading={loading} studentName={studentName} />
          ) : (
            <SubjectRadarChart subjectScores={subjectScores} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}