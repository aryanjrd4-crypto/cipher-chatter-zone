import { useState } from 'react';
import {
  Crown, Mic, MicOff, Video, VideoOff, UserX, Lock, Unlock,
  RefreshCw, PhoneOff, ScreenShare, ShieldAlert, Copy, Check, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CipherAvatar } from './CipherAvatar';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function shortName(id: string) {
  const trimmed = id.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
  return `Cipher#${trimmed || '0000'}`;
}

interface Participant {
  identity: string;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  isLocal: boolean;
  isSpeaking: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomType: string;
  inviteCode: string | null;
  isLocked: boolean;
  participants: Participant[];
  onKickParticipant?: (identity: string) => void;
  onEndCall?: () => void;
}

export function HostPanel({
  open, onOpenChange, roomId, roomType, inviteCode, isLocked,
  participants, onKickParticipant, onEndCall,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetConfirmCode, setResetConfirmCode] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);

  const copyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Cipher code copied');
  };

  const toggleLock = async () => {
    setLockLoading(true);
    const { error } = await supabase.from('video_rooms').update({ is_locked: !isLocked }).eq('id', roomId);
    setLockLoading(false);
    if (error) { toast.error('Failed to update lock'); return; }
    toast.success(isLocked ? 'Room unlocked' : 'Room locked — no new joins');
  };

  const handleResetCode = async () => {
    if (resetConfirmCode.toUpperCase() !== inviteCode?.toUpperCase()) {
      toast.error('Current code does not match');
      return;
    }
    setResetting(true);
    const newCode = generateInviteCode();
    const { error } = await supabase.from('video_rooms').update({ invite_code: newCode }).eq('id', roomId);
    setResetting(false);
    if (error) { toast.error('Failed to reset code'); return; }
    setShowResetConfirm(false);
    setResetConfirmCode('');
    toast.success('New cipher code generated');
  };

  const handleEndCall = async () => {
    await supabase.from('video_rooms').update({ is_active: false }).eq('id', roomId);
    toast.success('Call ended for everyone');
    onEndCall?.();
  };

  const isCodedRoom = roomType !== 'confession';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 w-full sm:w-[380px] bg-background border-l border-border/40 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border/30">
          <SheetTitle className="text-sm flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            Host Controls
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Invite Code Section */}
          {isCodedRoom && inviteCode && (
            <div className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                  Cipher Code
                </p>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px]" onClick={copyCode}>
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="bg-secondary/60 rounded-lg px-4 py-3 text-center">
                <p className="text-xl font-mono font-bold tracking-[0.4em] text-primary">{inviteCode}</p>
              </div>
              
              <AnimatePresence>
                {showResetConfirm ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <p className="text-[10px] text-destructive font-medium">
                      ⚠️ This will generate a new code and disconnect all participants.
                    </p>
                    <Input
                      value={resetConfirmCode}
                      onChange={(e) => setResetConfirmCode(e.target.value.toUpperCase())}
                      placeholder="Enter current code to confirm"
                      className="h-9 text-xs font-mono text-center tracking-widest bg-secondary/40"
                      maxLength={8}
                    />
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => { setShowResetConfirm(false); setResetConfirmCode(''); }}>
                        Cancel
                      </Button>
                      <Button size="sm" className="flex-1 h-8 text-xs bg-destructive/90 hover:bg-destructive gap-1" onClick={handleResetCode} disabled={resetting}>
                        {resetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Confirm Reset
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5 border-border/40" onClick={() => setShowResetConfirm(true)}>
                    <RefreshCw className="h-3 w-3" />
                    Reset Cipher Code
                  </Button>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Room Controls */}
          <div className="glass rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold">Room Controls</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn('h-9 text-xs gap-1.5', isLocked && 'border-destructive/40 text-destructive')}
                onClick={toggleLock}
                disabled={lockLoading}
              >
                {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                {isLocked ? 'Locked' : 'Unlocked'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-3 w-3" />
                End Call
              </Button>
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* Participants */}
          <div className="space-y-2">
            <p className="text-xs font-semibold">Participants · {participants.length}</p>
            <div className="space-y-1">
              {participants.map((p) => (
                <div key={p.identity} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 group">
                  <CipherAvatar id={p.identity} size={28} pulse={p.isSpeaking} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate">{shortName(p.identity)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.isLocal ? 'Host (you)' : 'Participant'}
                    </p>
                  </div>
                  {!p.isLocal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                      onClick={() => onKickParticipant?.(p.identity)}
                      title="Remove"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
