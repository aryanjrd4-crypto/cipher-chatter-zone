import { useState } from 'react';
import { motion } from 'framer-motion';
import { Reply, Trash2 } from 'lucide-react';
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
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChatMessage({ id, content, anonymousId, createdAt, parentContent, hasEffect, onReply, onDelete }: ChatMessageProps) {
  const myId = useIdentityStore((s) => s.anonymousId);
  const isOwn = myId === anonymousId;
  const { reactionCounts, toggleReaction } = useReactions({ commentId: id });
  const [hovered, setHovered] = useState(false);

  const effectClass = hasEffect === 'glow' ? 'shadow-[0_0_20px_hsl(190,95%,55%,0.3)]' :
                      hasEffect === 'encrypted' ? 'font-mono' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnonAvatar id={anonymousId} size={36} />
      
      <div className={`max-w-[70%] space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {!isOwn && <span className="font-medium text-secondary-foreground">{anonymousId.slice(0, 8)}</span>}
          <span>{formatDistanceToNow(createdAt)}</span>
          {isOwn && (
            <span className="text-primary font-medium">You</span>
          )}
        </div>

        {parentContent && (
          <div className={`text-[11px] text-muted-foreground/70 border-l-2 border-primary/30 pl-2 py-0.5 truncate max-w-[200px] ${isOwn ? 'ml-auto' : ''}`}>
            {parentContent}
          </div>
        )}

        <div
          className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${effectClass} ${
            isOwn
              ? 'bg-primary/15 border border-primary/20 text-foreground rounded-br-md'
              : 'bg-secondary/60 border border-border/40 text-foreground rounded-bl-md'
          }`}
        >
          {content}
          
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 ${isOwn ? '-left-20' : '-right-20'}`}
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

        <ReactionBar reactions={reactionCounts} onToggle={toggleReaction} />
      </div>
    </motion.div>
  );
}
