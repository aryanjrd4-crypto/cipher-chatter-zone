import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { useQueryClient } from '@tanstack/react-query';

interface UseVoteOptions {
  postId?: string;
  commentId?: string;
}

export function useVote({ postId, commentId }: UseVoteOptions) {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const [userVote, setUserVote] = useState<number>(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchVote = async () => {
      let query = supabase.from('votes').select('vote_type').eq('anonymous_id', anonymousId);
      if (postId) query = query.eq('post_id', postId);
      if (commentId) query = query.eq('comment_id', commentId);
      
      const { data } = await query.maybeSingle();
      if (data) setUserVote(data.vote_type);
    };
    fetchVote();
  }, [anonymousId, postId, commentId]);

  const handleVote = async (voteType: 1 | -1) => {
    const table = postId ? 'posts' : 'comments';
    const targetId = postId || commentId;
    if (!targetId) return;

    const isSameVote = userVote === voteType;
    
    if (userVote !== 0) {
      // Remove existing vote
      let deleteQuery = supabase.from('votes').delete().eq('anonymous_id', anonymousId);
      if (postId) deleteQuery = deleteQuery.eq('post_id', postId);
      if (commentId) deleteQuery = deleteQuery.eq('comment_id', commentId);
      await deleteQuery;

      // Decrement the old vote
      const oldField = userVote === 1 ? 'upvotes' : 'downvotes';
      const { data: current } = await supabase.from(table).select(oldField).eq('id', targetId).single();
      if (current) {
        await supabase.from(table).update({ [oldField]: Math.max(0, (current as any)[oldField] - 1) }).eq('id', targetId);
      }
    }

    if (isSameVote) {
      setUserVote(0);
    } else {
      // Insert new vote
      const voteData: any = { anonymous_id: anonymousId, vote_type: voteType };
      if (postId) voteData.post_id = postId;
      if (commentId) voteData.comment_id = commentId;
      await supabase.from('votes').insert(voteData);

      const newField = voteType === 1 ? 'upvotes' : 'downvotes';
      const { data: current } = await supabase.from(table).select(newField).eq('id', targetId).single();
      if (current) {
        await supabase.from(table).update({ [newField]: (current as any)[newField] + 1 }).eq('id', targetId);
      }
      setUserVote(voteType);
    }

    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['post', postId] });
  };

  return { userVote, handleVote };
}
