import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Share2, ArrowBigUp, ArrowBigDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { useVote } from '@/hooks/useVote';
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
  createdAt: string;
  anonymousId: string;
  index?: number;
}

export function PostCard({
  id, title, content, category, upvotes, downvotes,
  commentCount, createdAt, anonymousId, index = 0,
}: PostCardProps) {
  const myId = useIdentityStore((s) => s.anonymousId);
  const isOwn = myId === anonymousId;
  const { userVote, handleVote } = useVote({ postId: id });
  const score = upvotes - downvotes;

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${id}`;
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="glass glass-hover rounded-xl p-4 group"
    >
      <Link to={`/post/${id}`} className="block space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {category && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {category}
            </span>
          )}
          <Clock className="h-3 w-3" />
          <span>{formatDistanceToNow(createdAt)}</span>
          {isOwn && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">
              You
            </span>
          )}
        </div>
        <h2 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {title}
        </h2>
        {content && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {content}
          </p>
        )}
      </Link>

      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${userVote === 1 ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => handleVote(1)}
          >
            <ArrowBigUp className="h-5 w-5" />
          </Button>
          <span className={`text-sm font-medium min-w-[2ch] text-center ${score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {score}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${userVote === -1 ? 'text-destructive' : 'text-muted-foreground'}`}
            onClick={() => handleVote(-1)}
          >
            <ArrowBigDown className="h-5 w-5" />
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 ml-2" asChild>
          <Link to={`/post/${id}`}>
            <MessageCircle className="h-4 w-4" />
            <span>{commentCount}</span>
          </Link>
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground ml-auto" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.article>
  );
}
