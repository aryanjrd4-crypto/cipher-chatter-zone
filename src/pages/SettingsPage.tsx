import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { AnonAvatar } from '@/components/chat/AnonAvatar';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { RefreshCw, Shield, ArrowLeft, Lock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { anonymousId, resetIdentity } = useIdentityStore();
  const navigate = useNavigate();

  const handleReset = () => {
    resetIdentity();
    toast.success('New cipher identity created.');
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Cipher Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your anonymous cipher identity</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <AnonAvatar id={anonymousId} size={48} />
            <div>
              <p className="text-sm font-semibold text-foreground">Anonymous Cipher</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{anonymousId.slice(0, 8)}...{anonymousId.slice(-4)}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/30">
            <Button variant="destructive" onClick={handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset Identity
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Creates a completely new cipher. Your previous posts will no longer be linked to you.
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Privacy & Security</h2>
          </div>
          <ul className="space-y-2.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <Eye className="h-3.5 w-3.5 mt-0.5 text-primary/60 shrink-0" />
              No email, no password, no personal data collected
            </li>
            <li className="flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 mt-0.5 text-primary/60 shrink-0" />
              Your identity is a random cipher stored only on your device
            </li>
            <li className="flex items-start gap-2">
              <RefreshCw className="h-3.5 w-3.5 mt-0.5 text-primary/60 shrink-0" />
              Reset anytime to become a completely new identity
            </li>
          </ul>
        </div>
      </motion.div>
    </Layout>
  );
}
