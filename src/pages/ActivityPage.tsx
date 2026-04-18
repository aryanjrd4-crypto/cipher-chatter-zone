import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/posts/PostCard';
import { PostSkeleton } from '@/components/posts/PostSkeleton';
import { useMyPosts, useMyReplies, useMyReactedPosts } from '@/hooks/useUserPosts';
import { useBookmarkedPosts } from '@/hooks/useBookmarks';
import { Link } from 'react-router-dom';
import { FileText, MessageSquare, Bookmark, Heart, Sparkles, Clock } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/time';

const TABS = [
  { id: 'posts', label: 'My Posts', icon: FileText },
  { id: 'replies', label: 'My Replies', icon: MessageSquare },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'reacted', label: 'Reacted', icon: Heart },
];

export default function ActivityPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'posts';

  const { data: myPosts = [], isLoading: lp } = useMyPosts();
  const { data: replies = [], isLoading: lr } = useMyReplies();
  const { data: saved = [], isLoading: ls } = useBookmarkedPosts();
  const { data: reacted = [], isLoading: lre } = useMyReactedPosts();

  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const renderPosts = (list: any[], loading: boolean) => {
    if (loading) return Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />);
    if (list.length === 0) return <EmptyState />;
    return list.map((p, i) => (
      <PostCard
        key={p.id}
        id={p.id}
        title={p.title}
        content={p.content}
        category={p.category}
        upvotes={p.upvotes}
        downvotes={p.downvotes}
        commentCount={p.comment_count}
        viewCount={p.view_count}
        createdAt={p.created_at}
        anonymousId={p.anonymous_id}
        index={i}
      />
    ));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Your Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">A private trail of your cipher footprint.</p>
        </div>

        <div className="glass rounded-xl p-1 grid grid-cols-2 sm:grid-cols-4 gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {tab === 'posts' && renderPosts(myPosts, lp)}
          {tab === 'saved' && renderPosts(saved, ls)}
          {tab === 'reacted' && renderPosts(reacted, lre)}
          {tab === 'replies' && (
            lr ? Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
            : replies.length === 0 ? <EmptyState />
            : (
              <div className="space-y-3">
                {replies.map((r: any) => (
                  <Link
                    key={r.id}
                    to={`/post/${r.post_id}`}
                    className="block glass glass-hover rounded-2xl p-4 group"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(r.created_at)} on
                    </p>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{r.postTitle}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{r.content}</p>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Sparkles className="h-10 w-10 mb-3 opacity-30" />
      <p className="text-sm">Nothing here yet.</p>
      <p className="text-xs mt-1 text-muted-foreground/50">Your activity will appear as you engage anonymously.</p>
    </div>
  );
}
