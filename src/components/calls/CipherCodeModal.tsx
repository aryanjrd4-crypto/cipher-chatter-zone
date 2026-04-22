import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, X, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  roomName: string;
  onSubmit: (code: string) => Promise<boolean>;
  onCancel: () => void;
}

export function CipherCodeModal({ open, roomName, onSubmit, onCancel }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCode('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (code.length < 1 || loading) return;
    setLoading(true);
    setError(false);
    const ok = await onSubmit(code.trim().toUpperCase());
    setLoading(false);
    if (!ok) setError(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          'relative w-full max-w-sm glass-strong rounded-2xl p-6 border border-border/40',
          error && 'animate-shake'
        )}
      >
        <button onClick={onCancel} className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-secondary/40 text-muted-foreground">
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 shadow-[0_0_30px_hsl(190,95%,55%,0.25)]">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Enter Cipher Code</h2>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-foreground/80 font-medium">{roomName}</span> requires an invite code to join.
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
                setError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="X7K9P2MQ"
              maxLength={8}
              className={cn(
                'w-full h-12 rounded-xl bg-secondary/60 border text-center text-lg font-mono tracking-[0.3em] placeholder:tracking-[0.3em] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 transition-all',
                error
                  ? 'border-destructive/60 focus:ring-destructive/40 text-destructive'
                  : 'border-border/40 focus:ring-primary/40 text-foreground'
              )}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-destructive text-center font-medium"
              >
                Invalid Cipher Code — access denied
              </motion.p>
            )}
          </AnimatePresence>

          <Button
            onClick={handleSubmit}
            disabled={code.length < 1 || loading}
            className="w-full h-11 gap-2 bg-primary/90 hover:bg-primary text-primary-foreground shadow-[0_0_24px_hsl(190,95%,55%,0.3)]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Verify & Join
            {!loading && <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-muted-foreground/60">
          <ShieldCheck className="h-3 w-3" />
          Secured with Cipher Code · End-to-end encrypted
        </div>
      </motion.div>
    </div>
  );
}
