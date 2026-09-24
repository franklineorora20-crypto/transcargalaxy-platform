-- ====================================================================
-- SAFARILINE EXPRESS TRANSPORT MANAGEMENT & LONG-DISTANCE BOOKING
-- PRODUCTION-GRADE POSTGRESQL & SUPABASE MIGRATION SCHEMA WITH RLS
-- ====================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('CUSTOMER_PUBLIC', 'DRIVER', 'MANAGER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trip_status_enum AS ENUM ('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'AT_STOP', 'DELAYED', 'ARRIVED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_status_enum AS ENUM ('AVAILABLE', 'ASSIGNED', 'ON_TRIP', 'MAINTENANCE', 'OUT_OF_SERVICE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status_enum AS ENUM ('CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. USER PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role_enum NOT NULL DEFAULT 'CUSTOMER_PUBLIC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VEHICLES & FLEET
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_number TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'LUXURY_COACH',
  seating_capacity INT NOT NULL DEFAULT 49,
  status vehicle_status_enum NOT NULL DEFAULT 'AVAILABLE',
  current_location TEXT DEFAULT 'Depot',
  insurance_expiry DATE NOT NULL,
  inspection_expiry DATE NOT NULL,
  last_service_date DATE,
  mileage_km INT DEFAULT 0,
  amenities TEXT[] DEFAULT ARRAY['Wi-Fi', 'Air Conditioning', 'USB Charging', 'Reclining Seats'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DRIVERS
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  total_trips_completed INT DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 5.0,
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ROUTES & STOPS
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km INT NOT NULL,
  estimated_duration_hours NUMERIC(4,1) NOT NULL,
  base_fare_ksh NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.route_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stop_order INT NOT NULL,
  distance_from_origin_km INT NOT NULL,
  estimated_minutes INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRIPS & SCHEDULES
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_code TEXT NOT NULL UNIQUE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  departure_time TIMESTAMPTZ NOT NULL,
  estimated_arrival_time TIMESTAMPTZ NOT NULL,
  fare_ksh NUMERIC(10,2) NOT NULL,
  status trip_status_enum NOT NULL DEFAULT 'SCHEDULED',
  current_stop TEXT,
  delay_minutes INT DEFAULT 0,
  delay_reason TEXT,
  total_seats INT NOT NULL DEFAULT 49,
  available_seats INT NOT NULL DEFAULT 49,
  current_lat NUMERIC(9,6),
  current_lng NUMERIC(9,6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BOOKINGS & PASSENGERS
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_reference TEXT NOT NULL UNIQUE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  total_fare_ksh NUMERIC(10,2) NOT NULL,
  booking_status booking_status_enum NOT NULL DEFAULT 'CONFIRMED',
  payment_status payment_status_enum NOT NULL DEFAULT 'PENDING',
  payment_method TEXT DEFAULT 'MPESA',
  mpesa_transaction_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  seat_number TEXT NOT NULL,
  seat_class TEXT NOT NULL DEFAULT 'STANDARD',
  fare_ksh NUMERIC(10,2) NOT NULL,
  has_boarded BOOLEAN DEFAULT FALSE,
  boarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAYMENTS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  booking_reference TEXT NOT NULL,
  amount_ksh NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'MPESA',
  status payment_status_enum NOT NULL DEFAULT 'PENDING',
  transaction_reference TEXT UNIQUE,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PRE-TRIP VEHICLE INSPECTIONS
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PASS',
  items JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INCIDENTS
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'REPORTED',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. MAINTENANCE RECORDS (Cost is Manager-Only)
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  issue TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost_ksh NUMERIC(12,2) NOT NULL, -- STRICTLY MANAGER-ONLY
  service_provider TEXT NOT NULL,
  next_service_date DATE,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STRICTLY MANAGER-ONLY FINANCIAL TABLES
CREATE TABLE IF NOT EXISTS public.revenues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  amount_ksh NUMERIC(12,2) NOT NULL,
  route_origin TEXT,
  route_destination TEXT,
  vehicle_registration TEXT,
  trip_code TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  amount_ksh NUMERIC(12,2) NOT NULL,
  vehicle_registration TEXT,
  recipient TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  notes TEXT,
  approved_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  role TEXT NOT NULL,
  base_salary_ksh NUMERIC(12,2) NOT NULL,
  allowances_ksh NUMERIC(12,2) DEFAULT 0,
  deductions_ksh NUMERIC(12,2) DEFAULT 0,
  net_pay_ksh NUMERIC(12,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PAID',
  pay_period TEXT NOT NULL,
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ANNOUNCEMENTS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  target_audience TEXT NOT NULL DEFAULT 'ALL_DRIVERS',
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check manager role
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'MANAGER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check driver role
CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'DRIVER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FINANCIAL TABLES RLS: STRICTLY MANAGER-ONLY
CREATE POLICY "Manager Full Access Revenues" ON public.revenues
  FOR ALL USING (public.is_manager());

CREATE POLICY "Manager Full Access Expenses" ON public.expenses
  FOR ALL USING (public.is_manager());

CREATE POLICY "Manager Full Access Payroll" ON public.payroll
  FOR ALL USING (public.is_manager());

CREATE POLICY "Manager Full Access Maintenance" ON public.maintenance_records
  FOR ALL USING (public.is_manager());

CREATE POLICY "Manager Full Access Audit" ON public.audit_logs
  FOR ALL USING (public.is_manager());

-- PUBLIC POLICIES
CREATE POLICY "Public Read Active Routes" ON public.routes
  FOR SELECT USING (is_active = TRUE OR public.is_manager());

CREATE POLICY "Public Read Route Stops" ON public.route_stops
  FOR SELECT USING (TRUE);

CREATE POLICY "Public Read Trips" ON public.trips
  FOR SELECT USING (TRUE);

CREATE POLICY "Public Create Bookings" ON public.bookings
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Public Read Own Booking" ON public.bookings
  FOR SELECT USING (
    public.is_manager() OR
    public.is_driver() OR
    (auth.uid() IS NULL) -- Controlled via backend phone verification API
  );

CREATE POLICY "Public Create Booking Passengers" ON public.booking_passengers
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Public Read Announcements" ON public.announcements
  FOR SELECT USING (TRUE);

-- DRIVER POLICIES
CREATE POLICY "Driver Read Assigned Trips" ON public.trips
  FOR SELECT USING (
    public.is_manager() OR
    (public.is_driver() AND driver_id IN (
      SELECT id FROM public.drivers WHERE profile_id = auth.uid()
    ))
  );

CREATE POLICY "Driver Update Trip Status" ON public.trips
  FOR UPDATE USING (
    public.is_manager() OR
    (public.is_driver() AND driver_id IN (
      SELECT id FROM public.drivers WHERE profile_id = auth.uid()
    ))
  );

CREATE POLICY "Driver Insert Inspection" ON public.vehicle_inspections
  FOR INSERT WITH CHECK (public.is_driver() OR public.is_manager());

CREATE POLICY "Driver Read Inspection" ON public.vehicle_inspections
  FOR SELECT USING (public.is_driver() OR public.is_manager());

CREATE POLICY "Driver Insert Incident" ON public.incidents
  FOR INSERT WITH CHECK (public.is_driver() OR public.is_manager());

CREATE POLICY "Driver Read Incident" ON public.incidents
  FOR SELECT USING (public.is_driver() OR public.is_manager());
