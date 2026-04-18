import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Menu, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';

interface HeaderProps {
  onOpenSidebar?: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 glass-strong border-b border-border/50"
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-gradient-cyan">Cipher</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild className={isChat ? 'text-primary' : ''}>
            <Link to="/chat" aria-label="Chat">
              <MessageSquare className="h-4 w-4" />
            </Link>
          </Button>
          <NotificationsPopover />
          {location.pathname !== '/create' && (
            <Button size="sm" asChild className="gap-1.5 ml-1 bg-primary/90 hover:bg-primary text-primary-foreground shadow-[0_0_20px_hsl(190,95%,55%,0.2)]">
              <Link to="/create">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
