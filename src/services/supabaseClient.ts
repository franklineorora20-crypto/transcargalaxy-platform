/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read public environment variables for browser usage
const env = (import.meta as any).env || {};
const supabaseUrl = (env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseAnonKey.includes('your-anon-public-key')
);

// Create safe Supabase client for client-side authentication and RLS-protected queries
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-transcar.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Database interfaces representing the Supabase PostgreSQL tables
export interface DbProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'customer' | 'driver' | 'manager';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DbRoute {
  id: string;
  code: string;
  origin: string;
  destination: string;
  distance_km: number;
  estimated_duration_hours: number;
  base_fare_ksh: number;
  stops: any[];
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DbVehicle {
  id: string;
  registration_number: string;
  model: string;
  type: 'LUXURY_COACH' | 'EXECUTIVE_BUS' | 'STANDARD_COACH';
  seating_capacity: number;
  status: 'AVAILABLE' | 'ASSIGNED' | 'ON_TRIP' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  current_location: string;
  insurance_expiry: string;
  inspection_expiry: string;
  last_service_date: string;
  mileage_km: number;
  amenities: string[];
  assigned_driver_id?: string;
  image_url?: string;
  tagline?: string;
  special_edition?: string;
  created_at: string;
  updated_at: string;
}

export interface DbDriver {
  id: string;
  profile_id?: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  assigned_vehicle_id?: string;
  total_trips_completed: number;
  rating: number;
  joined_date: string;
  created_at: string;
  updated_at: string;
}

export interface DbTrip {
  id: string;
  trip_code: string;
  route_id: string;
  vehicle_id: string;
  driver_id: string;
  departure_time: string;
  estimated_arrival_time: string;
  actual_departure_time?: string;
  actual_arrival_time?: string;
  fare_ksh: number;
  status: 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'IN_TRANSIT' | 'AT_STOP' | 'DELAYED' | 'ARRIVED' | 'CANCELLED';
  current_stop?: string;
  delay_minutes: number;
  delay_reason?: string;
  total_seats: number;
  available_seats: number;
  booked_seat_numbers: string[];
  current_location_coords?: { lat: number; lng: number };
  amenities: string[];
  created_at: string;
  updated_at: string;
}

export interface DbBooking {
  id: string;
  booking_reference: string;
  customer_id?: string;
  user_id?: string;
  trip_id: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  total_fare_ksh: number;
  booking_status: 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED' | 'REFUNDED' | 'PENDING_PAYMENT';
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  payment_method: 'MPESA';
  mpesa_transaction_code?: string;
  pickup_point?: string;
  dropoff_point?: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export interface DbTicket {
  id: string;
  ticket_number: string;
  booking_id: string;
  trip_id: string;
  passenger_name: string;
  passenger_id_number?: string;
  passenger_phone?: string;
  seat_number: string;
  seat_class: string;
  fare_ksh: number;
  qr_code: string;
  status: 'ISSUED' | 'VALIDATED' | 'BOARDED' | 'CANCELLED';
  has_boarded: boolean;
  boarded_at?: string;
  boarded_by_driver_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DbExpense {
  id: string;
  category: 'FUEL' | 'VEHICLE_MAINTENANCE' | 'STAFF_SALARIES' | 'INSURANCE_LICENSING' | 'ROAD_TOLLS_FEES' | 'OFFICE_UTILITIES' | 'SUPPLIER_PAYMENTS';
  amount_ksh: number;
  recipient: string;
  receipt_number: string;
  notes?: string;
  vehicle_id?: string;
  vehicle_registration?: string;
  recorded_by?: string;
  approved_by: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface DbRevenueRecord {
  id: string;
  category: string;
  amount_ksh: number;
  booking_id?: string;
  trip_id?: string;
  route_origin?: string;
  route_destination?: string;
  vehicle_registration?: string;
  trip_code?: string;
  description: string;
  record_date: string;
  created_at: string;
}

export interface DbAnnouncement {
  id: string;
  title: string;
  message: string;
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  target_audience: 'ALL_DRIVERS' | 'SPECIFIC_ROUTE' | 'ALL_STAFF' | 'PUBLIC';
  author_id?: string;
  author_name: string;
  is_active: boolean;
  created_at: string;
}

export interface DbNotification {
  id: string;
  recipient_profile_id?: string;
  recipient_role?: 'customer' | 'driver' | 'manager';
  title: string;
  message: string;
  type: 'INFO' | 'ALERT' | 'TRIP_UPDATE' | 'PAYMENT' | 'EMERGENCY';
  is_read: boolean;
  metadata?: any;
  created_at: string;
}
