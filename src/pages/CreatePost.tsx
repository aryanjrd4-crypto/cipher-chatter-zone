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
import { ArrowLeft, Send, Lock, Image as ImageIcon, X } from 'lucide-react';

const CATEGORIES = ['general', 'thoughts', 'questions', 'stories', 'rants', 'random'];
const MOODS = [
  { id: 'confession', label: '🤫 Confession' },
  { id: 'vent', label: '😤 Vent' },
  { id: 'celebration', label: '🎉 Win' },
  { id: 'question', label: '❓ Asking' },
  { id: 'shower-thought', label: '💭 Shower thought' },
  { id: 'hot-take', label: '🔥 Hot take' },
];

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [moods, setMoods] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const anonymousId = useIdentityStore((s) => s.anonymousId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `posts/${anonymousId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('chat-media').upload(path, file);
    if (error) {
      toast.error('Image upload failed');
    } else {
      const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
      setImageUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const toggleMood = (id: string) => {
    setMoods((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const moodTags = moods.length ? `\n\n${moods.map((m) => `#${m}`).join(' ')}` : '';
    const imgMd = imageUrl ? `\n\n![image](${imageUrl})` : '';
    const finalContent = `${content.trim()}${imgMd}${moodTags}`.trim() || null;

    const { error } = await supabase.from('posts').insert({
      anonymous_id: anonymousId,
      title: title.trim(),
      content: finalContent,
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
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Category</p>
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
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Mood (optional)</p>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map((m) => {
                const active = moods.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMood(m.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      active
                        ? 'bg-accent/15 text-accent border-accent/30'
                        : 'bg-secondary text-secondary-foreground border-transparent hover:border-accent/20'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="bg-secondary/50 border-border/50 text-base rounded-xl" maxLength={300} />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's on your mind? (optional)" className="min-h-[150px] bg-secondary/50 border-border/50 text-sm leading-relaxed resize-none rounded-xl" />

          {imageUrl && (
            <div className="relative inline-block">
              <img src={imageUrl} alt="upload" className="rounded-xl max-h-48 border border-border/40" />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/40">
              <ImageIcon className="h-3.5 w-3.5" />
              {uploading ? 'Uploading…' : 'Add image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              />
            </label>
          </div>

          <Button type="submit" disabled={!title.trim() || loading} className="w-full gap-2 bg-primary/90 hover:bg-primary shadow-[0_0_20px_hsl(190,95%,55%,0.15)]">
            <Send className="h-4 w-4" />
            {loading ? 'Encrypting...' : 'Post Anonymously'}
          </Button>
        </form>
      </motion.div>
    </Layout>
  );
}
