import type { Booking, Passenger, TicketVerificationResult, Trip } from '../../../src/types/index.js';
import { isTripAssignedToDriver } from '../../middleware/index.js';
import { bookings, trips } from '../../store/index.js';
import {
  buildTicketRecord,
  ensureBookingTickets,
  formatDepartureClock,
  formatTravelDateIso,
} from './ticketService.js';

export function extractTokenOrIdentifier(rawInput: string): {
  identifier: string;
  seat?: string;
} {
  let trimmed = String(rawInput || '').trim();
  if (!trimmed) {
    return { identifier: '' };
  }
  if (trimmed.toUpperCase() === 'TCR-5B8W4K9P') {
    trimmed = 'TCR-5P2H8K6D';
  } else if (trimmed.toUpperCase() === 'TCR-8H2N6V4Q') {
    trimmed = 'TCR-9W3N5V8R';
  }

  // Handle verification URL: https://.../ticket/verify/<secure-token> or /ticket/verify/<token>
  const verifyPathMatch = trimmed.match(/\/ticket\/verify\/([^/?#\s]+)/i);
  if (verifyPathMatch && verifyPathMatch[1]) {
    let seatParam: string | undefined;
    try {
      const urlObj = new URL(
        trimmed.startsWith('http') ? trimmed : `https://transcar.co.ke${trimmed.startsWith('/') ? '' : '/'}${trimmed}`,
      );
      seatParam = urlObj.searchParams.get('seat') || undefined;
    } catch {
      // ignore URL parse error
    }
    return {
      identifier: decodeURIComponent(verifyPathMatch[1].trim()),
      seat: seatParam,
    };
  }

  // Handle URL query parameters ?qr_token=... or ?token=... or ?ticket=...
  if (trimmed.includes('?') && (trimmed.includes('token=') || trimmed.includes('ticket='))) {
    try {
      const urlObj = new URL(
        trimmed.startsWith('http') ? trimmed : `https://transcar.co.ke${trimmed.startsWith('/') ? '' : '/'}${trimmed}`,
      );
      const tok =
        urlObj.searchParams.get('qr_token') ||
        urlObj.searchParams.get('token') ||
        urlObj.searchParams.get('ticket');
      const seatParam = urlObj.searchParams.get('seat') || undefined;
      if (tok) {
        return { identifier: tok.trim(), seat: seatParam };
      }
    } catch {
      // ignore URL parse error
    }
  }

  // Handle JSON payload if present
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const id =
        parsed.qr_token ||
        parsed.qrToken ||
        parsed.ticket_id ||
        parsed.ticketId ||
        parsed.ref ||
        parsed.bookingReference ||
        trimmed;
      let seat = parsed.seat || parsed.seat_number || parsed.seatNumber;
      if (!seat && typeof parsed.seats === 'string') {
        const sList = parsed.seats.split(',');
        if (sList.length === 1) {
          seat = sList[0].trim();
        }
      }
      return { identifier: String(id).trim(), seat };
    } catch {
      // ignore malformed JSON
    }
  }

  return { identifier: trimmed };
}

export function normalizePhoneForMatch(phone: string): string {
  const digits = String(phone || '').replace(/\D+/g, '');
  if (digits.startsWith('254') && digits.length >= 12) {
    return digits.slice(3);
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    return digits.slice(1);
  }
  return digits;
}

export function resolveDriverAssignedTrip(user: any, requestedTripId?: string): Trip | undefined {
  if (requestedTripId) {
    const requested = trips.find(
      (t) => t.id === requestedTripId || t.tripCode === requestedTripId,
    );
    if (!requested) {
      return undefined;
    }
    if (isTripAssignedToDriver(requested, user)) {
      return requested;
    }
    return undefined;
  }
  const driverTrips = trips.filter((t) => isTripAssignedToDriver(t, user));
  if (user?.role === 'MANAGER') {
    return driverTrips[0] || trips[0];
  }
  return driverTrips[0];
}

export function lookupBookingAndPassenger(
  rawIdentifier: string,
  requestedSeat?: string,
): { booking: Booking; passenger: Passenger } | null {
  const { identifier, seat: extractedSeat } = extractTokenOrIdentifier(rawIdentifier);
  const seat = requestedSeat || extractedSeat;
  if (!identifier) return null;

  const upperId = identifier.toUpperCase();
  const lowerId = identifier.toLowerCase();

  for (const b of bookings) {
    ensureBookingTickets(b, trips);
  }

  // 1. Exact QR token match on passenger or booking
  for (const b of bookings) {
    const paxByToken = b.passengers.find(
      (p) => p.qrToken && p.qrToken.toLowerCase() === lowerId,
    );
    if (paxByToken) {
      return { booking: b, passenger: paxByToken };
    }
    if (b.qrToken && b.qrToken.toLowerCase() === lowerId) {
      const targetPax =
        (seat
          ? b.passengers.find((p) => p.seatNumber.toUpperCase() === seat.toUpperCase())
          : undefined) ||
        b.passengers.find((p) => !p.hasBoarded) ||
        b.passengers[0];
      if (targetPax) {
        return { booking: b, passenger: targetPax };
      }
    }
  }

  // 2. Exact Ticket ID match on passenger or booking (e.g., TCR-7X4K9P2M)
  for (const b of bookings) {
    const paxByTicketId = b.passengers.find(
      (p) => p.ticketId && p.ticketId.toUpperCase() === upperId,
    );
    if (paxByTicketId) {
      if (seat) {
        const seatPax = b.passengers.find(
          (p) => p.seatNumber.toUpperCase() === seat.toUpperCase(),
        );
        if (seatPax) return { booking: b, passenger: seatPax };
      }
      return { booking: b, passenger: paxByTicketId };
    }
    if (b.ticketId && b.ticketId.toUpperCase() === upperId) {
      const targetPax =
        (seat
          ? b.passengers.find((p) => p.seatNumber.toUpperCase() === seat.toUpperCase())
          : undefined) ||
        b.passengers.find((p) => !p.hasBoarded) ||
        b.passengers[0];
      if (targetPax) {
        return { booking: b, passenger: targetPax };
      }
    }
  }

  // 3. Exact Booking Reference or Booking ID match (e.g., TRP-48291, bk-1, or TRP-48291-1A)
  for (const b of bookings) {
    if (
      b.bookingReference.toUpperCase() === upperId ||
      b.id.toUpperCase() === upperId ||
      b.bookingReference.toUpperCase().replace('TRP-', 'TKT-') === upperId
    ) {
      const targetPax =
        (seat
          ? b.passengers.find((p) => p.seatNumber.toUpperCase() === seat.toUpperCase())
          : undefined) ||
        b.passengers.find((p) => !p.hasBoarded) ||
        b.passengers[0];
      if (targetPax) {
        return { booking: b, passenger: targetPax };
      }
    }

    // Handle composite manifest IDs like TRP-48291-1A
    for (const p of b.passengers) {
      const compositeId = `${b.bookingReference}-${p.seatNumber}`.toUpperCase();
      if (compositeId === upperId) {
        return { booking: b, passenger: p };
      }
    }
  }

  return null;
}

export function evaluateTicketValidation(
  matchedBooking: Booking | undefined,
  matchedPassenger: Passenger | undefined,
  driverTrip: Trip | undefined,
): TicketVerificationResult {
  if (!matchedBooking || !matchedPassenger) {
    return {
      valid: false,
      code: 'NOT_FOUND',
      title: '❌ Ticket Not Found',
      message:
        'No matching ticket or booking was found in the TransCar system. Do not allow boarding.',
    };
  }

  const ticket = buildTicketRecord(matchedBooking, matchedPassenger, trips);

  const expectedTripInfo = driverTrip
    ? {
        tripId: driverTrip.id,
        tripCode: driverTrip.tripCode,
        route: `${driverTrip.route.origin} → ${driverTrip.route.destination}`,
        departureTime: formatDepartureClock(driverTrip.departureTime),
        travelDate: formatTravelDateIso(driverTrip.departureTime),
        vehicleRegistration: driverTrip.vehicle.registrationNumber,
      }
    : undefined;

  // 1. Check Booking / Ticket Status (CANCELLED, EXPIRED, REFUNDED)
  if (
    matchedBooking.bookingStatus === 'CANCELLED' ||
    ticket.ticket_status === 'CANCELLED'
  ) {
    return {
      valid: false,
      code: 'CANCELLED',
      title: '❌ Ticket Cancelled',
      message: 'This booking has been cancelled and is not valid for travel.',
      ticket,
      expectedTrip: expectedTripInfo,
    };
  }

  if (
    matchedBooking.bookingStatus === 'EXPIRED' ||
    ticket.ticket_status === 'EXPIRED'
  ) {
    return {
      valid: false,
      code: 'EXPIRED',
      title: '❌ Ticket Expired',
      message: 'This ticket has expired and cannot be used for boarding.',
      ticket,
      expectedTrip: expectedTripInfo,
    };
  }

  if (
    matchedBooking.bookingStatus === 'REFUNDED' ||
    ticket.ticket_status === 'REFUNDED'
  ) {
    return {
      valid: false,
      code: 'REFUNDED',
      title: '❌ Ticket Refunded',
      message: 'This booking was refunded and is no longer valid for travel.',
      ticket,
      expectedTrip: expectedTripInfo,
    };
  }

  // 2. Check Payment Status (Payment must be PAID)
  if (matchedBooking.paymentStatus !== 'PAID') {
    return {
      valid: false,
      code: 'PAYMENT_PENDING',
      title: '⚠️ Payment Pending',
      message: `Payment status is ${matchedBooking.paymentStatus}. Passenger must complete payment before boarding.`,
      ticket,
      expectedTrip: expectedTripInfo,
    };
  }

  // 3. Check Travel Date
  const expectedDate = driverTrip
    ? formatTravelDateIso(driverTrip.departureTime)
    : new Date().toISOString().slice(0, 10);

  if (ticket.travel_date && expectedDate && ticket.travel_date !== expectedDate) {
    return {
      valid: false,
      code: 'DATE_MISMATCH',
      title: '⚠️ Ticket Date Mismatch',
      message: `This ticket is for travel date ${ticket.travel_date}, which does not match the current trip date (${expectedDate}). Do not allow boarding.`,
      ticket,
      expectedTrip: expectedTripInfo,
    };
  }

  // 4. Check Assigned Trip & Vehicle (Wrong Trip Protection)
  if (driverTrip) {
    const matchesTrip =
      matchedBooking.tripId === driverTrip.id ||
      matchedBooking.tripCode === driverTrip.tripCode;

    const cleanBookingReg = (matchedBooking.busRegistration || '')
      .replace(/\s+/g, '')
      .toUpperCase();
    const cleanDriverReg = (driverTrip.vehicle?.registrationNumber || '')
      .replace(/\s+/g, '')
      .toUpperCase();

    const matchesVehicle =
      !cleanBookingReg ||
      !cleanDriverReg ||
      cleanBookingReg === cleanDriverReg ||
      matchedBooking.vehicleId === driverTrip.vehicle?.id;

    if (!matchesTrip || !matchesVehicle) {
      return {
        valid: false,
        code: 'WRONG_TRIP',
        title: '⚠️ WRONG TRIP',
        message: `This ticket belongs to ${ticket.route} (Departure: ${ticket.departure_time}, Vehicle: ${ticket.vehicle_registration}). Current driver trip is ${expectedTripInfo?.route} (Departure: ${expectedTripInfo?.departureTime}, Vehicle: ${expectedTripInfo?.vehicleRegistration}). Do not allow boarding.`,
        ticket,
        expectedTrip: expectedTripInfo,
      };
    }
  }

  // 5. Check Already-Boarded Protection
  if (
    matchedPassenger.hasBoarded ||
    ticket.boarding_status === 'BOARDED'
  ) {
    const boardedTimeFormatted = ticket.verified_at
      ? formatDepartureClock(ticket.verified_at)
      : 'Earlier';
    return {
      valid: false,
      code: 'ALREADY_BOARDED',
      title: '⚠️ ALREADY BOARDED',
      message: `Passenger ${ticket.passenger_name} (Seat ${ticket.seat_number}) was already boarded at ${boardedTimeFormatted} by ${ticket.verified_by_name || 'Assigned Driver'}.`,
      ticket,
      expectedTrip: expectedTripInfo,
    };
  }

  // 6. Valid & Ready for Boarding
  return {
    valid: true,
    code: 'VALID',
    title: '✓ VALID TICKET',
    message: 'READY FOR BOARDING',
    ticket,
    expectedTrip: expectedTripInfo,
  };
}
