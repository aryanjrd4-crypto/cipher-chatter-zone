import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-background bg-mesh">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
        <Lock className="h-16 w-16 text-primary/30 mx-auto" />
      </motion.div>
      <h1 className="text-5xl font-bold text-gradient-cyan">404</h1>
      <p className="text-muted-foreground">This cipher doesn't exist.</p>
      <a href="/" className="text-primary hover:text-primary/80 text-sm underline underline-offset-4 transition-colors">
        Return to base
      </a>
    </motion.div>
  </div>
);

export default NotFound;
