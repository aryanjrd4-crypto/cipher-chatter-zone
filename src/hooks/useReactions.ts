import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';

interface UseReactionsOptions {
  postId?: string;
  commentId?: string;
}

export function useReactions({ postId, commentId }: UseReactionsOptions) {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const queryClient = useQueryClient();
  const key = ['reactions', postId || commentId];

  const { data: reactions = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      let query = supabase.from('reactions').select('emoji, anonymous_id');
      if (postId) query = query.eq('post_id', postId);
      if (commentId) query = query.eq('comment_id', commentId);
      const { data } = await query;
      return data || [];
    },
    enabled: !!(postId || commentId),
  });

  // Group reactions
  const grouped = reactions.reduce<Record<string, { count: number; hasReacted: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasReacted: false };
    acc[r.emoji].count++;
    if (r.anonymous_id === anonymousId) acc[r.emoji].hasReacted = true;
    return acc;
  }, {});

  const reactionCounts = Object.entries(grouped)
    .map(([emoji, { count, hasReacted }]) => ({ emoji, count, hasReacted }))
    .sort((a, b) => b.count - a.count);

  const toggleReaction = async (emoji: string) => {
    const existing = reactions.find((r) => r.emoji === emoji && r.anonymous_id === anonymousId);
    if (existing) {
      let q = supabase.from('reactions').delete().eq('anonymous_id', anonymousId).eq('emoji', emoji);
      if (postId) q = q.eq('post_id', postId);
      if (commentId) q = q.eq('comment_id', commentId);
      await q;
    } else {
      const data: Record<string, unknown> = { anonymous_id: anonymousId, emoji };
      if (postId) data.post_id = postId;
      if (commentId) data.comment_id = commentId;
      await supabase.from('reactions').insert(data as any);

      if (postId) {
        const { data: postRow } = await supabase.from('posts').select('anonymous_id').eq('id', postId).maybeSingle();
        if (postRow && postRow.anonymous_id !== anonymousId) {
          await supabase.from('notifications').insert({
            anonymous_id: postRow.anonymous_id,
            type: 'reaction',
            post_id: postId,
            actor_anonymous_id: anonymousId,
            payload: { emoji },
          });
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: key });
  };

  return { reactionCounts, toggleReaction };
}
