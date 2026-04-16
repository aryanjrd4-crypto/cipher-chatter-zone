import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';

export function useUserAnalytics() {
  const anonymousId = useIdentityStore((s) => s.anonymousId);

  return useQuery({
    queryKey: ['user-analytics', anonymousId],
    queryFn: async () => {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, upvotes, downvotes, view_count, comment_count, share_count')
        .eq('anonymous_id', anonymousId);

      const myPosts = posts || [];
      const totalPosts = myPosts.length;
      const totalViews = myPosts.reduce((s, p) => s + p.view_count, 0);
      const totalUpvotes = myPosts.reduce((s, p) => s + p.upvotes, 0);
      const totalDownvotes = myPosts.reduce((s, p) => s + p.downvotes, 0);
      const totalComments = myPosts.reduce((s, p) => s + p.comment_count, 0);
      const totalShares = myPosts.reduce((s, p) => s + p.share_count, 0);
      const mostViewed = myPosts.sort((a, b) => b.view_count - a.view_count)[0] || null;

      return {
        totalPosts,
        totalViews,
        totalUpvotes,
        totalDownvotes,
        totalComments,
        totalShares,
        mostViewed,
        posts: myPosts,
      };
    },
  });
}
