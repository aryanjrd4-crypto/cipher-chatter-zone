import { usePostAnalytics } from '@/hooks/usePostAnalytics';
import { Eye, Users, ThumbsUp, ThumbsDown, MessageCircle, Share2, TrendingUp, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PostAnalyticsProps {
  postId: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
}

export function PostAnalytics({ postId, upvotes, downvotes, commentCount }: PostAnalyticsProps) {
  const { data, isLoading } = usePostAnalytics(postId);

  if (isLoading) return <div className="text-xs text-muted-foreground py-4">Loading analytics...</div>;
  if (!data) return null;

  const totalVotes = upvotes + downvotes;
  const upvoteRatio = totalVotes > 0 ? ((upvotes / totalVotes) * 100).toFixed(0) : '0';
  const engagementRate = data.totalViews > 0
    ? (((upvotes + commentCount) / data.totalViews) * 100).toFixed(1)
    : '0';

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> Post Analytics
      </h3>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Views</span>
          <span className="ml-auto font-semibold text-foreground">{data.totalViews}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Unique</span>
          <span className="ml-auto font-semibold text-foreground">{data.uniqueViewers}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThumbsUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Upvotes</span>
          <span className="ml-auto font-semibold text-foreground">{upvotes} ({upvoteRatio}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Downvotes</span>
          <span className="ml-auto font-semibold text-foreground">{downvotes}</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Comments</span>
          <span className="ml-auto font-semibold text-foreground">{commentCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <Share2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Shares</span>
          <span className="ml-auto font-semibold text-foreground">{data.totalShares}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Engagement</span>
          <span className="ml-auto font-semibold text-foreground">{engagementRate}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">24h / 7d</span>
          <span className="ml-auto font-semibold text-foreground">{data.views24h} / {data.views7d}</span>
        </div>
      </div>

      {data.chartData.length > 1 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Views over time</p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="postViewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'hsl(240, 8%, 9%)', border: '1px solid hsl(240, 6%, 20%)', borderRadius: '8px', fontSize: 11 }} />
              <Area type="monotone" dataKey="views" stroke="hsl(0, 84%, 60%)" fill="url(#postViewGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
