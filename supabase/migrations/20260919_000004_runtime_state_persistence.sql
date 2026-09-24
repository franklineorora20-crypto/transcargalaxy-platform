-- Transitional persistence bridge for the existing service layer.
-- The normalized domain tables remain authoritative for new Supabase-native flows.
CREATE TABLE IF NOT EXISTS public.runtime_state (
  state_key TEXT PRIMARY KEY,
  state_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.runtime_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can inspect runtime state" ON public.runtime_state;
CREATE POLICY "Managers can inspect runtime state" ON public.runtime_state
  FOR SELECT USING (public.is_manager());
