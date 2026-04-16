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
import { ArrowLeft, Send, Lock } from 'lucide-react';

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
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Create Cipher Post
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your identity is encrypted. Share freely.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-primary/15 text-primary border border-primary/25'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="bg-secondary/50 border-border/50 text-base rounded-xl" maxLength={300} />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's on your mind? (optional)" className="min-h-[150px] bg-secondary/50 border-border/50 text-sm leading-relaxed resize-none rounded-xl" />

          <Button type="submit" disabled={!title.trim() || loading} className="w-full gap-2 bg-primary/90 hover:bg-primary shadow-[0_0_20px_hsl(190,95%,55%,0.15)]">
            <Send className="h-4 w-4" />
            {loading ? 'Encrypting...' : 'Post Anonymously'}
          </Button>
        </form>
      </motion.div>
    </Layout>
  );
}
