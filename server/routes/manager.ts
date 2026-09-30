import crypto from 'crypto';
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import {
  supabaseAdmin,
  isSupabaseAdminConfigured,
  getSupabaseProfile,
  getSupabaseAuthStatus,
  supabaseAuth,
} from '../../lib/supabaseAdmin';
import {
  Announcement,
  Booking,
  Driver,
  ExpenseItem,
  MaintenanceRecord,
  Route,
  Trip,
  Vehicle,
} from '../../src/types';
import {
  type AuthUser,
  createLocalSession,
  requireManager,
} from '../middleware';
import {
  announcements,
  auditLogs,
  bookings,
  drivers,
  expenses,
  incidents,
  inspections,
  logAuditAction,
  maintenance,
  payroll,
  revenues,
  routes,
  trips,
  vehicles,
} from '../store';
import { createDriverAccount, validDriverPassword } from './driver';

const router = Router();

// =============================================================
// SUPABASE AUTH CONNECTION STATUS (PUBLIC DIAGNOSTIC)
// =============================================================

router.get('/api/auth/supabase-status', (_req, res) => {
  res.json(getSupabaseAuthStatus());
});

// =============================================================
// MANAGER LOGIN (STRICT SUPABASE AUTH)
// =============================================================

router.post('/api/auth/manager-login', async (req, res) => {
  const { email, password } = req.body;

  const identifier =
    typeof email === 'string'
      ? email.trim().toLowerCase()
      : '';

  const authEmail = identifier.includes('@')
    ? identifier
    : `${identifier}@transcarrongai.co.ke`;

  if (!identifier || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({
      error: 'Supabase Auth email and password are required.',
    });
  }

  // 1. When Supabase Auth is connected, ONLY Supabase Auth user credentials are accepted
  if (supabaseAuth) {
    let lastSupabaseError = 'Invalid Supabase Auth email or password.';
    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (error) {
        lastSupabaseError = error.message || lastSupabaseError;
      } else if (data?.user && data?.session) {
        const metadataRole = String(
          data.user.user_metadata?.role || '',
        ).toLowerCase();

        const profile = await getSupabaseProfile(
          data.session.access_token,
          data.user.id,
        );

        const role = metadataRole || String(profile?.role || '').toLowerCase();

        if (metadataRole === 'driver' || role === 'driver') {
          return res.status(403).json({
            error: 'This Supabase account is assigned the driver role and cannot access the Manager Portal.',
          });
        }

        const supaManagerUser: AuthUser = {
          userId: data.user.id,
          name:
            profile?.full_name ||
            data.user.user_metadata?.full_name ||
            data.user.email ||
            authEmail,
          email: data.user.email || authEmail,
          role: 'MANAGER',
        };
        const sessionToken = createLocalSession(supaManagerUser);

        logAuditAction(
          supaManagerUser.email,
          'MANAGER',
          'MANAGER_LOGIN',
          'AUTH',
          supaManagerUser.userId,
          'Manager authenticated via Supabase Auth',
        );

        return res.json({
          token: sessionToken,
          user: {
            id: supaManagerUser.userId,
            name: supaManagerUser.name,
            email: supaManagerUser.email,
            role: 'MANAGER',
          },
        });
      }
    } catch (err: any) {
      lastSupabaseError = err?.message || 'Unable to reach Supabase Auth server.';
    }

    return res.status(401).json({
      error: `Supabase Auth rejected login for ${authEmail}: ${lastSupabaseError}`,
    });
  }

  // 2. Automated test runner secret (only when INITIAL_MANAGER_PASSWORD is explicitly injected by test suite)
  const envManagerEmail = (process.env.INITIAL_MANAGER_EMAIL || '').trim().toLowerCase();
  const envManagerPassword = process.env.INITIAL_MANAGER_PASSWORD || '';

  if (envManagerPassword) {
    const isRecognizedManagerUser =
      !envManagerEmail || identifier === envManagerEmail || authEmail === envManagerEmail;

    const matchesEnvPassword =
      password.length === envManagerPassword.length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(envManagerPassword));

    if (isRecognizedManagerUser && matchesEnvPassword) {
      const managerUser: AuthUser = {
        userId: 'mgr-transcar-frankline',
        name: 'Director Frankline Orora',
        email: authEmail,
        role: 'MANAGER',
      };

      const sessionToken = createLocalSession(managerUser);

      logAuditAction(
        managerUser.email,
        'MANAGER',
        'MANAGER_LOGIN',
        'AUTH',
        managerUser.userId,
        'Manager authenticated via configured environment secret',
      );

      return res.json({
        token: sessionToken,
        user: {
          id: managerUser.userId,
          name: managerUser.name,
          email: managerUser.email,
          role: 'MANAGER',
        },
      });
    }

    return res.status(401).json({
      error: 'Invalid manager credentials.',
    });
  }

  return res.status(401).json({
    error:
      'Supabase Auth is not connected in this environment because VITE_SUPABASE_ANON_KEY is missing. Add VITE_SUPABASE_ANON_KEY (for project vjhztgdkvrqfhsilhpda.supabase.co) in Environment Variables / Secrets so your Supabase Auth credentials can be verified.',
  });
});

// =============================================================
// MANAGER DASHBOARD & REAL-TIME PERFORMANCE METRICS
// =============================================================

export function computeRealtimePerformanceMetrics(
  allTrips: Trip[],
  allBookings: Booking[],
  allVehicles: Vehicle[],
  allRevenues: any[],
  allExpenses: any[],
) {
  const totalTrips = allTrips.length;
  const completedTrips = allTrips.filter((t) => t.status === 'ARRIVED').length;
  const inTransitTrips = allTrips.filter((t) => t.status === 'IN_TRANSIT' || t.status === 'DEPARTED').length;
  const scheduledTrips = allTrips.filter((t) => t.status === 'SCHEDULED' || t.status === 'BOARDING').length;
  const cancelledTrips = allTrips.filter((t) => t.status === 'CANCELLED').length;
  const delayedTrips = allTrips.filter((t) => (t.delayMinutes || 0) > 0).length;
  const onTimeTrips = allTrips.filter((t) => (t.delayMinutes || 0) === 0).length;

  const tripCompletionRatePercent = totalTrips > 0
    ? Math.round(((completedTrips + inTransitTrips) / Math.max(1, totalTrips - cancelledTrips)) * 1000) / 10
    : 100;

  const onTimeDepartureRatePercent = totalTrips > 0
    ? Math.round((onTimeTrips / totalTrips) * 1000) / 10
    : 100;

  let totalSeatCapacityAcrossTrips = 0;
  let totalOccupiedSeatsAcrossTrips = 0;

  const capacityMetrics = {
    elevenSeater: { trips: 0, occupied: 0, total: 0, occupancyPercent: 0 },
    fourteenSeater: { trips: 0, occupied: 0, total: 0, occupancyPercent: 0 },
    sixteenSeater: { trips: 0, occupied: 0, total: 0, occupancyPercent: 0 },
  };

  allTrips.forEach((t) => {
    const capacity = t.totalSeats || t.vehicle?.seatingCapacity || 16;
    const occupied = Math.max(0, capacity - (t.availableSeats ?? 0));
    totalSeatCapacityAcrossTrips += capacity;
    totalOccupiedSeatsAcrossTrips += occupied;

    if (capacity <= 11) {
      capacityMetrics.elevenSeater.trips++;
      capacityMetrics.elevenSeater.occupied += occupied;
      capacityMetrics.elevenSeater.total += capacity;
    } else if (capacity <= 14) {
      capacityMetrics.fourteenSeater.trips++;
      capacityMetrics.fourteenSeater.occupied += occupied;
      capacityMetrics.fourteenSeater.total += capacity;
    } else {
      capacityMetrics.sixteenSeater.trips++;
      capacityMetrics.sixteenSeater.occupied += occupied;
      capacityMetrics.sixteenSeater.total += capacity;
    }
  });

  if (capacityMetrics.elevenSeater.total > 0) {
    capacityMetrics.elevenSeater.occupancyPercent =
      Math.round((capacityMetrics.elevenSeater.occupied / capacityMetrics.elevenSeater.total) * 1000) / 10;
  }
  if (capacityMetrics.fourteenSeater.total > 0) {
    capacityMetrics.fourteenSeater.occupancyPercent =
      Math.round((capacityMetrics.fourteenSeater.occupied / capacityMetrics.fourteenSeater.total) * 1000) / 10;
  }
  if (capacityMetrics.sixteenSeater.total > 0) {
    capacityMetrics.sixteenSeater.occupancyPercent =
      Math.round((capacityMetrics.sixteenSeater.occupied / capacityMetrics.sixteenSeater.total) * 1000) / 10;
  }

  const averageSeatOccupancyPercent = totalSeatCapacityAcrossTrips > 0
    ? Math.round((totalOccupiedSeatsAcrossTrips / totalSeatCapacityAcrossTrips) * 1000) / 10
    : 88.5;

  const totalVehicles = allVehicles.length || 1;
  const activeBuses = allVehicles.filter((v) => v.status === 'ON_TRIP').length;
  const availableBuses = allVehicles.filter((v) => v.status === 'AVAILABLE').length;
  const fleetUtilizationRatePercent = Math.round((activeBuses / totalVehicles) * 1000) / 10;
  const fleetReadinessRatePercent = Math.round(((activeBuses + availableBuses) / totalVehicles) * 1000) / 10;

  const totalPassengers = allBookings.reduce((sum, b) => sum + (b.passengers?.length || 1), 0);
  const totalRevenue = allRevenues.reduce((sum, r) => sum + r.amountKsh, 0) || 890000;
  const avgRevenuePerTripKsh = Math.round(totalRevenue / Math.max(1, totalTrips));
  const avgRevenuePerPassengerKsh = Math.round(totalRevenue / Math.max(1, totalPassengers));

  return {
    tripCompletionRatePercent,
    onTimeDepartureRatePercent,
    averageSeatOccupancyPercent,
    totalSeatCapacityAcrossTrips,
    totalOccupiedSeatsAcrossTrips,
    completedTripsCount: completedTrips,
    inTransitTripsCount: inTransitTrips,
    scheduledTripsCount: scheduledTrips,
    delayedTripsCount: delayedTrips,
    cancelledTripsCount: cancelledTrips,
    fleetUtilizationRatePercent,
    fleetReadinessRatePercent,
    avgRevenuePerTripKsh,
    avgRevenuePerPassengerKsh,
    totalPassengerVolume: totalPassengers,
    capacityMetrics,
  };
}

router.get('/api/manager/dashboard-stats', requireManager, (_req, res) => {
  const activeBuses = vehicles.filter((v) => v.status === 'ON_TRIP').length;
  const availableBuses = vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const maintenanceBuses = vehicles.filter((v) => v.status === 'MAINTENANCE').length;

  const activeTripsCount = trips.filter(
    (t) =>
      t.status === 'IN_TRANSIT' ||
      t.status === 'BOARDING' ||
      t.status === 'DEPARTED',
  ).length;

  const delayedTripsCount = trips.filter((t) => (t.delayMinutes || 0) > 0).length;

  const totalPassengers = bookings.reduce(
    (sum, b) => sum + (b.passengers?.length || 1),
    0,
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const todayRevenue = revenues
    .filter((r) => r.date === todayStr)
    .reduce((sum, r) => sum + r.amountKsh, 0);

  const totalRevenue = revenues.reduce((sum, r) => sum + r.amountKsh, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountKsh, 0);
  const netResult = totalRevenue - totalExpenses;
  const pendingPayments = bookings.filter((b) => b.paymentStatus === 'PENDING').length;

  const performance = computeRealtimePerformanceMetrics(
    trips,
    bookings,
    vehicles,
    revenues,
    expenses,
  );

  res.json({
    operational: {
      activeBuses,
      availableBuses,
      maintenanceBuses,
      totalVehicles: vehicles.length,
      activeTripsCount,
      delayedTripsCount,
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter((d) => d.status === 'ACTIVE').length,
      totalPassengers,
      totalBookings: bookings.length,
    },
    financial: {
      todayRevenueKsh: todayRevenue || 185300,
      weeklyRevenueKsh: totalRevenue,
      monthlyRevenueKsh: totalRevenue * 3.8,
      totalExpensesKsh: totalExpenses,
      netResultKsh: netResult,
      pendingPayments,
      netMarginPercent:
        totalRevenue > 0 ? Math.round((netResult / totalRevenue) * 100) : 0,
    },
    performance,
  });
});

router.get('/api/manager/performance-metrics', requireManager, (_req, res) => {
  const performance = computeRealtimePerformanceMetrics(
    trips,
    bookings,
    vehicles,
    revenues,
    expenses,
  );
  res.json(performance);
});

// =============================================================
// FLEET MANAGEMENT
// =============================================================

router.get('/api/manager/fleet', requireManager, (_req, res) => {
  res.json(vehicles);
});

router.post('/api/manager/fleet', requireManager, (req, res) => {
  const {
    registrationNumber,
    model,
    type,
    seatingCapacity,
    amenities,
  } = req.body;

  if (!registrationNumber || !model) {
    return res.status(400).json({
      error: 'Registration number and model required.',
    });
  }

  const newVehicle: Vehicle = {
    id: `veh-${Date.now()}`,
    registrationNumber: registrationNumber.toUpperCase().trim(),
    model,
    type: type || 'LUXURY_COACH',
    seatingCapacity: Number(seatingCapacity) || 49,
    status: 'AVAILABLE',
    currentLocation: 'Main Depot',
    insuranceExpiry: '2027-12-31',
    inspectionExpiry: '2027-11-30',
    lastServiceDate: new Date().toISOString().split('T')[0],
    mileageKm: 0,
    amenities: amenities || [
      'Wi-Fi',
      'Air Conditioning',
      'USB Charging',
      'Reclining Seats',
    ],
  };

  vehicles.push(newVehicle);

  const user = (req as any).user;

  logAuditAction(
    user.email,
    user.role,
    'CREATE_VEHICLE',
    'VEHICLE',
    newVehicle.id,
    `Added vehicle ${newVehicle.registrationNumber} (${newVehicle.model})`,
  );

  res.status(201).json(newVehicle);
});

router.patch('/api/manager/fleet/:id', requireManager, (req, res) => {
  const vehicle = vehicles.find((v) => v.id === req.params.id);

  if (!vehicle) {
    return res.status(404).json({
      error: 'Vehicle not found.',
    });
  }

  const { status, currentLocation, assignedDriverId } = req.body;
  const oldStatus = vehicle.status;

  if (status) {
    vehicle.status = status;
  }

  if (currentLocation) {
    vehicle.currentLocation = currentLocation;
  }

  if (assignedDriverId !== undefined) {
    vehicle.assignedDriverId = assignedDriverId;
  }

  const user = (req as any).user;

  logAuditAction(
    user.email,
    user.role,
    'UPDATE_VEHICLE',
    'VEHICLE',
    vehicle.id,
    `Updated vehicle ${vehicle.registrationNumber} status from ${oldStatus} to ${vehicle.status}`,
  );

  res.json(vehicle);
});

// =============================================================
// DRIVER MANAGEMENT
// =============================================================

router.get('/api/manager/drivers', requireManager, (_req, res) => {
  res.json(drivers);
});

router.post('/api/manager/drivers', requireManager, (req, res) => {
  const {
    name,
    email,
    phone,
    licenseNumber,
    licenseExpiry,
    password,
  } = req.body;

  if (
    !name ||
    !email ||
    !phone ||
    !licenseNumber ||
    !licenseExpiry ||
    !validDriverPassword(password)
  ) {
    return res.status(400).json({
      error:
        'Name, email, phone, licence details, and a password of at least 12 characters are required.',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedLicense = String(licenseNumber).trim().toUpperCase();

  if (
    drivers.some(
      (driver) =>
        driver.email.toLowerCase() === normalizedEmail ||
        driver.licenseNumber.toUpperCase() === normalizedLicense,
    )
  ) {
    return res.status(409).json({
      error: 'A driver with that email or licence number already exists.',
    });
  }

  createDriverAccount({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
    phone: String(phone).trim(),
    licenseNumber: normalizedLicense,
    licenseExpiry: String(licenseExpiry),
  })
    .then(({ user: authUser }) => {
      const newDriver: Driver = {
        id: authUser.id,
        name: String(name).trim(),
        email: normalizedEmail,
        phone: String(phone).trim(),
        licenseNumber: normalizedLicense,
        licenseExpiry: String(licenseExpiry),
        status: 'ACTIVE',
        totalTripsCompleted: 0,
        rating: 5,
        joinedDate: new Date().toISOString().slice(0, 10),
      };

      drivers.push(newDriver);

      const manager = (req as any).user;

      logAuditAction(
        manager.email,
        manager.role,
        'CREATE_DRIVER',
        'DRIVER',
        newDriver.id,
        `Registered driver account ${newDriver.name} (${newDriver.licenseNumber})`,
      );

      res.status(201).json(newDriver);
    })
    .catch((error: any) =>
      res.status(400).json({
        error: error.message || 'Unable to create driver account.',
      }),
    );
});

router.patch('/api/manager/drivers/:id', requireManager, (req, res) => {
  const driver = drivers.find((d) => d.id === req.params.id);

  if (!driver) {
    return res.status(404).json({
      error: 'Driver not found.',
    });
  }

  const { status, assignedVehicleId, phone } = req.body;

  if (status) {
    driver.status = status;
  }

  if (assignedVehicleId !== undefined) {
    driver.assignedVehicleId = assignedVehicleId;
  }

  if (phone) {
    driver.phone = phone;
  }

  const user = (req as any).user;

  logAuditAction(
    user.email,
    user.role,
    'UPDATE_DRIVER',
    'DRIVER',
    driver.id,
    `Updated driver profile for ${driver.name}`,
  );

  res.json(driver);
});

router.delete('/api/manager/drivers/:id', requireManager, async (req, res) => {
  const index = drivers.findIndex((driver) => driver.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      error: 'Driver not found.',
    });
  }

  const driver = drivers[index];

  const hasActiveTrip = trips.some(
    (trip) =>
      trip.driverId === driver.id &&
      !['ARRIVED', 'CANCELLED'].includes(trip.status),
  );

  if (hasActiveTrip) {
    return res.status(409).json({
      error:
        'This driver is assigned to an active trip and cannot be removed.',
    });
  }

  if (supabaseAdmin && isSupabaseAdminConfigured) {
    const { data: dbDriver } = await supabaseAdmin
      .from('drivers')
      .select('profile_id')
      .eq('email', driver.email)
      .maybeSingle();

    if (dbDriver?.profile_id) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(
        dbDriver.profile_id,
      );

      if (error) {
        return res.status(400).json({
          error: error.message,
        });
      }
    }
  }

  drivers.splice(index, 1);

  const manager = (req as any).user;

  logAuditAction(
    manager.email,
    manager.role,
    'REMOVE_DRIVER',
    'DRIVER',
    driver.id,
    `Removed driver ${driver.name} (${driver.email})`,
  );

  res.json({
    message: 'Driver account removed.',
  });
});

// =============================================================
// ROUTE MANAGEMENT
// =============================================================

router.get('/api/manager/routes', requireManager, (_req, res) => {
  res.json(routes);
});

router.post('/api/manager/routes', requireManager, (req, res) => {
  const {
    origin,
    destination,
    distanceKm,
    estimatedDurationHours,
    baseFareKsh,
    description,
    stops,
  } = req.body;

  if (!origin || !destination || !baseFareKsh) {
    return res.status(400).json({
      error: 'Origin, destination, and base fare are required.',
    });
  }

  const code = `R-${Math.floor(100 + Math.random() * 900)}`;

  const newRoute: Route = {
    id: `route-${Date.now()}`,
    code,
    origin,
    destination,
    distanceKm: Number(distanceKm) || 300,
    estimatedDurationHours: Number(estimatedDurationHours) || 5,
    baseFareKsh: Number(baseFareKsh),
    isActive: true,
    description:
      description ||
      `Express connection between ${origin} and ${destination}`,
    stops: stops || [
      {
        id: `st-orig-${Date.now()}`,
        name: `${origin} Central Stage`,
        order: 1,
        distanceFromOriginKm: 0,
        estimatedMinutes: 0,
      },
      {
        id: `st-dest-${Date.now()}`,
        name: `${destination} Terminal`,
        order: 2,
        distanceFromOriginKm: Number(distanceKm) || 300,
        estimatedMinutes: (Number(estimatedDurationHours) || 5) * 60,
      },
    ],
  };

  routes.push(newRoute);

  const user = (req as any).user;

  logAuditAction(
    user.email,
    user.role,
    'CREATE_ROUTE',
    'ROUTE',
    newRoute.id,
    `Created route ${newRoute.code}: ${origin} to ${destination}`,
  );

  res.status(201).json(newRoute);
});

router.patch('/api/manager/routes/:id', requireManager, (req, res) => {
  const route = routes.find((r) => r.id === req.params.id);

  if (!route) {
    return res.status(404).json({
      error: 'Route not found.',
    });
  }

  const {
    origin,
    destination,
    distanceKm,
    estimatedDurationHours,
    baseFareKsh,
    description,
    isActive,
    stops,
    updateScheduledTrips,
  } = req.body;

  const prevBaseFare = route.baseFareKsh;

  if (origin !== undefined) {
    route.origin = origin;
  }

  if (destination !== undefined) {
    route.destination = destination;
  }

  if (distanceKm !== undefined) {
    route.distanceKm = Number(distanceKm);
  }

  if (estimatedDurationHours !== undefined) {
    route.estimatedDurationHours = Number(estimatedDurationHours);
  }

  if (baseFareKsh !== undefined) {
    route.baseFareKsh = Number(baseFareKsh);
  }

  if (description !== undefined) {
    route.description = description;
  }

  if (isActive !== undefined) {
    route.isActive = Boolean(isActive);
  }

  if (stops !== undefined) {
    route.stops = stops;
  }

  let updatedTripsCount = 0;

  trips.forEach((t) => {
    if (t.routeId === route.id) {
      t.route = { ...route };

      if (
        updateScheduledTrips &&
        t.status === 'SCHEDULED' &&
        baseFareKsh !== undefined
      ) {
        t.fareKsh = Number(baseFareKsh);
        updatedTripsCount++;
      }
    }
  });

  const user = (req as any).user;

  const priceChangeNote =
    baseFareKsh !== undefined && Number(baseFareKsh) !== prevBaseFare
      ? ` Base fare updated from KES ${prevBaseFare} to KES ${baseFareKsh} (${updatedTripsCount} future departures synced).`
      : '';

  logAuditAction(
    user.email,
    user.role,
    'UPDATE_ROUTE',
    'ROUTE',
    route.id,
    `Updated route ${route.code} (${route.origin} → ${route.destination}).${priceChangeNote}`,
  );

  res.json({
    route,
    updatedTripsCount,
    message: 'Route updated successfully.',
  });
});

router.delete('/api/manager/routes/:id', requireManager, (req, res) => {
  const index = routes.findIndex((r) => r.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      error: 'Route not found.',
    });
  }

  const route = routes[index];
  route.isActive = false;

  const user = (req as any).user;

  logAuditAction(
    user.email,
    user.role,
    'DEACTIVATE_ROUTE',
    'ROUTE',
    route.id,
    `Deactivated route ${route.code}`,
  );

  res.json({
    message: `Route ${route.code} deactivated successfully.`,
    route,
  });
});

// =============================================================
// BATCH PRICING
// =============================================================

router.post('/api/manager/pricing/adjust', requireManager, (req, res) => {
  const { routeId, adjustmentType, amount, updateTrips } = req.body;

  const route = routes.find((r) => r.id === routeId);

  if (!route) {
    return res.status(404).json({
      error: 'Route not found',
    });
  }

  const prevFare = route.baseFareKsh;
  let newFare = prevFare;

  if (adjustmentType === 'SET') {
    newFare = Math.max(50, Number(amount));
  } else if (adjustmentType === 'PERCENT') {
    newFare = Math.round(prevFare * (1 + Number(amount) / 100));
  } else if (adjustmentType === 'FIXED') {
    newFare = Math.max(50, prevFare + Number(amount));
  }

  route.baseFareKsh = newFare;

  let updatedTrips = 0;

  if (updateTrips) {
    trips.forEach((t) => {
      if (t.routeId === route.id && t.status === 'SCHEDULED') {
        t.fareKsh = newFare;
        t.route.baseFareKsh = newFare;
        updatedTrips++;
      }
    });
  }

  const user = (req as any).user;

  logAuditAction(
    user.email,
    user.role,
    'ADJUST_PRICING',
    'ROUTE',
    route.id,
    `Price adjusted for ${route.code} (${route.origin} - ${route.destination}) from KES ${prevFare} to KES ${newFare} (${updatedTrips} trips updated)`,
  );

  res.json({
    success: true,
    route,
    prevFare,
    newFare,
    updatedTrips,
  });
});

// =============================================================
// TRIP MANAGEMENT
// =============================================================

router.get('/api/manager/trips', requireManager, (_req, res) => {
  res.json(trips);
});

router.post('/api/manager/trips', requireManager, (req, res) => {
  const {
    routeId,
    vehicleId,
    driverId,
    departureTime,
    fareKsh,
  } = req.body;

  if (!routeId || !vehicleId || !driverId || !departureTime) {
    return res.status(400).json({
      error: 'Route, vehicle, driver, and departure time are required.',
    });
  }

  const route = routes.find((r) => r.id === routeId);
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const driver = drivers.find((d) => d.id === driverId);

  if (!route || !vehicle || !driver) {
    return res.status(404).json({
      error: 'Route, vehicle, or driver not found.',
    });
  }

  if (
    vehicle.status === 'MAINTENANCE' ||
    vehicle.status === 'OUT_OF_SERVICE'
  ) {
    return res.status(400).json({
      error: `Conflict: Vehicle ${vehicle.registrationNumber} is currently in ${vehicle.status} status and cannot be scheduled.`,
    });
  }

  const depDate = new Date(departureTime);

  const hasDriverConflict = trips.some((t) => {
    if (
      t.driverId !== driverId ||
      t.status === 'ARRIVED' ||
      t.status === 'CANCELLED'
    ) {
      return false;
    }

    const tDep = new Date(t.departureTime);
    const diffHours =
      Math.abs(depDate.getTime() - tDep.getTime()) / (1000 * 60 * 60);

    return diffHours < 6;
  });

  if (hasDriverConflict) {
    return res.status(409).json({
      error: `Scheduling Conflict: Driver ${driver.name} is already assigned to an overlapping trip within this travel window.`,
    });
  }

  const estArrival = new Date(
    depDate.getTime() + route.estimatedDurationHours * 60 * 60 * 1000,
  ).toISOString();

  const tripCode = `TR-${route.origin.slice(0, 3).toUpperCase()}-${route.destination
    .slice(0, 3)
    .toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newTrip: Trip = {
    id: `trip-${Date.now()}`,
    tripCode,
    routeId: route.id,
    route,
    vehicleId: vehicle.id,
    vehicle,
    driverId: driver.id,
    driverName: driver.name,
    departureTime,
    estimatedArrivalTime: estArrival,
    fareKsh: Number(fareKsh) || route.baseFareKsh,
    status: 'SCHEDULED',
    delayMinutes: 0,
    totalSeats: vehicle.seatingCapacity,
    availableSeats: vehicle.seatingCapacity,
    bookedSeatNumbers: [],
    amenities: vehicle.amenities,
  };

  trips.push(newTrip);

  const user = (req as any).user;

  logAuditAction(
    user.email,
    user.role,
    'SCHEDULE_TRIP',
    'TRIP',
    newTrip.id,
    `Scheduled trip ${newTrip.tripCode} with bus ${vehicle.registrationNumber} & driver ${driver.name}`,
  );

  res.status(201).json(newTrip);
});

router.patch('/api/manager/trips/:id', requireManager, (req, res) => {
  const trip = trips.find((t) => t.id === req.params.id);

  if (!trip) {
    return res.status(404).json({
      error: 'Trip not found.',
    });
  }

  const {
    status,
    departureTime,
    delayMinutes,
    delayReason,
    fareKsh,
    vehicleId,
    driverId,
  } = req.body;

  const prevFare = trip.fareKsh;

  if (fareKsh !== undefined) {
    trip.fareKsh = Number(fareKsh);
  }

  if (status) {
    trip.status = status;
  }

  if (departureTime) {
    trip.departureTime = departureTime;
  }

  if (delayMinutes !== undefined) {
    trip.delayMinutes = delayMinutes;
  }

  if (delayReason !== undefined) {
    trip.delayReason = delayReason;
  }

  if (vehicleId) {
    const v = vehicles.find((veh) => veh.id === vehicleId);
    if (v) {
      trip.vehicleId = v.id;
      trip.vehicle = v;
    }
  }

  if (driverId) {
    const d = drivers.find((drv) => drv.id === driverId);
    if (d) {
      trip.driverId = d.id;
      trip.driverName = d.name;
    }
  }

  const user = (req as any).user;

  const fareChangeDetail =
    fareKsh !== undefined && Number(fareKsh) !== prevFare
      ? ` Fare price adjusted manually from KES ${prevFare} to KES ${fareKsh}.`
      : '';

  logAuditAction(
    user.email,
    user.role,
    'MODIFY_TRIP',
    'TRIP',
    trip.id,
    `Trip ${trip.tripCode} modified.${fareChangeDetail} Status: ${trip.status}`,
  );

  res.json(trip);
});

// =============================================================
// BOOKING MANAGEMENT
// =============================================================

router.get('/api/manager/bookings', requireManager, (_req, res) => {
  res.json(bookings);
});

router.patch('/api/manager/bookings/:id', requireManager, (req, res) => {
  const booking = bookings.find(
    (b) =>
      b.id === req.params.id || b.bookingReference === req.params.id,
  );

  if (!booking) {
    return res.status(404).json({
      error: 'Booking not found.',
    });
  }

  const { bookingStatus, paymentStatus, refundReason } = req.body;

  if (bookingStatus) {
    booking.bookingStatus = bookingStatus;
  }

  if (paymentStatus) {
    booking.paymentStatus = paymentStatus;
  }

  // Release seats on trip when booking is cancelled or refunded
  if (
    booking.bookingStatus === 'CANCELLED' ||
    booking.bookingStatus === 'REFUNDED' ||
    booking.paymentStatus === 'REFUNDED'
  ) {
    const trip = trips.find(
      (t) => t.id === booking.tripId || t.tripCode === booking.tripCode,
    );
    if (trip) {
      const releasedSeats = booking.passengers.map((p) =>
        String(p.seatNumber).trim().toUpperCase(),
      );
      trip.bookedSeatNumbers = trip.bookedSeatNumbers.filter(
        (s) => !releasedSeats.includes(String(s).trim().toUpperCase()),
      );
      trip.availableSeats = Math.max(
        0,
        trip.totalSeats - trip.bookedSeatNumbers.length,
      );
    }
    booking.passengers.forEach((p) => {
      p.ticketStatus =
        booking.bookingStatus === 'REFUNDED' || booking.paymentStatus === 'REFUNDED'
          ? 'REFUNDED'
          : 'CANCELLED';
    });
  }

  if (paymentStatus === 'REFUNDED' || bookingStatus === 'REFUNDED') {
    const user = (req as any).user;

    logAuditAction(
      user.email,
      user.role,
      'PROCESS_REFUND',
      'BOOKING',
      booking.bookingReference,
      `Processed refund of KES ${booking.totalFareKsh} for ref ${booking.bookingReference}. Reason: ${refundReason || 'Customer cancellation'}`,
    );
  }

  res.json(booking);
});

// =============================================================
// MANAGER FINANCE
// =============================================================

router.get('/api/manager/finance/revenue', requireManager, (_req, res) => {
  res.json(revenues);
});

router.get('/api/manager/finance/expenses', requireManager, (_req, res) => {
  res.json(expenses);
});

router.post('/api/manager/finance/expenses', requireManager, (req, res) => {
  const {
    category,
    amountKsh,
    vehicleRegistration,
    recipient,
    receiptNumber,
    notes,
  } = req.body;

  if (!category || !amountKsh || !recipient) {
    return res.status(400).json({
      error: 'Category, amount, and recipient are required.',
    });
  }

  const user = (req as any).user;

  const newExpense: ExpenseItem = {
    id: `exp-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    category,
    amountKsh: Number(amountKsh),
    vehicleRegistration,
    recipient,
    receiptNumber:
      receiptNumber || `RCP-${Math.floor(1000 + Math.random() * 9000)}`,
    notes: notes || '',
    approvedBy: user.name || 'Executive Manager',
  };

  expenses.unshift(newExpense);

  logAuditAction(
    user.email,
    user.role,
    'RECORD_EXPENSE',
    'EXPENSE',
    newExpense.id,
    `Recorded expense KES ${newExpense.amountKsh} [${newExpense.category}] to ${recipient}`,
  );

  res.status(201).json(newExpense);
});

// =============================================================
// PAYROLL
// =============================================================

router.get('/api/manager/finance/payroll', requireManager, (_req, res) => {
  res.json(payroll);
});

router.patch('/api/manager/finance/payroll/:id/pay', requireManager, (req, res) => {
  const item = payroll.find((p) => p.id === req.params.id);

  if (!item) {
    return res.status(404).json({
      error: 'Payroll item not found.',
    });
  }

  item.paymentStatus = 'PAID';
  item.paymentDate = new Date().toISOString().split('T')[0];

  const user = (req as any).user;

  logAuditAction(
    user.email,
    user.role,
    'DISBURSE_PAYROLL',
    'PAYROLL',
    item.id,
    `Disbursed salary of KES ${item.netPayKsh} to ${item.employeeName} (${item.role})`,
  );

  res.json(item);
});

// =============================================================
// PROFIT & LOSS
// =============================================================

router.get('/api/manager/finance/profit-loss', requireManager, (_req, res) => {
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amountKsh, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountKsh, 0);

  const expensesByCategory: Record<string, number> = {};
  for (const exp of expenses) {
    expensesByCategory[exp.category] =
      (expensesByCategory[exp.category] || 0) + exp.amountKsh;
  }

  const revenuesByCategory: Record<string, number> = {};
  for (const rev of revenues) {
    revenuesByCategory[rev.category] =
      (revenuesByCategory[rev.category] || 0) + rev.amountKsh;
  }

  res.json({
    summary: {
      totalRevenueKsh: totalRevenue,
      totalExpensesKsh: totalExpenses,
      netProfitKsh: totalRevenue - totalExpenses,
      netProfitMarginPercent:
        totalRevenue > 0
          ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100)
          : 0,
    },
    revenuesByCategory,
    expensesByCategory,
    revenues,
    expenses,
  });
});

// =============================================================
// MAINTENANCE
// =============================================================

router.get('/api/manager/maintenance', requireManager, (_req, res) => {
  res.json(maintenance);
});

router.post('/api/manager/maintenance', requireManager, (req, res) => {
  const {
    vehicleId,
    issue,
    type,
    costKsh,
    serviceProvider,
    nextServiceDate,
    notes,
  } = req.body;

  const vehicle = vehicles.find((v) => v.id === vehicleId);

  if (!vehicle || !issue) {
    return res.status(400).json({
      error: 'Vehicle and issue description are required.',
    });
  }

  const newRecord: MaintenanceRecord = {
    id: `maint-${Date.now()}`,
    vehicleId: vehicle.id,
    vehicleRegistration: vehicle.registrationNumber,
    issue,
    type: type || 'SCHEDULED_SERVICE',
    date: new Date().toISOString().split('T')[0],
    costKsh: Number(costKsh) || 0,
    serviceProvider: serviceProvider || 'Central Fleet Workshop',
    nextServiceDate: nextServiceDate || '2027-01-01',
    status: 'IN_PROGRESS',
    notes: notes || '',
  };

  maintenance.unshift(newRecord);
  vehicle.status = 'MAINTENANCE';

  const user = (req as any).user;

  logAuditAction(
    user.email,
    user.role,
    'LOG_MAINTENANCE',
    'MAINTENANCE',
    newRecord.id,
    `Opened maintenance job on ${vehicle.registrationNumber}: ${issue}`,
  );

  res.status(201).json(newRecord);
});

// =============================================================
// INCIDENTS
// =============================================================

router.get('/api/manager/incidents', requireManager, (_req, res) => {
  res.json(incidents);
});

router.patch('/api/manager/incidents/:id', requireManager, (req, res) => {
  const incident = incidents.find((i) => i.id === req.params.id);

  if (!incident) {
    return res.status(404).json({
      error: 'Incident not found.',
    });
  }

  const { status, resolutionNotes } = req.body;

  if (status) {
    incident.status = status;
  }

  if (resolutionNotes) {
    incident.resolutionNotes = resolutionNotes;
  }

  const user = (req as any).user;

  logAuditAction(
    user.email,
    user.role,
    'RESOLVE_INCIDENT',
    'INCIDENT',
    incident.id,
    `Incident marked ${status}: ${resolutionNotes || ''}`,
  );

  res.json(incident);
});

// =============================================================
// INSPECTIONS
// =============================================================

router.get('/api/manager/inspections', requireManager, (_req, res) => {
  res.json(inspections);
});

// =============================================================
// ANNOUNCEMENTS
// =============================================================

router.post('/api/manager/announcements', requireManager, (req, res) => {
  const { title, message, priority, targetAudience } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      error: 'Title and message required.',
    });
  }

  const user = (req as any).user;

  const newAnn: Announcement = {
    id: `ann-${Date.now()}`,
    title,
    message,
    priority: priority || 'NORMAL',
    targetAudience: targetAudience || 'ALL_DRIVERS',
    createdAt: new Date().toISOString(),
    authorName: user.name || 'Fleet Management',
  };

  announcements.unshift(newAnn);

  logAuditAction(
    user.email,
    user.role,
    'BROADCAST_ANNOUNCEMENT',
    'ANNOUNCEMENT',
    newAnn.id,
    `Broadcast [${newAnn.priority}]: ${newAnn.title}`,
  );

  res.status(201).json(newAnn);
});

// =============================================================
// AUDIT LOGS
// =============================================================

router.get('/api/manager/audit-logs', requireManager, (_req, res) => {
  res.json(auditLogs);
});

// =============================================================
// LIVE OPERATIONS MAP
// =============================================================

router.get('/api/manager/live-map', requireManager, (_req, res) => {
  const activeBuses = trips.map((t) => ({
    tripId: t.id,
    tripCode: t.tripCode,
    route: `${t.route.origin} → ${t.route.destination}`,
    origin: t.route.origin,
    destination: t.route.destination,
    vehicleRegistration: t.vehicle.registrationNumber,
    vehicleModel: t.vehicle.model,
    driverName: t.driverName,
    status: t.status,
    speedKmH: t.status === 'IN_TRANSIT' ? 78 : 0,
    delayMinutes: t.delayMinutes,
    currentStop: t.currentStop || 'In Corridor',
    coordinates: t.currentLocationCoords || {
      lat: -1.286389,
      lng: 36.817223,
    },
    passengersOnboard: t.totalSeats - t.availableSeats,
    totalCapacity: t.totalSeats,
  }));

  res.json(activeBuses);
});

// =============================================================
// FINANCIAL CSV EXPORT
// =============================================================

router.get('/api/manager/export/financial-csv', requireManager, (_req, res) => {
  let csv =
    'Type,ID,Date,Category,Amount_KES,Vehicle,Description_or_Recipient\n';

  revenues.forEach((r) => {
    csv += `REVENUE,${r.id},${r.date},${r.category},${r.amountKsh},${r.vehicleRegistration || 'N/A'},"${r.description.replace(/"/g, '""')}"\n`;
  });

  expenses.forEach((e) => {
    csv += `EXPENSE,${e.id},${e.date},${e.category},-${e.amountKsh},${e.vehicleRegistration || 'N/A'},"${e.recipient.replace(/"/g, '""')}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="transcar-rongai-financial-ledger.csv"',
  );

  res.send(csv);
});

// =============================================================
// SUPABASE STATUS, SCHEMA & SEED
// =============================================================

router.get('/api/supabase/status', requireManager, (_req, res) => {
  const url = process.env.VITE_SUPABASE_URL || '';
  const maskedUrl =
    url && url !== 'https://your-project.supabase.co'
      ? url
      : 'Not Configured';

  res.json({
    configured: isSupabaseAdminConfigured,
    url: maskedUrl,
    schemaReady: true,
    provider: isSupabaseAdminConfigured
      ? 'Supabase PostgreSQL Cloud'
      : 'Local In-Memory Hybrid (Standby for Supabase)',
    tables: {
      routes: routes.length,
      vehicles: vehicles.length,
      drivers: drivers.length,
      trips: trips.length,
      bookings: bookings.length,
      expenses: expenses.length,
    },
  });
});

router.get('/api/supabase/schema', requireManager, (_req, res) => {
  try {
    const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');

    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      return res.send(sql);
    }

    res.status(404).send('-- Schema file not found');
  } catch (err: any) {
    res.status(500).send(`-- Error reading schema: ${err.message}`);
  }
});

router.post('/api/supabase/seed', requireManager, async (_req, res) => {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return res.json({
      success: true,
      message:
        'Supabase credentials in standby mode. Relational store is seeded locally.',
    });
  }

  try {
    const { count, error } = await supabaseAdmin
      .from('routes')
      .select('*', {
        count: 'exact',
        head: true,
      });

    if (error) {
      return res.status(500).json({
        error: error.message,
        details:
          'Please ensure migration has been run in Supabase SQL editor.',
      });
    }

    if ((count || 0) === 0) {
      for (const r of routes) {
        await supabaseAdmin.from('routes').upsert({
          code: r.code,
          origin: r.origin,
          destination: r.destination,
          distance_km: r.distanceKm,
          estimated_duration_hours: r.estimatedDurationHours,
          base_fare_ksh: r.baseFareKsh,
          stops: r.stops,
          is_active: r.isActive,
          description: r.description,
        });
      }
    }

    res.json({
      success: true,
      message:
        'Supabase relational database verified and seeded successfully.',
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
});

export default router;
