import { useState } from 'react';
import { ShieldCheck, Lock, Loader2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { APPROVED_ADMIN_EMAIL } from '@/lib/admin-access';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}

export function AdminLoginDialog({ open, onOpenChange, onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: APPROVED_ADMIN_EMAIL, password });
    if (signInError || !data.user) {
      setError('Sign-in failed. Check the password or request a secure email link.');
      setLoading(false);
      return;
    }
    const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin');
    if (roleError || !isAdmin) {
      await supabase.auth.signOut();
      setError('This account does not have admin access.');
      setLoading(false);
      return;
    }
    toast.success('Admin access granted');
    onLogin();
    onOpenChange(false);
    setPassword('');
    setLoading(false);
  };

  const requestSecureLink = async () => {
    setLoading(true);
    setError('');
    const { error: inviteError } = await supabase.functions.invoke('send-admin-invite', { body: {} });
    if (inviteError) {
      const response = inviteError.context instanceof Response ? await inviteError.context.json().catch(() => null) as { error?: string } | null : null;
      setError(response?.error || 'The secure email could not be sent. Please try again later.');
    } else {
      toast.success('Check the approved admin inbox for a secure setup link.');
    }
    setLoading(false);
  };

  const requestPasswordReset = async () => {
    setLoading(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(APPROVED_ADMIN_EMAIL, {
      redirectTo: `${window.location.origin}/admin/set-password`,
    });
    if (resetError) setError('A recovery email could not be sent. Please try again later.');
    else toast.success('If the admin account is set up, a recovery link is on its way.');
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
            Restricted access for the approved administrator only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex h-11 items-center gap-3 rounded-lg border border-border/50 bg-secondary/40 px-3 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{APPROVED_ADMIN_EMAIL}</span>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
              placeholder="Admin password"
              className="h-11 pl-10 bg-secondary/40 font-mono"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-destructive text-center animate-shake"
            >
              {error}
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
          <Button onClick={requestSecureLink} disabled={loading} variant="outline" className="w-full h-10 gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send secure setup email
          </Button>
          <button type="button" onClick={requestPasswordReset} disabled={loading} className="w-full text-center text-xs text-muted-foreground hover:text-primary disabled:opacity-50">
            Forgot admin password?
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
