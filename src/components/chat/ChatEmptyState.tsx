import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none">
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-4"
      >
        <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full" />
        <div className="relative h-16 w-16 rounded-2xl glass-strong flex items-center justify-center border border-primary/20">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
      </motion.div>
      <p className="text-sm font-medium text-foreground/80">The channel is silent</p>
      <p className="text-xs mt-1 text-muted-foreground/70 max-w-[240px] text-center">
        Send the first encrypted message. All conversations are anonymous.
      </p>
    </div>
  );
}
