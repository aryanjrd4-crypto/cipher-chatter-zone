import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';

const viewedThisSession = new Set<string>();

export function useViewTracking(postId: string | undefined) {
  const anonymousId = useIdentityStore((s) => s.anonymousId);

  useEffect(() => {
    if (!postId || viewedThisSession.has(postId)) return;
    viewedThisSession.add(postId);

    const track = async () => {
      // Upsert view (unique constraint on post_id + anonymous_id prevents duplicates)
      const { error } = await supabase.from('post_views').upsert(
        { post_id: postId, anonymous_id: anonymousId },
        { onConflict: 'post_id,anonymous_id' }
      );
      if (!error) {
        // Increment view_count on post
        const { data } = await supabase.from('posts').select('view_count').eq('id', postId).single();
        if (data) {
          await supabase.from('posts').update({ view_count: data.view_count + 1 }).eq('id', postId);
        }
      }
    };
    track();
  }, [postId, anonymousId]);
}
