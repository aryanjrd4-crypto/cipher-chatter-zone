import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Video, Trash2, RefreshCw, Users, PhoneOff, Lock, LogOut,
  Eye, EyeOff, Loader2, Crown, Copy, Check,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const admin = sessionStorage.getItem('cipher_admin');
    if (admin !== 'true') {
      navigate('/');
      return;
    }
    setIsAdmin(true);
  }, [navigate]);

  const { data: rooms = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-video-rooms'],
    queryFn: async () => {
      const { data } = await supabase
        .from('video_rooms')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: isAdmin,
    refetchInterval: 10_000,
  });

  const logAction = async (action: string, roomId: string, details?: any) => {
    await supabase.from('admin_actions').insert({
      action_type: action,
      target_room_id: roomId,
      details: details || {},
    });
  };

  const handleEndCall = async (roomId: string) => {
    await supabase.from('video_rooms').update({ is_active: false }).eq('id', roomId);
    await logAction('end_call', roomId);
    toast.success('Call ended');
    refetch();
  };

  const handleResetCode = async (roomId: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    await supabase.from('video_rooms').update({ invite_code: code }).eq('id', roomId);
    await logAction('reset_code', roomId, { new_code: code });
    toast.success('Code reset');
    refetch();
  };

  const handleDeleteRoom = async (roomId: string) => {
    await supabase.from('video_rooms').delete().eq('id', roomId);
    await logAction('delete_room', roomId);
    toast.success('Room deleted');
    refetch();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cipher_admin');
    toast.success('Admin session ended');
    navigate('/');
  };

  const copyCode = (code: string, roomId: string) => {
    navigator.clipboard.writeText(code);
    setCopied(roomId);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isAdmin) return null;

  return (
    <Layout wide>
      <div className="space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_18px_hsl(190,95%,55%,0.25)]">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gradient-cyan">Admin Dashboard</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Global moderation panel · All video rooms
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 text-xs border-destructive/30 text-destructive" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
            Logout Admin
          </Button>
        </header>

        <div className="grid gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-primary/30 text-primary gap-1">
              <Crown className="h-2.5 w-2.5" />
              Admin Mode
            </Badge>
            <span>{rooms.length} total rooms</span>
            <span>{rooms.filter(r => r.is_active).length} active</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Video className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No video rooms exist yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4 group hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <Video className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{r.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px] border-border/40">{r.room_type}</Badge>
                        <Badge variant="outline" className="text-[9px] border-border/40">{r.category}</Badge>
                        {r.is_locked && (
                          <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive gap-0.5">
                            <Lock className="h-2 w-2" /> Locked
                          </Badge>
                        )}
                        {r.is_active ? (
                          <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">Ended</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invite code (admin can see) */}
                {r.invite_code && r.room_type !== 'confession' && (
                  <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg bg-secondary/30">
                    <Lock className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-[10px] text-muted-foreground">Code:</span>
                    <span className="text-xs font-mono font-bold tracking-widest text-primary">
                      {showCodes[r.id] ? r.invite_code : '••••••••'}
                    </span>
                    <button onClick={() => setShowCodes(s => ({ ...s, [r.id]: !s[r.id] }))} className="ml-auto text-muted-foreground hover:text-foreground">
                      {showCodes[r.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    {showCodes[r.id] && (
                      <button onClick={() => copyCode(r.invite_code!, r.id)} className="text-muted-foreground hover:text-foreground">
                        {copied === r.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {r.is_active && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleEndCall(r.id)}>
                      <PhoneOff className="h-2.5 w-2.5" /> End Call
                    </Button>
                  )}
                  {r.invite_code && r.room_type !== 'confession' && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 border-border/40" onClick={() => handleResetCode(r.id)}>
                      <RefreshCw className="h-2.5 w-2.5" /> Reset Code
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRoom(r.id)}>
                    <Trash2 className="h-2.5 w-2.5" /> Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
