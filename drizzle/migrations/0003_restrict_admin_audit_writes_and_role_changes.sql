DROP POLICY IF EXISTS "Anyone can create admin actions" ON public.admin_actions;
REVOKE INSERT, UPDATE, DELETE ON public.admin_actions FROM anon, authenticated;
GRANT SELECT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;

CREATE OR REPLACE FUNCTION public.handle_auth_user_profile_and_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  IF lower(coalesce(NEW.email, '')) = 'aryanjrd4@gmail.com' AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'admin'::public.app_role;
  END IF;
  RETURN NEW;
END;
$$;