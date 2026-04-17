
-- Storage bucket for chat images
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view chat media"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

CREATE POLICY "Anyone can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Anyone can delete own chat media"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-media');

-- Add image_url to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS image_url text;

-- Read receipts table
CREATE TABLE IF NOT EXISTS public.message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  anonymous_id text NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, anonymous_id)
);

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read message reads" ON public.message_reads FOR SELECT USING (true);
CREATE POLICY "Anyone can create message reads" ON public.message_reads FOR INSERT WITH CHECK (true);

-- Presence table for online/typing
CREATE TABLE IF NOT EXISTS public.room_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  anonymous_id text NOT NULL,
  is_typing boolean NOT NULL DEFAULT false,
  last_seen timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, anonymous_id)
);

ALTER TABLE public.room_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read presence" ON public.room_presence FOR SELECT USING (true);
CREATE POLICY "Anyone can upsert presence" ON public.room_presence FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update presence" ON public.room_presence FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete presence" ON public.room_presence FOR DELETE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
