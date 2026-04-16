import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { Ghost, RefreshCw, Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { anonymousId, resetIdentity } = useIdentityStore();
  const navigate = useNavigate();

  const handleReset = () => {
    resetIdentity();
    toast.success('New identity created. You are now someone else.');
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your anonymous identity</p>
        </div>

        <div className="glass rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Ghost className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Anonymous Identity</p>
              <p className="text-xs text-muted-foreground font-mono">{anonymousId.slice(0, 8)}...{anonymousId.slice(-4)}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-border/50">
            <Button variant="destructive" onClick={handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset Identity
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This creates a completely new identity. Your previous posts will no longer be linked to you.
            </p>
          </div>
        </div>

        <div className="glass rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">Privacy</h2>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>• No email, no password, no personal data collected</li>
            <li>• Your identity is a random ID stored only on your device</li>
            <li>• Reset anytime to become a completely new person</li>
            <li>• No tracking, no analytics, no cookies beyond identity</li>
          </ul>
        </div>
      </motion.div>
    </Layout>
  );
}
