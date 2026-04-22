
-- Add new columns to video_rooms
ALTER TABLE public.video_rooms
  ADD COLUMN room_type text NOT NULL DEFAULT 'standard',
  ADD COLUMN invite_code text,
  ADD COLUMN is_locked boolean NOT NULL DEFAULT false;

-- Create admin_actions audit log table
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  target_room_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read admin actions" ON public.admin_actions FOR SELECT USING (true);
CREATE POLICY "Anyone can create admin actions" ON public.admin_actions FOR INSERT WITH CHECK (true);
