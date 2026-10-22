CREATE OR REPLACE FUNCTION public.get_admin_insights()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily jsonb;
  v_hourly jsonb;
  v_pages jsonb;
  v_top_posts jsonb;
  v_posts_daily jsonb;
  v_visitors jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Daily site visits for the last 14 days (UTC days).
  SELECT coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'visits', coalesce(v.visits, 0), 'ciphers', coalesce(v.ciphers, 0)) ORDER BY d.day), '[]'::jsonb)
  INTO v_daily
  FROM generate_series(((now() AT TIME ZONE 'utc')::date - 13), (now() AT TIME ZONE 'utc')::date, interval '1 day') AS d(day)
  LEFT JOIN (
    SELECT (visited_at AT TIME ZONE 'utc')::date AS day, count(*)::int AS visits, count(DISTINCT anonymous_id)::int AS ciphers
    FROM public.site_visits
    GROUP BY 1
  ) v ON v.day = d.day::date;

  -- Visits by UTC hour of day (0-23) so the client can show local peak times.
  SELECT jsonb_agg(jsonb_build_object('hour', h.hour, 'visits', coalesce(v.visits, 0)) ORDER BY h.hour)
  INTO v_hourly
  FROM generate_series(0, 23) AS h(hour)
  LEFT JOIN (
    SELECT extract(hour FROM visited_at)::int AS hour, count(*)::int AS visits
    FROM public.site_visits
    GROUP BY 1
  ) v ON v.hour = h.hour;

  -- Most visited page paths (top 10).
  SELECT coalesce(jsonb_agg(jsonb_build_object('path', p.path, 'visits', p.visits) ORDER BY p.visits DESC), '[]'::jsonb)
  INTO v_pages
  FROM (
    SELECT path, count(*)::int AS visits
    FROM public.site_visits
    GROUP BY path
    ORDER BY count(*) DESC
    LIMIT 10
  ) p;

  -- Most viewed posts (top 5).
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'view_count', t.view_count) ORDER BY t.view_count DESC), '[]'::jsonb)
  INTO v_top_posts
  FROM (
    SELECT id, title, view_count
    FROM public.posts
    ORDER BY view_count DESC
    LIMIT 5
  ) t;

  -- New posts per day for the last 14 days.
  SELECT coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'posts', coalesce(p.posts, 0)) ORDER BY d.day), '[]'::jsonb)
  INTO v_posts_daily
  FROM generate_series(((now() AT TIME ZONE 'utc')::date - 13), (now() AT TIME ZONE 'utc')::date, interval '1 day') AS d(day)
  LEFT JOIN (
    SELECT (created_at AT TIME ZONE 'utc')::date AS day, count(*)::int AS posts
    FROM public.posts
    GROUP BY 1
  ) p ON p.day = d.day::date;

  -- Visitor mix: totals, uniques, and how many come back more than once.
  SELECT jsonb_build_object(
    'total_visits', (SELECT count(*)::int FROM public.site_visits),
    'unique_ciphers', (SELECT count(DISTINCT anonymous_id)::int FROM public.site_visits),
    'returning_ciphers', (SELECT count(*)::int FROM (
      SELECT anonymous_id FROM public.site_visits GROUP BY anonymous_id HAVING count(*) > 1
    ) r)
  )
  INTO v_visitors;

  RETURN jsonb_build_object(
    'daily', v_daily,
    'hourly', v_hourly,
    'pages', v_pages,
    'top_posts', v_top_posts,
    'posts_daily', v_posts_daily,
    'visitors', v_visitors
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_insights() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_admin_insights() TO authenticated;