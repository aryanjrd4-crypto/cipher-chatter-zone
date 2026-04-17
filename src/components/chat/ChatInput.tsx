import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ImagePlus, X, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatInputProps {
  onSend: (content: string, opts: { effect: string | null; imageUrl: string | null }) => Promise<void>;
  onTyping: () => void;
  disabled?: boolean;
  replyPreview?: { content: string } | null;
  onCancelReply?: () => void;
}

export function ChatInput({ onSend, onTyping, disabled, replyPreview, onCancelReply }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [effect, setEffect] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only images are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('chat-media').upload(path, file);
    if (error) {
      toast.error('Upload failed');
    } else {
      const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
      setPendingImage(data.publicUrl);
    }
    setUploading(false);
  };

  const send = async () => {
    if ((!message.trim() && !pendingImage) || disabled) return;
    setSending(true);
    await onSend(message.trim(), { effect, imageUrl: pendingImage });
    setMessage('');
    setEffect(null);
    setPendingImage(null);
    setSending(false);
  };

  return (
    <div className="border-t border-border/40 bg-background/30 backdrop-blur-xl">
      {/* Reply preview */}
      <AnimatePresence>
        {replyPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 border-b border-border/30 flex items-center gap-2 text-xs bg-secondary/30 overflow-hidden"
          >
            <div className="w-1 self-stretch bg-primary rounded-full" />
            <div className="flex-1 min-w-0">
              <div className="text-primary text-[10px] font-medium uppercase tracking-wider">Replying to</div>
              <div className="truncate text-muted-foreground">{replyPreview.content}</div>
            </div>
            <button className="text-muted-foreground hover:text-foreground" onClick={onCancelReply}>
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image preview */}
      <AnimatePresence>
        {pendingImage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 overflow-hidden"
          >
            <div className="relative inline-block">
              <img src={pendingImage} alt="upload preview" className="h-20 rounded-lg border border-border/40" />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3">
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setEffect(effect === 'glow' ? null : 'glow')}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                effect === 'glow' ? 'bg-primary/15 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Glow effect"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setEffect(effect === 'encrypted' ? null : 'encrypted')}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                effect === 'encrypted' ? 'bg-accent/15 text-accent shadow-[0_0_12px_hsl(var(--accent)/0.3)]' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Encrypted style"
            >
              <Lock className="h-4 w-4" />
            </button>
          </div>

          <input
            value={message}
            onChange={(e) => { setMessage(e.target.value); onTyping(); }}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Send an encrypted message..."
            disabled={disabled}
            className="flex-1 h-10 bg-secondary/50 border border-border/40 rounded-xl px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />

          <Button
            size="icon"
            disabled={(!message.trim() && !pendingImage) || sending || uploading}
            onClick={send}
            className="h-10 w-10 rounded-xl bg-primary/90 hover:bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.25)]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
