import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useUserAnalytics } from '@/hooks/useUserAnalytics';
import { ArrowLeft, Eye, ThumbsUp, MessageCircle, Share2, FileText, TrendingUp } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-4 space-y-1.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useUserAnalytics();
  const anonymousId = useIdentityStore((s) => s.anonymousId);

  const { data: chartData } = useQuery({
    queryKey: ['user-views-chart', anonymousId],
    queryFn: async () => {
      const { data: posts } = await supabase.from('posts').select('id').eq('anonymous_id', anonymousId);
      if (!posts?.length) return [];
      const ids = posts.map((p) => p.id);
      const { data: views } = await supabase.from('post_views').select('viewed_at').in('post_id', ids);
      const byDay: Record<string, number> = {};
      const day = 24 * 60 * 60 * 1000;
      for (let i = 6; i >= 0; i--) {
        byDay[new Date(Date.now() - i * day).toISOString().slice(0, 10)] = 0;
      }
      views?.forEach((v) => {
        const d = new Date(v.viewed_at).toISOString().slice(0, 10);
        if (d in byDay) byDay[d]++;
      });
      return Object.entries(byDay).map(([date, views]) => ({ date: date.slice(5), views }));
    },
  });

  if (isLoading) return <Layout><p className="text-center text-muted-foreground py-20">Loading analytics...</p></Layout>;

  const engagementRate = data && data.totalViews > 0
    ? (((data.totalUpvotes + data.totalComments) / data.totalViews) * 100).toFixed(1) : '0';

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div>
          <h1 className="text-xl font-bold text-foreground">Your Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Stats for your cipher identity</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={FileText} label="Total Posts" value={data?.totalPosts ?? 0} />
          <StatCard icon={Eye} label="Total Views" value={data?.totalViews ?? 0} />
          <StatCard icon={ThumbsUp} label="Upvotes" value={data?.totalUpvotes ?? 0} />
          <StatCard icon={MessageCircle} label="Comments" value={data?.totalComments ?? 0} />
          <StatCard icon={Share2} label="Shares" value={data?.totalShares ?? 0} />
          <StatCard icon={TrendingUp} label="Engagement" value={`${engagementRate}%`} sub="(upvotes+comments)/views" />
        </div>

        {chartData && chartData.length > 0 && (
          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Views (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(190, 95%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(190, 95%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(220, 15%, 8%)', border: '1px solid hsl(220, 12%, 18%)', borderRadius: '12px', fontSize: 12 }} labelStyle={{ color: 'hsl(210, 20%, 95%)' }} />
                <Area type="monotone" dataKey="views" stroke="hsl(190, 95%, 55%)" fill="url(#viewGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {data?.mostViewed && (
          <div className="glass rounded-2xl p-5 space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Most Viewed Post</h2>
            <Link to={`/post/${data.mostViewed.id}`} className="text-primary hover:underline text-sm">{data.mostViewed.title}</Link>
            <p className="text-xs text-muted-foreground">{data.mostViewed.view_count} views · {data.mostViewed.upvotes} upvotes</p>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
