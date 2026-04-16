
-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anonymous_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  anonymous_id TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anonymous_id TEXT NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(anonymous_id, post_id),
  UNIQUE(anonymous_id, comment_id)
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Anyone can read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Anyone can create posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update posts" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete posts" ON public.posts FOR DELETE USING (true);

-- Comments policies
CREATE POLICY "Anyone can read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete comments" ON public.comments FOR DELETE USING (true);

-- Votes policies
CREATE POLICY "Anyone can read votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Anyone can create votes" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update votes" ON public.votes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete votes" ON public.votes FOR DELETE USING (true);

-- Indexes
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_votes_anonymous_post ON public.votes(anonymous_id, post_id);
CREATE INDEX idx_votes_anonymous_comment ON public.votes(anonymous_id, comment_id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
