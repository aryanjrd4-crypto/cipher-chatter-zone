import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';

export function useMyPosts() {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  return useQuery({
    queryKey: ['my-posts', anonymousId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('anonymous_id', anonymousId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMyReplies() {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  return useQuery({
    queryKey: ['my-replies', anonymousId],
    queryFn: async () => {
      const { data: comments } = await supabase
        .from('comments')
        .select('id, post_id, content, created_at')
        .eq('anonymous_id', anonymousId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!comments || comments.length === 0) return [];
      const postIds = Array.from(new Set(comments.map((c) => c.post_id)));
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title')
        .in('id', postIds);
      const postMap = new Map((posts || []).map((p) => [p.id, p.title]));
      return comments.map((c) => ({ ...c, postTitle: postMap.get(c.post_id) || 'Deleted post' }));
    },
  });
}

export function useMyReactedPosts() {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  return useQuery({
    queryKey: ['my-reacted-posts', anonymousId],
    queryFn: async () => {
      const { data: reactions } = await supabase
        .from('reactions')
        .select('post_id, emoji')
        .eq('anonymous_id', anonymousId)
        .not('post_id', 'is', null);
      if (!reactions || reactions.length === 0) return [];
      const ids = Array.from(new Set(reactions.map((r) => r.post_id!).filter(Boolean)));
      const { data: posts } = await supabase.from('posts').select('*').in('id', ids);
      return posts || [];
    },
  });
}
