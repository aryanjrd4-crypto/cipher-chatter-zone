CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_auth_user_profile_and_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  IF lower(coalesce(NEW.email, '')) = 'aryanjrd4@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_profile_and_admin_role_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_profile_and_role();
CREATE TRIGGER create_profile_and_admin_role_on_email_update
AFTER UPDATE OF email, email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_profile_and_role();

CREATE TABLE public.post_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  anonymous_id text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.post_view_events TO authenticated;
GRANT ALL ON public.post_view_events TO service_role;
ALTER TABLE public.post_view_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read post view events" ON public.post_view_events FOR SELECT TO authenticated USING (public.is_admin());
CREATE INDEX post_view_events_post_viewed_at_idx ON public.post_view_events (post_id, viewed_at DESC);
CREATE INDEX post_view_events_viewed_at_idx ON public.post_view_events (viewed_at DESC);

CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id text NOT NULL,
  path text NOT NULL,
  visited_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read site visits" ON public.site_visits FOR SELECT TO authenticated USING (public.is_admin());
CREATE INDEX site_visits_visited_at_idx ON public.site_visits (visited_at DESC);
CREATE INDEX site_visits_anonymous_id_idx ON public.site_visits (anonymous_id, visited_at DESC);

CREATE TABLE public.admin_invite_limits (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_sent_at timestamptz NOT NULL DEFAULT '-infinity'::timestamptz
);
GRANT ALL ON public.admin_invite_limits TO service_role;
ALTER TABLE public.admin_invite_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reserve_admin_invite()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE reserved_id smallint;
BEGIN
  INSERT INTO public.admin_invite_limits (id, last_sent_at)
  VALUES (1, now())
  ON CONFLICT (id) DO UPDATE
    SET last_sent_at = now()
    WHERE public.admin_invite_limits.last_sent_at < now() - interval '10 minutes'
  RETURNING id INTO reserved_id;
  RETURN reserved_id IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_admin_invite() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_admin_invite() TO service_role;

CREATE OR REPLACE FUNCTION public.record_site_visit(p_anonymous_id text, p_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_anonymous_id IS NULL OR length(p_anonymous_id) > 80 OR p_path IS NULL OR length(p_path) > 300 OR left(p_path, 1) <> '/' OR position('?' in p_path) > 0 THEN
    RAISE EXCEPTION 'Invalid visit record';
  END IF;
  INSERT INTO public.site_visits (anonymous_id, path) VALUES (p_anonymous_id, p_path);
END;
$$;
REVOKE ALL ON FUNCTION public.record_site_visit(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_site_visit(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_post_view(p_post_id uuid, p_anonymous_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_post_id IS NULL OR p_anonymous_id IS NULL OR length(p_anonymous_id) > 80 THEN
    RAISE EXCEPTION 'Invalid post view';
  END IF;
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = p_post_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  INSERT INTO public.post_view_events (post_id, anonymous_id) VALUES (p_post_id, p_anonymous_id);
END;
$$;
REVOKE ALL ON FUNCTION public.record_post_view(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_post_view(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_post_analytics(p_post_id uuid)
RETURNS TABLE(total_views bigint, unique_viewers bigint, views_24h bigint, views_7d bigint, total_shares bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    coalesce(p.view_count, 0)::bigint,
    (SELECT count(DISTINCT v.anonymous_id)::bigint FROM (
      SELECT pv.anonymous_id FROM public.post_views pv WHERE pv.post_id = p_post_id
      UNION ALL
      SELECT ev.anonymous_id FROM public.post_view_events ev WHERE ev.post_id = p_post_id
    ) v),
    ((SELECT count(*) FROM public.post_view_events ev WHERE ev.post_id = p_post_id AND ev.viewed_at >= now() - interval '24 hours') +
      (SELECT count(*) FROM public.post_views pv WHERE pv.post_id = p_post_id AND pv.viewed_at >= now() - interval '24 hours'))::bigint,
    ((SELECT count(*) FROM public.post_view_events ev WHERE ev.post_id = p_post_id AND ev.viewed_at >= now() - interval '7 days') +
      (SELECT count(*) FROM public.post_views pv WHERE pv.post_id = p_post_id AND pv.viewed_at >= now() - interval '7 days'))::bigint,
    (SELECT count(*) FROM public.post_shares ps WHERE ps.post_id = p_post_id)::bigint
  FROM public.posts p
  WHERE p.id = p_post_id;
$$;
REVOKE ALL ON FUNCTION public.get_post_analytics(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_post_analytics(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_post_view_timeline(p_post_id uuid)
RETURNS TABLE(view_date date, views bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.view_date, count(*)::bigint
  FROM (
    SELECT (pv.viewed_at AT TIME ZONE 'UTC')::date AS view_date FROM public.post_views pv WHERE pv.post_id = p_post_id
    UNION ALL
    SELECT (ev.viewed_at AT TIME ZONE 'UTC')::date AS view_date FROM public.post_view_events ev WHERE ev.post_id = p_post_id
  ) v
  GROUP BY v.view_date
  ORDER BY v.view_date;
$$;
REVOKE ALL ON FUNCTION public.get_post_view_timeline(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_post_view_timeline(uuid) TO anon, authenticated;

ALTER TABLE public.admin_actions ADD COLUMN target_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;
CREATE INDEX admin_actions_created_at_idx ON public.admin_actions (created_at DESC);
DROP POLICY IF EXISTS "Anyone can read admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Anyone can create admin actions" ON public.admin_actions;
REVOKE ALL ON public.admin_actions FROM anon, authenticated;
GRANT SELECT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
CREATE POLICY "Admins can read admin actions" ON public.admin_actions FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.record_admin_action(p_action_type text, p_target_room_id uuid DEFAULT NULL, p_target_post_id uuid DEFAULT NULL, p_details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  INSERT INTO public.admin_actions (action_type, target_room_id, target_post_id, details)
  VALUES (left(coalesce(p_action_type, 'admin_action'), 80), p_target_room_id, p_target_post_id, coalesce(p_details, '{}'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.record_admin_action(text, uuid, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_admin_action(text, uuid, uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_post(p_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE post_title text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  SELECT title INTO post_title FROM public.posts WHERE id = p_post_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  DELETE FROM public.posts WHERE id = p_post_id;
  INSERT INTO public.admin_actions (action_type, target_post_id, details)
  VALUES ('delete_post', p_post_id, jsonb_build_object('title', post_title));
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_post(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_post(uuid) TO authenticated;

DROP POLICY IF EXISTS "Anyone can read post views" ON public.post_views;
DROP POLICY IF EXISTS "Anyone can create post views" ON public.post_views;
REVOKE ALL ON public.post_views FROM anon, authenticated;
GRANT SELECT ON public.post_views TO authenticated;
CREATE POLICY "Admins can read legacy post views" ON public.post_views FOR SELECT TO authenticated USING (public.is_admin());