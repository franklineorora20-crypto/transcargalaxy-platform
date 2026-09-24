-- =============================================================================
-- TRANS CAR GALAXY
-- Production PostgreSQL / Supabase Database Schema
-- =============================================================================
-- Includes:
--   - Authentication-linked profiles
--   - Customer / Driver / Manager RBAC
--   - Vehicles
--   - Routes
--   - Trips
--   - Bookings
--   - Tickets
--   - Payments
--   - Expenses
--   - Revenue
--   - Notifications
--   - Announcements
--   - Vehicle inspections
--   - Incident reports
--   - Audit logs
--   - Row Level Security
--   - Security helper functions
--   - Automatic timestamps
--   - Automatic profile creation
--   - Automatic trip seat synchronization
--   - Production-style seed data
--
-- IMPORTANT:
--   Never expose a Supabase service-role key in frontend code.
--   Financial tables are restricted to managers.
-- =============================================================================


-- =============================================================================
-- 0. EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- 1. PROFILES
-- Linked directly to Supabase auth.users
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    email TEXT NOT NULL UNIQUE,

    full_name TEXT NOT NULL,

    phone TEXT,

    role TEXT NOT NULL DEFAULT 'customer'
        CHECK (role IN ('customer', 'driver', 'manager')),

    avatar_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 2. DRIVERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID UNIQUE
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    name TEXT NOT NULL,

    email TEXT NOT NULL UNIQUE,

    phone TEXT NOT NULL,

    license_number TEXT NOT NULL UNIQUE,

    license_expiry DATE NOT NULL,

    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED')),

    assigned_vehicle_id UUID,

    total_trips_completed INTEGER NOT NULL DEFAULT 0
        CHECK (total_trips_completed >= 0),

    rating NUMERIC(3,2) NOT NULL DEFAULT 5.00
        CHECK (rating >= 1.00 AND rating <= 5.00),

    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 3. VEHICLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    registration_number TEXT NOT NULL UNIQUE,

    model TEXT NOT NULL,

    type TEXT NOT NULL DEFAULT 'STANDARD_COACH'
        CHECK (
            type IN (
                'LUXURY_COACH',
                'EXECUTIVE_BUS',
                'STANDARD_COACH'
            )
        ),

    seating_capacity INTEGER NOT NULL DEFAULT 16
        CHECK (seating_capacity > 0),

    status TEXT NOT NULL DEFAULT 'AVAILABLE'
        CHECK (
            status IN (
                'AVAILABLE',
                'ASSIGNED',
                'ON_TRIP',
                'MAINTENANCE',
                'OUT_OF_SERVICE'
            )
        ),

    current_location TEXT NOT NULL DEFAULT 'Ongata Rongai',

    insurance_expiry DATE NOT NULL,

    inspection_expiry DATE NOT NULL,

    last_service_date DATE NOT NULL,

    mileage_km INTEGER NOT NULL DEFAULT 0
        CHECK (mileage_km >= 0),

    amenities TEXT[] NOT NULL
        DEFAULT ARRAY[
            'Air Conditioning',
            'High-Speed Wi-Fi',
            'USB-C Charging'
        ],

    assigned_driver_id UUID
        REFERENCES public.drivers(id)
        ON DELETE SET NULL,

    image_url TEXT,

    tagline TEXT,

    special_edition TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 4. DRIVER → VEHICLE FOREIGN KEY
-- Added after vehicles table exists.
-- =============================================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_drivers_vehicle'
    ) THEN

        ALTER TABLE public.drivers

        ADD CONSTRAINT fk_drivers_vehicle

        FOREIGN KEY (assigned_vehicle_id)

        REFERENCES public.vehicles(id)

        ON DELETE SET NULL;

    END IF;

END $$;


-- =============================================================================
-- 5. ROUTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT NOT NULL UNIQUE,

    origin TEXT NOT NULL,

    destination TEXT NOT NULL,

    distance_km NUMERIC(7,2) NOT NULL
        CHECK (distance_km > 0),

    estimated_duration_hours NUMERIC(4,2) NOT NULL
        CHECK (estimated_duration_hours > 0),

    base_fare_ksh NUMERIC(10,2) NOT NULL
        CHECK (base_fare_ksh >= 0),

    stops JSONB NOT NULL DEFAULT '[]'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT true,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 6. TRIPS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_code TEXT NOT NULL UNIQUE,

    route_id UUID NOT NULL
        REFERENCES public.routes(id)
        ON DELETE RESTRICT,

    vehicle_id UUID NOT NULL
        REFERENCES public.vehicles(id)
        ON DELETE RESTRICT,

    driver_id UUID NOT NULL
        REFERENCES public.drivers(id)
        ON DELETE RESTRICT,

    departure_time TIMESTAMPTZ NOT NULL,

    estimated_arrival_time TIMESTAMPTZ NOT NULL,

    actual_departure_time TIMESTAMPTZ,

    actual_arrival_time TIMESTAMPTZ,

    fare_ksh NUMERIC(10,2) NOT NULL
        CHECK (fare_ksh >= 0),

    status TEXT NOT NULL DEFAULT 'SCHEDULED'
        CHECK (
            status IN (
                'SCHEDULED',
                'BOARDING',
                'DEPARTED',
                'IN_TRANSIT',
                'AT_STOP',
                'DELAYED',
                'ARRIVED',
                'CANCELLED'
            )
        ),

    current_stop TEXT,

    delay_minutes INTEGER NOT NULL DEFAULT 0
        CHECK (delay_minutes >= 0),

    delay_reason TEXT,

    total_seats INTEGER NOT NULL DEFAULT 16
        CHECK (total_seats > 0),

    available_seats INTEGER NOT NULL DEFAULT 16
        CHECK (available_seats >= 0),

    booked_seat_numbers TEXT[] NOT NULL
        DEFAULT ARRAY[]::TEXT[],

    current_location_coords JSONB,

    amenities TEXT[] NOT NULL
        DEFAULT ARRAY[
            'Air Conditioning',
            'Free Wi-Fi',
            'USB-C Charging'
        ],

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT trips_arrival_after_departure
        CHECK (estimated_arrival_time > departure_time),

    CONSTRAINT trips_available_seats_valid
        CHECK (available_seats <= total_seats)
);


-- =============================================================================
-- 7. CUSTOMERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID UNIQUE
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    full_name TEXT NOT NULL,

    phone TEXT NOT NULL,

    email TEXT,

    national_id TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 8. BOOKINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_reference TEXT NOT NULL UNIQUE,

    customer_id UUID
        REFERENCES public.customers(id)
        ON DELETE SET NULL,

    user_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    trip_id UUID NOT NULL
        REFERENCES public.trips(id)
        ON DELETE RESTRICT,

    contact_name TEXT NOT NULL,

    contact_phone TEXT NOT NULL,

    contact_email TEXT NOT NULL,

    emergency_contact_name TEXT,

    emergency_contact_phone TEXT,

    total_fare_ksh NUMERIC(10,2) NOT NULL
        CHECK (total_fare_ksh >= 0),

    booking_status TEXT NOT NULL DEFAULT 'CONFIRMED'
        CHECK (
            booking_status IN (
                'CONFIRMED',
                'CHECKED_IN',
                'CANCELLED',
                'REFUNDED',
                'PENDING_PAYMENT'
            )
        ),

    payment_status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (
            payment_status IN (
                'PENDING',
                'PAID',
                'FAILED',
                'REFUNDED',
                'CANCELLED'
            )
        ),

    payment_method TEXT NOT NULL DEFAULT 'MPESA'
        CHECK (
            payment_method IN (
                'MPESA',
                'CARD',
                'BANK',
                'CASH'
            )
        ),

    mpesa_transaction_code TEXT,

    pickup_point TEXT,

    dropoff_point TEXT,

    special_requests TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 9. TICKETS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_number TEXT NOT NULL UNIQUE,

    booking_id UUID NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    trip_id UUID NOT NULL
        REFERENCES public.trips(id)
        ON DELETE RESTRICT,

    passenger_name TEXT NOT NULL,

    passenger_id_number TEXT,

    passenger_phone TEXT,

    seat_number TEXT NOT NULL,

    seat_class TEXT NOT NULL DEFAULT 'STANDARD',

    fare_ksh NUMERIC(10,2) NOT NULL
        CHECK (fare_ksh >= 0),

    qr_code TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'ISSUED'
        CHECK (
            status IN (
                'ISSUED',
                'VALIDATED',
                'BOARDED',
                'CANCELLED'
            )
        ),

    has_boarded BOOLEAN NOT NULL DEFAULT false,

    boarded_at TIMESTAMPTZ,

    boarded_by_driver_id UUID
        REFERENCES public.drivers(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 10. PAYMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL
        REFERENCES public.bookings(id)
        ON DELETE CASCADE,

    booking_reference TEXT NOT NULL,

    amount_ksh NUMERIC(10,2) NOT NULL
        CHECK (amount_ksh >= 0),

    payment_method TEXT NOT NULL DEFAULT 'MPESA'
        CHECK (
            payment_method IN (
                'MPESA',
                'CARD',
                'BANK',
                'CASH'
            )
        ),

    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'PAID',
                'FAILED',
                'REFUNDED',
                'CANCELLED'
            )
        ),

    transaction_reference TEXT NOT NULL UNIQUE,

    mpesa_receipt_number TEXT,

    phone TEXT NOT NULL,

    raw_callback_payload JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 11. EXPENSES
-- STRICTLY MANAGER ACCESS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category TEXT NOT NULL
        CHECK (
            category IN (
                'FUEL',
                'VEHICLE_MAINTENANCE',
                'STAFF_SALARIES',
                'INSURANCE_LICENSING',
                'ROAD_TOLLS_FEES',
                'OFFICE_UTILITIES',
                'SUPPLIER_PAYMENTS'
            )
        ),

    amount_ksh NUMERIC(12,2) NOT NULL
        CHECK (amount_ksh > 0),

    recipient TEXT NOT NULL,

    receipt_number TEXT NOT NULL,

    notes TEXT,

    vehicle_id UUID
        REFERENCES public.vehicles(id)
        ON DELETE SET NULL,

    vehicle_registration TEXT,

    recorded_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    approved_by TEXT NOT NULL,

    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 12. REVENUE RECORDS
-- STRICTLY MANAGER ACCESS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.revenue_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category TEXT NOT NULL DEFAULT 'PASSENGER_TICKETS',

    amount_ksh NUMERIC(12,2) NOT NULL
        CHECK (amount_ksh >= 0),

    booking_id UUID
        REFERENCES public.bookings(id)
        ON DELETE SET NULL,

    trip_id UUID
        REFERENCES public.trips(id)
        ON DELETE SET NULL,

    route_origin TEXT,

    route_destination TEXT,

    vehicle_registration TEXT,

    trip_code TEXT,

    description TEXT NOT NULL,

    record_date DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 13. NOTIFICATIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recipient_profile_id UUID
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    recipient_role TEXT
        CHECK (
            recipient_role IN (
                'customer',
                'driver',
                'manager'
            )
        ),

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    type TEXT NOT NULL DEFAULT 'INFO'
        CHECK (
            type IN (
                'INFO',
                'ALERT',
                'TRIP_UPDATE',
                'PAYMENT',
                'EMERGENCY'
            )
        ),

    is_read BOOLEAN NOT NULL DEFAULT false,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 14. ANNOUNCEMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    priority TEXT NOT NULL DEFAULT 'NORMAL'
        CHECK (
            priority IN (
                'NORMAL',
                'URGENT',
                'CRITICAL'
            )
        ),

    target_audience TEXT NOT NULL DEFAULT 'ALL_STAFF'
        CHECK (
            target_audience IN (
                'ALL_DRIVERS',
                'SPECIFIC_ROUTE',
                'ALL_STAFF',
                'PUBLIC'
            )
        ),

    author_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    author_name TEXT NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 15. VEHICLE INSPECTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vehicle_id UUID NOT NULL
        REFERENCES public.vehicles(id)
        ON DELETE CASCADE,

    vehicle_registration TEXT NOT NULL,

    driver_id UUID NOT NULL
        REFERENCES public.drivers(id)
        ON DELETE RESTRICT,

    driver_name TEXT NOT NULL,

    trip_id UUID
        REFERENCES public.trips(id)
        ON DELETE SET NULL,

    items JSONB NOT NULL,

    status TEXT NOT NULL DEFAULT 'PASS'
        CHECK (
            status IN (
                'PASS',
                'ISSUE_FOUND'
            )
        ),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 16. INCIDENT REPORTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_id UUID
        REFERENCES public.trips(id)
        ON DELETE SET NULL,

    trip_code TEXT,

    driver_id UUID NOT NULL
        REFERENCES public.drivers(id)
        ON DELETE RESTRICT,

    driver_name TEXT NOT NULL,

    vehicle_registration TEXT NOT NULL,

    type TEXT NOT NULL
        CHECK (
            type IN (
                'BREAKDOWN',
                'ACCIDENT',
                'MECHANICAL',
                'PASSENGER_EMERGENCY',
                'TRAFFIC_DELAY',
                'ROAD_CLOSURE',
                'SECURITY'
            )
        ),

    severity TEXT NOT NULL DEFAULT 'MEDIUM'
        CHECK (
            severity IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            )
        ),

    description TEXT NOT NULL,

    location TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'REPORTED'
        CHECK (
            status IN (
                'REPORTED',
                'INVESTIGATING',
                'RESOLVED'
            )
        ),

    resolution_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 17. AUDIT LOGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

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
-- 18. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role
    ON public.profiles(role);

CREATE INDEX IF NOT EXISTS idx_drivers_profile
    ON public.drivers(profile_id);

CREATE INDEX IF NOT EXISTS idx_drivers_status
    ON public.drivers(status);

CREATE INDEX IF NOT EXISTS idx_drivers_vehicle
    ON public.drivers(assigned_vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_status
    ON public.vehicles(status);

CREATE INDEX IF NOT EXISTS idx_vehicles_driver
    ON public.vehicles(assigned_driver_id);

CREATE INDEX IF NOT EXISTS idx_routes_active
    ON public.routes(is_active);

CREATE INDEX IF NOT EXISTS idx_trips_route
    ON public.trips(route_id);

CREATE INDEX IF NOT EXISTS idx_trips_driver
    ON public.trips(driver_id);

CREATE INDEX IF NOT EXISTS idx_trips_vehicle
    ON public.trips(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_trips_departure
    ON public.trips(departure_time);

CREATE INDEX IF NOT EXISTS idx_trips_status
    ON public.trips(status);

CREATE INDEX IF NOT EXISTS idx_customers_profile
    ON public.customers(profile_id);

CREATE INDEX IF NOT EXISTS idx_bookings_trip
    ON public.bookings(trip_id);

CREATE INDEX IF NOT EXISTS idx_bookings_user
    ON public.bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_customer
    ON public.bookings(customer_id);

CREATE INDEX IF NOT EXISTS idx_bookings_reference
    ON public.bookings(booking_reference);

CREATE INDEX IF NOT EXISTS idx_bookings_phone
    ON public.bookings(contact_phone);

CREATE INDEX IF NOT EXISTS idx_tickets_booking
    ON public.tickets(booking_id);

CREATE INDEX IF NOT EXISTS idx_tickets_trip
    ON public.tickets(trip_id);

CREATE INDEX IF NOT EXISTS idx_tickets_number
    ON public.tickets(ticket_number);

CREATE INDEX IF NOT EXISTS idx_payments_booking
    ON public.payments(booking_id);

CREATE INDEX IF NOT EXISTS idx_payments_reference
    ON public.payments(transaction_reference);

CREATE INDEX IF NOT EXISTS idx_expenses_date
    ON public.expenses(expense_date);

CREATE INDEX IF NOT EXISTS idx_expenses_vehicle
    ON public.expenses(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_revenue_date
    ON public.revenue_records(record_date);

CREATE INDEX IF NOT EXISTS idx_revenue_trip
    ON public.revenue_records(trip_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
    ON public.notifications(recipient_profile_id);

CREATE INDEX IF NOT EXISTS idx_notifications_role
    ON public.notifications(recipient_role);

CREATE INDEX IF NOT EXISTS idx_inspections_vehicle
    ON public.vehicle_inspections(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_inspections_driver
    ON public.vehicle_inspections(driver_id);

CREATE INDEX IF NOT EXISTS idx_incidents_trip
    ON public.incident_reports(trip_id);

CREATE INDEX IF NOT EXISTS idx_incidents_driver
    ON public.incident_reports(driver_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
    ON public.audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
    ON public.audit_logs(created_at);


-- =============================================================================
-- 19. AUTOMATIC UPDATED_AT FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    NEW.updated_at = now();

    RETURN NEW;

END;
$$;


-- =============================================================================
-- 20. APPLY UPDATED_AT TRIGGERS
-- =============================================================================

DO $$
DECLARE
    table_name_text TEXT;
BEGIN

    FOR table_name_text IN

        SELECT DISTINCT table_name

        FROM information_schema.columns

        WHERE column_name = 'updated_at'

        AND table_schema = 'public'

    LOOP

        EXECUTE format(
            'DROP TRIGGER IF EXISTS trigger_updated_at_%I ON public.%I',
            table_name_text,
            table_name_text
        );

        EXECUTE format(
            'CREATE TRIGGER trigger_updated_at_%I
             BEFORE UPDATE ON public.%I
             FOR EACH ROW
             EXECUTE FUNCTION public.set_current_timestamp_updated_at()',
            table_name_text,
            table_name_text
        );

    END LOOP;

END $$;


-- =============================================================================
-- 21. AUTH USER → PROFILE FUNCTION
-- =============================================================================
-- IMPORTANT:
-- Public signups ALWAYS become customers.
-- The user cannot self-register as a manager or driver.
-- Managers can later assign/promote the appropriate role.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        role
    )

    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'phone',
        'customer'
    )

    ON CONFLICT (id)

    DO UPDATE SET

        email = EXCLUDED.email,

        full_name = EXCLUDED.full_name,

        phone = COALESCE(
            EXCLUDED.phone,
            public.profiles.phone
        );

    RETURN NEW;

END;
$$;


-- =============================================================================
-- 22. AUTH USER TRIGGER
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

CREATE TRIGGER on_auth_user_created

AFTER INSERT ON auth.users

FOR EACH ROW

EXECUTE FUNCTION public.handle_new_auth_user();


-- =============================================================================
-- 23. CURRENT USER ROLE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$

    SELECT role

    FROM public.profiles

    WHERE id = auth.uid();

$$;


-- =============================================================================
-- 24. CURRENT DRIVER ID
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_driver_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$

    SELECT id

    FROM public.drivers

    WHERE profile_id = auth.uid();

$$;


-- =============================================================================
-- 25. IS MANAGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$

    SELECT COALESCE(
        public.current_user_role() = 'manager',
        false
    );

$$;


-- =============================================================================
-- 26. IS DRIVER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$

    SELECT COALESCE(
        public.current_user_role() = 'driver',
        false
    );

$$;


-- =============================================================================
-- 27. TRIP SEAT SYNCHRONIZATION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_trip_seat_allocation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE

    target_trip_id UUID;

    current_booked TEXT[];

    capacity INTEGER;

BEGIN

    target_trip_id :=
        COALESCE(NEW.trip_id, OLD.trip_id);


    SELECT ARRAY_AGG(seat_number ORDER BY seat_number)

    INTO current_booked

    FROM public.tickets

    WHERE trip_id = target_trip_id

    AND status <> 'CANCELLED';


    IF current_booked IS NULL THEN

        current_booked := ARRAY[]::TEXT[];

    END IF;


    SELECT total_seats

    INTO capacity

    FROM public.trips

    WHERE id = target_trip_id;


    IF capacity IS NOT NULL THEN

        UPDATE public.trips

        SET

            booked_seat_numbers = current_booked,

            available_seats =
                GREATEST(
                    0,
                    capacity - COALESCE(
                        cardinality(current_booked),
                        0
                    )
                ),

            updated_at = now()

        WHERE id = target_trip_id;

    END IF;


    RETURN COALESCE(NEW, OLD);

END;
$$;


-- =============================================================================
-- 28. TRIP SEAT TRIGGER
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_sync_trip_seats
ON public.tickets;

CREATE TRIGGER trigger_sync_trip_seats

AFTER INSERT OR UPDATE OR DELETE

ON public.tickets

FOR EACH ROW

EXECUTE FUNCTION public.sync_trip_seat_allocation();


-- =============================================================================
-- 29. ENABLE ROW LEVEL SECURITY
-- =============================================================================

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


-- =============================================================================
-- 30. DROP EXISTING POLICIES
-- =============================================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN

    FOR policy_record IN

        SELECT
            schemaname,
            tablename,
            policyname

        FROM pg_policies

        WHERE schemaname = 'public'

    LOOP

        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            policy_record.policyname,
            policy_record.schemaname,
            policy_record.tablename
        );

    END LOOP;

END $$;


-- =============================================================================
-- 31. PROFILES RLS
-- =============================================================================

CREATE POLICY "profiles_select_own_or_manager"

ON public.profiles

FOR SELECT

USING (
    auth.uid() = id
    OR public.is_manager()
);


CREATE POLICY "profiles_update_own_or_manager"

ON public.profiles

FOR UPDATE

USING (
    auth.uid() = id
    OR public.is_manager()
)

WITH CHECK (
    auth.uid() = id
    OR public.is_manager()
);


-- =============================================================================
-- 32. DRIVERS RLS
-- =============================================================================
-- Driver personal records are NOT publicly exposed.
-- =============================================================================

CREATE POLICY "drivers_select_authenticated"

ON public.drivers

FOR SELECT

USING (
    public.is_manager()
    OR profile_id = auth.uid()
);


CREATE POLICY "drivers_update_own_or_manager"

ON public.drivers

FOR UPDATE

USING (
    profile_id = auth.uid()
    OR public.is_manager()
)

WITH CHECK (
    profile_id = auth.uid()
    OR public.is_manager()
);


CREATE POLICY "drivers_manager_insert"

ON public.drivers

FOR INSERT

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "drivers_manager_delete"

ON public.drivers

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 33. VEHICLES RLS
-- =============================================================================

CREATE POLICY "vehicles_public_select"

ON public.vehicles

FOR SELECT

USING (
    status <> 'OUT_OF_SERVICE'
    OR public.is_manager()
    OR public.is_driver()
);


CREATE POLICY "vehicles_manager_insert"

ON public.vehicles

FOR INSERT

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "vehicles_manager_update"

ON public.vehicles

FOR UPDATE

USING (
    public.is_manager()
)

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "vehicles_manager_delete"

ON public.vehicles

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 34. ROUTES RLS
-- =============================================================================

CREATE POLICY "routes_public_select"

ON public.routes

FOR SELECT

USING (
    is_active = true
    OR public.is_manager()
);


CREATE POLICY "routes_manager_insert"

ON public.routes

FOR INSERT

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "routes_manager_update"

ON public.routes

FOR UPDATE

USING (
    public.is_manager()
)

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "routes_manager_delete"

ON public.routes

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 35. TRIPS RLS
-- =============================================================================

CREATE POLICY "trips_public_select"

ON public.trips

FOR SELECT

USING (
    true
);


CREATE POLICY "trips_driver_update_assigned"

ON public.trips

FOR UPDATE

USING (
    driver_id = public.current_driver_id()
    OR public.is_manager()
)

WITH CHECK (
    driver_id = public.current_driver_id()
    OR public.is_manager()
);


CREATE POLICY "trips_manager_insert"

ON public.trips

FOR INSERT

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "trips_manager_update"

ON public.trips

FOR UPDATE

USING (
    public.is_manager()
)

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "trips_manager_delete"

ON public.trips

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 36. CUSTOMERS RLS
-- =============================================================================

CREATE POLICY "customers_select_own_or_manager"

ON public.customers

FOR SELECT

USING (
    profile_id = auth.uid()
    OR public.is_manager()
);


CREATE POLICY "customers_insert_own_or_manager"

ON public.customers

FOR INSERT

WITH CHECK (
    profile_id = auth.uid()
    OR public.is_manager()
);


CREATE POLICY "customers_update_own_or_manager"

ON public.customers

FOR UPDATE

USING (
    profile_id = auth.uid()
    OR public.is_manager()
)

WITH CHECK (
    profile_id = auth.uid()
    OR public.is_manager()
);


CREATE POLICY "customers_manager_delete"

ON public.customers

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 37. BOOKINGS RLS
-- =============================================================================

CREATE POLICY "bookings_select_owner_driver_manager"

ON public.bookings

FOR SELECT

USING (

    user_id = auth.uid()

    OR public.is_manager()

    OR (
        public.is_driver()
        AND trip_id IN (
            SELECT id
            FROM public.trips
            WHERE driver_id = public.current_driver_id()
        )
    )

);


-- Customer / guest booking creation.
-- If logged in, user_id must belong to that logged-in account.
-- Guest bookings must leave user_id NULL.

CREATE POLICY "bookings_insert_customer"

ON public.bookings

FOR INSERT

WITH CHECK (

    user_id IS NULL

    OR user_id = auth.uid()

    OR public.is_manager()

);


CREATE POLICY "bookings_update_owner_or_manager"

ON public.bookings

FOR UPDATE

USING (
    user_id = auth.uid()
    OR public.is_manager()
)

WITH CHECK (
    user_id = auth.uid()
    OR public.is_manager()
);


CREATE POLICY "bookings_manager_delete"

ON public.bookings

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 38. TICKETS RLS
-- =============================================================================

CREATE POLICY "tickets_select_owner_driver_manager"

ON public.tickets

FOR SELECT

USING (

    public.is_manager()

    OR booking_id IN (
        SELECT id
        FROM public.bookings
        WHERE user_id = auth.uid()
    )

    OR trip_id IN (
        SELECT id
        FROM public.trips
        WHERE driver_id = public.current_driver_id()
    )

);


-- Tickets should be generated by trusted backend logic
-- or managers, NOT directly by anonymous clients.

CREATE POLICY "tickets_manager_insert"

ON public.tickets

FOR INSERT

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "tickets_driver_update"

ON public.tickets

FOR UPDATE

USING (

    public.is_manager()

    OR trip_id IN (
        SELECT id
        FROM public.trips
        WHERE driver_id = public.current_driver_id()
    )

)

WITH CHECK (

    public.is_manager()

    OR trip_id IN (
        SELECT id
        FROM public.trips
        WHERE driver_id = public.current_driver_id()
    )

);


CREATE POLICY "tickets_manager_delete"

ON public.tickets

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 39. PAYMENTS RLS
-- =============================================================================

CREATE POLICY "payments_select_owner_or_manager"

ON public.payments

FOR SELECT

USING (

    public.is_manager()

    OR booking_id IN (
        SELECT id
        FROM public.bookings
        WHERE user_id = auth.uid()
    )

);


-- Authenticated customers may initiate a payment against their own booking.
-- Guest payment processing should be performed through a trusted server-side
-- endpoint using the service role.

CREATE POLICY "payments_insert_owner_or_manager"

ON public.payments

FOR INSERT

WITH CHECK (

    public.is_manager()

    OR (
        booking_id IN (
            SELECT id
            FROM public.bookings
            WHERE user_id = auth.uid()
        )
    )

);


CREATE POLICY "payments_manager_update"

ON public.payments

FOR UPDATE

USING (
    public.is_manager()
)

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "payments_manager_delete"

ON public.payments

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 40. EXPENSES
-- STRICTLY MANAGERS
-- =============================================================================

CREATE POLICY "expenses_manager_select"

ON public.expenses

FOR SELECT

USING (
    public.is_manager()
);


CREATE POLICY "expenses_manager_insert"

ON public.expenses

FOR INSERT

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "expenses_manager_update"

ON public.expenses

FOR UPDATE

USING (
    public.is_manager()
)

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "expenses_manager_delete"

ON public.expenses

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 41. REVENUE
-- STRICTLY MANAGERS
-- =============================================================================

CREATE POLICY "revenue_manager_select"

ON public.revenue_records

FOR SELECT

USING (
    public.is_manager()
);


CREATE POLICY "revenue_manager_insert"

ON public.revenue_records

FOR INSERT

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "revenue_manager_update"

ON public.revenue_records

FOR UPDATE

USING (
    public.is_manager()
)

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "revenue_manager_delete"

ON public.revenue_records

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 42. NOTIFICATIONS
-- =============================================================================

CREATE POLICY "notifications_select_relevant"

ON public.notifications

FOR SELECT

USING (

    recipient_profile_id = auth.uid()

    OR (
        recipient_role = public.current_user_role()
        AND auth.uid() IS NOT NULL
    )

    OR public.is_manager()

);


CREATE POLICY "notifications_update_own"

ON public.notifications

FOR UPDATE

USING (

    recipient_profile_id = auth.uid()

    OR public.is_manager()

)

WITH CHECK (

    recipient_profile_id = auth.uid()

    OR public.is_manager()

);


CREATE POLICY "notifications_manager_insert"

ON public.notifications

FOR INSERT

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "notifications_manager_delete"

ON public.notifications

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 43. ANNOUNCEMENTS
-- =============================================================================

CREATE POLICY "announcements_public_select"

ON public.announcements

FOR SELECT

USING (

    is_active = true

    AND (
        target_audience = 'PUBLIC'
        OR target_audience = 'ALL_STAFF'
        OR (
            target_audience = 'ALL_DRIVERS'
            AND public.is_driver()
        )
        OR public.is_manager()
    )

);


CREATE POLICY "announcements_manager_insert"

ON public.announcements

FOR INSERT

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "announcements_manager_update"

ON public.announcements

FOR UPDATE

USING (
    public.is_manager()
)

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "announcements_manager_delete"

ON public.announcements

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 44. VEHICLE INSPECTIONS
-- =============================================================================

CREATE POLICY "inspections_driver_insert"

ON public.vehicle_inspections

FOR INSERT

WITH CHECK (

    public.is_manager()

    OR driver_id = public.current_driver_id()

);


CREATE POLICY "inspections_driver_select"

ON public.vehicle_inspections

FOR SELECT

USING (

    public.is_manager()

    OR driver_id = public.current_driver_id()

);


CREATE POLICY "inspections_manager_update"

ON public.vehicle_inspections

FOR UPDATE

USING (
    public.is_manager()
)

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "inspections_manager_delete"

ON public.vehicle_inspections

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 45. INCIDENT REPORTS
-- =============================================================================

CREATE POLICY "incidents_driver_insert"

ON public.incident_reports

FOR INSERT

WITH CHECK (

    public.is_manager()

    OR driver_id = public.current_driver_id()

);


CREATE POLICY "incidents_driver_select"

ON public.incident_reports

FOR SELECT

USING (

    public.is_manager()

    OR driver_id = public.current_driver_id()

);


CREATE POLICY "incidents_manager_update"

ON public.incident_reports

FOR UPDATE

USING (
    public.is_manager()
)

WITH CHECK (
    public.is_manager()
);


CREATE POLICY "incidents_manager_delete"

ON public.incident_reports

FOR DELETE

USING (
    public.is_manager()
);


-- =============================================================================
-- 46. AUDIT LOGS
-- STRICTLY MANAGER READ ACCESS
-- =============================================================================

CREATE POLICY "audit_logs_manager_select"

ON public.audit_logs

FOR SELECT

USING (
    public.is_manager()
);


-- No public INSERT policy.
-- Audit records should be created by trusted backend/service-role logic.


-- =============================================================================
-- 47. SEED ROUTES
-- =============================================================================

INSERT INTO public.routes (
    id,
    code,
    origin,
    destination,
    distance_km,
    estimated_duration_hours,
    base_fare_ksh,
    stops,
    is_active,
    description
)

VALUES

(
    'a1b2c3d4-e5f6-4001-8001-000000000001',

    'SL-RN-KSI-01',

    'Ongata Rongai (Galaxy Terminal)',

    'Kisii Express Terminal',

    310.00,

    5.50,

    1500.00,

    '[
        {
            "id": "stp-1",
            "name": "Ongata Rongai Main Station",
            "order": 1,
            "distanceFromOriginKm": 0,
            "estimatedMinutes": 0
        },
        {
            "id": "stp-2",
            "name": "Nairobi Expressway Southern Bypass",
            "order": 2,
            "distanceFromOriginKm": 18,
            "estimatedMinutes": 25
        },
        {
            "id": "stp-3",
            "name": "Mai Mahiu Escarpment",
            "order": 3,
            "distanceFromOriginKm": 65,
            "estimatedMinutes": 75
        },
        {
            "id": "stp-4",
            "name": "Narok Quickmart Transit Hub",
            "order": 4,
            "distanceFromOriginKm": 145,
            "estimatedMinutes": 150
        },
        {
            "id": "stp-5",
            "name": "Bomet Green Square",
            "order": 5,
            "distanceFromOriginKm": 235,
            "estimatedMinutes": 240
        },
        {
            "id": "stp-6",
            "name": "Kisii Central Express Terminal",
            "order": 6,
            "distanceFromOriginKm": 310,
            "estimatedMinutes": 330
        }
    ]'::jsonb,

    true,

    'Flagship corridor connecting Rongai commuters directly to Kisii without downtown CBD congestion.'
)

ON CONFLICT (code) DO NOTHING;


INSERT INTO public.routes (
    id,
    code,
    origin,
    destination,
    distance_km,
    estimated_duration_hours,
    base_fare_ksh,
    stops,
    is_active,
    description
)

VALUES

(
    'a1b2c3d4-e5f6-4001-8001-000000000002',

    'SL-RN-SSW-02',

    'Ongata Rongai (Galaxy Terminal)',

    'Suswa / Narok Intercity',

    145.00,

    2.50,

    800.00,

    '[
        {
            "id": "stp-201",
            "name": "Ongata Rongai Maasai Mall",
            "order": 1,
            "distanceFromOriginKm": 0,
            "estimatedMinutes": 0
        },
        {
            "id": "stp-202",
            "name": "Ngong Hills Viewpoint",
            "order": 2,
            "distanceFromOriginKm": 22,
            "estimatedMinutes": 30
        },
        {
            "id": "stp-203",
            "name": "Suswa SGR Junction",
            "order": 3,
            "distanceFromOriginKm": 78,
            "estimatedMinutes": 80
        },
        {
            "id": "stp-204",
            "name": "Narok Town Gate",
            "order": 4,
            "distanceFromOriginKm": 145,
            "estimatedMinutes": 150
        }
    ]'::jsonb,

    true,

    'Rapid high-frequency shuttle service for Rift Valley commerce and passenger connections.'
)

ON CONFLICT (code) DO NOTHING;


INSERT INTO public.routes (
    id,
    code,
    origin,
    destination,
    distance_km,
    estimated_duration_hours,
    base_fare_ksh,
    stops,
    is_active,
    description
)

VALUES

(
    'a1b2c3d4-e5f6-4001-8001-000000000003',

    'SL-RN-HMB-03',

    'Ongata Rongai (Galaxy Terminal)',

    'Homa Bay Lakefront Pier',

    380.00,

    6.50,

    1800.00,

    '[
        {
            "id": "stp-301",
            "name": "Ongata Rongai Galaxy Terminal",
            "order": 1,
            "distanceFromOriginKm": 0,
            "estimatedMinutes": 0
        },
        {
            "id": "stp-302",
            "name": "Narok Town Transit",
            "order": 2,
            "distanceFromOriginKm": 145,
            "estimatedMinutes": 150
        },
        {
            "id": "stp-303",
            "name": "Kisii Junction",
            "order": 3,
            "distanceFromOriginKm": 310,
            "estimatedMinutes": 330
        },
        {
            "id": "stp-304",
            "name": "Oyugis Stage",
            "order": 4,
            "distanceFromOriginKm": 345,
            "estimatedMinutes": 360
        },
        {
            "id": "stp-305",
            "name": "Homa Bay Lakefront Pier",
            "order": 5,
            "distanceFromOriginKm": 380,
            "estimatedMinutes": 390
        }
    ]'::jsonb,

    true,

    'Lake region direct executive service with air conditioning and guaranteed seat selection.'
)

ON CONFLICT (code) DO NOTHING;


INSERT INTO public.routes (
    id,
    code,
    origin,
    destination,
    distance_km,
    estimated_duration_hours,
    base_fare_ksh,
    stops,
    is_active,
    description
)

VALUES

(
    'a1b2c3d4-e5f6-4001-8001-000000000004',

    'SL-RN-MGR-04',

    'Ongata Rongai (Galaxy Terminal)',

    'Migori / Sirare Border',

    360.00,

    6.00,

    1700.00,

    '[
        {
            "id": "stp-401",
            "name": "Ongata Rongai Galaxy Terminal",
            "order": 1,
            "distanceFromOriginKm": 0,
            "estimatedMinutes": 0
        },
        {
            "id": "stp-402",
            "name": "Narok Rest Stop",
            "order": 2,
            "distanceFromOriginKm": 145,
            "estimatedMinutes": 150
        },
        {
            "id": "stp-403",
            "name": "Rongo Town",
            "order": 3,
            "distanceFromOriginKm": 320,
            "estimatedMinutes": 330
        },
        {
            "id": "stp-404",
            "name": "Migori Post Office Stage",
            "order": 4,
            "distanceFromOriginKm": 360,
            "estimatedMinutes": 360
        }
    ]'::jsonb,

    true,

    'Border gateway shuttle supporting cross-border trade, regional commuters, and corporate logistics.'
)

ON CONFLICT (code) DO NOTHING;


-- =============================================================================
-- 48. SEED DRIVERS
-- =============================================================================

INSERT INTO public.drivers (
    id,
    name,
    email,
    phone,
    license_number,
    license_expiry,
    status,
    total_trips_completed,
    rating,
    joined_date
)

VALUES

(
    'd1b2c3d4-e5f6-4002-8001-000000000001',

    'John Mwangi',

    'john.mwangi@transcargalaxy.co.ke',

    '+254 712 345 678',

    'DL-NTSA-883921',

    '2028-06-30',

    'ACTIVE',

    412,

    4.95,

    '2022-01-15'
),

(
    'd1b2c3d4-e5f6-4002-8001-000000000002',

    'Peter Otieno',

    'peter.otieno@transcargalaxy.co.ke',

    '+254 722 987 654',

    'DL-NTSA-554210',

    '2027-11-20',

    'ACTIVE',

    350,

    4.88,

    '2022-05-10'
),

(
    'd1b2c3d4-e5f6-4002-8001-000000000003',

    'Samuel Kiprop',

    'samuel.kiprop@transcargalaxy.co.ke',

    '+254 733 456 789',

    'DL-NTSA-992341',

    '2028-03-15',

    'ACTIVE',

    289,

    4.92,

    '2023-02-01'
),

(
    'd1b2c3d4-e5f6-4002-8001-000000000004',

    'David Kamau',

    'david.kamau@transcargalaxy.co.ke',

    '+254 701 234 567',

    'DL-NTSA-332190',

    '2027-08-14',

    'ACTIVE',

    195,

    4.85,

    '2023-09-10'
)

ON CONFLICT (license_number) DO NOTHING;


-- =============================================================================
-- 49. SEED VEHICLES
-- =============================================================================

INSERT INTO public.vehicles (
    id,
    registration_number,
    model,
    type,
    seating_capacity,
    status,
    current_location,
    insurance_expiry,
    inspection_expiry,
    last_service_date,
    mileage_km,
    amenities,
    assigned_driver_id,
    image_url,
    tagline,
    special_edition
)

VALUES

(
    'b1b2c3d4-e5f6-4003-8001-000000000001',

    'KDE 416Q',

    'TransCar VIP Toyota HiAce',

    'STANDARD_COACH',

    16,

    'ASSIGNED',

    'Ongata Rongai',

    '2026-12-31',

    '2026-12-31',

    '2026-08-01',

    148200,

    ARRAY[
        'Air Conditioning',
        'Free Wi-Fi',
        'Dual USB-C Ports',
        'Speed Governor (80 km/h)'
    ],

    'd1b2c3d4-e5f6-4002-8001-000000000001',

    '/images/transcar_highway_kde4160.jpg',

    'Galaxy Express Cruiser',

    'Galaxy Star Edition'
),

(
    'b1b2c3d4-e5f6-4003-8001-000000000002',

    'KDV 149E',

    'TransCar VIP Toyota HiAce',

    'STANDARD_COACH',

    16,

    'ASSIGNED',

    'Ongata Rongai',

    '2026-12-31',

    '2026-12-31',

    '2026-08-01',

    122500,

    ARRAY[
        'Air Conditioning',
        'High-Speed Wi-Fi',
        'Leather Bucket Seats'
    ],

    'd1b2c3d4-e5f6-4002-8001-000000000002',

    '/images/transcar_stalker_kdv149e.jpg',

    'Highway Pioneer',

    'Stalker Line'
),

(
    'b1b2c3d4-e5f6-4003-8001-000000000003',

    'KDE 832Y',

    'TransCar VIP Toyota HiAce',

    'STANDARD_COACH',

    16,

    'ASSIGNED',

    'Ongata Rongai',

    '2026-12-31',

    '2026-12-31',

    '2026-08-01',

    135800,

    ARRAY[
        'Air Conditioning',
        'Wi-Fi',
        'Luggage Compartment'
    ],

    'd1b2c3d4-e5f6-4002-8001-000000000003',

    '/images/transcar_kde832y_day.jpg',

    'Intercity Voyager',

    'Rongai Express'
),

(
    'b1b2c3d4-e5f6-4003-8001-000000000004',

    'KDA 123A',

    'TransCar VIP Toyota HiAce',

    'STANDARD_COACH',

    16,

    'ASSIGNED',

    'Ongata Rongai',

    '2026-12-31',

    '2026-12-31',

    '2026-08-01',

    160000,

    ARRAY[
        'Air Conditioning',
        'Free Wi-Fi',
        'Audio Entertainment'
    ],

    'd1b2c3d4-e5f6-4002-8001-000000000004',

    '/images/transcar_white_highway.jpg',

    'Silver Liner',

    'Standard Executive'
),

(
    'b1b2c3d4-e5f6-4003-8001-000000000005',

    'KDB 456B',

    'TransCar VIP Toyota HiAce',

    'STANDARD_COACH',

    16,

    'AVAILABLE',

    'Ongata Rongai',

    '2026-12-31',

    '2026-12-31',

    '2026-08-01',

    142000,

    ARRAY[
        'Air Conditioning',
        'Night Ambience Lights',
        'USB-C Charging'
    ],

    NULL,

    '/images/transcar_night_travel.jpg',

    'Midnight Express',

    'Night Rider'
),

(
    'b1b2c3d4-e5f6-4003-8001-000000000006',

    'KDC 789C',

    'TransCar VIP Toyota HiAce',

    'STANDARD_COACH',

    16,

    'AVAILABLE',

    'Ongata Rongai',

    '2026-12-31',

    '2026-12-31',

    '2026-08-01',

    98000,

    ARRAY[
        'Air Conditioning',
        'High-Speed Wi-Fi',
        'Leather Recliners'
    ],

    NULL,

    '/images/executive_shuttle_van.jpg',

    'Executive Shuttle',

    'Galaxy Business Class'
)

ON CONFLICT (registration_number) DO NOTHING;


-- =============================================================================
-- 50. LINK DRIVERS TO VEHICLES
-- =============================================================================

UPDATE public.drivers

SET assigned_vehicle_id =
    'b1b2c3d4-e5f6-4003-8001-000000000001'

WHERE id =
    'd1b2c3d4-e5f6-4002-8001-000000000001';


UPDATE public.drivers

SET assigned_vehicle_id =
    'b1b2c3d4-e5f6-4003-8001-000000000002'

WHERE id =
    'd1b2c3d4-e5f6-4002-8001-000000000002';


UPDATE public.drivers

SET assigned_vehicle_id =
    'b1b2c3d4-e5f6-4003-8001-000000000003'

WHERE id =
    'd1b2c3d4-e5f6-4002-8001-000000000003';


UPDATE public.drivers

SET assigned_vehicle_id =
    'b1b2c3d4-e5f6-4003-8001-000000000004'

WHERE id =
    'd1b2c3d4-e5f6-4002-8001-000000000004';


-- =============================================================================
-- 51. SEED TRIPS
-- =============================================================================

INSERT INTO public.trips (
    id,
    trip_code,
    route_id,
    vehicle_id,
    driver_id,
    departure_time,
    estimated_arrival_time,
    fare_ksh,
    status,
    total_seats,
    available_seats,
    booked_seat_numbers,
    amenities
)

VALUES

(
    'c1b2c3d4-e5f6-4004-8001-000000000001',

    'TC-RN-KSI-0600',

    'a1b2c3d4-e5f6-4001-8001-000000000001',

    'b1b2c3d4-e5f6-4003-8001-000000000001',

    'd1b2c3d4-e5f6-4002-8001-000000000001',

    CURRENT_DATE + TIME '06:00:00',

    CURRENT_DATE + TIME '11:30:00',

    1500.00,

    'BOARDING',

    16,

    14,

    ARRAY[
        '1A',
        '1B'
    ]::TEXT[],

    ARRAY[
        'Air Conditioning',
        'Free Wi-Fi',
        'USB-C Charging'
    ]
),

(
    'c1b2c3d4-e5f6-4004-8001-000000000002',

    'TC-RN-SSW-0730',

    'a1b2c3d4-e5f6-4001-8001-000000000002',

    'b1b2c3d4-e5f6-4003-8001-000000000002',

    'd1b2c3d4-e5f6-4002-8001-000000000002',

    CURRENT_DATE + TIME '07:30:00',

    CURRENT_DATE + TIME '10:00:00',

    800.00,

    'SCHEDULED',

    16,

    15,

    ARRAY[
        '2A'
    ]::TEXT[],

    ARRAY[
        'Air Conditioning',
        'High-Speed Wi-Fi'
    ]
),

(
    'c1b2c3d4-e5f6-4004-8001-000000000003',

    'TC-RN-KSI-0900',

    'a1b2c3d4-e5f6-4001-8001-000000000001',

    'b1b2c3d4-e5f6-4003-8001-000000000003',

    'd1b2c3d4-e5f6-4002-8001-000000000003',

    CURRENT_DATE + TIME '09:00:00',

    CURRENT_DATE + TIME '14:30:00',

    1500.00,

    'SCHEDULED',

    16,

    16,

    ARRAY[]::TEXT[],

    ARRAY[
        'Air Conditioning',
        'Luggage Compartment'
    ]
),

(
    'c1b2c3d4-e5f6-4004-8001-000000000004',

    'TC-RN-HMB-1030',

    'a1b2c3d4-e5f6-4001-8001-000000000003',

    'b1b2c3d4-e5f6-4003-8001-000000000004',

    'd1b2c3d4-e5f6-4002-8001-000000000004',

    CURRENT_DATE + TIME '10:30:00',

    CURRENT_DATE + TIME '17:00:00',

    1800.00,

    'SCHEDULED',

    16,

    16,

    ARRAY[]::TEXT[],

    ARRAY[
        'Air Conditioning',
        'Audio Entertainment'
    ]
)

ON CONFLICT (trip_code) DO NOTHING;


-- =============================================================================
-- 52. ANNOUNCEMENTS
-- =============================================================================

INSERT INTO public.announcements (
    id,
    title,
    message,
    priority,
    target_audience,
    author_name,
    is_active
)

VALUES

(
    'e1b2c3d4-e5f6-4005-8001-000000000001',

    'Direct Ongata Rongai to Kisii Express Launches Daily',

    'TransCar Galaxy announces our daily direct service connecting Rongai commuters to Kisii via the Southern Bypass and Mai Mahiu corridor.',

    'NORMAL',

    'PUBLIC',

    'Fleet Operations Management',

    true
),

(
    'e1b2c3d4-e5f6-4005-8001-000000000002',

    'Mandatory NTSA Speed Calibration Compliance',

    'All assigned drivers must verify that telemetry and speed governors have received current monthly inspection before departure.',

    'URGENT',

    'ALL_DRIVERS',

    'Director of Safety & Compliance',

    true
)

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 53. SAMPLE EXPENSES
-- =============================================================================
-- These are inserted by SQL/service role.
-- Managers will be able to see them after authentication.
-- =============================================================================

INSERT INTO public.expenses (
    id,
    category,
    amount_ksh,
    recipient,
    receipt_number,
    notes,
    vehicle_id,
    vehicle_registration,
    approved_by,
    expense_date
)

VALUES

(
    'f1b2c3d4-e5f6-4006-8001-000000000001',

    'FUEL',

    8500.00,

    'Rubis Ongata Rongai Service Station',

    'REC-RUB-88910',

    'Full tank diesel for KDE 416Q prior to Kisii departure.',

    'b1b2c3d4-e5f6-4003-8001-000000000001',

    'KDE 416Q',

    'Operations Director',

    CURRENT_DATE
),

(
    'f1b2c3d4-e5f6-4006-8001-000000000002',

    'ROAD_TOLLS_FEES',

    1200.00,

    'Moja Expressway Company Limited',

    'REC-EXPR-44120',

    'Electronic toll card reload for Southern Bypass transit.',

    'b1b2c3d4-e5f6-4003-8001-000000000002',

    'KDV 149E',

    'Operations Director',

    CURRENT_DATE
)

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 54. SAMPLE REVENUE
-- =============================================================================

INSERT INTO public.revenue_records (
    id,
    category,
    amount_ksh,
    route_origin,
    route_destination,
    vehicle_registration,
    trip_code,
    description,
    record_date
)

VALUES

(
    'd2b2c3d4-e5f6-4007-8001-000000000001',

    'PASSENGER_TICKETS',

    3000.00,

    'Ongata Rongai (Galaxy Terminal)',

    'Kisii Express Terminal',

    'KDE 416Q',

    'TC-RN-KSI-0600',

    'Passenger booking seat reservations.',

    CURRENT_DATE
),

(
    'd2b2c3d4-e5f6-4007-8001-000000000002',

    'PARCEL_CARGO',

    1800.00,

    'Ongata Rongai (Galaxy Terminal)',

    'Narok Quickmart Transit Hub',

    'KDV 149E',

    'TC-RN-SSW-0730',

    'Expedited parcel consignments for Suswa and Narok commercial hubs.',

    CURRENT_DATE
)

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 55. FINAL SCHEMA VERIFICATION
-- =============================================================================

DO $$
DECLARE
    missing_count INTEGER;
BEGIN

    SELECT COUNT(*)

    INTO missing_count

    FROM (
        VALUES
            ('profiles'),
            ('drivers'),
            ('vehicles'),
            ('routes'),
            ('trips'),
            ('customers'),
            ('bookings'),
            ('tickets'),
            ('payments'),
            ('expenses'),
            ('revenue_records'),
            ('notifications'),
            ('announcements'),
            ('vehicle_inspections'),
            ('incident_reports'),
            ('audit_logs')
    ) AS expected(table_name)

    WHERE NOT EXISTS (
        SELECT 1

        FROM information_schema.tables t

        WHERE t.table_schema = 'public'

        AND t.table_name = expected.table_name
    );


    IF missing_count > 0 THEN

        RAISE EXCEPTION
            'TransCar Galaxy schema verification failed: % tables are missing.',
            missing_count;

    END IF;


    RAISE NOTICE
        '====================================================';

    RAISE NOTICE
        'TRANS CAR GALAXY DATABASE SETUP COMPLETE';

    RAISE NOTICE
        'All required public tables exist.';

    RAISE NOTICE
        'RLS is enabled.';

    RAISE NOTICE
        'Manager-only financial controls are configured.';

    RAISE NOTICE
        'Authentication profile trigger is configured.';

    RAISE NOTICE
        'Trip seat synchronization is configured.';

    RAISE NOTICE
        '====================================================';

END $$;