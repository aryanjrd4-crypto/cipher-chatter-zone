import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';

export function useShareTracking() {
  const anonymousId = useIdentityStore((s) => s.anonymousId);

  const trackShare = async (postId: string) => {
    await supabase.from('post_shares').insert({ post_id: postId, anonymous_id: anonymousId });
    const { data } = await supabase.from('posts').select('share_count').eq('id', postId).single();
    if (data) {
      await supabase.from('posts').update({ share_count: data.share_count + 1 }).eq('id', postId);
    }
  };

  return { trackShare };
}
