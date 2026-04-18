import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/posts/PostCard';
import { PostSkeleton } from '@/components/posts/PostSkeleton';
import { usePosts, type Feed } from '@/hooks/usePosts';
import { Sparkles, Flame, Clock, Home as HomeIcon } from 'lucide-react';
import { TrendingTagsRail } from '@/components/sidebar/TrendingTagsRail';

const CATEGORIES = ['all', 'general', 'thoughts', 'questions', 'stories', 'rants', 'random'];

const FEED_TABS: { id: Feed; label: string; icon: any }[] = [
  { id: 'for-you', label: 'For You', icon: HomeIcon },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'latest', label: 'Latest', icon: Clock },
];

export default function Index() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const feed = (params.get('feed') as Feed) || 'latest';
  const query = params.get('q') || '';

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts({ category, feed, query });
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const posts = useMemo(() => data?.pages.flat() || [], [data]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  return (
    <Layout rightRail={<TrendingTagsRail />}>
      <div className="space-y-6">
        {/* Feed tabs */}
        <div className="glass rounded-xl p-1 flex items-center gap-1">
          {FEED_TABS.map((t) => {
            const Icon = t.icon;
            const active = feed === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setParam('feed', t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-primary/15 text-primary shadow-[0_0_12px_hsl(190,95%,55%,0.15)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {query && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Searching for <span className="text-primary font-mono">"{query}"</span>
            <button onClick={() => setParam('q', null)} className="text-primary hover:underline">clear</button>
          </div>
        )}

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setParam('category', cat === 'all' ? null : cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  active || (cat === 'all' && category === 'all')
                    ? 'bg-primary/15 text-primary border border-primary/25 shadow-[0_0_12px_hsl(190,95%,55%,0.15)]'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {isLoading && Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}

          {!isLoading && posts.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <Sparkles className="h-12 w-12 mb-4 opacity-30" />
              </motion.div>
              <p className="text-sm">No echoes yet. Be the first to speak.</p>
              <p className="text-xs mt-1 text-muted-foreground/50">Your message is encrypted and anonymous.</p>
            </motion.div>
          )}

          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              content={post.content}
              category={post.category}
              upvotes={post.upvotes}
              downvotes={post.downvotes}
              commentCount={post.comment_count}
              viewCount={post.view_count}
              createdAt={post.created_at}
              anonymousId={post.anonymous_id}
              index={i}
            />
          ))}

          {isFetchingNextPage && <PostSkeleton />}
          <div ref={loadMoreRef} className="h-4" />
        </div>
      </div>
    </Layout>
  );
}
