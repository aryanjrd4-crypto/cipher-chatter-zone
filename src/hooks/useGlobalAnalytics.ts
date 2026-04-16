import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGlobalAnalytics() {
  return useQuery({
    queryKey: ['global-analytics'],
    queryFn: async () => {
      const [postsRes, viewsRes, viewsTodayRes] = await Promise.all([
        supabase.from('posts').select('id, title, view_count, upvotes, comment_count, created_at').order('view_count', { ascending: false }).limit(10),
        supabase.from('post_views').select('viewed_at'),
        supabase.from('post_views').select('viewed_at').gte('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const posts = postsRes.data || [];
      const allViews = viewsRes.data || [];
      const todayViews = viewsTodayRes.data || [];

      const day = 24 * 60 * 60 * 1000;
      const weekViews = allViews.filter((v) => Date.now() - new Date(v.viewed_at).getTime() < 7 * day).length;

      // Views per day for last 7 days
      const viewsByDay: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * day).toISOString().slice(0, 10);
        viewsByDay[d] = 0;
      }
      allViews.forEach((v) => {
        const d = new Date(v.viewed_at).toISOString().slice(0, 10);
        if (d in viewsByDay) viewsByDay[d]++;
      });
      const chartData = Object.entries(viewsByDay).map(([date, views]) => ({ date, views }));

      return {
        totalPosts: posts.length,
        totalViewsToday: todayViews.length,
        totalViewsWeek: weekViews,
        topPosts: posts.slice(0, 5),
        chartData,
      };
    },
  });
}
