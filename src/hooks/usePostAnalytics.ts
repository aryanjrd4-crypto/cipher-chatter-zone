import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePostAnalytics(postId: string | undefined) {
  return useQuery({
    queryKey: ['post-analytics', postId],
    queryFn: async () => {
      const [viewsRes, sharesRes, viewsTimeRes] = await Promise.all([
        supabase.from('post_views').select('*').eq('post_id', postId!),
        supabase.from('post_shares').select('*').eq('post_id', postId!),
        supabase.from('post_views').select('viewed_at').eq('post_id', postId!).order('viewed_at', { ascending: true }),
      ]);

      const views = viewsRes.data || [];
      const shares = sharesRes.data || [];
      const viewTimes = viewsTimeRes.data || [];

      const now = new Date();
      const day = 24 * 60 * 60 * 1000;
      const views24h = views.filter((v) => now.getTime() - new Date(v.viewed_at).getTime() < day).length;
      const views7d = views.filter((v) => now.getTime() - new Date(v.viewed_at).getTime() < 7 * day).length;

      // Group views by day for chart
      const viewsByDay: Record<string, number> = {};
      viewTimes.forEach((v) => {
        const d = new Date(v.viewed_at).toISOString().slice(0, 10);
        viewsByDay[d] = (viewsByDay[d] || 0) + 1;
      });
      const chartData = Object.entries(viewsByDay).map(([date, count]) => ({ date, views: count }));

      return {
        totalViews: views.length,
        uniqueViewers: new Set(views.map((v) => v.anonymous_id)).size,
        totalShares: shares.length,
        views24h,
        views7d,
        chartData,
      };
    },
    enabled: !!postId,
  });
}
