import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Plus, Users, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateRoomDialog } from '@/components/calls/CreateRoomDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export default function VoiceRoomsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['voice-rooms'],
    queryFn: async () => {
      const { data } = await supabase
        .from('voice_rooms')
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
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_18px_hsl(190,95%,55%,0.2)]">
                <Mic className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gradient-cyan">Voice Rooms</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Anonymous audio lounges. No camera, just voices in the cipher.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 bg-primary/90 hover:bg-primary text-primary-foreground shadow-[0_0_24px_hsl(190,95%,55%,0.3)]"
          >
            <Plus className="h-4 w-4" />
            New Voice Room
          </Button>
        </header>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-xl h-40 animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Mic className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No voice rooms live right now.</p>
            <Button onClick={() => setCreateOpen(true)} variant="outline" className="gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Be the first to open one
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {rooms.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-xl p-5 group hover:border-primary/40 transition-all relative overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Mic className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{r.name}</h3>
                      <Badge variant="outline" className="text-[9px] border-border/40 text-muted-foreground mt-0.5">
                        {r.category}
                      </Badge>
                    </div>
                  </div>
                  <span className={cn(
                    'flex items-center gap-1 text-[10px] text-emerald-400',
                  )}>
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
                    onClick={() => navigate(`/voice/${r.id}`)}
                    className="h-8 gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground shadow-[0_0_18px_hsl(190,95%,55%,0.3)]"
                  >
                    <Mic className="h-3 w-3" />
                    Join
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <CreateRoomDialog kind="voice" open={createOpen} onOpenChange={setCreateOpen} />
    </Layout>
  );
}
