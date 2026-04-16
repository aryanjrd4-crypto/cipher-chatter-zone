
-- Reactions table for emoji reactions on posts/comments
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  anonymous_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_post_reaction UNIQUE (post_id, anonymous_id, emoji),
  CONSTRAINT unique_comment_reaction UNIQUE (comment_id, anonymous_id, emoji),
  CONSTRAINT reaction_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Anyone can create reactions" ON public.reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete reactions" ON public.reactions FOR DELETE USING (true);

CREATE INDEX idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX idx_reactions_comment_id ON public.reactions(comment_id);

-- Chat rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat rooms" ON public.chat_rooms FOR SELECT USING (true);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  anonymous_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  has_effect TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete own chat messages" ON public.chat_messages FOR DELETE USING (true);

CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_parent_id ON public.chat_messages(parent_id);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Insert default chat rooms
INSERT INTO public.chat_rooms (name, description) VALUES 
  ('General', 'Main discussion channel'),
  ('Random', 'Off-topic conversations'),
  ('Whispers', 'Secret conversations');
