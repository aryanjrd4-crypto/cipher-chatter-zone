import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Share2, ArrowBigUp, ArrowBigDown, Clock, Eye, Bookmark, Flag, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AnonAvatar } from '@/components/chat/AnonAvatar';
import { ReactionPicker } from '@/components/reactions/ReactionPicker';
import { ReactionBar } from '@/components/reactions/ReactionBar';
import { ReportDialog } from './ReportDialog';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { useVote } from '@/hooks/useVote';
import { useReactions } from '@/hooks/useReactions';
import { useShareTracking } from '@/hooks/useShareTracking';
import { useBookmarks } from '@/hooks/useBookmarks';
import { toast } from 'sonner';
import { formatDistanceToNow } from '@/lib/time';

interface PostCardProps {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  viewCount?: number;
  createdAt: string;
  anonymousId: string;
  index?: number;
}

export function PostCard({
  id, title, content, category, upvotes, downvotes,
  commentCount, viewCount = 0, createdAt, anonymousId, index = 0,
}: PostCardProps) {
  const myId = useIdentityStore((s) => s.anonymousId);
  const isOwn = myId === anonymousId;
  const { userVote, handleVote } = useVote({ postId: id });
  const { reactionCounts, toggleReaction } = useReactions({ postId: id });
  const { trackShare } = useShareTracking();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const [reportOpen, setReportOpen] = useState(false);
  const isBookmarked = bookmarkedIds.has(id);
  const score = upvotes - downvotes;

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
    trackShare(id);
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3 }}
        className="glass glass-hover rounded-2xl p-5 group"
      >
        <Link to={`/post/${id}`} className="block space-y-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <AnonAvatar id={anonymousId} size={24} />
            {category && (
              <Link
                to={`/?category=${category}`}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-[10px] uppercase tracking-wider hover:bg-primary/20 transition-colors"
              >
                {category}
              </Link>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(createdAt)}</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <Eye className="h-3 w-3" />
              <span>{viewCount}</span>
            </div>
            {isOwn && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">You</span>
            )}
          </div>
          <h2 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
            {title}
          </h2>
          {content && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{content}</p>
          )}
        </Link>

        <ReactionBar reactions={reactionCounts} onToggle={toggleReaction} />

        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className={`h-8 w-8 ${userVote === 1 ? 'text-primary glow-sm' : 'text-muted-foreground'}`} onClick={() => handleVote(1)}>
              <ArrowBigUp className="h-5 w-5" />
            </Button>
            <span className={`text-sm font-medium min-w-[2ch] text-center ${score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{score}</span>
            <Button variant="ghost" size="icon" className={`h-8 w-8 ${userVote === -1 ? 'text-destructive' : 'text-muted-foreground'}`} onClick={() => handleVote(-1)}>
              <ArrowBigDown className="h-5 w-5" />
            </Button>
          </div>

          <ReactionPicker onSelect={toggleReaction} triggerOnHover />

          <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 ml-1" asChild>
            <Link to={`/post/${id}`}>
              <MessageCircle className="h-4 w-4" /> <span>{commentCount}</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ml-auto transition-colors ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            onClick={() => toggleBookmark(id)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Save post'}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={handleShare} aria-label="Share">
            <Share2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="More">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-glass-border">
              <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-xs gap-2">
                <Flag className="h-3.5 w-3.5" /> Report post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.article>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} postId={id} />
    </>
  );
}
