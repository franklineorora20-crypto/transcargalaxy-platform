import crypto from 'crypto';
import type { Booking, Passenger, Trip, TicketRecord } from '../../../src/types/index.js';
import { bookings, trips } from '../../store/store.js';

const TICKET_ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateUniqueTicketId(): string {
  while (true) {
    const bytes = crypto.randomBytes(8);
    let suffix = '';
    for (let i = 0; i < 8; i++) {
      suffix += TICKET_ID_ALPHABET[bytes[i] % TICKET_ID_ALPHABET.length];
    }
    const candidate = `TCR-${suffix}`;
    const exists = bookings.some(
      (b) =>
        b.ticketId === candidate ||
        b.passengers.some((p) => p.ticketId === candidate),
    );
    if (!exists) return candidate;
  }
}

export function generateSecureQrToken(ticketId: string): string {
  const shortTag = ticketId.replace(/[^A-Z0-9]/gi, '').slice(-8).toLowerCase();
  const entropy = crypto.randomBytes(16).toString('hex');
  return `tcr_tok_${shortTag}_${entropy}`;
}

export function generateTicketId(): string {
  return generateUniqueTicketId();
}

export function generateQrToken(ticketId?: string): string {
  return generateSecureQrToken(ticketId || generateUniqueTicketId());
}

export function formatTravelDateIso(isoString: string): string {
  if (!isoString) return new Date().toISOString().slice(0, 10);
  if (isoString.includes('T')) return isoString.split('T')[0];
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function formatDepartureClock(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '05:00 AM';
  return d.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function buildTicketRecord(
  booking: Booking,
  passenger: Passenger,
  tripOrTrips?: Trip | Trip[],
): TicketRecord {
  const tripList = Array.isArray(tripOrTrips) ? tripOrTrips : trips;
  const explicitTrip = !Array.isArray(tripOrTrips) ? tripOrTrips : undefined;
  const matchedTrip =
    explicitTrip ||
    tripList.find(
      (t) => t.id === booking.tripId || t.tripCode === booking.tripCode,
    );

  const travelDate = (booking.departureTime || matchedTrip?.departureTime || new Date().toISOString()).split('T')[0];
  const departureIso = booking.departureTime || matchedTrip?.departureTime || new Date().toISOString();
  const isBoarded = Boolean(passenger.hasBoarded || passenger.boardingStatus === 'BOARDED');

  const ticketStatus =
    booking.bookingStatus === 'CANCELLED'
      ? 'CANCELLED'
      : booking.bookingStatus === 'REFUNDED'
        ? 'REFUNDED'
        : booking.bookingStatus === 'EXPIRED'
          ? 'EXPIRED'
          : isBoarded
            ? 'BOARDED'
            : passenger.ticketStatus || 'ISSUED';

  return {
    ticket_id: passenger.ticketId || booking.ticketId || booking.bookingReference,
    booking_id: booking.id,
    booking_reference: booking.bookingReference,
    trip_id: booking.tripId || matchedTrip?.id || 'trip-rng-ksi-01',
    trip_code: booking.tripCode || matchedTrip?.tripCode || 'TR-RNG-KSI-0500',
    passenger_name: passenger.fullName || booking.contactName,
    passenger_phone: booking.contactPhone || '',
    passenger_id_number: passenger.idNumber || '',
    route: `${booking.routeOrigin} → ${booking.routeDestination}`,
    route_origin: booking.routeOrigin,
    route_destination: booking.routeDestination,
    travel_date: travelDate,
    departure_time: formatDepartureClock(departureIso),
    departure_iso: departureIso,
    vehicle_id: booking.vehicleId || matchedTrip?.vehicleId || matchedTrip?.vehicle?.id || 'veh-1',
    vehicle_registration: booking.busRegistration || matchedTrip?.vehicle?.registrationNumber || 'KDE 416Q',
    seat_number: passenger.seatNumber,
    fare: passenger.fareKsh || Math.round(booking.totalFareKsh / Math.max(1, booking.passengers.length)),
    payment_status: booking.paymentStatus,
    payment_method: booking.paymentMethod,
    booking_status: booking.bookingStatus,
    ticket_status: ticketStatus,
    qr_token: passenger.qrToken || booking.qrToken || '',
    created_at: booking.createdAt,
    verified_at: passenger.verifiedAt || passenger.boardedAt || booking.verifiedAt || null,
    verified_by: passenger.verifiedBy || booking.verifiedBy || null,
    verified_by_name:
      passenger.verifiedByName ||
      booking.verifiedByName ||
      (isBoarded ? 'Captain Frankline Orora' : null),
    boarding_status: isBoarded ? 'BOARDED' : 'NOT_BOARDED',
  };
}

export function ensureBookingTickets(booking: Booking, _trips?: Trip[]): Booking {
  const matchedTrip = trips.find(
    (t) => t.id === booking.tripId || t.tripCode === booking.tripCode,
  );

  if (!booking.vehicleId && matchedTrip) {
    booking.vehicleId = matchedTrip.vehicleId || matchedTrip.vehicle?.id;
  }

  booking.passengers.forEach((p, idx) => {
    if (!p.ticketId) {
      p.ticketId = idx === 0 && booking.ticketId ? booking.ticketId : generateUniqueTicketId();
    }
    if (!p.qrToken) {
      p.qrToken = idx === 0 && booking.qrToken ? booking.qrToken : generateSecureQrToken(p.ticketId);
    }
    p.boardingStatus = p.hasBoarded || p.boardingStatus === 'BOARDED' ? 'BOARDED' : 'NOT_BOARDED';
    p.hasBoarded = p.boardingStatus === 'BOARDED';
    if (p.hasBoarded) {
      p.ticketStatus = 'BOARDED';
    } else if (booking.bookingStatus === 'CANCELLED') {
      p.ticketStatus = 'CANCELLED';
    } else if (booking.bookingStatus === 'REFUNDED') {
      p.ticketStatus = 'REFUNDED';
    } else if (booking.bookingStatus === 'EXPIRED') {
      p.ticketStatus = 'EXPIRED';
    } else {
      p.ticketStatus = p.ticketStatus || 'ISSUED';
    }
  });

  if (booking.passengers.length > 0) {
    booking.ticketId = booking.passengers[0].ticketId;
    booking.qrToken = booking.passengers[0].qrToken;
  }

  booking.boardingStatus = booking.passengers.every((p) => p.hasBoarded)
    ? 'BOARDED'
    : 'NOT_BOARDED';

  booking.tickets = booking.passengers.map((p) =>
    buildTicketRecord(booking, p, matchedTrip),
  );

  return booking;
}
