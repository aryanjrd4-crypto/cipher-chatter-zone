import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useIdentityStore } from '@/stores/useIdentityStore';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';

const CATEGORIES = ['general', 'thoughts', 'questions', 'stories', 'rants'];

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('posts').insert({
      anonymous_id: anonymousId,
      title: title.trim(),
      content: content.trim() || null,
      category,
    });

    if (error) {
      toast.error('Failed to create post');
    } else {
      toast.success('Post created');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div>
          <h1 className="text-xl font-semibold text-foreground">Create Echo</h1>
          <p className="text-sm text-muted-foreground mt-1">Share your thoughts anonymously</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="bg-secondary/50 border-border/50 text-base"
            maxLength={300}
          />

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? (optional)"
            className="min-h-[150px] bg-secondary/50 border-border/50 text-sm leading-relaxed resize-none"
          />

          <Button type="submit" disabled={!title.trim() || loading} className="w-full gap-2">
            <Send className="h-4 w-4" />
            {loading ? 'Posting...' : 'Post Anonymously'}
          </Button>
        </form>
      </motion.div>
    </Layout>
  );
}
