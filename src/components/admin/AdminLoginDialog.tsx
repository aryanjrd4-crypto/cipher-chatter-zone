import { useState } from 'react';
import { ShieldCheck, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Default admin password — change in production
const ADMIN_PASSWORD = 'CIPHER-ADMIN-2026';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}

export function AdminLoginDialog({ open, onOpenChange, onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(false);
    // simulate verification delay
    await new Promise((r) => setTimeout(r, 600));
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('cipher_admin', 'true');
      toast.success('Admin access granted');
      onLogin();
      onOpenChange(false);
      setPassword('');
    } else {
      setError(true);
      toast.error('Invalid admin credentials');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Cipher Admin Login
          </DialogTitle>
          <DialogDescription className="text-xs">
            Enter the master password to access admin controls.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Master password"
              className={cn(
                'h-11 pl-10 pr-10 bg-secondary/40 font-mono',
                error && 'border-destructive/60 animate-shake'
              )}
            />
            <button
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-destructive text-center"
            >
              Access denied — invalid credentials
            </motion.p>
          )}

          <Button
            onClick={handleLogin}
            disabled={!password || loading}
            className="w-full h-10 gap-2 bg-primary/90 hover:bg-primary shadow-[0_0_24px_hsl(190,95%,55%,0.3)]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Authenticate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
