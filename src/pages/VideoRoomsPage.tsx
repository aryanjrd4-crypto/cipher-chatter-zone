import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Plus, Users, Sparkles, Camera, Lock, ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateRoomDialog } from '@/components/calls/CreateRoomDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function VideoRoomsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['video-rooms'],
    queryFn: async () => {
      const { data } = await supabase
        .from('video_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
    refetchInterval: 15_000,
  });

  return (
    <Layout wide>
      <div className="space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-[0_0_18px_hsl(270,80%,65%,0.25)]">
                <Video className="h-4 w-4 text-accent" />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--neon-purple)), hsl(var(--neon-pink)))' }}>
                Video Rooms
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Anonymous video lounges. Camera optional, identity always hidden.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 bg-accent/90 hover:bg-accent text-accent-foreground shadow-[0_0_24px_hsl(270,80%,65%,0.4)]"
          >
            <Plus className="h-4 w-4" />
            New Video Room
          </Button>
        </header>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-xl h-44 animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Video className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No video rooms live right now.</p>
            <Button onClick={() => setCreateOpen(true)} variant="outline" className="gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Open the first one
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {rooms.map((r: any, i: number) => {
              const isConfession = r.room_type === 'confession';
              const isCodeProtected = !isConfession && r.invite_code;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-xl p-5 group hover:border-accent/40 transition-all relative overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-accent/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <Video className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{r.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-[9px] border-border/40 text-muted-foreground">
                            {r.room_type || r.category}
                          </Badge>
                          {r.camera_required && (
                            <Badge variant="outline" className="text-[9px] border-accent/40 text-accent gap-1">
                              <Camera className="h-2 w-2" />
                              cam required
                            </Badge>
                          )}
                          {isCodeProtected && (
                            <Badge variant="outline" className="text-[9px] border-primary/40 text-primary gap-1">
                              <ShieldCheck className="h-2 w-2" />
                              Cipher Code
                            </Badge>
                          )}
                          {isConfession && (
                            <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 gap-1">
                              🔓 Open
                            </Badge>
                          )}
                          {r.is_locked && (
                            <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive gap-1">
                              <Lock className="h-2 w-2" />
                              Locked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-4 min-h-[2rem]">
                      {r.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>up to {r.max_participants}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/video/${r.id}`)}
                      className="h-8 gap-1.5 bg-accent/90 hover:bg-accent text-accent-foreground shadow-[0_0_22px_hsl(270,80%,65%,0.45)]"
                    >
                      {isCodeProtected ? <Lock className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                      {isCodeProtected ? 'Enter Code' : 'Join Call'}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <CreateRoomDialog kind="video" open={createOpen} onOpenChange={setCreateOpen} />
    </Layout>
  );
}
