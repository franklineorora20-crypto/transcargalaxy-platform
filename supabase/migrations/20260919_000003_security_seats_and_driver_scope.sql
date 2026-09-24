-- Security hardening: seat inventory, one reservation per seat/date, and atomic booking.

CREATE TABLE IF NOT EXISTS public.seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  seat_class TEXT NOT NULL DEFAULT 'STANDARD' CHECK (seat_class IN ('STANDARD', 'EXECUTIVE')),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (vehicle_id, seat_number)
);

CREATE TABLE IF NOT EXISTS public.booking_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  travel_date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, seat_number, travel_date)
);

CREATE INDEX IF NOT EXISTS idx_booking_seats_trip_date ON public.booking_seats(trip_id, travel_date);

ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view unblocked seats" ON public.seats;
CREATE POLICY "Public can view unblocked seats" ON public.seats
  FOR SELECT USING (is_blocked = false OR public.is_manager());

DROP POLICY IF EXISTS "Users can view their reserved seats" ON public.booking_seats;
CREATE POLICY "Users can view their reserved seats" ON public.booking_seats
  FOR SELECT USING (user_id = auth.uid() OR public.is_manager() OR public.is_driver());

CREATE OR REPLACE FUNCTION public.book_seat(
  p_trip_id UUID,
  p_seat_number TEXT,
  p_travel_date DATE,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS public.booking_seats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_trip public.trips;
  target_vehicle public.vehicles;
  seat_exists BOOLEAN;
  reservation public.booking_seats;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Authenticated user required to reserve a seat';
  END IF;

  SELECT * INTO target_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trip not found'; END IF;

  SELECT * INTO target_vehicle FROM public.vehicles WHERE id = target_trip.vehicle_id;
  SELECT EXISTS (
    SELECT 1 FROM public.seats
    WHERE vehicle_id = target_trip.vehicle_id
      AND seat_number = upper(trim(p_seat_number))
      AND is_blocked = false
  ) INTO seat_exists;
  IF NOT seat_exists THEN RAISE EXCEPTION 'Seat does not exist or is blocked'; END IF;

  INSERT INTO public.booking_seats (trip_id, seat_number, travel_date, user_id)
  VALUES (p_trip_id, upper(trim(p_seat_number)), p_travel_date, p_user_id)
  RETURNING * INTO reservation;
  RETURN reservation;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Seat is already reserved for this trip and date';
END;
$$;

REVOKE ALL ON FUNCTION public.book_seat(UUID, TEXT, DATE, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_seat(UUID, TEXT, DATE, UUID) TO authenticated;

DROP POLICY IF EXISTS "Drivers can select assigned trips by auth uid" ON public.trips;
CREATE POLICY "Drivers can select assigned trips by auth uid" ON public.trips
  FOR SELECT USING (driver_id = auth.uid() OR driver_id = public.current_driver_id() OR public.is_manager());

DROP POLICY IF EXISTS "Drivers can update assigned trips by auth uid" ON public.trips;
CREATE POLICY "Drivers can update assigned trips by auth uid" ON public.trips
  FOR UPDATE USING (driver_id = auth.uid() OR driver_id = public.current_driver_id() OR public.is_manager())
  WITH CHECK (driver_id = auth.uid() OR driver_id = public.current_driver_id() OR public.is_manager());
