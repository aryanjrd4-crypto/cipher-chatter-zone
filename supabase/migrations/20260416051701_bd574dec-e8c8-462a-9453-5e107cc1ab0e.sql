
-- Add view_count and share_count to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0;

-- Create post_views table
CREATE TABLE public.post_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  anonymous_id text NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX idx_post_views_anonymous_id ON public.post_views(anonymous_id);
CREATE INDEX idx_post_views_viewed_at ON public.post_views(viewed_at);
CREATE UNIQUE INDEX idx_post_views_unique_session ON public.post_views(post_id, anonymous_id);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read post views" ON public.post_views FOR SELECT USING (true);
CREATE POLICY "Anyone can create post views" ON public.post_views FOR INSERT WITH CHECK (true);

-- Create post_shares table
CREATE TABLE public.post_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  anonymous_id text NOT NULL,
  shared_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_shares_post_id ON public.post_shares(post_id);

ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read post shares" ON public.post_shares FOR SELECT USING (true);
CREATE POLICY "Anyone can create post shares" ON public.post_shares FOR INSERT WITH CHECK (true);
