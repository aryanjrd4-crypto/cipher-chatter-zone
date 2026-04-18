import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Hash, Users, TrendingUp } from 'lucide-react';

export function TrendingTagsRail() {
  const { data: trendingPosts = [] } = useQuery({
    queryKey: ['rail-trending'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('posts')
        .select('id, title, category, upvotes, view_count')
        .gte('created_at', since)
        .order('upvotes', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: topCategories = [] } = useQuery({
    queryKey: ['rail-top-cats'],
    queryFn: async () => {
      const { data } = await supabase.from('posts').select('category');
      const counts: Record<string, number> = {};
      (data || []).forEach((r) => {
        if (r.category) counts[r.category] = (counts[r.category] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
    },
  });

  const { data: onlineCount = 0 } = useQuery({
    queryKey: ['rail-online'],
    queryFn: async () => {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { count } = await supabase
        .from('room_presence')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', since);
      return count || 0;
    },
    refetchInterval: 20_000,
  });

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
            Trending now
          </p>
        </div>
        <div className="space-y-2">
          {trendingPosts.length === 0 && (
            <p className="text-xs text-muted-foreground/60">Nothing trending yet</p>
          )}
          {trendingPosts.map((p, i) => (
            <Link
              key={p.id}
              to={`/post/${p.id}`}
              className="block group"
            >
              <div className="flex gap-2">
                <span className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">{(i + 1).toString().padStart(2, '0')}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground group-hover:text-primary line-clamp-2 transition-colors">
                    {p.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ↑ {p.upvotes} · {p.view_count} views
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-accent" />
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
            Popular tags
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {topCategories.map(([cat, count]) => (
            <Link
              key={cat}
              to={`/?category=${cat}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/60 hover:bg-primary/10 hover:text-primary text-[11px] text-muted-foreground transition-all"
            >
              <Hash className="h-2.5 w-2.5" />
              {cat}
              <span className="text-muted-foreground/50">·{count}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-semibold flex items-center gap-1.5">
            {onlineCount} online
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </p>
          <p className="text-[10px] text-muted-foreground">in live rooms</p>
        </div>
      </div>
    </div>
  );
}
