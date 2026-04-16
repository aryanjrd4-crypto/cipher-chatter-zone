import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/posts/PostCard';
import { PostSkeleton } from '@/components/posts/PostSkeleton';
import { usePosts } from '@/hooks/usePosts';
import { Sparkles } from 'lucide-react';

const CATEGORIES = ['all', 'general', 'thoughts', 'questions', 'stories', 'rants'];

export default function Index() {
  const [category, setCategory] = useState('all');
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts(category);
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

  const posts = data?.pages.flat() || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-primary/15 text-primary border border-primary/25 shadow-[0_0_12px_hsl(190,95%,55%,0.15)]'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
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
