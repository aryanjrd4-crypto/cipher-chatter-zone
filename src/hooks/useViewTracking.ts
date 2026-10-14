import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';

export function useViewTracking(postId: string | undefined) {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const trackedPost = useRef<string | null>(null);

  useEffect(() => {
    if (!postId || trackedPost.current === postId) return;
    trackedPost.current = postId;
    void supabase.rpc('record_post_view', { p_post_id: postId, p_anonymous_id: anonymousId });
  }, [postId, anonymousId]);
}
