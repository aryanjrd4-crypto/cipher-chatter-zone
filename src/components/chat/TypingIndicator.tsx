import { motion } from 'framer-motion';

export function TypingIndicator({ count = 1 }: { count?: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/60"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <span>{count} anonymous {count === 1 ? 'user' : 'users'} typing...</span>
    </div>
  );
}
