import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ghost, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const location = useLocation();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 glass border-b border-border"
    >
      <div className="container flex items-center justify-between h-14 max-w-2xl mx-auto px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <Ghost className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
          <span className="text-lg font-semibold text-gradient">Echo</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          {location.pathname !== '/create' && (
            <Button size="sm" asChild className="gap-1.5">
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
