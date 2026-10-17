import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3, Check, Copy, Eye, EyeOff, FileText, Globe, Loader2,
  LogOut, PhoneOff, RefreshCw, ShieldCheck, Trash2, Video,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdminLoginDialog } from '@/components/admin/AdminLoginDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AdminPost = { id: string; title: string; anonymous_id: string; created_at: string; view_count: number };
type PostViewEvent = { id: string; post_id: string; anonymous_id: string; viewed_at: string; posts: { title: string } | null };
type SiteVisit = { id: string; anonymous_id: string; path: string; visited_at: string };

const formatTime = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const cipher = (value: string) => `Cipher#${value.replaceAll('-', '').slice(0, 8).toUpperCase()}`;

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) { setIsAdmin(false); setChecking(false); }
        return;
      }
      const { data } = await supabase.rpc('is_admin');
      if (active) { setIsAdmin(data === true); setChecking(false); }
    };
    void checkAdmin();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void checkAdmin(), 0);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const { data: summary } = useQuery({
    queryKey: ['admin-analytics-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_analytics_summary');
      if (error) throw error;
      return data?.[0] ?? { total_posts: 0, total_views: 0, total_site_visits: 0, visits_24h: 0, unique_visitors: 0 };
    }, enabled: isAdmin, refetchInterval: 30_000,
  });
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select('id,title,anonymous_id,created_at,view_count').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as AdminPost[];
    }, enabled: isAdmin, refetchInterval: 30_000,
  });
  const { data: postViews = [], isLoading: viewsLoading } = useQuery({
    queryKey: ['admin-post-view-events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('post_view_events').select('id,post_id,anonymous_id,viewed_at,posts(title)').order('viewed_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as PostViewEvent[];
    }, enabled: isAdmin, refetchInterval: 30_000,
  });
  const { data: legacyViews = [] } = useQuery({
    queryKey: ['admin-legacy-post-views'],
    queryFn: async () => {
      const { data, error } = await supabase.from('post_views').select('id,post_id,anonymous_id,viewed_at').order('viewed_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    }, enabled: isAdmin,
  });
  const { data: siteVisits = [], isLoading: visitsLoading } = useQuery({
    queryKey: ['admin-site-visits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_visits').select('id,anonymous_id,path,visited_at').order('visited_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as SiteVisit[];
    }, enabled: isAdmin, refetchInterval: 30_000,
  });
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['admin-video-rooms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('video_rooms').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }, enabled: isAdmin, refetchInterval: 10_000,
  });
  const { data: roomActions = [] } = useQuery({
    queryKey: ['admin-action-log'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_actions').select('*').order('created_at', { ascending: false }).limit(30);
      if (error) throw error;
      return data ?? [];
    }, enabled: isAdmin,
  });

  const refreshReports = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-analytics-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-post-view-events'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-legacy-post-views'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-site-visits'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-action-log'] }),
      queryClient.invalidateQueries({ queryKey: ['posts'] }),
    ]);
  };
  const logAction = async (action: string, roomId?: string, postId?: string, details: Record<string, unknown> = {}) => {
    const { error } = await supabase.rpc('record_admin_action', {
      p_action_type: action, p_target_room_id: roomId ?? null, p_target_post_id: postId ?? null, p_details: details,
    });
    if (error) toast.error('The action could not be recorded.');
  };
  const deletePost = async () => {
    if (!deleteTarget) return;
    const { data, error } = await supabase.rpc('admin_delete_post', { p_post_id: deleteTarget.id });
    if (error || !data) { toast.error('Post could not be deleted.'); return; }
    toast.success('Post deleted.');
    setDeleteTarget(null);
    await refreshReports();
  };
  const endCall = async (id: string) => {
    const { error } = await supabase.from('video_rooms').update({ is_active: false }).eq('id', id);
    if (error) { toast.error('The call could not be ended.'); return; }
    await logAction('end_call', id);
    toast.success('Call ended.');
    await queryClient.invalidateQueries({ queryKey: ['admin-video-rooms'] });
  };
  const resetCode = async (id: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const code = Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
    const { error } = await supabase.from('video_rooms').update({ invite_code: code }).eq('id', id);
    if (error) { toast.error('Cipher code could not be reset.'); return; }
    await logAction('reset_code', id);
    toast.success('Cipher code reset.');
    await queryClient.invalidateQueries({ queryKey: ['admin-video-rooms'] });
  };
  const deleteRoom = async (id: string) => {
    const { error } = await supabase.from('video_rooms').delete().eq('id', id);
    if (error) { toast.error('Room could not be deleted.'); return; }
    await logAction('delete_room', id);
    toast.success('Room deleted.');
    await queryClient.invalidateQueries({ queryKey: ['admin-video-rooms'] });
  };
  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1800);
  };

  if (checking) return <Layout wide><div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></Layout>;
  if (!isAdmin) return <Layout wide>
    <section className="mx-auto max-w-md py-12 text-center space-y-4">
      <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
      <h1 className="text-xl font-semibold">Restricted admin access</h1>
      <p className="text-sm text-muted-foreground">Sign in with the approved admin account to open private reports and moderation.</p>
      <Button onClick={() => setLoginOpen(true)} className="gap-2"><ShieldCheck className="h-4 w-4" /> Admin sign in</Button>
      <AdminLoginDialog open={loginOpen} onOpenChange={setLoginOpen} onLogin={() => setIsAdmin(true)} />
    </section>
  </Layout>;

  const matchedPosts = posts.filter((post) => `${post.title} ${post.anonymous_id}`.toLowerCase().includes(search.toLowerCase()));
  const events = [
    ...postViews.map((view) => ({ id: view.id, postId: view.post_id, visitor: view.anonymous_id, at: view.viewed_at, title: view.posts?.title ?? 'Post unavailable' })),
    ...legacyViews.map((view) => ({ id: `legacy-${view.id}`, postId: view.post_id, visitor: view.anonymous_id, at: view.viewed_at, title: posts.find((post) => post.id === view.post_id)?.title ?? 'Earlier post' })),
  ].sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime()).slice(0, 150);

  return <Layout wide>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-gradient-cyan">Cipher Admin</h1>
          </div>
          <p className="text-sm text-muted-foreground">Anonymous traffic, post views, and moderation</p>
          <Badge variant="outline" className="mt-2 border-primary/30 text-primary">Private · Cipher IDs only</Badge>
        </div>
        <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={async () => { await supabase.auth.signOut(); setIsAdmin(false); }}>
          <LogOut className="h-3.5 w-3.5" /> Logout Admin
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={FileText} label="Posts" value={summary?.total_posts ?? 0} />
        <Metric icon={Eye} label="Post views" value={summary?.total_views ?? 0} />
        <Metric icon={Globe} label="Visits · 24h" value={summary?.visits_24h ?? 0} />
        <Metric icon={BarChart3} label="Unique ciphers" value={summary?.unique_visitors ?? 0} />
      </section>

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-4 gap-1 bg-secondary/70 p-1">
          <TabsTrigger value="posts" className="px-2 py-2 text-xs">Posts</TabsTrigger>
          <TabsTrigger value="views" className="px-2 py-2 text-xs">Views</TabsTrigger>
          <TabsTrigger value="visits" className="px-2 py-2 text-xs">Visits</TabsTrigger>
          <TabsTrigger value="rooms" className="px-2 py-2 text-xs">Rooms</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find by post title or Cipher ID" aria-label="Search posts" />
          {postsLoading ? <Loading /> : matchedPosts.length === 0 ? <Empty text="No posts found." /> : matchedPosts.map((post) => <article key={post.id} className="glass flex flex-wrap items-center gap-3 rounded-xl p-4">
            <div className="min-w-0 flex-1">
              <Link to={`/post/${post.id}`} className="break-words text-sm font-medium text-foreground hover:text-primary">{post.title}</Link>
              <p className="mt-1 text-xs text-muted-foreground">{cipher(post.anonymous_id)} · {formatTime(post.created_at)}</p>
            </div>
            <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" />{post.view_count}</Badge>
            <Button variant="ghost" size="icon" aria-label={`Delete post ${post.title}`} title="Delete post" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(post)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </article>)}
          <p className="text-center text-xs text-muted-foreground">Showing up to the 100 newest posts.</p>
        </TabsContent>

        <TabsContent value="views" className="space-y-3">
          <div className="glass rounded-xl p-4"><h2 className="text-sm font-semibold">Post view history</h2><p className="mt-1 text-xs text-muted-foreground">Each new visit to a post is logged with its anonymous Cipher ID and time.</p></div>
          {viewsLoading ? <Loading /> : events.length === 0 ? <Empty text="No post view events recorded yet." /> : events.map((event) => <article key={event.id} className="glass flex flex-wrap items-start justify-between gap-3 rounded-xl p-4">
            <div className="min-w-0 flex-1">
              <Link to={`/post/${event.postId}`} className="break-words text-sm font-medium hover:text-primary">{event.title}</Link>
              <p className="mt-1 font-mono text-xs text-primary">{cipher(event.visitor)}</p>
            </div>
            <time className="text-xs text-muted-foreground">{formatTime(event.at)}</time>
          </article>)}
          <p className="text-center text-xs text-muted-foreground">Showing up to 150 newest visits; earlier totals remain counted.</p>
        </TabsContent>

        <TabsContent value="visits" className="space-y-3">
          <div className="glass rounded-xl p-4"><h2 className="text-sm font-semibold">Website visit history</h2><p className="mt-1 text-xs text-muted-foreground">Only page paths, anonymous Cipher IDs, and visit times are stored.</p></div>
          {visitsLoading ? <Loading /> : siteVisits.length === 0 ? <Empty text="No site visits recorded yet." /> : siteVisits.map((visit) => <article key={visit.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
            <div><p className="font-mono text-xs text-primary">{cipher(visit.anonymous_id)}</p><p className="mt-1 text-sm">{visit.path}</p></div>
            <time className="text-xs text-muted-foreground">{formatTime(visit.visited_at)}</time>
          </article>)}
          <p className="text-center text-xs text-muted-foreground">Showing up to the 100 most recent page visits.</p>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Video className="h-4 w-4 text-primary" />{rooms.length} rooms · {rooms.filter((room) => room.is_active).length} active</div>
          {roomsLoading ? <Loading /> : rooms.length === 0 ? <Empty text="No video rooms exist yet." /> : rooms.map((room) => <article key={room.id} className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{room.name}</h3><p className="mt-1 text-xs text-muted-foreground">{room.room_type} · {room.category} · {room.is_active ? 'Active' : 'Ended'}</p></div><Badge variant="outline">{room.is_locked ? 'Locked' : 'Open'}</Badge></div>
            {room.invite_code && <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 font-mono text-xs"><span>Cipher code</span><span className="text-primary">{showCodes[room.id] ? room.invite_code : '••••••••'}</span><Button variant="ghost" size="icon" className="ml-auto h-7 w-7" aria-label="Toggle code visibility" onClick={() => setShowCodes((state) => ({ ...state, [room.id]: !state[room.id] }))}>{showCodes[room.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>{showCodes[room.id] && <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Copy cipher code" onClick={() => void copyCode(room.invite_code ?? '', room.id)}>{copied === room.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</Button>}</div>}
            <div className="flex flex-wrap gap-2">{room.is_active && <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => void endCall(room.id)}><PhoneOff className="h-3.5 w-3.5" />End call</Button>}{room.invite_code && <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => void resetCode(room.id)}><RefreshCw className="h-3.5 w-3.5" />Reset code</Button>}<Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive" onClick={() => void deleteRoom(room.id)}><Trash2 className="h-3.5 w-3.5" />Delete room</Button></div>
          </article>)}
          <div className="glass rounded-xl p-4 space-y-2"><h2 className="text-sm font-semibold">Admin activity</h2>{roomActions.length === 0 ? <p className="text-xs text-muted-foreground">No admin actions recorded.</p> : roomActions.map((action) => <p key={action.id} className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{action.action_type.replaceAll('_', ' ')}</span><time>{formatTime(action.created_at)}</time></p>)}</div>
        </TabsContent>
      </Tabs>
    </motion.div>

    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent className="glass-strong">
        <AlertDialogHeader><AlertDialogTitle>Delete this post?</AlertDialogTitle><AlertDialogDescription>This permanently removes the post and its comments, reactions, and view history.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void deletePost(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete post</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </Layout>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) {
  return <div className="glass rounded-xl p-4"><Icon className="mb-2 h-4 w-4 text-primary" /><p className="text-xl font-semibold">{value.toLocaleString()}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}

function Loading() { return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>; }
function Empty({ text }: { text: string }) { return <div className="glass rounded-xl p-10 text-center text-sm text-muted-foreground">{text}</div>; }