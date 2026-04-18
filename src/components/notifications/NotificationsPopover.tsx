import { Link } from 'react-router-dom';
import { Bell, MessageCircle, Heart, Share2, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from '@/lib/time';
import { motion } from 'framer-motion';

const ICONS: Record<string, any> = {
  reply: MessageCircle,
  reaction: Heart,
  share: Share2,
  mention: AtSign,
};

export function NotificationsPopover() {
  const { notifications, unreadCount, markAllRead } = useNotifications();

  return (
    <Popover onOpenChange={(open) => { if (!open && unreadCount > 0) markAllRead(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center shadow-[0_0_10px_hsl(190,95%,55%,0.6)]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 glass-strong border-glass-border p-0">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No echoes yet
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              const text =
                n.type === 'reply' ? 'replied to your post'
                : n.type === 'reaction' ? `reacted ${(n.payload as any)?.emoji || ''} to your post`
                : n.type === 'share' ? 'shared your post'
                : 'mentioned you';
              const target = n.post_id ? `/post/${n.post_id}` : '/';
              return (
                <Link
                  key={n.id}
                  to={target}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <span className="font-mono text-muted-foreground">Anon</span> {text}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(n.created_at)}</p>
                  </div>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                </Link>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
