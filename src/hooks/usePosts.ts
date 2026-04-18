import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 20;

export type Feed = 'for-you' | 'trending' | 'latest';

interface UsePostsOptions {
  category?: string;
  feed?: Feed;
  query?: string;
}

export function usePosts({ category, feed = 'latest', query }: UsePostsOptions = {}) {
  return useInfiniteQuery({
    queryKey: ['posts', category, feed, query],
    queryFn: async ({ pageParam = 0 }) => {
      let q = supabase.from('posts').select('*');

      if (category && category !== 'all') {
        q = q.eq('category', category);
      }
      if (query) {
        q = q.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      }
      if (feed === 'trending') {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        q = q.gte('created_at', since).order('upvotes', { ascending: false }).order('view_count', { ascending: false });
      } else {
        q = q.order('created_at', { ascending: false });
      }
      q = q.range(pageParam, pageParam + PAGE_SIZE - 1);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
  });
}
