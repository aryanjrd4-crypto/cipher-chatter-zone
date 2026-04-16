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
    const targetId = postId || commentId;
    if (!targetId) return;

    const isPost = !!postId;
    const isSameVote = userVote === voteType;
    
    if (userVote !== 0) {
      // Remove existing vote
      let deleteQuery = supabase.from('votes').delete().eq('anonymous_id', anonymousId);
      if (postId) deleteQuery = deleteQuery.eq('post_id', postId);
      if (commentId) deleteQuery = deleteQuery.eq('comment_id', commentId);
      await deleteQuery;

      // Decrement the old vote count
      if (isPost) {
        const { data: current } = await supabase.from('posts').select('upvotes, downvotes').eq('id', targetId).single();
        if (current) {
          const update = userVote === 1
            ? { upvotes: Math.max(0, current.upvotes - 1) }
            : { downvotes: Math.max(0, current.downvotes - 1) };
          await supabase.from('posts').update(update).eq('id', targetId);
        }
      } else {
        const { data: current } = await supabase.from('comments').select('upvotes, downvotes').eq('id', targetId).single();
        if (current) {
          const update = userVote === 1
            ? { upvotes: Math.max(0, current.upvotes - 1) }
            : { downvotes: Math.max(0, current.downvotes - 1) };
          await supabase.from('comments').update(update).eq('id', targetId);
        }
      }
    }

    if (isSameVote) {
      setUserVote(0);
    } else {
      // Insert new vote
      const voteData: Record<string, unknown> = { anonymous_id: anonymousId, vote_type: voteType };
      if (postId) voteData.post_id = postId;
      if (commentId) voteData.comment_id = commentId;
      await supabase.from('votes').insert(voteData as any);

      // Increment new vote count
      if (isPost) {
        const { data: current } = await supabase.from('posts').select('upvotes, downvotes').eq('id', targetId).single();
        if (current) {
          const update = voteType === 1
            ? { upvotes: current.upvotes + 1 }
            : { downvotes: current.downvotes + 1 };
          await supabase.from('posts').update(update).eq('id', targetId);
        }
      } else {
        const { data: current } = await supabase.from('comments').select('upvotes, downvotes').eq('id', targetId).single();
        if (current) {
          const update = voteType === 1
            ? { upvotes: current.upvotes + 1 }
            : { downvotes: current.downvotes + 1 };
          await supabase.from('comments').update(update).eq('id', targetId);
        }
      }
      setUserVote(voteType);
    }

    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['post', postId] });
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
  };

  return { userVote, handleVote };
}
