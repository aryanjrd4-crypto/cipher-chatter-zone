import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Plus, Settings, BarChart3, MessageSquare, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 glass-strong border-b border-border/50"
    >
      <div className="container flex items-center justify-between h-14 max-w-5xl mx-auto px-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <Lock className="h-5 w-5 text-primary transition-all group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_hsl(190,95%,55%)]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gradient-cyan">Cipher</span>
          <span className="hidden sm:inline text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full uppercase tracking-wider">Encrypted</span>
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild className={isChat ? 'text-primary' : ''}>
            <Link to="/chat">
              <MessageSquare className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/analytics">
              <BarChart3 className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          {location.pathname !== '/create' && (
            <Button size="sm" asChild className="gap-1.5 ml-1 bg-primary/90 hover:bg-primary text-primary-foreground shadow-[0_0_20px_hsl(190,95%,55%,0.2)]">
              <Link to="/create">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Post</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
