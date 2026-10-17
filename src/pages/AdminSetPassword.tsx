import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { isApprovedAdminEmail } from '@/lib/admin-access';

export default function AdminSetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const linkType = new URLSearchParams(window.location.hash.slice(1)).get('type');
  const validLink = linkType === 'invite' || linkType === 'recovery';

  const savePassword = async () => {
    if (!validLink) {
      toast.error('This secure link is invalid or expired. Request a new email link.');
      return;
    }
    if (password.length < 12) {
      toast.error('Choose a password with at least 12 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('The passwords do not match.');
      return;
    }
    setBusy(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user || !isApprovedAdminEmail(userData.user.email)) {
      await supabase.auth.signOut();
      toast.error('This setup link is not valid for the admin account. Request a new link.');
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin');
    if (roleError || !isAdmin) {
      await supabase.auth.signOut();
      toast.error('Admin access is not active for this account.');
      setBusy(false);
      return;
    }
    toast.success('Admin account secured.');
    navigate('/admin', { replace: true });
    setBusy(false);
  };

  return (
    <main className="min-h-screen bg-background bg-mesh flex items-center justify-center p-4">
      <section className="glass-strong float-3d w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-6">
        <header className="space-y-3 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Secure admin access</h1>
            <p className="mt-1 text-sm text-muted-foreground">Set a private password for the approved admin account.</p>
          </div>
        </header>
        <div className="space-y-3">
          {!validLink && <p role="alert" className="text-center text-xs text-destructive">Secure link invalid or expired. Request a new email link from Cipher Admin.</p>}
          <Input aria-label="New password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" />
          <Input aria-label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Confirm password" onKeyDown={(event) => event.key === 'Enter' && void savePassword()} />
          <Button className="w-full gap-2" onClick={() => void savePassword()} disabled={!validLink || !password || !confirm || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Set password
          </Button>
        </div>
      </section>
    </main>
  );
}