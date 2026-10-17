import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePostAnalytics(postId: string | undefined) {
  return useQuery({
    queryKey: ['post-analytics', postId],
    queryFn: async () => {
      if (!postId) return null;
      const [analyticsRes, sharesRes, viewsTimeRes] = await Promise.all([
        supabase.rpc('get_post_analytics', { p_post_id: postId }),
        supabase.from('post_shares').select('*').eq('post_id', postId!),
        supabase.rpc('get_post_view_timeline', { p_post_id: postId }),
      ]);

      if (analyticsRes.error) throw analyticsRes.error;
      if (sharesRes.error) throw sharesRes.error;
      if (viewsTimeRes.error) throw viewsTimeRes.error;
      const analytics = analyticsRes.data?.[0];
      const shares = sharesRes.data || [];
      const chartData = (viewsTimeRes.data || []).map((row) => ({ date: row.view_date, views: Number(row.views) }));

      return {
        totalViews: analytics?.total_views ?? 0,
        uniqueViewers: analytics?.unique_viewers ?? 0,
        totalShares: shares.length,
        views24h: analytics?.views_24h ?? 0,
        views7d: analytics?.views_7d ?? 0,
        chartData,
      };
    },
    enabled: !!postId,
  });
}
