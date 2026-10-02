import type { Trip, Booking } from '../../../src/types/index.js';
import { bookings, revenues, trips } from '../../store/store.js';
import { ensureBookingTickets } from '../tickets/ticketService.js';

export const SEAT_LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function calculateTripFare(
  trip: Trip,
  seatNumbers: string[],
) {
  const fares = seatNumbers.map(() => trip.fareKsh);
  const fare = fares.reduce((sum, value) => sum + value, 0);
  const serviceFee = 0;

  return {
    fare,
    serviceFee,
    total: fare + serviceFee,
  };
}

export function markBookingPaid(
  booking: Booking,
  mpesaCode: string,
  method?: 'MPESA' | 'CASH',
) {
  if (booking.paymentStatus === 'PAID') {
    ensureBookingTickets(booking);
    return;
  }

  booking.paymentStatus = 'PAID';
  booking.bookingStatus = 'CONFIRMED';
  if (method) {
    booking.paymentMethod = method;
  }
  booking.mpesaTransactionCode = mpesaCode;

  ensureBookingTickets(booking);

  const channelLabel =
    booking.paymentMethod === 'CASH' ? `Cash (${mpesaCode})` : `M-Pesa ${mpesaCode}`;

  revenues.unshift({
    id: `rev-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    category: 'PASSENGER_TICKETS',
    amountKsh: booking.totalFareKsh,
    routeOrigin: booking.routeOrigin,
    routeDestination: booking.routeDestination,
    vehicleRegistration: booking.busRegistration,
    tripCode: booking.tripCode,
    description: `Ticket sale ref ${booking.bookingReference} (${booking.ticketId || ''}, ${booking.passengers.length} passenger(s)) via ${channelLabel}`,
  });
}

export function cleanupExpiredUnpaidBookings() {
  const now = Date.now();
  let releasedCount = 0;
  for (const booking of bookings) {
    if (
      booking.bookingStatus === 'PENDING_PAYMENT' &&
      booking.paymentStatus === 'PENDING'
    ) {
      const bookingTime = new Date(booking.createdAt).getTime();
      if (now - bookingTime > SEAT_LOCK_TIMEOUT_MS) {
        booking.bookingStatus = 'EXPIRED';
        booking.paymentStatus = 'FAILED';
        // Auto-release seats back to trip
        const trip = trips.find((t) => t.id === booking.tripId);
        if (trip) {
          const bookedSeats = booking.passengers.map((p) =>
            String(p.seatNumber).trim().toUpperCase(),
          );
          trip.bookedSeatNumbers = trip.bookedSeatNumbers.filter(
            (seat) => !bookedSeats.includes(String(seat).trim().toUpperCase()),
          );
          trip.availableSeats = Math.max(
            0,
            trip.totalSeats - trip.bookedSeatNumbers.length,
          );
          releasedCount++;
        }
        ensureBookingTickets(booking, trips);
      }
    }
  }
  if (releasedCount > 0) {
    console.log(
      `[SeatLock] Auto-released ${releasedCount} unpaid seat reservation(s) after 10 min timeout.`,
    );
  }
}

export function areBookingSeatsStillAvailable(booking: Booking): {
  available: boolean;
  conflictingSeats: string[];
} {
  const requestedSeats = booking.passengers.map((p) =>
    String(p.seatNumber).trim().toUpperCase(),
  );
  const conflictingSeats: string[] = [];

  for (const other of bookings) {
    if (other.id === booking.id || other.tripId !== booking.tripId) continue;
    if (
      other.bookingStatus === 'CONFIRMED' ||
      other.bookingStatus === 'CHECKED_IN' ||
      other.bookingStatus === 'PENDING_PAYMENT'
    ) {
      for (const p of other.passengers) {
        const seat = String(p.seatNumber).trim().toUpperCase();
        if (requestedSeats.includes(seat) && !conflictingSeats.includes(seat)) {
          conflictingSeats.push(seat);
        }
      }
    }
  }

  return {
    available: conflictingSeats.length === 0,
    conflictingSeats,
  };
}

export function isValidPassengerName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const t = name.trim();
  if (t.length < 5 || t.length > 50) return false;
  if (!/^[a-zA-Z\s'-]+$/.test(t)) return false;
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  const lower = t.toLowerCase().replace(/\s+/g, '');
  const dummyPats = [
    'qwerty',
    'asdf',
    'zxcv',
    'rertgy',
    'tyhjik',
    'hjik',
    'ghjk',
    'dfgh',
    'jklm',
    'dummy',
    'fake',
  ];
  for (const pat of dummyPats) {
    if (lower.includes(pat)) return false;
  }
  return true;
}

export function isValidKenyanIdOrPassport(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const t = id.trim().toUpperCase();
  if (/^\d{7,8}$/.test(t)) {
    const dummies = [
      '1234567',
      '2345678',
      '3456789',
      '4567890',
      '12345678',
      '87654321',
      '0000000',
      '00000000',
      '11111111',
      '99999999',
    ];
    if (dummies.includes(t) || /^(\d)\1+$/.test(t)) return false;
    return true;
  }
  return /^[A-Z]\d{7,8}$/.test(t);
}

export function isValidKenyanPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const kenyaRegex = /^(?:\+254|254|0)(7|1)\d{8}$/;
  if (!kenyaRegex.test(cleaned)) return false;
  const dummies = [
    '0700000000',
    '0712345678',
    '0711111111',
    '0722222222',
    '0787654321',
    '0799999999',
  ];
  return !dummies.includes(cleaned);
}

