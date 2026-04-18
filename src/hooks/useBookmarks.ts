import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { toast } from 'sonner';

export function useBookmarks() {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const queryClient = useQueryClient();

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks', anonymousId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('anonymous_id', anonymousId);
      if (error) throw error;
      return data;
    },
  });

  const bookmarkedIds = new Set(bookmarks.map((b) => b.post_id));

  const toggleBookmark = async (postId: string) => {
    if (bookmarkedIds.has(postId)) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('anonymous_id', anonymousId)
        .eq('post_id', postId);
      toast.success('Removed from saved');
    } else {
      await supabase
        .from('bookmarks')
        .insert({ anonymous_id: anonymousId, post_id: postId });
      toast.success('Saved');
    }
    queryClient.invalidateQueries({ queryKey: ['bookmarks', anonymousId] });
    queryClient.invalidateQueries({ queryKey: ['bookmarked-posts', anonymousId] });
  };

  return { bookmarkedIds, toggleBookmark };
}

export function useBookmarkedPosts() {
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  return useQuery({
    queryKey: ['bookmarked-posts', anonymousId],
    queryFn: async () => {
      const { data: bms } = await supabase
        .from('bookmarks')
        .select('post_id, created_at')
        .eq('anonymous_id', anonymousId)
        .order('created_at', { ascending: false });
      if (!bms || bms.length === 0) return [];
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .in('id', bms.map((b) => b.post_id));
      return posts || [];
    },
  });
}
