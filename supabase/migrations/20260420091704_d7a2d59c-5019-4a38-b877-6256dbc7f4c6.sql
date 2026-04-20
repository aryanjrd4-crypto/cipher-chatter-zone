-- Voice rooms (audio-only)
CREATE TABLE public.voice_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  max_participants INT NOT NULL DEFAULT 8,
  host_anonymous_id TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read voice rooms" ON public.voice_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create voice rooms" ON public.voice_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete voice rooms" ON public.voice_rooms FOR DELETE USING (true);
CREATE POLICY "Anyone can update voice rooms" ON public.voice_rooms FOR UPDATE USING (true);

-- Video rooms
CREATE TABLE public.video_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  max_participants INT NOT NULL DEFAULT 6,
  host_anonymous_id TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  camera_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read video rooms" ON public.video_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create video rooms" ON public.video_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete video rooms" ON public.video_rooms FOR DELETE USING (true);
CREATE POLICY "Anyone can update video rooms" ON public.video_rooms FOR UPDATE USING (true);

-- Seed voice rooms
INSERT INTO public.voice_rooms (name, description, category, max_participants, host_anonymous_id) VALUES
  ('Whisper Lounge', 'Late-night low-key voice chat. Speak softly, the cipher listens.', 'general', 8, 'system'),
  ('Confession Booth', 'Anonymous voice confessions. No judgement, no record.', 'stories', 6, 'system'),
  ('Cyber Deep Talks', 'Voice-only philosophy and tech tangents.', 'thoughts', 8, 'system'),
  ('Rant Radio', 'Mic on, vent it out, cipher resets every hour.', 'rants', 8, 'system');

-- Seed video rooms
INSERT INTO public.video_rooms (name, description, category, max_participants, host_anonymous_id, camera_required) VALUES
  ('Anonymous Face Confessions', 'Camera optional. Share what you cannot say in text.', 'stories', 6, 'system', false),
  ('Visual Story Sharing', 'Show, don''t tell. Anonymous video storytelling.', 'stories', 6, 'system', false),
  ('Cyber Deep Talks · Video', 'Big questions. Pixelated faces. Real conversations.', 'thoughts', 5, 'system', false),
  ('Random Video Meet', 'Drop in, meet a stranger, vanish.', 'random', 4, 'system', false);