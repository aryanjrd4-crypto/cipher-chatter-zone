import '@livekit/components-styles';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useDataChannel,
  TrackRefContext,
  TrackReferenceOrPlaceholder,
  VideoTrack,
} from '@livekit/components-react';
import { Track, ConnectionState, RoomEvent } from 'livekit-client';
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, Hand, Phone, Smile,
  MessageSquare, Users, X, Pin, Grid3x3, User, Loader2, ShieldCheck, Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CipherAvatar } from '@/components/calls/CipherAvatar';
import { CipherCodeModal } from '@/components/calls/CipherCodeModal';
import { HostPanel } from '@/components/calls/HostPanel';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { useLiveKitToken } from '@/hooks/useLiveKitToken';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Kind = 'voice' | 'video';

interface ChatMsg {
  id: string;
  from: string;
  text: string;
  ts: number;
}

interface Reaction {
  id: string;
  emoji: string;
  from: string;
}

const REACTIONS = ['❤️', '🔥', '👏', '😂', '😢', '😮', '👍', '✨'];

export function RoomCallScreen({ kind }: { kind: Kind }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { anonymousId } = useIdentityStore();
  const queryClient = useQueryClient();
  const isVideo = kind === 'video';
  const [codeVerified, setCodeVerified] = useState(false);

  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: [kind, 'room', id],
    queryFn: async () => {
      if (!id) return null;
      const table = isVideo ? 'video_rooms' : 'voice_rooms';
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Check if this user is the host (bypass code)
  const isHost = room && id ? sessionStorage.getItem(`cipher_host_${id}`) === anonymousId || (room as any).host_anonymous_id === anonymousId : false;

  // Determine if code is needed
  const needsCode = isVideo && room && (room as any).room_type !== 'confession' && (room as any).invite_code && !isHost && !codeVerified;

  const lkRoomName = id ? `${kind}-${id}` : null;
  const { data: tokenData, error: tokenError, loading: tokenLoading } =
    useLiveKitToken({ room: lkRoomName, identity: anonymousId, enabled: !!room && !needsCode });

  const leave = () => navigate(isVideo ? '/video' : '/voice');

  if (!id) return null;

  if (roomLoading) {
    return <FullscreenStatus icon={<Loader2 className="h-6 w-6 animate-spin text-primary" />} title="Connecting to the cipher" subtitle="Securing anonymous channel..." />;
  }
  if (!room) {
    return <FullscreenStatus title="Room not found" subtitle="This cipher line has gone dark." onBack={leave} />;
  }

  // Show cipher code modal for coded rooms
  if (needsCode) {
    return (
      <CipherCodeModal
        open
        roomName={(room as any).name}
        onSubmit={async (code) => {
          const match = code.toUpperCase() === ((room as any).invite_code || '').toUpperCase();
          if (match) {
            setCodeVerified(true);
            return true;
          }
          return false;
        }}
        onCancel={leave}
      />
    );
  }

  if (tokenLoading) {
    return <FullscreenStatus icon={<Loader2 className="h-6 w-6 animate-spin text-primary" />} title="Connecting to the cipher" subtitle="Securing anonymous channel..." />;
  }
  if (tokenError || !tokenData) {
    return <FullscreenStatus title="Couldn't open the line" subtitle={tokenError || 'No token returned.'} onBack={leave} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <LiveKitRoom
        token={tokenData.token}
        serverUrl={tokenData.url}
        connect
        audio
        video={isVideo && (('camera_required' in room) ? Boolean((room as any).camera_required) : false)}
        data-lk-theme="default"
        className="h-full w-full"
        onDisconnected={leave}
        onError={(e) => toast.error(e.message)}
      >
        <RoomAudioRenderer />
        <CallShell kind={kind} roomMeta={room as any} onLeave={leave} isHost={isHost} />
      </LiveKitRoom>
    </div>
  );
}

function FullscreenStatus({
  icon, title, subtitle, onBack,
}: { icon?: React.ReactNode; title: string; subtitle?: string; onBack?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-background bg-mesh flex items-center justify-center p-6">
      <div className="glass-strong rounded-2xl p-8 text-center max-w-sm w-full">
        <div className="flex justify-center mb-3">{icon ?? <ShieldCheck className="h-6 w-6 text-primary" />}</div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
        {onBack && (
          <Button onClick={onBack} variant="outline" size="sm" className="mt-5">
            Back
          </Button>
        )}
      </div>
    </div>
  );
}

interface RoomMeta {
  id: string;
  name: string;
  description: string | null;
  max_participants: number;
  room_type?: string;
  invite_code?: string | null;
  is_locked?: boolean;
  host_anonymous_id?: string;
}

function CallShell({ kind, roomMeta, onLeave, isHost }: { kind: Kind; roomMeta: RoomMeta; onLeave: () => void; isHost: boolean }) {
  const isVideo = kind === 'video';
  const lkRoom = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [view, setView] = useState<'grid' | 'speaker'>('grid');
  const [pinned, setPinned] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [hostPanelOpen, setHostPanelOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [duration, setDuration] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState<Reaction[]>([]);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [unread, setUnread] = useState(0);

  // Live room data for host panel
  const { data: liveRoom } = useQuery({
    queryKey: ['live-room-meta', roomMeta.id],
    queryFn: async () => {
      const { data } = await supabase.from('video_rooms').select('*').eq('id', roomMeta.id).maybeSingle();
      return data;
    },
    refetchInterval: 5000,
    enabled: isHost,
  });

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setDuration(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!lkRoom) return;
    const onJoin = (p: any) => toast(`${shortName(p.identity)} joined the cipher`, { duration: 2200 });
    const onLeaveEvt = (p: any) => toast(`${shortName(p.identity)} left`, { duration: 2200 });
    lkRoom.on(RoomEvent.ParticipantConnected, onJoin);
    lkRoom.on(RoomEvent.ParticipantDisconnected, onLeaveEvt);
    return () => {
      lkRoom.off(RoomEvent.ParticipantConnected, onJoin);
      lkRoom.off(RoomEvent.ParticipantDisconnected, onLeaveEvt);
    };
  }, [lkRoom]);

  const { send } = useDataChannel((msg) => {
    try {
      const text = new TextDecoder().decode(msg.payload);
      const data = JSON.parse(text);
      const from = msg.from?.identity ?? 'anon';
      if (data.kind === 'chat') {
        const m: ChatMsg = { id: crypto.randomUUID(), from, text: String(data.text).slice(0, 500), ts: Date.now() };
        setChat((c) => [...c, m]);
        if (!chatOpen) setUnread((u) => u + 1);
      } else if (data.kind === 'reaction') {
        const r: Reaction = { id: crypto.randomUUID(), emoji: String(data.emoji).slice(0, 4), from };
        setFloatingReactions((rs) => [...rs, r]);
        setTimeout(() => setFloatingReactions((rs) => rs.filter((x) => x.id !== r.id)), 3000);
      }
    } catch { /* ignore */ }
  });

  const broadcast = (data: object) => {
    send(new TextEncoder().encode(JSON.stringify(data)), { reliable: true });
  };

  const sendChat = (text: string) => {
    if (!text.trim()) return;
    broadcast({ kind: 'chat', text });
    setChat((c) => [...c, {
      id: crypto.randomUUID(), from: localParticipant?.identity ?? 'me', text, ts: Date.now(),
    }]);
  };

  const sendReaction = (emoji: string) => {
    broadcast({ kind: 'reaction', emoji });
    const r: Reaction = { id: crypto.randomUUID(), emoji, from: localParticipant?.identity ?? 'me' };
    setFloatingReactions((rs) => [...rs, r]);
    setTimeout(() => setFloatingReactions((rs) => rs.filter((x) => x.id !== r.id)), 3000);
  };

  useEffect(() => { if (chatOpen) setUnread(0); }, [chatOpen]);

  const camOn = !!localParticipant?.isCameraEnabled;
  const micOn = !!localParticipant?.isMicrophoneEnabled;
  const screenOn = !!localParticipant?.isScreenShareEnabled;

  const toggleCam = async () => {
    try { await localParticipant?.setCameraEnabled(!camOn); }
    catch { toast.error('Camera permission denied'); }
  };
  const toggleMic = async () => {
    try { await localParticipant?.setMicrophoneEnabled(!micOn); }
    catch { toast.error('Microphone permission denied'); }
  };
  const toggleScreen = async () => {
    try { await localParticipant?.setScreenShareEnabled(!screenOn); }
    catch { toast.error('Screen share unavailable'); }
  };
  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    broadcast({ kind: 'reaction', emoji: next ? '✋' : '👇' });
  };

  const isCodeProtected = isVideo && roomMeta.room_type !== 'confession' && roomMeta.invite_code;

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-b from-background via-background to-background/95 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-mesh" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/30 backdrop-blur-md bg-background/40">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onLeave} className="md:hidden p-1.5 rounded-md hover:bg-secondary/40">
            <X className="h-4 w-4" />
          </button>
          <div className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center border',
            isVideo ? 'bg-accent/10 border-accent/30' : 'bg-primary/10 border-primary/30',
          )}>
            {isVideo ? <Video className="h-4 w-4 text-accent" /> : <Mic className="h-4 w-4 text-primary" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate">{roomMeta.name}</p>
              {isCodeProtected && (
                <Badge variant="outline" className="text-[8px] border-primary/30 text-primary gap-0.5 py-0 h-4">
                  <ShieldCheck className="h-2 w-2" /> Secured
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-2 font-mono">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
              <span>·</span>
              <span>{formatDuration(duration)}</span>
              <span>·</span>
              <span>{participants.length} cipher{participants.length === 1 ? '' : 's'}</span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          {isHost && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1.5 text-yellow-400 hover:bg-yellow-400/10"
              onClick={() => setHostPanelOpen(true)}
            >
              <Crown className="h-3.5 w-3.5 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]" />
              Host
            </Button>
          )}
          {isVideo && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5" onClick={() => setView(v => v === 'grid' ? 'speaker' : 'grid')}>
              {view === 'grid' ? <Grid3x3 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              {view === 'grid' ? 'Grid' : 'Speaker'}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5 relative" onClick={() => setChatOpen(true)}>
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-accent text-[9px] text-accent-foreground flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5" onClick={() => setParticipantsOpen(true)}>
            <Users className="h-3.5 w-3.5" />
            {participants.length}
          </Button>
        </div>
      </header>

      {/* Main stage */}
      <main className="flex-1 relative z-10 overflow-hidden">
        {isVideo ? (
          <VideoStage view={view} pinned={pinned} setPinned={setPinned} />
        ) : (
          <VoiceStage />
        )}
        <FloatingReactions reactions={floatingReactions} />
      </main>

      {/* Bottom controls */}
      <footer className="relative z-20 px-3 sm:px-6 pb-4 pt-3 backdrop-blur-md bg-background/60 border-t border-border/30">
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <ControlButton active={micOn} onClick={toggleMic} label={micOn ? 'Mute' : 'Unmute'}>
            {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </ControlButton>

          {isVideo && (
            <ControlButton active={camOn} onClick={toggleCam} label={camOn ? 'Stop video' : 'Start video'} accent>
              {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </ControlButton>
          )}

          {isVideo && (
            <ControlButton active={screenOn} onClick={toggleScreen} label="Share screen" accent>
              <ScreenShare className="h-4 w-4" />
            </ControlButton>
          )}

          <div className="relative">
            <ControlButton onClick={() => setReactionPickerOpen(o => !o)} label="React">
              <Smile className="h-4 w-4" />
            </ControlButton>
            <AnimatePresence>
              {reactionPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 glass-strong rounded-full px-2 py-1.5 flex items-center gap-1 shadow-xl"
                >
                  {REACTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => { sendReaction(e); setReactionPickerOpen(false); }}
                      className="text-xl hover:scale-125 transition-transform px-1"
                    >
                      {e}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ControlButton active={handRaised} onClick={toggleHand} label="Raise hand">
            <Hand className="h-4 w-4" />
          </ControlButton>

          {isHost && (
            <ControlButton onClick={() => setHostPanelOpen(true)} label="Host controls">
              <Crown className="h-4 w-4 text-yellow-400" />
            </ControlButton>
          )}

          <Button
            onClick={onLeave}
            className="h-11 px-4 sm:px-5 rounded-full bg-destructive/90 hover:bg-destructive text-destructive-foreground gap-2 shadow-[0_0_24px_hsl(0,72%,51%,0.4)]"
          >
            <Phone className="h-4 w-4 rotate-[135deg]" />
            <span className="text-xs font-semibold hidden sm:inline">Leave</span>
          </Button>
        </div>

        <div className="flex sm:hidden items-center justify-center gap-3 mt-2">
          {isHost && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1 text-yellow-400" onClick={() => setHostPanelOpen(true)}>
              <Crown className="h-3 w-3" /> Host
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1 relative" onClick={() => setChatOpen(true)}>
            <MessageSquare className="h-3 w-3" /> Chat
            {unread > 0 && <span className="ml-1 h-3.5 min-w-[14px] px-1 rounded-full bg-accent text-[9px] text-accent-foreground flex items-center justify-center">{unread}</span>}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1" onClick={() => setParticipantsOpen(true)}>
            <Users className="h-3 w-3" /> {participants.length}
          </Button>
        </div>
      </footer>

      {/* Side panels */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="p-0 w-full sm:w-[360px] bg-background border-l border-border/40 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border/30">
            <SheetTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Live cipher chat
            </SheetTitle>
          </SheetHeader>
          <CallChat messages={chat} onSend={sendChat} myIdentity={localParticipant?.identity ?? ''} />
        </SheetContent>
      </Sheet>

      <Sheet open={participantsOpen} onOpenChange={setParticipantsOpen}>
        <SheetContent side="right" className="p-0 w-full sm:w-[320px] bg-background border-l border-border/40 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border/30">
            <SheetTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              In the cipher · {participants.length}
            </SheetTitle>
          </SheetHeader>
          <ParticipantList />
        </SheetContent>
      </Sheet>

      {/* Host Panel */}
      {isHost && (
        <HostPanel
          open={hostPanelOpen}
          onOpenChange={setHostPanelOpen}
          roomId={roomMeta.id}
          roomType={liveRoom?.room_type ?? roomMeta.room_type ?? 'standard'}
          inviteCode={liveRoom?.invite_code ?? roomMeta.invite_code ?? null}
          isLocked={liveRoom?.is_locked ?? roomMeta.is_locked ?? false}
          participants={participants.map((p) => ({
            identity: p.identity,
            isMicrophoneEnabled: p.isMicrophoneEnabled,
            isCameraEnabled: p.isCameraEnabled,
            isLocal: p.isLocal,
            isSpeaking: p.isSpeaking,
          }))}
          onKickParticipant={(identity) => {
            // Kick via data channel message
            broadcast({ kind: 'kick', target: identity });
            toast.success(`Removed ${shortName(identity)}`);
          }}
          onEndCall={onLeave}
        />
      )}
    </div>
  );
}

// ============================================================
// Stages
// ============================================================

function VideoStage({ view, pinned, setPinned }: {
  view: 'grid' | 'speaker';
  pinned: string | null;
  setPinned: (id: string | null) => void;
}) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const activeIdentity = pinned ?? tracks.find((t) => t.participant.isSpeaking)?.participant.identity ?? tracks[0]?.participant.identity;

  if (view === 'speaker' && activeIdentity) {
    const main = tracks.find((t) => t.participant.identity === activeIdentity) ?? tracks[0];
    const others = tracks.filter((t) => t !== main);
    return (
      <div className="h-full flex flex-col p-3 gap-3">
        <div className="flex-1 min-h-0 rounded-2xl overflow-hidden">
          {main && <ParticipantTile track={main} large pinned={pinned === main.participant.identity} onPin={() => setPinned(pinned === main.participant.identity ? null : main.participant.identity)} />}
        </div>
        {others.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {others.map((t, i) => (
              <div key={`${t.participant.identity}-${i}`} className="w-32 sm:w-40 aspect-video shrink-0 rounded-xl overflow-hidden">
                <ParticipantTile track={t} onPin={() => setPinned(t.participant.identity)} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const cols = tracks.length <= 1 ? 'grid-cols-1'
    : tracks.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : tracks.length <= 4 ? 'grid-cols-2'
    : tracks.length <= 6 ? 'grid-cols-2 md:grid-cols-3'
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className="h-full p-3">
      <div className={cn('grid gap-3 h-full', cols)}>
        {tracks.map((t, i) => (
          <ParticipantTile
            key={`${t.participant.identity}-${t.source}-${i}`}
            track={t}
            pinned={pinned === t.participant.identity}
            onPin={() => setPinned(pinned === t.participant.identity ? null : t.participant.identity)}
          />
        ))}
      </div>
    </div>
  );
}

function VoiceStage() {
  const participants = useParticipants();
  return (
    <div className="h-full p-6 sm:p-10 flex items-center justify-center">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-8 max-w-3xl w-full">
        {participants.map((p) => (
          <div key={p.identity} className="flex flex-col items-center gap-2">
            <div className={cn(
              'relative rounded-full p-1 transition-all',
              p.isSpeaking && 'ring-2 ring-primary shadow-[0_0_30px_hsl(190,95%,55%,0.5)]',
            )}>
              <CipherAvatar id={p.identity} size={96} />
              {!p.isMicrophoneEnabled && (
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-destructive/90 flex items-center justify-center shadow-lg">
                  <MicOff className="h-3.5 w-3.5 text-destructive-foreground" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs font-mono text-muted-foreground">{shortName(p.identity)}</p>
              {p.isLocal && <p className="text-[9px] uppercase tracking-wider text-primary mt-0.5">you</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Tile
// ============================================================

function ParticipantTile({
  track, large = false, pinned = false, onPin,
}: {
  track: TrackReferenceOrPlaceholder;
  large?: boolean;
  pinned?: boolean;
  onPin?: () => void;
}) {
  const p = track.participant;
  const hasVideo = track.publication?.track && !track.publication.isMuted;
  const isScreen = track.source === Track.Source.ScreenShare;
  const speaking = p.isSpeaking;

  return (
    <TrackRefContext.Provider value={track}>
      <div className={cn(
        'relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-secondary/40 border transition-all group',
        speaking ? 'border-primary shadow-[0_0_24px_hsl(190,95%,55%,0.45)]' : 'border-border/30',
        pinned && 'ring-2 ring-accent ring-offset-2 ring-offset-background',
      )}>
        {hasVideo && track.publication ? (
          <VideoTrack trackRef={track as any} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/30 to-background">
            <CipherAvatar id={p.identity} size={large ? 160 : 80} pulse={speaking} />
          </div>
        )}

        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {isScreen && (
            <span className="px-1.5 py-0.5 rounded-md bg-accent/80 text-[9px] text-accent-foreground font-medium uppercase tracking-wider">
              Screen
            </span>
          )}
          {p.isLocal && (
            <span className="px-1.5 py-0.5 rounded-md bg-primary/80 text-[9px] text-primary-foreground font-medium uppercase tracking-wider">
              You
            </span>
          )}
        </div>

        {onPin && !isScreen && (
          <button
            onClick={onPin}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-background/60 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
            title={pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={cn('h-3 w-3', pinned ? 'text-accent fill-accent' : 'text-foreground')} />
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-white/90 truncate">{shortName(p.identity)}</span>
          {!p.isMicrophoneEnabled && (
            <MicOff className="h-3 w-3 text-destructive shrink-0" />
          )}
        </div>
      </div>
    </TrackRefContext.Provider>
  );
}

// ============================================================
// Side panels
// ============================================================

function CallChat({ messages, onSend, myIdentity }: {
  messages: ChatMsg[]; onSend: (t: string) => void; myIdentity: string;
}) {
  const [text, setText] = useState('');

  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground/60 mt-8">
            Messages here are temporary and disappear when the call ends.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.from === myIdentity;
          return (
            <div key={m.id} className={cn('flex gap-2', mine && 'flex-row-reverse')}>
              <CipherAvatar id={m.from} size={24} />
              <div className={cn(
                'max-w-[75%] rounded-2xl px-3 py-1.5 text-xs',
                mine ? 'bg-primary/15 text-foreground rounded-tr-sm' : 'bg-secondary/60 rounded-tl-sm',
              )}>
                <p className="text-[9px] font-mono text-muted-foreground/70 mb-0.5">{shortName(m.from)}</p>
                <p className="break-words leading-relaxed">{m.text}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); onSend(text); setText(''); }}
        className="flex items-center gap-2 p-3 border-t border-border/30 bg-background"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type anonymously..."
          maxLength={500}
          className="bg-secondary/40 h-9 text-xs"
        />
        <Button type="submit" size="sm" className="h-9 bg-primary/90 hover:bg-primary">Send</Button>
      </form>
    </>
  );
}

function ParticipantList() {
  const participants = useParticipants();
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
      {participants.map((p) => (
        <div key={p.identity} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40">
          <CipherAvatar id={p.identity} size={32} pulse={p.isSpeaking} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono">{shortName(p.identity)}</p>
            <p className="text-[10px] text-muted-foreground">
              {p.isLocal && 'you · '}
              {p.isMicrophoneEnabled ? 'mic on' : 'muted'}
              {p.isCameraEnabled && ' · cam on'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Floating reactions
// ============================================================

function FloatingReactions({ reactions }: { reactions: Reaction[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => {
          const left = 20 + Math.random() * 60;
          return (
            <motion.div
              key={r.id}
              initial={{ y: '100%', opacity: 0, scale: 0.5 }}
              animate={{ y: '-20%', opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, ease: 'easeOut' }}
              className="absolute text-3xl sm:text-4xl drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
              style={{ left: `${left}%`, bottom: 0 }}
            >
              {r.emoji}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Bits
// ============================================================

function ControlButton({
  children, onClick, active, label, accent,
}: {
  children: React.ReactNode; onClick: () => void; active?: boolean; label?: string; accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'h-11 w-11 rounded-full flex items-center justify-center transition-all border',
        active
          ? accent
            ? 'bg-accent/20 border-accent/50 text-accent shadow-[0_0_18px_hsl(270,80%,65%,0.4)]'
            : 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_18px_hsl(190,95%,55%,0.35)]'
          : 'bg-secondary/60 border-border/40 text-foreground hover:bg-secondary',
      )}
    >
      {children}
    </button>
  );
}

function shortName(id: string) {
  const trimmed = id.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
  return `Cipher#${trimmed || '0000'}`;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toString().padStart(2, '0');
  if (m < 60) return `${m}:${sec}`;
  const h = Math.floor(m / 60);
  const mm = (m % 60).toString().padStart(2, '0');
  return `${h}:${mm}:${sec}`;
}
