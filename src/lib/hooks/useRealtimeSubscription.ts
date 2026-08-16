'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribes to INSERT / UPDATE / DELETE events on the given Supabase tables.
 * Calls `onRefresh` whenever any change is detected.
 *
 * @param tables    - Array of table names to watch
 * @param onRefresh - Callback invoked on any change
 * @param enabled   - Set to false to skip subscription (e.g. while loading auth)
 */
export function useRealtimeSubscription(
  tables: string[],
  onRefresh: () => void,
  enabled = true
) {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const onRefreshRef = useRef(onRefresh);
  const tableKey = tables.join(',');

  // Keep callback ref current without re-subscribing
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled || tables.length === 0) return;

    const supabase = createClient();

    const channels: RealtimeChannel[] = tables.map((table) => {
      const channel = supabase
        .channel(`rt:${table}:${Math.random().toString(36).slice(2)}`)
        .on(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'postgres_changes' as any,
          { event: '*', schema: 'public', table },
          () => {
            onRefreshRef.current();
          }
        )
        .subscribe();
      return channel;
    });

    channelsRef.current = channels;

    return () => {
      channels.forEach((ch) => {
        supabase.removeChannel(ch);
      });
      channelsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tableKey]);
}
