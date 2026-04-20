import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Mic, Sparkles } from 'lucide-react';
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

export function CreateRoomDialog({ kind, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { anonymousId } = useIdentityStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [maxParticipants, setMaxParticipants] = useState(kind === 'voice' ? 8 : 6);
  const [isPublic, setIsPublic] = useState(true);
  const [cameraRequired, setCameraRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isVideo = kind === 'video';
  const Icon = isVideo ? Camera : Mic;
  const accent = isVideo ? 'accent' : 'primary';

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Give your room a mysterious name');
      return;
    }
    setSubmitting(true);
    try {
      const table = isVideo ? 'video_rooms' : 'voice_rooms';
      const payload: any = {
        name: name.trim().slice(0, 80),
        description: description.trim().slice(0, 200) || null,
        category,
        max_participants: maxParticipants,
        host_anonymous_id: anonymousId,
        is_public: isPublic,
      };
      if (isVideo) payload.camera_required = cameraRequired;

      const { data, error } = await supabase.from(table).insert(payload).select('id').single();
      if (error) throw error;

      toast.success(`${isVideo ? 'Video' : 'Voice'} room created`);
      onOpenChange(false);
      navigate(`/${isVideo ? 'video' : 'voice'}/${data.id}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

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
