import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMOJIS = ['❤️', '🔥', '😂', '👏', '😮', '👍', '👎', '🎉', '💀', '🤔'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

export function ReactionPicker({ onSelect }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-primary"
        onClick={() => setOpen(!open)}
      >
        <SmilePlus className="h-3.5 w-3.5" />
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            className="absolute bottom-full mb-2 left-0 z-50 glass-strong rounded-xl p-2 flex gap-1 shadow-xl"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onSelect(emoji); setOpen(false); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary/80 transition-all hover:scale-125 text-base"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
