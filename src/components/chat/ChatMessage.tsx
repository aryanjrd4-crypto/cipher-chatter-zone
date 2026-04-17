import { useState } from 'react';
import { motion } from 'framer-motion';
import { Reply, Trash2, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnonAvatar } from './AnonAvatar';
import { ReactionPicker } from '@/components/reactions/ReactionPicker';
import { ReactionBar } from '@/components/reactions/ReactionBar';
import { useReactions } from '@/hooks/useReactions';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { formatDistanceToNow } from '@/lib/time';

interface ChatMessageProps {
  id: string;
  content: string;
  anonymousId: string;
  createdAt: string;
  parentContent?: string;
  hasEffect?: string | null;
  imageUrl?: string | null;
  readCount?: number;
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChatMessage({ id, content, anonymousId, createdAt, parentContent, hasEffect, imageUrl, readCount = 0, onReply, onDelete }: ChatMessageProps) {
  const myId = useIdentityStore((s) => s.anonymousId);
  const isOwn = myId === anonymousId;
  const { reactionCounts, toggleReaction } = useReactions({ commentId: id });
  const [hovered, setHovered] = useState(false);

  const effectClass = hasEffect === 'glow' ? 'shadow-[0_0_24px_hsl(var(--primary)/0.35)] border-primary/40' :
                      hasEffect === 'encrypted' ? 'font-mono tracking-wider' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnonAvatar id={anonymousId} size={36} />

      <div className={`max-w-[75%] min-w-0 space-y-1 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
          {!isOwn && <span className="font-medium text-secondary-foreground/80">{anonymousId.slice(0, 6)}</span>}
          <span className="tabular-nums">{formatDistanceToNow(createdAt)}</span>
          {isOwn && <span className="text-primary/80 font-medium uppercase tracking-wider text-[9px]">You</span>}
        </div>

        {parentContent && (
          <div className={`text-[11px] text-muted-foreground/80 border-l-2 border-primary/40 pl-2 py-0.5 truncate max-w-[240px] bg-secondary/30 rounded-r ${isOwn ? 'ml-auto' : ''}`}>
            ↳ {parentContent}
          </div>
        )}

        <div
          className={`relative rounded-2xl text-sm leading-relaxed transition-all ${effectClass} ${
            isOwn
              ? 'bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/25 text-foreground rounded-br-md'
              : 'bg-secondary/70 border border-border/50 text-foreground rounded-bl-md'
          } ${imageUrl ? 'p-1.5' : 'px-4 py-2.5'}`}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt="attachment"
              className="rounded-xl max-h-72 object-cover mb-1"
              loading="lazy"
            />
          )}
          {content && <div className={imageUrl ? 'px-2.5 py-1.5' : ''}>{content}</div>}

          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 glass-strong rounded-full px-1 py-0.5 shadow-lg ${isOwn ? '-left-2 -translate-x-full' : '-right-2 translate-x-full'}`}
            >
              <ReactionPicker onSelect={toggleReaction} />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onReply(id)}>
                <Reply className="h-3.5 w-3.5" />
              </Button>
              {isOwn && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </motion.div>
          )}
        </div>

        <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <ReactionBar reactions={reactionCounts} onToggle={toggleReaction} />
          {isOwn && (
            <span className="text-[10px] text-muted-foreground/60 px-1" title={readCount > 0 ? `Read by ${readCount}` : 'Sent'}>
              {readCount > 0 ? (
                <CheckCheck className="h-3 w-3 text-primary/70" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
