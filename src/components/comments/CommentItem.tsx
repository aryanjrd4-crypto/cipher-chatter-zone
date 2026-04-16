import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowBigUp, ArrowBigDown, Reply, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { useVote } from '@/hooks/useVote';
import { formatDistanceToNow } from '@/lib/time';

interface Comment {
  id: string;
  content: string;
  anonymous_id: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  parent_id: string | null;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, content: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}

export function CommentItem({ comment, onReply, onDelete, depth = 0 }: CommentItemProps) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const myId = useIdentityStore((s) => s.anonymousId);
  const isOwn = myId === comment.anonymous_id;
  const { userVote, handleVote } = useVote({ commentId: comment.id });
  const score = comment.upvotes - comment.downvotes;

  const submitReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText('');
    setReplying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${depth > 0 ? 'ml-4 pl-4 border-l border-border/40' : ''}`}
    >
      <div className="py-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDistanceToNow(comment.created_at)}</span>
          {isOwn && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">
              You
            </span>
          )}
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            className={`h-7 w-7 ${userVote === 1 ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => handleVote(1)}
          >
            <ArrowBigUp className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium min-w-[2ch] text-center text-muted-foreground">{score}</span>
          <Button
            variant="ghost" size="icon"
            className={`h-7 w-7 ${userVote === -1 ? 'text-destructive' : 'text-muted-foreground'}`}
            onClick={() => handleVote(-1)}
          >
            <ArrowBigDown className="h-4 w-4" />
          </Button>
          {depth < 3 && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 ml-2" onClick={() => setReplying(!replying)}>
              <Reply className="h-3 w-3" /> Reply
            </Button>
          )}
          {isOwn && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive ml-auto" onClick={() => onDelete(comment.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        {replying && (
          <div className="space-y-2 mt-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px] text-sm bg-secondary/50 border-border/50"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submitReply} disabled={!replyText.trim()}>Reply</Button>
              <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} depth={depth + 1} />
      ))}
    </motion.div>
  );
}
