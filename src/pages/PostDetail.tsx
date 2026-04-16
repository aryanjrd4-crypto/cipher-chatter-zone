import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Trash2, Clock, Eye } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CommentItem } from '@/components/comments/CommentItem';
import { PostSkeleton } from '@/components/posts/PostSkeleton';
import { PostAnalytics } from '@/components/posts/PostAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { useVote } from '@/hooks/useVote';
import { useViewTracking } from '@/hooks/useViewTracking';
import { useShareTracking } from '@/hooks/useShareTracking';
import { formatDistanceToNow } from '@/lib/time';
import { toast } from 'sonner';

function nestComments(comments: any[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];
  comments.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  comments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useViewTracking(id);
  const { trackShare } = useShareTracking();

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { userVote, handleVote } = useVote({ postId: id });

  const addComment = async (parentId: string | null, content: string) => {
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      post_id: id!,
      parent_id: parentId,
      anonymous_id: anonymousId,
      content,
    });
    if (!error) {
      await supabase.from('posts').update({ comment_count: (post?.comment_count || 0) + 1 }).eq('id', id!);
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      setCommentText('');
    }
    setSubmitting(false);
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId).eq('anonymous_id', anonymousId);
    await supabase.from('posts').update({ comment_count: Math.max(0, (post?.comment_count || 1) - 1) }).eq('id', id!);
    queryClient.invalidateQueries({ queryKey: ['comments', id] });
    queryClient.invalidateQueries({ queryKey: ['post', id] });
  };

  const deletePost = async () => {
    await supabase.from('posts').delete().eq('id', id!).eq('anonymous_id', anonymousId);
    toast.success('Post deleted');
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    navigate('/');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
    if (id) trackShare(id);
  };

  if (postLoading) return <Layout><PostSkeleton /></Layout>;
  if (!post) return <Layout><p className="text-center text-muted-foreground py-20">Post not found</p></Layout>;

  const score = post.upvotes - post.downvotes;
  const isOwn = anonymousId === post.anonymous_id;
  const nested = nestComments(comments);

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <article className="glass rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {post.category && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{post.category}</span>
            )}
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(post.created_at)}</span>
            <div className="flex items-center gap-1 ml-auto">
              <Eye className="h-3 w-3" />
              <span>{post.view_count} viewed</span>
            </div>
            {isOwn && <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">You</span>}
          </div>

          <h1 className="text-lg font-semibold text-foreground">{post.title}</h1>
          {post.content && <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>}

          <div className="flex items-center gap-1 pt-2 border-t border-border/50">
            <Button variant="ghost" size="icon" className={`h-8 w-8 ${userVote === 1 ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => handleVote(1)}>
              <ArrowBigUp className="h-5 w-5" />
            </Button>
            <span className={`text-sm font-medium ${score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{score}</span>
            <Button variant="ghost" size="icon" className={`h-8 w-8 ${userVote === -1 ? 'text-destructive' : 'text-muted-foreground'}`} onClick={() => handleVote(-1)}>
              <ArrowBigDown className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-1 ml-3 text-muted-foreground text-sm">
              <MessageCircle className="h-4 w-4" /> {post.comment_count}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground ml-auto" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            {isOwn && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={deletePost}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </article>

        {/* Analytics - visible only to post creator */}
        {isOwn && (
          <PostAnalytics
            postId={post.id}
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            commentCount={post.comment_count}
          />
        )}

        {/* Add comment */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Comments</h2>
          <div className="space-y-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[80px] bg-secondary/50 border-border/50 text-sm"
            />
            <Button
              size="sm"
              disabled={!commentText.trim() || submitting}
              onClick={() => addComment(null, commentText.trim())}
            >
              Comment
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-1">
          {commentsLoading && <p className="text-sm text-muted-foreground">Loading comments...</p>}
          {!commentsLoading && nested.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No comments yet</p>
          )}
          {nested.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(parentId, content) => addComment(parentId, content)}
              onDelete={deleteComment}
            />
          ))}
        </div>
      </motion.div>
    </Layout>
  );
}
