-- Keep Supabase role metadata and RLS aligned with the API's admin role.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'driver', 'manager', 'admin'));

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean AS $$
  SELECT public.current_user_role() IN ('manager', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;
