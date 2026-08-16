'use client';

import React, { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface ActivityItem {
  id: string;
  type: 'submission' | 'grade' | 'attendance' | 'ai' | 'alert';
  icon: string;
  iconColor: string;
  iconBg: string;
  message: string;
  time: string;
  actor: string;
  timestamp: number;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function buildSubmissionItem(row: any): ActivityItem {
  const studentName = row.students?.users?.name ?? 'A student';
  const assignmentTitle = row.assignments?.title ?? 'an assignment';
  return {
    id: `sub-${row.id}`,
    type: 'submission',
    icon: 'DocumentTextIcon',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    message: `${studentName} submitted "${assignmentTitle}"`,
    time: timeAgo(row.submitted_at ?? row.created_at),
    actor: 'Student',
    timestamp: new Date(row.submitted_at ?? row.created_at).getTime(),
  };
}

function buildGradeItem(row: any): ActivityItem {
  const studentName = row.students?.users?.name ?? 'A student';
  const examName = row.exams?.exam_name ?? 'an exam';
  const marks = row.marks != null ? ` — ${row.marks} marks` : '';
  return {
    id: `grade-${row.id}`,
    type: 'grade',
    icon: 'CheckBadgeIcon',
    iconColor: 'text-positive',
    iconBg: 'bg-positive/10',
    message: `${studentName} graded for "${examName}"${marks}`,
    time: timeAgo(row.created_at),
    actor: 'Teacher',
    timestamp: new Date(row.created_at).getTime(),
  };
}

function buildAttendanceItem(row: any): ActivityItem {
  const studentName = row.students?.users?.name ?? 'A student';
  const courseName = row.courses?.course_name ?? 'a course';
  const statusMap: Record<string, { icon: string; color: string; bg: string }> = {
    absent: { icon: 'ExclamationTriangleIcon', color: 'text-negative', bg: 'bg-negative/10' },
    late: { icon: 'ClockIcon', color: 'text-warning', bg: 'bg-warning/10' },
    present: { icon: 'ClipboardDocumentCheckIcon', color: 'text-positive', bg: 'bg-positive/10' },
    excused: { icon: 'ClipboardDocumentCheckIcon', color: 'text-muted-foreground', bg: 'bg-muted/30' },
  };
  const style = statusMap[row.status] ?? statusMap['present'];
  return {
    id: `att-${row.id}`,
    type: row.status === 'absent' ? 'alert' : 'attendance',
    icon: style.icon,
    iconColor: style.color,
    iconBg: style.bg,
    message: `${studentName} marked ${row.status} in "${courseName}"`,
    time: timeAgo(row.created_at),
    actor: 'System',
    timestamp: new Date(row.created_at).getTime(),
  };
}

const MAX_ITEMS = 20;

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  // Initial fetch
  useEffect(() => {
    const supabase = supabaseRef.current;

    async function fetchInitial() {
      try {
        const [subRes, gradeRes, attRes] = await Promise.all([
          supabase
            .from('assignment_submissions')
            .select('id, submitted_at, created_at, students(users(name)), assignments(title)')
            .order('submitted_at', { ascending: false })
            .limit(7),
          supabase
            .from('exam_results')
            .select('id, marks, created_at, students(users(name)), exams(exam_name)')
            .order('created_at', { ascending: false })
            .limit(7),
          supabase
            .from('attendance')
            .select('id, status, created_at, students(users(name)), courses(course_name)')
            .order('created_at', { ascending: false })
            .limit(7),
        ]);

        const items: ActivityItem[] = [
          ...(subRes.data ?? []).map(buildSubmissionItem),
          ...(gradeRes.data ?? []).map(buildGradeItem),
          ...(attRes.data ?? []).map(buildAttendanceItem),
        ];

        items.sort((a, b) => b.timestamp - a.timestamp);
        setActivities(items.slice(0, MAX_ITEMS));
      } catch (err: any) {
        console.error('ActivityFeed initial fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInitial();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const supabase = supabaseRef.current;

    const addItem = (item: ActivityItem) => {
      setActivities((prev) => {
        const deduped = prev.filter((a) => a.id !== item.id);
        return [item, ...deduped].slice(0, MAX_ITEMS);
      });
    };

    const subChannel = supabase
      .channel('rt_submissions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'assignment_submissions' },
        async (payload) => {
          const row = payload.new as any;
          // Enrich with related data
          const { data: enriched } = await supabase
            .from('assignment_submissions')
            .select('id, submitted_at, created_at, students(users(name)), assignments(title)')
            .eq('id', row.id)
            .maybeSingle();
          if (enriched) addItem(buildSubmissionItem(enriched));
        }
      )
      .subscribe();

    const gradeChannel = supabase
      .channel('rt_exam_results')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'exam_results' },
        async (payload) => {
          const row = payload.new as any;
          const { data: enriched } = await supabase
            .from('exam_results')
            .select('id, marks, created_at, students(users(name)), exams(exam_name)')
            .eq('id', row.id)
            .maybeSingle();
          if (enriched) addItem(buildGradeItem(enriched));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'exam_results' },
        async (payload) => {
          const row = payload.new as any;
          const { data: enriched } = await supabase
            .from('exam_results')
            .select('id, marks, created_at, students(users(name)), exams(exam_name)')
            .eq('id', row.id)
            .maybeSingle();
          if (enriched) addItem(buildGradeItem(enriched));
        }
      )
      .subscribe();

    const attChannel = supabase
      .channel('rt_attendance')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance' },
        async (payload) => {
          const row = payload.new as any;
          const { data: enriched } = await supabase
            .from('attendance')
            .select('id, status, created_at, students(users(name)), courses(course_name)')
            .eq('id', row.id)
            .maybeSingle();
          if (enriched) addItem(buildAttendanceItem(enriched));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'attendance' },
        async (payload) => {
          const row = payload.new as any;
          const { data: enriched } = await supabase
            .from('attendance')
            .select('id, status, created_at, students(users(name)), courses(course_name)')
            .eq('id', row.id)
            .maybeSingle();
          if (enriched) addItem(buildAttendanceItem(enriched));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subChannel);
      supabase.removeChannel(gradeChannel);
      supabase.removeChannel(attChannel);
    };
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-600 text-foreground">Recent Activity</h3>
          <span className="flex items-center gap-1 text-[10px] text-positive font-500">
            <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
            Live
          </span>
        </div>
        <button className="text-xs text-primary hover:underline font-500">View all</button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3.5 animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-muted flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted rounded w-4/5" />
                <div className="h-2.5 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Icon name="ClipboardDocumentCheckIcon" size={28} className="mb-2 opacity-40" />
            <p className="text-xs">No recent activity</p>
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors"
            >
              <div
                className={`w-7 h-7 rounded-lg ${act.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}
              >
                <Icon
                  name={act.icon as Parameters<typeof Icon>[0]['name']}
                  size={14}
                  className={act.iconColor}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-snug">{act.message}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-muted-foreground">{act.actor}</span>
                  <span className="text-[10px] text-border">·</span>
                  <span className="text-[10px] text-muted-foreground">{act.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-3 border-t border-border flex-shrink-0">
        <p className="text-[11px] text-muted-foreground text-center">
          Live updates · {activities.length} events shown
        </p>
      </div>
    </div>
  );
}