-- =============================================================================
-- TransCar Galaxy - Production Seed Data for Supabase
-- Realistic Nairobi - Ongata Rongai - Kisii - Suswa transport network
-- =============================================================================

-- 1. SEED ROUTES
INSERT INTO public.routes (id, code, origin, destination, distance_km, estimated_duration_hours, base_fare_ksh, stops, is_active, description)
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
      {"id": "stp-1", "name": "Ongata Rongai Main Station", "order": 1, "distanceFromOriginKm": 0, "estimatedMinutes": 0},
      {"id": "stp-2", "name": "Nairobi Expressway Southern Bypass", "order": 2, "distanceFromOriginKm": 18, "estimatedMinutes": 25},
      {"id": "stp-3", "name": "Mai Mahiu Escarpment", "order": 3, "distanceFromOriginKm": 65, "estimatedMinutes": 75},
      {"id": "stp-4", "name": "Narok Quickmart Transit Hub", "order": 4, "distanceFromOriginKm": 145, "estimatedMinutes": 150},
      {"id": "stp-5", "name": "Bomet Green Square", "order": 5, "distanceFromOriginKm": 235, "estimatedMinutes": 240},
      {"id": "stp-6", "name": "Kisii Central Express Terminal", "order": 6, "distanceFromOriginKm": 310, "estimatedMinutes": 330}
    ]'::jsonb,
    true,
    'Flagship corridor connecting Rongai commuters directly to Kisii without downtown CBD congestion.'
  ),
  (
    'a1b2c3d4-e5f6-4001-8001-000000000002',
    'SL-RN-SSW-02',
    'Ongata Rongai (Galaxy Terminal)',
    'Suswa / Narok Intercity',
    145.00,
    2.50,
    800.00,
    '[
      {"id": "stp-201", "name": "Ongata Rongai Maasai Mall", "order": 1, "distanceFromOriginKm": 0, "estimatedMinutes": 0},
      {"id": "stp-202", "name": "Ngong Hills Viewpoint", "order": 2, "distanceFromOriginKm": 22, "estimatedMinutes": 30},
      {"id": "stp-203", "name": "Suswa SGR Junction", "order": 3, "distanceFromOriginKm": 78, "estimatedMinutes": 80},
      {"id": "stp-204", "name": "Narok Town Gate", "order": 4, "distanceFromOriginKm": 145, "estimatedMinutes": 150}
    ]'::jsonb,
    true,
    'Rapid high-frequency shuttle service for Rift Valley commerce and passenger connections.'
  ),
  (
    'a1b2c3d4-e5f6-4001-8001-000000000003',
    'SL-RN-HMB-03',
    'Ongata Rongai (Galaxy Terminal)',
    'Homa Bay Lakefront Pier',
    380.00,
    6.50,
    1800.00,
    '[
      {"id": "stp-301", "name": "Ongata Rongai Galaxy Terminal", "order": 1, "distanceFromOriginKm": 0, "estimatedMinutes": 0},
      {"id": "stp-302", "name": "Narok Town Transit", "order": 2, "distanceFromOriginKm": 145, "estimatedMinutes": 150},
      {"id": "stp-303", "name": "Kisii Junction", "order": 3, "distanceFromOriginKm": 310, "estimatedMinutes": 330},
      {"id": "stp-304", "name": "Oyugis Stage", "order": 4, "distanceFromOriginKm": 345, "estimatedMinutes": 360},
      {"id": "stp-305", "name": "Homa Bay Lakefront Pier", "order": 5, "distanceFromOriginKm": 380, "estimatedMinutes": 390}
    ]'::jsonb,
    true,
    'Lake region direct executive service with air conditioning and guaranteed seat selection.'
  ),
  (
    'a1b2c3d4-e5f6-4001-8001-000000000004',
    'SL-RN-MGR-04',
    'Ongata Rongai (Galaxy Terminal)',
    'Migori / Sirare Border',
    360.00,
    6.00,
    1700.00,
    '[
      {"id": "stp-401", "name": "Ongata Rongai Galaxy Terminal", "order": 1, "distanceFromOriginKm": 0, "estimatedMinutes": 0},
      {"id": "stp-402", "name": "Narok Rest Stop", "order": 2, "distanceFromOriginKm": 145, "estimatedMinutes": 150},
      {"id": "stp-403", "name": "Rongo Town", "order": 3, "distanceFromOriginKm": 320, "estimatedMinutes": 330},
      {"id": "stp-404", "name": "Migori Post Office Stage", "order": 4, "distanceFromOriginKm": 360, "estimatedMinutes": 360}
    ]'::jsonb,
    true,
    'Border gateway shuttle supporting cross-border trade, regional commuters, and corporate logistics.'
  )
ON CONFLICT (code) DO NOTHING;

-- 2. SEED DRIVERS
INSERT INTO public.drivers (id, name, email, phone, license_number, license_expiry, status, total_trips_completed, rating, joined_date)
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

-- 3. SEED VEHICLES
INSERT INTO public.vehicles (id, registration_number, model, type, seating_capacity, status, current_location, insurance_expiry, inspection_expiry, last_service_date, mileage_km, amenities, assigned_driver_id, image_url, tagline, special_edition)
VALUES
  (
    'v1b2c3d4-e5f6-4003-8001-000000000001',
    'KDE 416Q',
    'TransCar VIP Toyota HiAce',
    'STANDARD_COACH',
    16,
    'AVAILABLE',
    'Ongata Rongai',
    '2026-12-31',
    '2026-12-31',
    '2026-08-01',
    148200,
    ARRAY['Air Conditioning', 'Free Wi-Fi', 'Dual USB-C Ports', 'Speed Governor (80 km/h)'],
    'd1b2c3d4-e5f6-4002-8001-000000000001',
    '/images/transcar_highway_kde4160.jpg',
    'Galaxy Express Cruiser',
    'Galaxy Star Edition'
  ),
  (
    'v1b2c3d4-e5f6-4003-8001-000000000002',
    'KDV 149E',
    'TransCar VIP Toyota HiAce',
    'STANDARD_COACH',
    16,
    'AVAILABLE',
    'Ongata Rongai',
    '2026-12-31',
    '2026-12-31',
    '2026-08-01',
    122500,
    ARRAY['Air Conditioning', 'High-Speed Wi-Fi', 'Leather Bucket Seats'],
    'd1b2c3d4-e5f6-4002-8001-000000000002',
    '/images/transcar_stalker_kdv149e.jpg',
    'Highway Pioneer',
    'Stalker Line'
  ),
  (
    'v1b2c3d4-e5f6-4003-8001-000000000003',
    'KDE 832Y',
    'TransCar VIP Toyota HiAce',
    'STANDARD_COACH',
    16,
    'AVAILABLE',
    'Ongata Rongai',
    '2026-12-31',
    '2026-12-31',
    '2026-08-01',
    135800,
    ARRAY['Air Conditioning', 'Wi-Fi', 'Luggage Compartment'],
    'd1b2c3d4-e5f6-4002-8001-000000000003',
    '/images/transcar_kde832y_day.jpg',
    'Intercity Voyager',
    'Rongai Express'
  ),
  (
    'v1b2c3d4-e5f6-4003-8001-000000000004',
    'KDA 123A',
    'TransCar VIP Toyota HiAce',
    'STANDARD_COACH',
    16,
    'AVAILABLE',
    'Ongata Rongai',
    '2026-12-31',
    '2026-12-31',
    '2026-08-01',
    160000,
    ARRAY['Air Conditioning', 'Free Wi-Fi', 'Audio Entertainment'],
    'd1b2c3d4-e5f6-4002-8001-000000000004',
    '/images/transcar_white_highway.jpg',
    'Silver Liner',
    'Standard Executive'
  ),
  (
    'v1b2c3d4-e5f6-4003-8001-000000000005',
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
    ARRAY['Air Conditioning', 'Night Ambience Lights', 'USB-C Charging'],
    NULL,
    '/images/transcar_night_travel.jpg',
    'Midnight Express',
    'Night Rider'
  ),
  (
    'v1b2c3d4-e5f6-4003-8001-000000000006',
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
    ARRAY['Air Conditioning', 'High-Speed Wi-Fi', 'Leather Recliners'],
    NULL,
    '/images/executive_shuttle_van.jpg',
    'Executive Shuttle',
    'Galaxy Business Class'
  )
ON CONFLICT (registration_number) DO NOTHING;

-- Link driver assigned vehicles
UPDATE public.drivers SET assigned_vehicle_id = 'v1b2c3d4-e5f6-4003-8001-000000000001' WHERE id = 'd1b2c3d4-e5f6-4002-8001-000000000001';
UPDATE public.drivers SET assigned_vehicle_id = 'v1b2c3d4-e5f6-4003-8001-000000000002' WHERE id = 'd1b2c3d4-e5f6-4002-8001-000000000002';
UPDATE public.drivers SET assigned_vehicle_id = 'v1b2c3d4-e5f6-4003-8001-000000000003' WHERE id = 'd1b2c3d4-e5f6-4002-8001-000000000003';
UPDATE public.drivers SET assigned_vehicle_id = 'v1b2c3d4-e5f6-4003-8001-000000000004' WHERE id = 'd1b2c3d4-e5f6-4002-8001-000000000004';

-- 4. SEED SAMPLE TRIPS
INSERT INTO public.trips (id, trip_code, route_id, vehicle_id, driver_id, departure_time, estimated_arrival_time, fare_ksh, status, total_seats, available_seats, booked_seat_numbers, amenities)
VALUES
  (
    't1b2c3d4-e5f6-4004-8001-000000000001',
    'TC-RN-KSI-0600',
    'a1b2c3d4-e5f6-4001-8001-000000000001',
    'v1b2c3d4-e5f6-4003-8001-000000000001',
    'd1b2c3d4-e5f6-4002-8001-000000000001',
    CURRENT_DATE + TIME '06:00:00',
    CURRENT_DATE + TIME '11:30:00',
    1500.00,
    'BOARDING',
    16,
    14,
    ARRAY['1A', '1B']::text[],
    ARRAY['Air Conditioning', 'Free Wi-Fi', 'USB-C Charging']
  ),
  (
    't1b2c3d4-e5f6-4004-8001-000000000002',
    'TC-RN-SSW-0730',
    'a1b2c3d4-e5f6-4001-8001-000000000002',
    'v1b2c3d4-e5f6-4003-8001-000000000002',
    'd1b2c3d4-e5f6-4002-8001-000000000002',
    CURRENT_DATE + TIME '07:30:00',
    CURRENT_DATE + TIME '10:00:00',
    800.00,
    'SCHEDULED',
    16,
    15,
    ARRAY['2A']::text[],
    ARRAY['Air Conditioning', 'High-Speed Wi-Fi']
  ),
  (
    't1b2c3d4-e5f6-4004-8001-000000000003',
    'TC-RN-KSI-0900',
    'a1b2c3d4-e5f6-4001-8001-000000000001',
    'v1b2c3d4-e5f6-4003-8001-000000000003',
    'd1b2c3d4-e5f6-4002-8001-000000000003',
    CURRENT_DATE + TIME '09:00:00',
    CURRENT_DATE + TIME '14:30:00',
    1500.00,
    'SCHEDULED',
    16,
    16,
    ARRAY[]::text[],
    ARRAY['Air Conditioning', 'Luggage Compartment']
  ),
  (
    't1b2c3d4-e5f6-4004-8001-000000000004',
    'TC-RN-HMB-1030',
    'a1b2c3d4-e5f6-4001-8001-000000000003',
    'v1b2c3d4-e5f6-4003-8001-000000000004',
    'd1b2c3d4-e5f6-4002-8001-000000000004',
    CURRENT_DATE + TIME '10:30:00',
    CURRENT_DATE + TIME '17:00:00',
    1800.00,
    'SCHEDULED',
    16,
    16,
    ARRAY[]::text[],
    ARRAY['Air Conditioning', 'Audio Entertainment']
  )
ON CONFLICT (trip_code) DO NOTHING;

-- 5. SEED SAMPLE ANNOUNCEMENTS
INSERT INTO public.announcements (id, title, message, priority, target_audience, author_name, is_active)
VALUES
  (
    'e1b2c3d4-e5f6-4005-8001-000000000001',
    'Direct Ongata Rongai to Kisii Express Launches Daily',
    'TransCar Galaxy announces our daily non-stop service connecting Rongai commuters directly to Kisii via the Southern Bypass and Mai Mahiu corridor. Zero downtown traffic delays.',
    'NORMAL',
    'PUBLIC',
    'Fleet Operations Management',
    true
  ),
  (
    'e1b2c3d4-e5f6-4005-8001-000000000002',
    'Mandatory NTSA Speed Calibration Compliance',
    'All assigned drivers must verify that telemetry and 80 km/h speed governors have received current monthly stamp from the engineering workshop before departure.',
    'URGENT',
    'ALL_DRIVERS',
    'Director of Safety & Compliance',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 6. SEED SAMPLE EXPENSES (Strictly Manager Only)
INSERT INTO public.expenses (id, category, amount_ksh, recipient, receipt_number, notes, vehicle_id, vehicle_registration, approved_by, expense_date)
VALUES
  (
    'f1b2c3d4-e5f6-4006-8001-000000000001',
    'FUEL',
    8500.00,
    'Rubis Ongata Rongai Service Station',
    'REC-RUB-88910',
    'Full tank diesel for KDE 416Q prior to 06:00 AM Kisii departure',
    'v1b2c3d4-e5f6-4003-8001-000000000001',
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
    'Electronic toll card reload for Rongai - Southern Bypass transit',
    'v1b2c3d4-e5f6-4003-8001-000000000002',
    'KDV 149E',
    'Operations Director',
    CURRENT_DATE
  )
ON CONFLICT (id) DO NOTHING;

-- 7. SEED SAMPLE REVENUE RECORDS (Strictly Manager Only)
INSERT INTO public.revenue_records (id, category, amount_ksh, route_origin, route_destination, vehicle_registration, trip_code, description, record_date)
VALUES
  (
    'g1b2c3d4-e5f6-4007-8001-000000000001',
    'PASSENGER_TICKETS',
    3000.00,
    'Ongata Rongai (Galaxy Terminal)',
    'Kisii Express Terminal',
    'KDE 416Q',
    'TC-RN-KSI-0600',
    'M-Pesa passenger booking seat reservations (Seats 1A, 1B)',
    CURRENT_DATE
  ),
  (
    'g1b2c3d4-e5f6-4007-8001-000000000002',
    'PARCEL_CARGO',
    1800.00,
    'Ongata Rongai (Galaxy Terminal)',
    'Narok Quickmart Transit Hub',
    'KDV 149E',
    'TC-RN-SSW-0730',
    'Expedited parcel consignments for Suswa and Narok commercial hubs',
    CURRENT_DATE
  )
ON CONFLICT (id) DO NOTHING;
