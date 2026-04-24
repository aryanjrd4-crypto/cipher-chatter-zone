import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock, Plus, Search, Home, Flame, Clock, Hash, ChevronDown, MessageSquare,
  Bookmark, Heart, FileText, Settings, RefreshCw, BarChart3, LogOut, Sparkles, Users,
  Mic, Video, ShieldCheck,
} from 'lucide-react';
import { AdminLoginDialog } from '@/components/admin/AdminLoginDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AnonAvatar } from '@/components/chat/AnonAvatar';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppSidebarProps {
  onNavigate?: () => void;
}

const DISCOVER = [
  { label: 'For You', icon: Home, to: '/?feed=for-you' },
  { label: 'Trending', icon: Flame, to: '/?feed=trending' },
  { label: 'Latest', icon: Clock, to: '/?feed=latest' },
];

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'questions', label: 'Questions & Advice' },
  { id: 'stories', label: 'Stories & Confessions' },
  { id: 'rants', label: 'Rants & Vent' },
  { id: 'thoughts', label: 'Thoughts' },
  { id: 'random', label: 'Random / Fun' },
];

const ACTIVITY = [
  { label: 'My Posts', icon: FileText, to: '/activity?tab=posts' },
  { label: 'My Replies', icon: MessageSquare, to: '/activity?tab=replies' },
  { label: 'Saved', icon: Bookmark, to: '/activity?tab=saved' },
  { label: 'Reacted', icon: Heart, to: '/activity?tab=reacted' },
];

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [openCats, setOpenCats] = useState(true);
  const [openActivity, setOpenActivity] = useState(true);
  const [openRooms, setOpenRooms] = useState(true);
  const [openVoice, setOpenVoice] = useState(true);
  const [openVideo, setOpenVideo] = useState(true);
  const { anonymousId, resetIdentity } = useIdentityStore();

  const { data: rooms = [] } = useQuery({
    queryKey: ['chat-rooms-sidebar'],
    queryFn: async () => {
      const { data } = await supabase
        .from('chat_rooms')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name')
        .limit(6);
      return data || [];
    },
  });

  const { data: presenceCounts = {} } = useQuery({
    queryKey: ['rooms-presence-counts'],
    queryFn: async () => {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { data } = await supabase
        .from('room_presence')
        .select('room_id')
        .gte('last_seen', since);
      const counts: Record<string, number> = {};
      (data || []).forEach((r) => {
        counts[r.room_id] = (counts[r.room_id] || 0) + 1;
      });
      return counts;
    },
    refetchInterval: 15_000,
  });

  const { data: voiceRooms = [] } = useQuery({
    queryKey: ['voice-rooms-sidebar'],
    queryFn: async () => {
      const { data } = await supabase
        .from('voice_rooms')
        .select('id, name, max_participants')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    refetchInterval: 30_000,
  });

  const { data: videoRooms = [] } = useQuery({
    queryKey: ['video-rooms-sidebar'],
    queryFn: async () => {
      const { data } = await supabase
        .from('video_rooms')
        .select('id, name, max_participants')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    refetchInterval: 30_000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?q=${encodeURIComponent(search.trim())}`);
      onNavigate?.();
    }
  };

  const isActive = (path: string) => {
    const [base] = path.split('?');
    return location.pathname === base && (path === base || location.search.includes(path.split('?')[1] || ''));
  };

  const handleNav = () => onNavigate?.();

  return (
    <aside className="flex flex-col h-full w-full bg-sidebar text-sidebar-foreground">
      {/* Brand + new post */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <Link to="/" onClick={handleNav} className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_18px_hsl(190,95%,55%,0.15)] group-hover:shadow-[0_0_24px_hsl(190,95%,55%,0.3)] transition-all">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-gradient-cyan leading-none">Cipher</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">Encrypted · Anonymous</p>
          </div>
        </Link>

        <Button
          onClick={() => { navigate('/create'); handleNav(); }}
          className="w-full gap-2 bg-primary/90 hover:bg-primary text-primary-foreground shadow-[0_0_24px_hsl(190,95%,55%,0.25)] hover:shadow-[0_0_32px_hsl(190,95%,55%,0.45)] transition-all"
        >
          <Plus className="h-4 w-4" />
          New Post
          <kbd className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-background/30 font-mono">N</kbd>
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => { navigate('/voice'); handleNav(); }}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-[11px] border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary"
          >
            <Mic className="h-3 w-3" />
            Voice
          </Button>
          <Button
            onClick={() => { navigate('/video'); handleNav(); }}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-[11px] border-accent/20 bg-accent/5 hover:bg-accent/10 text-accent hover:text-accent"
          >
            <Video className="h-3 w-3" />
            Video
          </Button>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the cipher..."
            className="h-9 pl-8 bg-secondary/40 border-border/40 text-xs rounded-lg focus-visible:ring-primary/40"
          />
        </form>
      </div>

      {/* Scroll body */}
      <div className="flex-1 overflow-y-auto px-3 space-y-5 pb-3">
        {/* Discover */}
        <Section title="Discover">
          {DISCOVER.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === '/' && location.search.includes(item.to.split('?')[1]);
            return (
              <SidebarItem
                key={item.label}
                to={item.to}
                onClick={handleNav}
                icon={<Icon className="h-4 w-4" />}
                label={item.label}
                active={active}
              />
            );
          })}
          <SidebarItem
            to="/analytics"
            onClick={handleNav}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Analytics"
            active={location.pathname === '/analytics'}
          />
        </Section>

        {/* Categories */}
        <Collapsible open={openCats} onOpenChange={setOpenCats}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
            <span>Categories</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${openCats ? '' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1">
            {CATEGORIES.map((c) => {
              const to = `/?category=${c.id}`;
              const active = location.pathname === '/' && location.search.includes(`category=${c.id}`);
              return (
                <SidebarItem
                  key={c.id}
                  to={to}
                  onClick={handleNav}
                  icon={<Hash className="h-4 w-4" />}
                  label={c.label}
                  active={active}
                />
              );
            })}
            <button
              onClick={() => toast('Custom categories coming soon')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground/70 hover:text-primary hover:bg-secondary/40 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>New category</span>
            </button>
          </CollapsibleContent>
        </Collapsible>

        {/* Live rooms */}
        <Collapsible open={openRooms} onOpenChange={setOpenRooms}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
            <span className="flex items-center gap-2">
              Live Rooms
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform ${openRooms ? '' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1">
            {rooms.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground/60">No active rooms</p>
            )}
            {rooms.map((r) => {
              const count = presenceCounts[r.id] || 0;
              return (
                <Link
                  key={r.id}
                  to={`/chat?room=${r.id}`}
                  onClick={handleNav}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all group"
                >
                  <Hash className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{r.name}</p>
                    {count > 0 && (
                      <p className="text-[10px] text-emerald-400/80 flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" />
                        {count} online
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
            <Link
              to="/chat"
              onClick={handleNav}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-primary hover:bg-primary/10 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Open chat lounge
            </Link>
          </CollapsibleContent>
        </Collapsible>

        {/* Voice Rooms */}
        <Collapsible open={openVoice} onOpenChange={setOpenVoice}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
            <span className="flex items-center gap-2">
              <Mic className="h-3 w-3 text-primary/80" />
              Voice Rooms
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(190,95%,55%)]" />
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform ${openVoice ? '' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1">
            {voiceRooms.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground/60">No live voice rooms</p>
            )}
            {voiceRooms.map((r) => (
              <Link
                key={r.id}
                to={`/voice/${r.id}`}
                onClick={handleNav}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all group"
              >
                <Mic className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground/70">up to {r.max_participants}</p>
                </div>
              </Link>
            ))}
            <Link
              to="/voice"
              onClick={handleNav}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-primary hover:bg-primary/10 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              All voice rooms
            </Link>
          </CollapsibleContent>
        </Collapsible>

        {/* Video Rooms */}
        <Collapsible open={openVideo} onOpenChange={setOpenVideo}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
            <span className="flex items-center gap-2">
              <Video className="h-3 w-3 text-accent/80" />
              Video Rooms
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_hsl(270,80%,65%)]" />
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform ${openVideo ? '' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1">
            {videoRooms.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground/60">No live video rooms</p>
            )}
            {videoRooms.map((r) => (
              <Link
                key={r.id}
                to={`/video/${r.id}`}
                onClick={handleNav}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-all group"
              >
                <Video className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground/70">up to {r.max_participants}</p>
                </div>
              </Link>
            ))}
            <Link
              to="/video"
              onClick={handleNav}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-accent hover:bg-accent/10 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              All video rooms
            </Link>
          </CollapsibleContent>
        </Collapsible>
        <Collapsible open={openActivity} onOpenChange={setOpenActivity}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
            <span>Your Activity</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${openActivity ? '' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-1">
            {ACTIVITY.map((item) => {
              const Icon = item.icon;
              const tab = item.to.split('=')[1];
              const active = location.pathname === '/activity' && location.search.includes(`tab=${tab}`);
              return (
                <SidebarItem
                  key={item.label}
                  to={item.to}
                  onClick={handleNav}
                  icon={<Icon className="h-4 w-4" />}
                  label={item.label}
                  active={active}
                />
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Bottom: identity + settings + admin */}
      <div className="border-t border-border/40 p-3 space-y-2">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <AnonAvatar id={anonymousId} size={32} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Anonymous Cipher</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              {anonymousId.slice(0, 6)}…{anonymousId.slice(-4)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-2 text-xs h-8"
            onClick={() => { resetIdentity(); toast.success('New cipher identity'); }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            New identity
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/settings" onClick={handleNav}><Settings className="h-3.5 w-3.5" /></Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => {
              localStorage.removeItem('echo_anonymous_id');
              window.location.href = '/';
            }}
            title="End session"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
        <AdminSidebarButton onNavigate={handleNav} />
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  to, icon, label, active, onClick,
}: { to: string; icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 relative will-change-transform hover:translate-x-0.5 active:scale-[0.98] ${
        active
          ? 'bg-primary/10 text-primary shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)]'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
      }`}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary shadow-[0_0_10px_hsl(187,100%,50%)]"
        />
      )}
      <span className={active ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground transition-colors'}>
        {icon}
      </span>
      <span className="text-xs font-medium tracking-tight">{label}</span>
    </Link>
  );
}

function AdminSidebarButton({ onNavigate }: { onNavigate?: () => void }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = sessionStorage.getItem('cipher_admin') === 'true';

  if (isAdmin) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-xs h-8 text-primary/60 hover:text-primary"
        onClick={() => { navigate('/admin'); onNavigate?.(); }}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Admin Dashboard
      </Button>
    );
  }

  return (
    <>
      <button
        onClick={() => setLoginOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
      >
        <ShieldCheck className="h-3 w-3" />
        Cipher Admin
      </button>
      <AdminLoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onLogin={() => { navigate('/admin'); onNavigate?.(); }}
      />
    </>
  );
}
