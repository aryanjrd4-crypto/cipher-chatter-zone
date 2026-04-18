import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { toast } from 'sonner';

const REASONS = ['Spam', 'Harassment', 'Hate speech', 'Misinformation', 'Other'];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  postId: string;
}

export function ReportDialog({ open, onOpenChange, postId }: ReportDialogProps) {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      anonymous_id: anonymousId,
      post_id: postId,
      reason,
      details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Could not submit report');
    } else {
      toast.success('Report submitted anonymously');
      setReason('');
      setDetails('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-glass-border">
        <DialogHeader>
          <DialogTitle>Report this post</DialogTitle>
          <DialogDescription>
            Your report stays anonymous. Tell us what's wrong.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  reason === r
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-secondary text-secondary-foreground border-transparent hover:border-primary/20'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Optional details..."
            className="min-h-[80px] bg-secondary/50 border-border/50 text-sm rounded-xl"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!reason || submitting}>
            {submitting ? 'Sending...' : 'Submit report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
