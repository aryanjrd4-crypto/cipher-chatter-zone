import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';

/**
 * Tracks which messages have been read in a room.
 * Marks all visible messages (not own) as read, and returns a set of message_ids
 * that have been read by anyone other than the sender.
 */
export function useReadReceipts(roomId: string | null, messageIds: string[]) {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const [readsByMessage, setReadsByMessage] = useState<Record<string, number>>({});

  // Fetch current reads
  useEffect(() => {
    if (!roomId || messageIds.length === 0) return;
    supabase
      .from('message_reads')
      .select('message_id, anonymous_id')
      .in('message_id', messageIds)
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach((r) => {
          if (r.anonymous_id !== anonymousId) {
            counts[r.message_id] = (counts[r.message_id] || 0) + 1;
          }
        });
        setReadsByMessage(counts);
      });

    const channel = supabase
      .channel(`reads-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reads' }, (payload) => {
        const row = payload.new as { message_id: string; anonymous_id: string };
        if (messageIds.includes(row.message_id) && row.anonymous_id !== anonymousId) {
          setReadsByMessage((prev) => ({ ...prev, [row.message_id]: (prev[row.message_id] || 0) + 1 }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, messageIds.join(','), anonymousId]);

  // Mark as read
  const markAsRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    const rows = ids.map((message_id) => ({ message_id, anonymous_id: anonymousId }));
    await supabase.from('message_reads').upsert(rows, { onConflict: 'message_id,anonymous_id', ignoreDuplicates: true });
  };

  return { readsByMessage, markAsRead };
}
