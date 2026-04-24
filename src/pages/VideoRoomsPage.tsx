import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Plus, Users, Sparkles, Camera, Lock, ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateRoomDialog } from '@/components/calls/CreateRoomDialog';
import { Tilt3D } from '@/components/effects/Tilt3D';
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
                <Tilt3D key={r.id} intensity={5} lift={6}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="glass rounded-3xl p-6 group hover:border-accent/40 transition-all duration-500 relative overflow-hidden float-3d"
                  >
                    <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-accent/20 blur-3xl opacity-30 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl opacity-20 group-hover:opacity-70 transition-opacity duration-700" />
                    <div className="relative flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/5 border border-accent/30 flex items-center justify-center shadow-[0_8px_24px_-8px_hsl(270,95%,70%,0.5)]">
                          <Video className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[15px] tracking-tight">{r.name}</h3>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[9px] border-border/40 text-muted-foreground rounded-full">
                              {r.room_type || r.category}
                            </Badge>
                            {r.camera_required && (
                              <Badge variant="outline" className="text-[9px] border-accent/40 text-accent gap-1 rounded-full">
                                <Camera className="h-2 w-2" />
                                cam required
                              </Badge>
                            )}
                            {isCodeProtected && (
                              <Badge variant="outline" className="text-[9px] border-primary/40 text-primary gap-1 rounded-full">
                                <ShieldCheck className="h-2 w-2" />
                                Cipher Code
                              </Badge>
                            )}
                            {isConfession && (
                              <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 gap-1 rounded-full">
                                🔓 Open
                              </Badge>
                            )}
                            {r.is_locked && (
                              <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive gap-1 rounded-full">
                                <Lock className="h-2 w-2" />
                                Locked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                        LIVE
                      </span>
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-5 min-h-[2rem] leading-relaxed">
                        {r.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between relative">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>up to {r.max_participants}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/video/${r.id}`)}
                        className="h-9 px-4 gap-1.5 rounded-full bg-gradient-to-br from-accent to-accent/80 hover:from-accent hover:to-accent text-accent-foreground shadow-[0_0_24px_hsl(270,95%,70%,0.5)] press-3d font-medium"
                      >
                        {isCodeProtected ? <Lock className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                        {isCodeProtected ? 'Enter Code' : 'Join Call'}
                      </Button>
                    </div>
                  </motion.div>
                </Tilt3D>
              );
            })}
          </div>
        )}
      </div>
      <CreateRoomDialog kind="video" open={createOpen} onOpenChange={setCreateOpen} />
    </Layout>
  );
}
