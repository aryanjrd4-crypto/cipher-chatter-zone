DROP POLICY IF EXISTS "Anyone can delete posts" ON public.posts;
CREATE POLICY "Admins can delete any post" ON public.posts FOR DELETE TO authenticated USING (public.is_admin());
REVOKE DELETE ON public.posts FROM anon;
GRANT DELETE ON public.posts TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_own_post(p_post_id uuid, p_anonymous_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_post_id IS NULL OR p_anonymous_id IS NULL OR length(p_anonymous_id) > 80 THEN
    RETURN false;
  END IF;
  DELETE FROM public.posts WHERE id = p_post_id AND anonymous_id = p_anonymous_id;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_own_post(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_post(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_analytics_summary()
RETURNS TABLE(total_posts bigint, total_views bigint, total_site_visits bigint, visits_24h bigint, unique_visitors bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.posts)::bigint,
    (SELECT coalesce(sum(p.view_count), 0) FROM public.posts p)::bigint,
    (SELECT count(*) FROM public.site_visits)::bigint,
    (SELECT count(*) FROM public.site_visits s WHERE s.visited_at >= now() - interval '24 hours')::bigint,
    (SELECT count(DISTINCT s.anonymous_id) FROM public.site_visits s)::bigint;
END;
$$;
REVOKE ALL ON FUNCTION public.get_admin_analytics_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics_summary() TO authenticated;

REVOKE SELECT ON public.post_views FROM anon, authenticated;
GRANT SELECT ON public.post_views TO authenticated;
DROP POLICY IF EXISTS "Admins can read legacy post views" ON public.post_views;
CREATE POLICY "Admins can read legacy post views" ON public.post_views FOR SELECT TO authenticated USING (public.is_admin());