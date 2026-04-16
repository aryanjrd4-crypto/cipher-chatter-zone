import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useGlobalAnalytics } from '@/hooks/useGlobalAnalytics';
import { ArrowLeft, Globe, Eye, TrendingUp, Flame } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { data, isLoading } = useGlobalAnalytics();

  if (isLoading) return <Layout><p className="text-center text-muted-foreground py-20">Loading...</p></Layout>;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div>
          <h1 className="text-xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Global Cipher statistics</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-2xl p-4 text-center">
            <Globe className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{data?.totalPosts ?? 0}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Eye className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{data?.totalViewsToday ?? 0}</p>
            <p className="text-xs text-muted-foreground">Views Today</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{data?.totalViewsWeek ?? 0}</p>
            <p className="text-xs text-muted-foreground">Views 7d</p>
          </div>
        </div>

        {data?.chartData && (
          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Views Trend (7 Days)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.chartData}>
                <XAxis dataKey="date" tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(220, 15%, 8%)', border: '1px solid hsl(220, 12%, 18%)', borderRadius: '12px', fontSize: 12 }} />
                <Bar dataKey="views" fill="hsl(190, 95%, 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Top Posts</h2>
          </div>
          <div className="space-y-1">
            {data?.topPosts.map((p, i) => (
              <Link key={p.id} to={`/post/${p.id}`} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <span className="text-xs font-bold text-primary w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.view_count} views · {p.upvotes} upvotes</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
