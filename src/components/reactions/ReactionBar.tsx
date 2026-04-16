import { motion } from 'framer-motion';

interface ReactionCount {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ReactionBarProps {
  reactions: ReactionCount[];
  onToggle: (emoji: string) => void;
}

export function ReactionBar({ reactions, onToggle }: ReactionBarProps) {
  if (reactions.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {reactions.map((r) => (
        <motion.button
          key={r.emoji}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all border ${
            r.hasReacted
              ? 'bg-primary/15 border-primary/30 text-primary'
              : 'bg-secondary/50 border-border/50 text-muted-foreground hover:border-primary/20'
          }`}
          onClick={() => onToggle(r.emoji)}
        >
          <span className="animate-reaction-pop">{r.emoji}</span>
          <span className="font-medium">{r.count}</span>
        </motion.button>
      ))}
    </div>
  );
}
