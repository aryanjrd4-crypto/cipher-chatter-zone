import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';

const STALE_MS = 20000; // user considered offline after 20s of no heartbeat

export function useRoomPresence(roomId: string | null) {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const [presence, setPresence] = useState<Array<{ anonymous_id: string; is_typing: boolean; last_seen: string }>>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Heartbeat + typing state
  const upsertPresence = useCallback(async (isTyping: boolean) => {
    if (!roomId) return;
    await supabase.from('room_presence').upsert(
      { room_id: roomId, anonymous_id: anonymousId, is_typing: isTyping, last_seen: new Date().toISOString() },
      { onConflict: 'room_id,anonymous_id' }
    );
  }, [roomId, anonymousId]);

  // Initial join + heartbeat every 8s
  useEffect(() => {
    if (!roomId) return;
    upsertPresence(false);
    const interval = setInterval(() => upsertPresence(false), 8000);

    // Subscribe to presence changes
    const channel = supabase
      .channel(`presence-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_presence', filter: `room_id=eq.${roomId}` }, async () => {
        const { data } = await supabase.from('room_presence').select('*').eq('room_id', roomId);
        setPresence(data || []);
      })
      .subscribe();

    // Initial fetch
    supabase.from('room_presence').select('*').eq('room_id', roomId).then(({ data }) => {
      setPresence(data || []);
    });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      // Clean up our row on leave
      supabase.from('room_presence').delete().eq('room_id', roomId).eq('anonymous_id', anonymousId);
    };
  }, [roomId, anonymousId, upsertPresence]);

  const setTyping = useCallback(() => {
    upsertPresence(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => upsertPresence(false), 2500);
  }, [upsertPresence]);

  const now = Date.now();
  const active = presence.filter((p) => now - new Date(p.last_seen).getTime() < STALE_MS);
  const onlineCount = active.length;
  const typingUsers = active.filter((p) => p.is_typing && p.anonymous_id !== anonymousId);

  return { onlineCount, typingUsers, setTyping };
}
