-- =============================================================================
-- TransCar Galaxy - Production Relational PostgreSQL Database Schema
-- Optimized for Supabase (with full Row Level Security & RBAC)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked to auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'driver', 'manager')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. DRIVERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED')),
  assigned_vehicle_id UUID,
  total_trips_completed INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. VEHICLES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'STANDARD_COACH' CHECK (type IN ('LUXURY_COACH', 'EXECUTIVE_BUS', 'STANDARD_COACH')),
  seating_capacity INTEGER NOT NULL DEFAULT 16 CHECK (seating_capacity > 0),
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ASSIGNED', 'ON_TRIP', 'MAINTENANCE', 'OUT_OF_SERVICE')),
  current_location TEXT NOT NULL DEFAULT 'Ongata Rongai',
  insurance_expiry DATE NOT NULL,
  inspection_expiry DATE NOT NULL,
  last_service_date DATE NOT NULL,
  mileage_km INTEGER NOT NULL DEFAULT 0,
  amenities TEXT[] NOT NULL DEFAULT ARRAY['Air Conditioning', 'High-Speed Wi-Fi', 'USB-C Charging'],
  assigned_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  image_url TEXT,
  tagline TEXT,
  special_edition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key from drivers to vehicles now that vehicles table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_drivers_vehicle'
  ) THEN
    ALTER TABLE public.drivers 
      ADD CONSTRAINT fk_drivers_vehicle 
      FOREIGN KEY (assigned_vehicle_id) 
      REFERENCES public.vehicles(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. ROUTES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km NUMERIC(7,2) NOT NULL CHECK (distance_km > 0),
  estimated_duration_hours NUMERIC(4,2) NOT NULL CHECK (estimated_duration_hours > 0),
  base_fare_ksh NUMERIC(10,2) NOT NULL CHECK (base_fare_ksh >= 0),
  stops JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 5. TRIPS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_code TEXT NOT NULL UNIQUE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  departure_time TIMESTAMPTZ NOT NULL,
  estimated_arrival_time TIMESTAMPTZ NOT NULL,
  actual_departure_time TIMESTAMPTZ,
  actual_arrival_time TIMESTAMPTZ,
  fare_ksh NUMERIC(10,2) NOT NULL CHECK (fare_ksh >= 0),
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'AT_STOP', 'DELAYED', 'ARRIVED', 'CANCELLED')),
  current_stop TEXT,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  delay_reason TEXT,
  total_seats INTEGER NOT NULL DEFAULT 16,
  available_seats INTEGER NOT NULL DEFAULT 16,
  booked_seat_numbers TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  current_location_coords JSONB,
  amenities TEXT[] NOT NULL DEFAULT ARRAY['Air Conditioning', 'Free Wi-Fi', 'USB-C Charging'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. CUSTOMERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  national_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 7. BOOKINGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  total_fare_ksh NUMERIC(10,2) NOT NULL CHECK (total_fare_ksh >= 0),
  booking_status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (booking_status IN ('CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'REFUNDED', 'PENDING_PAYMENT')),
  payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')),
  payment_method TEXT NOT NULL DEFAULT 'MPESA' CHECK (payment_method IN ('MPESA', 'CARD', 'BANK', 'CASH')),
  mpesa_transaction_code TEXT,
  pickup_point TEXT,
  dropoff_point TEXT,
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 8. TICKETS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  passenger_name TEXT NOT NULL,
  passenger_id_number TEXT,
  passenger_phone TEXT,
  seat_number TEXT NOT NULL,
  seat_class TEXT NOT NULL DEFAULT 'STANDARD',
  fare_ksh NUMERIC(10,2) NOT NULL CHECK (fare_ksh >= 0),
  qr_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'VALIDATED', 'BOARDED', 'CANCELLED')),
  has_boarded BOOLEAN NOT NULL DEFAULT false,
  boarded_at TIMESTAMPTZ,
  boarded_by_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 9. PAYMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  booking_reference TEXT NOT NULL,
  amount_ksh NUMERIC(10,2) NOT NULL CHECK (amount_ksh >= 0),
  payment_method TEXT NOT NULL DEFAULT 'MPESA' CHECK (payment_method IN ('MPESA', 'CARD', 'BANK', 'CASH')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')),
  transaction_reference TEXT NOT NULL UNIQUE,
  mpesa_receipt_number TEXT,
  phone TEXT NOT NULL,
  raw_callback_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 10. EXPENSES TABLE (STRICTLY MANAGERS ONLY)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('FUEL', 'VEHICLE_MAINTENANCE', 'STAFF_SALARIES', 'INSURANCE_LICENSING', 'ROAD_TOLLS_FEES', 'OFFICE_UTILITIES', 'SUPPLIER_PAYMENTS')),
  amount_ksh NUMERIC(12,2) NOT NULL CHECK (amount_ksh > 0),
  recipient TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  notes TEXT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_registration TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by TEXT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 11. REVENUE RECORDS (STRICTLY MANAGERS ONLY)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.revenue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'PASSENGER_TICKETS',
  amount_ksh NUMERIC(12,2) NOT NULL CHECK (amount_ksh >= 0),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  route_origin TEXT,
  route_destination TEXT,
  vehicle_registration TEXT,
  trip_code TEXT,
  description TEXT NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 12. NOTIFICATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_role TEXT CHECK (recipient_role IN ('customer', 'driver', 'manager')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO' CHECK (type IN ('INFO', 'ALERT', 'TRIP_UPDATE', 'PAYMENT', 'EMERGENCY')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 13. ANNOUNCEMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'URGENT', 'CRITICAL')),
  target_audience TEXT NOT NULL DEFAULT 'ALL_STAFF' CHECK (target_audience IN ('ALL_DRIVERS', 'SPECIFIC_ROUTE', 'ALL_STAFF', 'PUBLIC')),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 14. VEHICLE INSPECTIONS (Operational safety checks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vehicle_registration TEXT NOT NULL,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  driver_name TEXT NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PASS' CHECK (status IN ('PASS', 'ISSUE_FOUND')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 15. INCIDENT REPORTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  trip_code TEXT,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  driver_name TEXT NOT NULL,
  vehicle_registration TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BREAKDOWN', 'ACCIDENT', 'MECHANICAL', 'PASSENGER_EMERGENCY', 'TRAFFIC_DELAY', 'ROAD_CLOSURE', 'SECURITY')),
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'INVESTIGATING', 'RESOLVED')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 16. AUDIT LOGS (Compliance & Security trail)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_trips_route ON public.trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_departure ON public.trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);

CREATE INDEX IF NOT EXISTS idx_bookings_trip ON public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings(contact_phone);

CREATE INDEX IF NOT EXISTS idx_tickets_booking ON public.tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_trip ON public.tickets(trip_id);
CREATE INDEX IF NOT EXISTS idx_tickets_num ON public.tickets(ticket_number);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON public.payments(transaction_reference);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle ON public.expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON public.revenue_records(record_date);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(recipient_role);

-- =============================================================================
-- AUTOMATED TRIGGERS & PROCEDURES
-- =============================================================================

-- 1. Automatic updated_at timestamp refresher
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
      AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_updated_at_%I ON public.%I;
      CREATE TRIGGER trigger_updated_at_%I
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.set_current_timestamp_updated_at();
    ', t, t, t, t);
  END LOOP;
END $$;

-- 2. New Supabase auth.users handler -> sync to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Automatic Trip Seat Counter & Booked Seats Sync
CREATE OR REPLACE FUNCTION public.sync_trip_seat_allocation()
RETURNS TRIGGER AS $$
DECLARE
  target_trip_id UUID;
  current_booked TEXT[];
  capacity INTEGER;
BEGIN
  target_trip_id := COALESCE(NEW.trip_id, OLD.trip_id);

  SELECT ARRAY_AGG(seat_number)
  INTO current_booked
  FROM public.tickets
  WHERE trip_id = target_trip_id AND status != 'CANCELLED';

  IF current_booked IS NULL THEN
    current_booked := ARRAY[]::TEXT[];
  END IF;

  SELECT total_seats INTO capacity FROM public.trips WHERE id = target_trip_id;

  UPDATE public.trips
  SET 
    booked_seat_numbers = current_booked,
    available_seats = GREATEST(0, capacity - array_length(current_booked, 1)),
    updated_at = now()
  WHERE id = target_trip_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_trip_seats ON public.tickets;
CREATE TRIGGER trigger_sync_trip_seats
  AFTER INSERT OR UPDATE OR DELETE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.sync_trip_seat_allocation();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_driver_id()
RETURNS uuid AS $$
  SELECT id FROM public.drivers WHERE profile_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean AS $$
  SELECT public.current_user_role() = 'manager';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS boolean AS $$
  SELECT public.current_user_role() = 'driver';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- RLS: PROFILES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_manager());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: DRIVERS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active drivers" ON public.drivers;
CREATE POLICY "Public can view active drivers" ON public.drivers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Drivers can update own profile" ON public.drivers;
CREATE POLICY "Drivers can update own profile" ON public.drivers
  FOR UPDATE USING (profile_id = auth.uid() OR public.is_manager());

DROP POLICY IF EXISTS "Managers have full driver management" ON public.drivers;
CREATE POLICY "Managers have full driver management" ON public.drivers
  FOR ALL USING (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: VEHICLES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active vehicles" ON public.vehicles;
CREATE POLICY "Public can view active vehicles" ON public.vehicles
  FOR SELECT USING (status != 'OUT_OF_SERVICE' OR public.is_manager() OR public.is_driver());

DROP POLICY IF EXISTS "Managers have full vehicle management" ON public.vehicles;
CREATE POLICY "Managers have full vehicle management" ON public.vehicles
  FOR ALL USING (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: ROUTES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active routes" ON public.routes;
CREATE POLICY "Public can view active routes" ON public.routes
  FOR SELECT USING (is_active = true OR public.is_manager());

DROP POLICY IF EXISTS "Managers have full route management" ON public.routes;
CREATE POLICY "Managers have full route management" ON public.routes
  FOR ALL USING (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: TRIPS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view trips" ON public.trips;
CREATE POLICY "Public can view trips" ON public.trips
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Drivers can update their assigned trips" ON public.trips;
CREATE POLICY "Drivers can update their assigned trips" ON public.trips
  FOR UPDATE USING (driver_id = public.current_driver_id() OR public.is_manager());

DROP POLICY IF EXISTS "Managers have full trip management" ON public.trips;
CREATE POLICY "Managers have full trip management" ON public.trips
  FOR ALL USING (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: BOOKINGS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
CREATE POLICY "Customers can view own bookings" ON public.bookings
  FOR SELECT USING (
    user_id = auth.uid() 
    OR public.is_manager()
    OR (public.is_driver() AND trip_id IN (SELECT id FROM public.trips WHERE driver_id = public.current_driver_id()))
  );

DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
CREATE POLICY "Customers can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Managers have full booking management" ON public.bookings;
CREATE POLICY "Managers have full booking management" ON public.bookings
  FOR ALL USING (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: TICKETS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tickets for their bookings" ON public.tickets;
CREATE POLICY "Users can view tickets for their bookings" ON public.tickets
  FOR SELECT USING (
    booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
    OR trip_id IN (SELECT id FROM public.trips WHERE driver_id = public.current_driver_id())
    OR public.is_manager()
  );

DROP POLICY IF EXISTS "System and public can create tickets" ON public.tickets;
CREATE POLICY "System and public can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Drivers can validate and board tickets" ON public.tickets;
CREATE POLICY "Drivers can validate and board tickets" ON public.tickets
  FOR UPDATE USING (
    trip_id IN (SELECT id FROM public.trips WHERE driver_id = public.current_driver_id())
    OR public.is_manager()
  );

DROP POLICY IF EXISTS "Managers have full ticket management" ON public.tickets;
CREATE POLICY "Managers have full ticket management" ON public.tickets
  FOR ALL USING (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: PAYMENTS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;
CREATE POLICY "Customers can view own payments" ON public.payments
  FOR SELECT USING (
    booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
    OR public.is_manager()
  );

DROP POLICY IF EXISTS "Public can record payments" ON public.payments;
CREATE POLICY "Public can record payments" ON public.payments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Managers have full payment administration" ON public.payments;
CREATE POLICY "Managers have full payment administration" ON public.payments
  FOR ALL USING (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: EXPENSES (CRITICAL: STRICTLY MANAGERS ONLY - DRIVERS FORBIDDEN)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Strictly Managers Only can view expenses" ON public.expenses;
CREATE POLICY "Strictly Managers Only can view expenses" ON public.expenses
  FOR SELECT USING (public.is_manager());

DROP POLICY IF EXISTS "Strictly Managers Only can insert expenses" ON public.expenses;
CREATE POLICY "Strictly Managers Only can insert expenses" ON public.expenses
  FOR INSERT WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Strictly Managers Only can update expenses" ON public.expenses;
CREATE POLICY "Strictly Managers Only can update expenses" ON public.expenses
  FOR UPDATE USING (public.is_manager());

DROP POLICY IF EXISTS "Strictly Managers Only can delete expenses" ON public.expenses;
CREATE POLICY "Strictly Managers Only can delete expenses" ON public.expenses
  FOR DELETE USING (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: REVENUE RECORDS (CRITICAL: STRICTLY MANAGERS ONLY - DRIVERS FORBIDDEN)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Strictly Managers Only can view revenue" ON public.revenue_records;
CREATE POLICY "Strictly Managers Only can view revenue" ON public.revenue_records
  FOR SELECT USING (public.is_manager());

DROP POLICY IF EXISTS "Strictly Managers Only can manage revenue" ON public.revenue_records;
CREATE POLICY "Strictly Managers Only can manage revenue" ON public.revenue_records
  FOR ALL USING (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: NOTIFICATIONS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view relevant notifications" ON public.notifications;
CREATE POLICY "Users can view relevant notifications" ON public.notifications
  FOR SELECT USING (
    recipient_profile_id = auth.uid()
    OR recipient_role = public.current_user_role()
    OR public.is_manager()
  );

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (recipient_profile_id = auth.uid() OR public.is_manager());

DROP POLICY IF EXISTS "Managers can create notifications" ON public.notifications;
CREATE POLICY "Managers can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: ANNOUNCEMENTS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view applicable announcements" ON public.announcements;
CREATE POLICY "Users can view applicable announcements" ON public.announcements
  FOR SELECT USING (
    is_active = true AND (
      target_audience IN ('ALL_STAFF', 'PUBLIC')
      OR (target_audience = 'ALL_DRIVERS' AND public.is_driver())
      OR public.is_manager()
    )
  );

DROP POLICY IF EXISTS "Managers have full announcement management" ON public.announcements;
CREATE POLICY "Managers have full announcement management" ON public.announcements
  FOR ALL USING (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: VEHICLE INSPECTIONS & INCIDENT REPORTS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Drivers can submit inspections" ON public.vehicle_inspections;
CREATE POLICY "Drivers can submit inspections" ON public.vehicle_inspections
  FOR INSERT WITH CHECK (driver_id = public.current_driver_id() OR public.is_manager());

DROP POLICY IF EXISTS "Drivers can view their inspections" ON public.vehicle_inspections;
CREATE POLICY "Drivers can view their inspections" ON public.vehicle_inspections
  FOR SELECT USING (driver_id = public.current_driver_id() OR public.is_manager());

DROP POLICY IF EXISTS "Managers can manage inspections" ON public.vehicle_inspections;
CREATE POLICY "Managers can manage inspections" ON public.vehicle_inspections
  FOR ALL USING (public.is_manager());

DROP POLICY IF EXISTS "Drivers can submit incident reports" ON public.incident_reports;
CREATE POLICY "Drivers can submit incident reports" ON public.incident_reports
  FOR INSERT WITH CHECK (driver_id = public.current_driver_id() OR public.is_manager());

DROP POLICY IF EXISTS "Drivers can view incidents" ON public.incident_reports;
CREATE POLICY "Drivers can view incidents" ON public.incident_reports
  FOR SELECT USING (driver_id = public.current_driver_id() OR public.is_manager());

DROP POLICY IF EXISTS "Managers can manage incident reports" ON public.incident_reports;
CREATE POLICY "Managers can manage incident reports" ON public.incident_reports
  FOR ALL USING (public.is_manager());

-- -----------------------------------------------------------------------------
-- RLS: AUDIT LOGS (STRICTLY MANAGERS ONLY)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Strictly Managers can view audit logs" ON public.audit_logs;
CREATE POLICY "Strictly Managers can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_manager());

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);
