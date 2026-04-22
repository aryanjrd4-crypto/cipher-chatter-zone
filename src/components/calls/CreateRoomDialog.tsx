import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Mic, Sparkles, Copy, Check, ShieldCheck } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { toast } from 'sonner';

interface Props {
  kind: 'voice' | 'video';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUGGESTED_NAMES = {
  voice: ['Whisper Lounge', 'Midnight Frequencies', 'Static Confessions', 'Encrypted Echo'],
  video: ['Visual Cipher', 'Anonymous Lens', 'Pixelated Truths', 'Cipher Camera'],
};

const VIDEO_ROOM_TYPES = [
  { value: 'confession', label: '🔓 Confession Room', desc: 'Open join — no code needed' },
  { value: 'deep-talks', label: '🧠 Deep Talks', desc: 'Code-protected' },
  { value: 'advice', label: '💡 Advice', desc: 'Code-protected' },
  { value: 'cyber-meetup', label: '🤝 Cyber Meetup', desc: 'Code-protected' },
  { value: 'standard', label: '🔒 Standard', desc: 'Code-protected' },
];

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function CreateRoomDialog({ kind, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { anonymousId } = useIdentityStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [roomType, setRoomType] = useState('standard');
  const [maxParticipants, setMaxParticipants] = useState(kind === 'voice' ? 8 : 6);
  const [isPublic, setIsPublic] = useState(true);
  const [cameraRequired, setCameraRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isVideo = kind === 'video';
  const Icon = isVideo ? Camera : Mic;
  const accent = isVideo ? 'accent' : 'primary';
  const isConfession = roomType === 'confession';

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Give your room a mysterious name');
      return;
    }
    setSubmitting(true);
    try {
      const table = isVideo ? 'video_rooms' : 'voice_rooms';
      const inviteCode = isVideo && !isConfession ? generateInviteCode() : null;
      const payload: any = {
        name: name.trim().slice(0, 80),
        description: description.trim().slice(0, 200) || null,
        category,
        max_participants: maxParticipants,
        host_anonymous_id: anonymousId,
        is_public: isPublic,
      };
      if (isVideo) {
        payload.camera_required = cameraRequired;
        payload.room_type = roomType;
        payload.invite_code = inviteCode;
      }

      const { data, error } = await supabase.from(table).insert(payload).select('id').single();
      if (error) throw error;

      if (inviteCode) {
        // Show the code to host before navigating
        setGeneratedCode(inviteCode);
        // Store in sessionStorage so the host can bypass the code modal
        sessionStorage.setItem(`cipher_host_${data.id}`, anonymousId);
        // Navigate after a brief moment so host can see code
        setTimeout(() => {
          onOpenChange(false);
          setGeneratedCode(null);
          navigate(`/${isVideo ? 'video' : 'voice'}/${data.id}`);
        }, 100);
      } else {
        toast.success(`${isVideo ? 'Video' : 'Voice'} room created`);
        if (isVideo) sessionStorage.setItem(`cipher_host_${data.id}`, anonymousId);
        onOpenChange(false);
        navigate(`/${isVideo ? 'video' : 'voice'}/${data.id}`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Code copied — share it secretly');
  };

  // If code was generated, show it
  if (generatedCode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-strong max-w-sm">
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_30px_hsl(190,95%,55%,0.3)]">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Your Cipher Code</h3>
              <p className="text-xs text-muted-foreground mt-1">Share this code with people you want to invite. Only they can join.</p>
            </div>
            <div className="bg-secondary/60 rounded-xl px-6 py-4 w-full">
              <p className="text-2xl font-mono font-bold tracking-[0.4em] text-primary">{generatedCode}</p>
            </div>
            <Button onClick={copyCode} variant="outline" className="gap-2">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
            <p className="text-[10px] text-muted-foreground">Entering room automatically...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Icon className={`h-5 w-5 text-${accent}`} />
            New {isVideo ? 'Video' : 'Voice'} Room
          </DialogTitle>
          <DialogDescription className="text-xs">
            Spin up an anonymous {isVideo ? 'video' : 'voice'} lounge. No names, no recordings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="room-name" className="text-xs">Room name</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={SUGGESTED_NAMES[kind][Math.floor(Math.random() * 4)]}
              maxLength={80}
              className="bg-secondary/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="room-desc" className="text-xs">Topic / description</Label>
            <Textarea
              id="room-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this room about?"
              maxLength={200}
              rows={2}
              className="bg-secondary/40 resize-none"
            />
          </div>

          {isVideo && (
            <div className="space-y-1.5">
              <Label className="text-xs">Room Type</Label>
              <Select value={roomType} onValueChange={setRoomType}>
                <SelectTrigger className="bg-secondary/40 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_ROOM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        {t.label}
                        <span className="text-[10px] text-muted-foreground">— {t.desc}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isConfession && (
                <p className="text-[10px] text-primary/80 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  An 8-char cipher code will be auto-generated for this room
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary/40 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="stories">Stories</SelectItem>
                  <SelectItem value="thoughts">Thoughts</SelectItem>
                  <SelectItem value="rants">Rants</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max participants · {maxParticipants}</Label>
              <Slider
                value={[maxParticipants]}
                onValueChange={(v) => setMaxParticipants(v[0])}
                min={2}
                max={isVideo ? 8 : 12}
                step={1}
                className="py-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium">Public room</p>
              <p className="text-[10px] text-muted-foreground">
                {isPublic ? 'Anyone can discover and join' : 'Invite link only'}
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {isVideo && (
            <div className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2.5">
              <div>
                <p className="text-xs font-medium">Camera required</p>
                <p className="text-[10px] text-muted-foreground">
                  {cameraRequired ? 'Everyone must enable camera' : 'Camera optional, avatar fallback'}
                </p>
              </div>
              <Switch checked={cameraRequired} onCheckedChange={setCameraRequired} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className={isVideo
              ? 'bg-accent/90 hover:bg-accent text-accent-foreground shadow-[0_0_24px_hsl(270,80%,65%,0.35)]'
              : 'bg-primary/90 hover:bg-primary text-primary-foreground shadow-[0_0_24px_hsl(190,95%,55%,0.35)]'}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Create & Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
