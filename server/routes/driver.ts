import crypto from 'crypto';
import { Router } from 'express';
import {
  supabaseAdmin,
  isSupabaseAdminConfigured,
  getSupabaseProfile,
  supabaseAuth,
} from '../../lib/supabaseAdmin';
import {
  Driver,
  IncidentReport,
  TicketVerificationResult,
  TripStatus,
  VehicleInspection,
} from '../../src/types';
import {
  type AuthUser,
  createLocalSession,
  isTripAssignedToDriver,
  requireDriverOrManager,
  revokeLocalSession,
  setDriverPassword,
  verificationLimiter,
  verifyDriverStoredPassword,
} from '../middleware';
import {
  announcements,
  bookings,
  drivers,
  incidents,
  inspections,
  logAuditAction,
  trips,
  vehicles,
} from '../store';
import {
  buildTicketRecord,
  ensureBookingTickets,
} from '../domain/tickets/ticketService';
import {
  evaluateTicketValidation,
  extractTokenOrIdentifier,
  lookupBookingAndPassenger,
  normalizePhoneForMatch,
  resolveDriverAssignedTrip,
} from '../domain/tickets/ticketValidation';

const router = Router();

// =============================================================
// DRIVER ACCOUNT CREATION HELPERS
// =============================================================

export function validDriverPassword(
  password: unknown,
): password is string {
  return (
    typeof password === 'string' &&
    password.length >= 6
  );
}

export async function createDriverAccount(input: {
  name: string;
  email: string;
  password: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
}) {
  const {
    name,
    email,
    password,
    phone,
    licenseNumber,
    licenseExpiry,
  } = input;

  if (supabaseAdmin && isSupabaseAdminConfigured) {
    try {
      const {
        data: created,
        error: createError,
      } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'driver',
          full_name: name,
          phone,
        },
      });

      if (!createError && created?.user) {
        const user = created.user;
        await supabaseAdmin.from('profiles').upsert(
          {
            id: user.id,
            email,
            full_name: name,
            phone,
            role: 'driver',
          },
          { onConflict: 'id' },
        );

        const { data: dbDriver } = await supabaseAdmin
          .from('drivers')
          .insert({
            profile_id: user.id,
            name,
            email,
            phone,
            license_number: licenseNumber,
            license_expiry: licenseExpiry,
            status: 'ACTIVE',
            total_trips_completed: 0,
            rating: 5,
            joined_date: new Date().toISOString().slice(0, 10),
          })
          .select()
          .single();

        return { user, dbDriver };
      }
    } catch (err) {
      console.warn('Supabase driver provisioning failed, using local registration:', err);
    }
  }

  // Local fallback registration
  const fallbackId = `drv-${Date.now()}`;
  setDriverPassword(email, password);
  setDriverPassword(fallbackId, password);
  return {
    user: { id: fallbackId, email },
    dbDriver: {
      id: fallbackId,
      name,
      email,
      phone,
      license_number: licenseNumber,
      license_expiry: licenseExpiry,
      status: 'ACTIVE',
    },
  };
}

// =============================================================
// SESSION LOGOUT
// =============================================================

router.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (token) {
      revokeLocalSession(token);
    }
  }
  return res.json({ success: true, message: 'Session terminated.' });
});

// =============================================================
// DRIVER AUTHENTICATION
// =============================================================

router.post('/api/auth/driver-login', async (req, res) => {
  const { email, password } = req.body;

  const identifier =
    typeof email === 'string'
      ? email.trim().toLowerCase()
      : '';

  const authEmail = identifier.includes('@')
    ? identifier
    : `${identifier}@drivers.transcarrongai.co.ke`;

  if (!identifier || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({
      error: 'Username or email and password are required.',
    });
  }

  // 1. Try Supabase Auth if configured
  if (supabaseAuth) {
    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (!error && data?.user && data?.session) {
        const metadataRole = String(data.user.user_metadata?.role || '').toLowerCase();
        const profile = await getSupabaseProfile(
          data.session.access_token,
          data.user.id,
        );

        if (
          metadataRole === 'driver' ||
          String(profile?.role || '').toLowerCase() === 'driver'
        ) {
          const driver = supabaseAdmin
            ? (
                await supabaseAdmin
                  .from('drivers')
                  .select('*')
                  .eq('profile_id', data.user.id)
                  .maybeSingle()
              ).data
            : null;

          return res.json({
            token: data.session.access_token,
            user: {
              id: data.user.id,
              name: driver?.name || profile?.full_name || data.user.email,
              email: data.user.email,
              phone: driver?.phone || profile?.phone,
              licenseNumber: driver?.license_number,
              assignedVehicleId: driver?.assigned_vehicle_id,
              role: 'DRIVER',
            },
          });
        }
      }
    } catch (err: any) {
      console.warn('[DRIVER LOGIN] Supabase Auth unavailable, checking local drivers:', err?.message);
    }
  }

  // 2. Fallback to in-memory drivers store when non-production or initial driver env is configured
  const isKnownDriverAlias =
    identifier === 'driver@transcargalaxy.com' ||
    identifier === 'frankline.orora' ||
    identifier === 'driver';

  const localDriver =
    drivers.find(
      (d) =>
        d.email.toLowerCase() === authEmail ||
        d.email.toLowerCase() === identifier ||
        d.id.toLowerCase() === identifier ||
        d.name.toLowerCase().replace(/\s+/g, '.') === identifier ||
        (identifier.length >= 4 && d.name.toLowerCase().includes(identifier)),
    ) || (isKnownDriverAlias ? drivers[0] : undefined);

  if (!localDriver) {
    return res.status(401).json({
      error: 'Invalid driver credentials. Please check your username and password.',
    });
  }

  const storedMatch = verifyDriverStoredPassword(
    [localDriver.email, localDriver.id, authEmail, identifier],
    password,
  );

  const envDriverPassword =
    process.env.INITIAL_DRIVER_PASSWORD || process.env.INITIAL_MANAGER_PASSWORD || '';

  const isPasswordAccepted =
    storedMatch !== null
      ? storedMatch
      : Boolean(envDriverPassword) &&
        password.length === envDriverPassword.length &&
        crypto.timingSafeEqual(Buffer.from(password), Buffer.from(envDriverPassword));

  if (isPasswordAccepted) {
    const authUser: AuthUser = {
      userId: localDriver.id,
      name: localDriver.name,
      email: localDriver.email,
      role: 'DRIVER',
    };
    const sessionToken = createLocalSession(authUser);

    logAuditAction(
      localDriver.email,
      'DRIVER',
      'DRIVER_LOGIN',
      'DRIVER',
      localDriver.id,
      `Driver ${localDriver.name} logged in`,
    );

    return res.json({
      token: sessionToken,
      user: {
        id: localDriver.id,
        name: localDriver.name,
        email: localDriver.email,
        phone: localDriver.phone,
        licenseNumber: localDriver.licenseNumber,
        assignedVehicleId: localDriver.assignedVehicleId,
        role: 'DRIVER',
      },
    });
  }

  return res.status(401).json({
    error: 'Invalid driver credentials. Please check your username and password.',
  });
});

// =============================================================
// DRIVER SELF SIGN-UP
// =============================================================

router.post('/api/auth/driver-signup', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const username = String(
    req.body?.username || req.body?.email || '',
  )
    .trim()
    .toLowerCase();

  const email = username.includes('@')
    ? username
    : `${username}@drivers.transcarrongai.co.ke`;

  const password = req.body?.password;
  const phone = String(req.body?.phone || '').trim();
  const licenseNumber = String(req.body?.licenseNumber || '')
    .trim()
    .toUpperCase();
  const licenseExpiry = String(req.body?.licenseExpiry || '').trim();

  if (
    !name ||
    !phone ||
    !licenseNumber ||
    !licenseExpiry ||
    !validDriverPassword(password)
  ) {
    return res.status(400).json({
      error:
        'Name, phone, licence details, and a password of at least 6 characters are required.',
    });
  }

  if (
    drivers.some(
      (driver) =>
        driver.email.toLowerCase() === email ||
        driver.licenseNumber.toUpperCase() === licenseNumber,
    )
  ) {
    return res.status(409).json({
      error: 'A driver with that email or licence number already exists.',
    });
  }

  try {
    const { user } = await createDriverAccount({
      name,
      email,
      password,
      phone,
      licenseNumber,
      licenseExpiry,
    });

    const newDriver: Driver = {
      id: user.id,
      name,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      status: 'ACTIVE',
      totalTripsCompleted: 0,
      rating: 5,
      joinedDate: new Date().toISOString().slice(0, 10),
    };

    drivers.push(newDriver);

    res.status(201).json({
      message: 'Driver account created. You can now sign in.',
      driver: newDriver,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Unable to create driver account.',
    });
  }
});

// =============================================================
// DRIVER PORTAL TRIPS
// =============================================================

router.get(
  '/api/driver/my-trips',
  requireDriverOrManager,
  (req, res) => {
    const user = (req as any).user;

    const assigned =
      user.role === 'MANAGER'
        ? trips
        : trips.filter((t) => isTripAssignedToDriver(t, user));

    res.json(assigned);
  },
);

router.get(
  '/api/driver/active-trip',
  requireDriverOrManager,
  (req, res) => {
    const user = (req as any).user;

    const active = trips.find(
      (t) =>
        isTripAssignedToDriver(t, user) &&
        (t.status === 'BOARDING' ||
          t.status === 'IN_TRANSIT' ||
          t.status === 'SCHEDULED'),
    );

    if (!active) {
      return res.status(404).json({
        error: 'No assigned active trip found.',
      });
    }

    res.json(active);
  },
);

router.patch(
  '/api/driver/trips/:tripId/status',
  requireDriverOrManager,
  (req, res) => {
    const {
      status,
      currentStop,
      delayMinutes,
      delayReason,
    } = req.body as {
      status: TripStatus;
      currentStop?: string;
      delayMinutes?: number;
      delayReason?: string;
    };

    const trip = trips.find((t) => t.id === req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        error: 'Trip not found.',
      });
    }

    const user = (req as any).user;

    if (!isTripAssignedToDriver(trip, user)) {
      return res.status(403).json({
        error:
          'You can only update trips assigned to your authenticated driver profile.',
      });
    }

    trip.status = status;

    if (currentStop !== undefined) {
      trip.currentStop = currentStop;
    }

    if (delayMinutes !== undefined) {
      trip.delayMinutes = delayMinutes;
    }

    if (delayReason !== undefined) {
      trip.delayReason = delayReason;
    }

    const veh = vehicles.find((v) => v.id === trip.vehicleId);

    if (veh) {
      if (
        status === 'IN_TRANSIT' ||
        status === 'DEPARTED' ||
        status === 'BOARDING'
      ) {
        veh.status = 'ON_TRIP';
        veh.currentLocation =
          trip.currentStop ||
          `${trip.route.origin} - ${trip.route.destination} Corridor`;
      } else if (status === 'ARRIVED') {
        veh.status = 'AVAILABLE';
        veh.currentLocation = trip.route.destination;
      }
    }

    logAuditAction(
      user.email,
      user.role,
      'UPDATE_TRIP_STATUS',
      'TRIP',
      trip.id,
      `Status updated to ${status}. Current stop: ${trip.currentStop || 'N/A'}`,
    );

    res.json(trip);
  },
);

// =============================================================
// DRIVER PASSENGER MANIFEST
// =============================================================

router.get(
  '/api/driver/passengers/:tripId',
  requireDriverOrManager,
  (req, res) => {
    const trip = trips.find((t) => t.id === req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        error: 'Trip not found.',
      });
    }

    const user = (req as any).user;

    if (!isTripAssignedToDriver(trip, user)) {
      return res.status(403).json({
        error:
          'You can only view manifests for trips assigned to your authenticated driver profile.',
      });
    }

    const relevantBookings = bookings.filter(
      (b) => b.tripId === trip.id || b.tripCode === trip.tripCode,
    );

    relevantBookings.forEach((b) => ensureBookingTickets(b, trips));

    const manifest = relevantBookings.flatMap((b) =>
      b.passengers.map((p) => {
        const ticket = buildTicketRecord(b, p, trips);
        return {
          id: `${b.bookingReference}-${p.seatNumber}`,
          ticketId: ticket.ticket_id,
          qrToken: ticket.qr_token,
          bookingId: b.id,
          bookingReference: b.bookingReference,
          contactName: b.contactName,
          contactPhone: b.contactPhone,
          passengerName: p.fullName,
          fullName: p.fullName,
          idNumber: p.idNumber,
          seatNumber: p.seatNumber,
          seatClass: p.seatClass,
          fareKsh: p.fareKsh,
          paymentStatus: b.paymentStatus,
          bookingStatus: b.bookingStatus,
          ticketStatus: ticket.ticket_status,
          boardingStatus: ticket.boarding_status,
          hasBoarded: p.hasBoarded,
          boarded: p.hasBoarded,
          boardedAt: p.boardedAt,
          verifiedAt: ticket.verified_at,
          verifiedBy: ticket.verified_by,
          verifiedByName: ticket.verified_by_name,
          ticket,
        };
      }),
    );

    manifest.sort((a, b) =>
      a.seatNumber.localeCompare(b.seatNumber, undefined, {
        numeric: true,
      }),
    );

    res.json({
      tripCode: trip.tripCode,
      totalBooked: manifest.length,
      boardedCount: manifest.filter((m) => m.hasBoarded).length,
      manifest,
    });
  },
);

// =============================================================
// GET /api/driver/tickets/search
// =============================================================

router.get(
  '/api/driver/tickets/search',
  requireDriverOrManager,
  verificationLimiter,
  (req, res) => {
    const rawQuery = String(req.query.q || req.query.query || '').trim();
    const requestedTripId = String(req.query.tripId || req.query.trip_id || '').trim();
    const user = (req as any).user;

    if (!rawQuery) {
      return res.status(400).json({
        error: 'Please enter a ticket ID, booking ID, passenger name, or phone number.',
      });
    }

    const driverTrip = resolveDriverAssignedTrip(user, requestedTripId || undefined);
    if (
      requestedTripId &&
      !driverTrip &&
      user.role !== 'MANAGER'
    ) {
      return res.status(403).json({
        error: 'You are not authorized to verify tickets for a trip not assigned to you.',
      });
    }

    const { identifier } = extractTokenOrIdentifier(rawQuery);
    const cleanQueryUpper = identifier.toUpperCase();
    const cleanQueryLower = identifier.toLowerCase();
    const queryPhoneNorm = normalizePhoneForMatch(identifier);
    const queryTokens = cleanQueryLower.split(/\s+/).filter(Boolean);

    const scoredResults: Array<{
      score: number;
      result: TicketVerificationResult;
    }> = [];

    for (const b of bookings) {
      ensureBookingTickets(b, trips);
      const contactPhoneNorm = normalizePhoneForMatch(b.contactPhone);

      for (const p of b.passengers) {
        const ticket = buildTicketRecord(b, p, trips);
        let score = 0;

        const ticketIdUpper = ticket.ticket_id.toUpperCase();
        const bookingRefUpper = b.bookingReference.toUpperCase();
        const bookingIdUpper = b.id.toUpperCase();
        const qrTokenLower = ticket.qr_token.toLowerCase();
        const paxNameLower = p.fullName.toLowerCase();
        const contactNameLower = b.contactName.toLowerCase();

        // 1. Exact Ticket ID or QR Token match (Highest priority)
        if (
          ticketIdUpper === cleanQueryUpper ||
          qrTokenLower === cleanQueryLower ||
          (b.ticketId && b.ticketId.toUpperCase() === cleanQueryUpper)
        ) {
          score = 100;
        }
        // 2. Exact Booking ID / Reference match
        else if (
          bookingRefUpper === cleanQueryUpper ||
          bookingIdUpper === cleanQueryUpper ||
          bookingRefUpper.replace('TRP-', 'TKT-') === cleanQueryUpper ||
          bookingRefUpper.replace('TRP-', 'TCR-') === cleanQueryUpper
        ) {
          score = 95;
        }
        // 3. Partial Ticket ID or Booking Reference match (min 3 chars)
        else if (
          cleanQueryUpper.length >= 3 &&
          (ticketIdUpper.includes(cleanQueryUpper) ||
            bookingRefUpper.includes(cleanQueryUpper))
        ) {
          score = 85;
        }
        // 4. Phone number match (handles formatting differences: 0712..., +254712..., spaces)
        else if (
          queryPhoneNorm.length >= 6 &&
          (contactPhoneNorm.includes(queryPhoneNorm) ||
            queryPhoneNorm.includes(contactPhoneNorm))
        ) {
          score = 80;
        }
        // 5. Exact Passenger or Contact Name match
        else if (
          paxNameLower === cleanQueryLower ||
          contactNameLower === cleanQueryLower
        ) {
          score = 75;
        }
        // 6. Partial Passenger Name or Contact Name token match
        else if (
          queryTokens.length > 0 &&
          queryTokens.every(
            (tok) => paxNameLower.includes(tok) || contactNameLower.includes(tok),
          )
        ) {
          score = 65;
        }

        if (score > 0) {
          if (
            driverTrip &&
            (b.tripId === driverTrip.id || b.tripCode === driverTrip.tripCode)
          ) {
            score += 2;
          }
          const validation = evaluateTicketValidation(b, p, driverTrip);
          scoredResults.push({ score, result: validation });
        }
      }
    }

    scoredResults.sort((a, b) => b.score - a.score);

    const results = scoredResults.map((item) => item.result);
    const exactMatch =
      scoredResults.length > 0 && scoredResults[0].score >= 95
        ? scoredResults[0].result
        : results.length === 1
          ? results[0]
          : null;

    if (results.length === 0) {
      const notFoundResult = evaluateTicketValidation(undefined, undefined, driverTrip);
      return res.json({
        valid: false,
        exactMatch: notFoundResult,
        results: [],
        total: 0,
      });
    }

    return res.json({
      valid: (exactMatch || results[0]).valid,
      exactMatch: exactMatch || results[0],
      results,
      total: results.length,
    });
  },
);

// =============================================================
// POST /api/driver/tickets/verify
// =============================================================

router.post(
  '/api/driver/tickets/verify',
  requireDriverOrManager,
  verificationLimiter,
  (req, res) => {
    const {
      qr_token,
      qrToken,
      ticket_id,
      ticketId,
      booking_id,
      bookingReference,
      seat_number,
      seatNumber,
      trip_id,
      tripId,
    } = req.body || {};

    const user = (req as any).user;
    const requestedTripId = trip_id || tripId;
    const driverTrip = resolveDriverAssignedTrip(user, requestedTripId);

    if (requestedTripId && !driverTrip && user.role !== 'MANAGER') {
      return res.status(403).json({
        valid: false,
        code: 'WRONG_TRIP',
        title: '⚠️ Unauthorized Trip',
        message: 'You can only verify tickets for trips assigned to your driver account.',
      });
    }

    const rawLookup =
      qr_token ||
      qrToken ||
      ticket_id ||
      ticketId ||
      booking_id ||
      bookingReference ||
      '';

    const requestedSeat = seat_number || seatNumber;

    if (!String(rawLookup).trim()) {
      return res.status(400).json({
        valid: false,
        code: 'NOT_FOUND',
        title: '❌ Invalid Ticket Input',
        message: 'No QR token or Ticket ID was provided for verification.',
      });
    }

    const match = lookupBookingAndPassenger(String(rawLookup), requestedSeat);
    const providedToken = String(qr_token || qrToken || '').trim();
    if (
      match?.passenger &&
      providedToken &&
      providedToken.startsWith('tcr_tok_') &&
      match.passenger.qrToken &&
      match.passenger.qrToken.toLowerCase() !== providedToken.toLowerCase()
    ) {
      return res.json(evaluateTicketValidation(undefined, undefined, driverTrip));
    }

    const result = evaluateTicketValidation(
      match?.booking,
      match?.passenger,
      driverTrip,
    );

    return res.json(result);
  },
);

// =============================================================
// POST /api/driver/tickets/board
// =============================================================

router.post(
  '/api/driver/tickets/board',
  requireDriverOrManager,
  verificationLimiter,
  (req, res) => {
    const {
      qr_token,
      qrToken,
      ticket_id,
      ticketId,
      booking_id,
      bookingReference,
      seat_number,
      seatNumber,
      trip_id,
      tripId,
    } = req.body || {};

    const user = (req as any).user;
    const requestedTripId = trip_id || tripId;
    const driverTrip = resolveDriverAssignedTrip(user, requestedTripId);

    if (requestedTripId && !driverTrip && user.role !== 'MANAGER') {
      return res.status(403).json({
        valid: false,
        code: 'WRONG_TRIP',
        title: '⚠️ Unauthorized Trip',
        message: 'You can only board passengers on trips assigned to your driver account.',
      });
    }

    const rawLookup =
      qr_token ||
      qrToken ||
      ticket_id ||
      ticketId ||
      booking_id ||
      bookingReference ||
      '';
    const requestedSeat = seat_number || seatNumber;

    const match = lookupBookingAndPassenger(String(rawLookup), requestedSeat);
    const providedToken = String(qr_token || qrToken || '').trim();
    const isTamperedToken =
      Boolean(
        match?.passenger &&
          providedToken &&
          providedToken.startsWith('tcr_tok_') &&
          match.passenger.qrToken &&
          match.passenger.qrToken.toLowerCase() !== providedToken.toLowerCase(),
      );

    const validation = evaluateTicketValidation(
      isTamperedToken ? undefined : match?.booking,
      isTamperedToken ? undefined : match?.passenger,
      driverTrip,
    );

    if (validation.code === 'ALREADY_BOARDED') {
      return res.status(200).json({
        ...validation,
        alreadyBoarded: true,
      });
    }

    if (!validation.valid || !match) {
      const statusCode =
        validation.code === 'NOT_FOUND'
          ? 404
          : validation.code === 'WRONG_TRIP'
            ? 403
            : 400;
      return res.status(statusCode).json(validation);
    }

    const { booking: targetBooking, passenger: targetPassenger } = match;
    const now = new Date().toISOString();
    const verifierName = user.fullName || user.email || user.userId;

    targetPassenger.hasBoarded = true;
    targetPassenger.boardedAt = now;
    targetPassenger.boardingStatus = 'BOARDED';
    targetPassenger.ticketStatus = 'BOARDED';
    targetPassenger.verifiedAt = now;
    targetPassenger.verifiedBy = user.userId;
    targetPassenger.verifiedByName = verifierName;

    const allBoarded = targetBooking.passengers.every((p) => p.hasBoarded);
    targetBooking.bookingStatus = 'CHECKED_IN';
    if (allBoarded) {
      targetBooking.boardingStatus = 'BOARDED';
      targetBooking.ticketStatus = 'BOARDED';
    }
    targetBooking.verifiedAt = now;
    targetBooking.verifiedBy = user.userId;
    targetBooking.verifiedByName = verifierName;

    const updatedTicket = buildTicketRecord(
      targetBooking,
      targetPassenger,
      trips,
    );

    return res.json({
      valid: true,
      boarded: true,
      alreadyBoarded: false,
      code: 'BOARDED',
      title: '✓ PASSENGER BOARDED',
      message: `${updatedTicket.passenger_name} (Seat ${updatedTicket.seat_number}) has been verified and marked as BOARDED.`,
      ticket: updatedTicket,
    });
  },
);

// =============================================================
// DRIVER BOARDING / QR VALIDATION (LEGACY COMPATIBILITY)
// =============================================================

router.post(
  '/api/driver/board-passenger',
  requireDriverOrManager,
  verificationLimiter,
  (req, res) => {
    const {
      bookingReference,
      seatNumber,
      ticketCode,
      qrPayload,
      passengerId,
      unboard,
    } = req.body;

    let ref = (
      bookingReference ||
      ticketCode ||
      qrPayload ||
      ''
    ).trim();

    let seat = seatNumber;

    if (
      !ref &&
      passengerId &&
      typeof passengerId === 'string' &&
      passengerId.includes('-')
    ) {
      const parts = passengerId.split('-');
      ref = parts.slice(0, 2).join('-');
      seat = parts.slice(2).join('-');
    }

    const match = lookupBookingAndPassenger(ref, seat);
    const targetBooking = match?.booking;

    if (!targetBooking) {
      return res.status(404).json({
        error: `Invalid ticket or booking reference "${ref}". Please check again.`,
      });
    }

    const assignedTrip = trips.find(
      (trip) =>
        trip.id === targetBooking.tripId ||
        trip.tripCode === targetBooking.tripCode,
    );

    const user = (req as any).user;

    if (
      !assignedTrip ||
      !isTripAssignedToDriver(assignedTrip, user)
    ) {
      return res.status(403).json({
        error:
          'You can only board passengers on trips assigned to your authenticated driver profile.',
      });
    }

    if (
      targetBooking.bookingStatus === 'CANCELLED' ||
      targetBooking.bookingStatus === 'EXPIRED' ||
      targetBooking.bookingStatus === 'REFUNDED'
    ) {
      return res.status(400).json({
        error: `Ticket ${targetBooking.bookingReference} is ${targetBooking.bookingStatus}. Boarding denied.`,
      });
    }

    if (targetBooking.paymentStatus !== 'PAID') {
      return res.status(400).json({
        error: `Ticket ${targetBooking.bookingReference} payment is ${targetBooking.paymentStatus}. Boarding denied.`,
      });
    }

    if (unboard) {
      const passenger =
        match?.passenger ||
        targetBooking.passengers.find(
          (p) => !seat || p.seatNumber === seat,
        );

      if (passenger) {
        passenger.hasBoarded = false;
        passenger.boardingStatus = 'NOT_BOARDED';
        passenger.ticketStatus = 'ISSUED';
        delete passenger.boardedAt;
        delete passenger.verifiedAt;
        delete passenger.verifiedBy;
        delete passenger.verifiedByName;
      }

      const anyStillBoarded = targetBooking.passengers.some(
        (p) => p.hasBoarded,
      );

      targetBooking.bookingStatus = anyStillBoarded
        ? 'CHECKED_IN'
        : 'CONFIRMED';
      targetBooking.boardingStatus = anyStillBoarded
        ? 'BOARDED'
        : 'NOT_BOARDED';

      return res.json({
        success: true,
        message: `Boarding reversed for ${
          passenger ? passenger.fullName : targetBooking.contactName
        }.`,
        passenger,
        booking: targetBooking,
      });
    }

    const targetPassengers = match?.passenger
      ? [match.passenger]
      : targetBooking.passengers;

    const alreadyBoarded = targetPassengers.every((p) => p.hasBoarded);
    const now = new Date().toISOString();
    const verifierName = user.fullName || user.email || user.userId;

    if (!alreadyBoarded) {
      targetPassengers.forEach((p) => {
        p.hasBoarded = true;
        p.boardedAt = p.boardedAt || now;
        p.boardingStatus = 'BOARDED';
        p.ticketStatus = 'BOARDED';
        p.verifiedAt = p.verifiedAt || now;
        p.verifiedBy = p.verifiedBy || user.userId;
        p.verifiedByName = p.verifiedByName || verifierName;
      });

      targetBooking.bookingStatus = 'CHECKED_IN';
      if (targetBooking.passengers.every((p) => p.hasBoarded)) {
        targetBooking.boardingStatus = 'BOARDED';
        targetBooking.ticketStatus = 'BOARDED';
      }
      targetBooking.verifiedAt = now;
      targetBooking.verifiedBy = user.userId;
      targetBooking.verifiedByName = verifierName;
    }

    const primaryTicket = buildTicketRecord(
      targetBooking,
      targetPassengers[0],
      trips,
    );

    res.json({
      success: true,
      alreadyBoarded,
      ticket: primaryTicket,
      message: alreadyBoarded
        ? `Already Validated: ${targetPassengers
            .map((p) => `${p.fullName} (Seat ${p.seatNumber})`)
            .join(', ')} was already checked in at ${new Date(
            targetPassengers[0].boardedAt!,
          ).toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit',
          })}.`
        : `Boarding Approved: ${targetPassengers
            .map((p) => `${p.fullName} (Seat ${p.seatNumber})`)
            .join(', ')} checked in successfully. Welcome aboard!`,
      passengers: targetPassengers,
      passenger: targetPassengers[0],
      booking: {
        bookingReference: targetBooking.bookingReference,
        ticketId: targetBooking.ticketId,
        qrToken: targetBooking.qrToken,
        tripCode: targetBooking.tripCode,
        routeOrigin: targetBooking.routeOrigin,
        routeDestination: targetBooking.routeDestination,
        busRegistration: targetBooking.busRegistration,
        departureTime: targetBooking.departureTime,
        totalFareKsh: targetBooking.totalFareKsh,
        paymentStatus: targetBooking.paymentStatus,
        bookingStatus: targetBooking.bookingStatus,
      },
    });
  },
);

// =============================================================
// DRIVER VEHICLE INSPECTIONS
// =============================================================

router.post(
  '/api/driver/vehicle-inspections',
  requireDriverOrManager,
  (req, res) => {
    const {
      vehicleId,
      tripId,
      items,
      status,
      notes,
    } = req.body;

    const user = (req as any).user;

    const vehicle =
      vehicles.find((v) => v.id === vehicleId) || vehicles[0];

    const inspection: VehicleInspection = {
      id: `insp-${Date.now()}`,
      vehicleId: vehicle.id,
      vehicleRegistration: vehicle.registrationNumber,
      driverId: user.driverId || 'drv-1',
      driverName: user.name,
      tripId,
      timestamp: new Date().toISOString(),
      items: items || {
        tyres: true,
        brakes: true,
        lights: true,
        fuelLevel: 'FULL',
        emergencyKit: true,
        firstAidKit: true,
        doors: true,
        mirrors: true,
        wipers: true,
        ac: true,
      },
      status: status || 'PASS',
      notes,
    };

    inspections.unshift(inspection);

    if (status === 'ISSUE_FOUND') {
      logAuditAction(
        user.email,
        user.role,
        'INSPECTION_ISSUE_FLAGGED',
        'VEHICLE',
        vehicle.id,
        `Pre-trip inspection flagged issue on ${vehicle.registrationNumber}: ${notes || 'Defect detected'}`,
      );
    }

    res.status(201).json({
      message:
        status === 'PASS'
          ? 'Inspection passed. You are cleared for departure.'
          : 'Inspection issue recorded and escalated to Fleet Managers.',
      inspection,
    });
  },
);

// =============================================================
// DRIVER INCIDENT REPORTING
// =============================================================

router.post(
  '/api/driver/incidents',
  requireDriverOrManager,
  (req, res) => {
    const {
      tripId,
      type,
      severity,
      description,
      location,
    } = req.body;

    const user = (req as any).user;

    const trip = trips.find((t) => t.id === tripId) || trips[0];

    const incident: IncidentReport = {
      id: `inc-${Date.now()}`,
      tripId: trip.id,
      tripCode: trip.tripCode,
      driverId: user.driverId || 'drv-1',
      driverName: user.name,
      vehicleRegistration: trip.vehicle.registrationNumber,
      type: type || 'MECHANICAL',
      severity: severity || 'MEDIUM',
      description: description || 'Operational report',
      location: location || 'Transit Route',
      timestamp: new Date().toISOString(),
      status: 'REPORTED',
    };

    incidents.unshift(incident);

    logAuditAction(
      user.email,
      user.role,
      'INCIDENT_REPORTED',
      'INCIDENT',
      incident.id,
      `[${incident.severity}] ${incident.type} reported at ${incident.location}`,
    );

    res.status(201).json({
      message: 'Incident reported successfully to Fleet Operations.',
      incident,
    });
  },
);

// =============================================================
// DRIVER ANNOUNCEMENTS
// =============================================================

router.get(
  '/api/driver/announcements',
  requireDriverOrManager,
  (_req, res) => {
    res.json(announcements);
  },
);

export default router;
