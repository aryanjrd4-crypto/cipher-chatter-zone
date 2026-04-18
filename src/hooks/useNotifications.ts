import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';

export function useNotifications() {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', anonymousId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('anonymous_id', anonymousId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${anonymousId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `anonymous_id=eq.${anonymousId}` },
        () => queryClient.invalidateQueries({ queryKey: ['notifications', anonymousId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [anonymousId, queryClient]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('anonymous_id', anonymousId)
      .eq('read', false);
    queryClient.invalidateQueries({ queryKey: ['notifications', anonymousId] });
  };

  return { notifications, unreadCount, markAllRead };
}
