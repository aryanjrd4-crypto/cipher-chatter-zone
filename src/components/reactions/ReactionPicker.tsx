import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMOJIS = ['❤️', '🔥', '😂', '👏', '😮', '😢', '👍', '👎', '🎉', '💀', '🤔', '✨'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  triggerOnHover?: boolean;
}

export function ReactionPicker({ onSelect, triggerOnHover }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const triggerProps = triggerOnHover
    ? {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
      }
    : {};

  return (
    <div className="relative" {...triggerProps}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-primary"
        onClick={() => setOpen(!open)}
        aria-label="Add reaction"
      >
        <SmilePlus className="h-3.5 w-3.5" />
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 z-50 glass-strong rounded-2xl p-2 flex flex-wrap gap-1 shadow-[0_8px_30px_hsl(190,95%,55%,0.15)] w-[228px]"
          >
            {EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.3, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(emoji);
                  setOpen(false);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors text-base"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
