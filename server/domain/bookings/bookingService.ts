import { Booking } from '../../../src/types';
import { bookings, revenues, trips } from '../../store';
import { ensureBookingTickets } from '../tickets/ticketService';

export const SEAT_LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function cleanupExpiredUnpaidBookings(): void {
  const now = Date.now();
  let releasedCount = 0;
  for (const booking of bookings) {
    if (
      (booking.bookingStatus === 'PENDING_PAYMENT' ||
        booking.paymentStatus === 'PENDING') &&
      booking.paymentStatus !== 'PAID'
    ) {
      const bookingTime = new Date(booking.createdAt).getTime();
      if (now - bookingTime > SEAT_LOCK_TIMEOUT_MS) {
        booking.bookingStatus = 'EXPIRED';
        booking.ticketStatus = 'EXPIRED';
        booking.paymentStatus = 'FAILED';
        booking.passengers.forEach((p) => {
          p.ticketStatus = 'EXPIRED';
        });
        // Auto-release seats back to trip if not held by another active booking
        const trip = trips.find((t) => t.id === booking.tripId);
        if (trip) {
          const activeBookedSeats = new Set<string>();
          for (const other of bookings) {
            if (
              other.id !== booking.id &&
              other.tripId === trip.id &&
              (other.bookingStatus === 'CONFIRMED' ||
                other.bookingStatus === 'CHECKED_IN' ||
                other.bookingStatus === 'PENDING_PAYMENT')
            ) {
              other.passengers.forEach((p) =>
                activeBookedSeats.add(String(p.seatNumber).trim().toUpperCase()),
              );
            }
          }
          const bookedSeats = booking.passengers.map((p) =>
            String(p.seatNumber).trim().toUpperCase(),
          );
          trip.bookedSeatNumbers = trip.bookedSeatNumbers.filter((seat) => {
            const norm = String(seat).trim().toUpperCase();
            return !bookedSeats.includes(norm) || activeBookedSeats.has(norm);
          });
          trip.availableSeats = Math.max(
            0,
            trip.totalSeats - trip.bookedSeatNumbers.length,
          );
          releasedCount++;
        }
      }
    }
  }
  if (releasedCount > 0) {
    console.log(`[SeatLock] Auto-released ${releasedCount} unpaid seat reservation(s) after 10 min timeout.`);
  }
}

export function areBookingSeatsStillAvailable(booking: Booking): {
  available: boolean;
  conflictingSeats: string[];
} {
  const trip = trips.find((t) => t.id === booking.tripId);
  if (!trip) return { available: true, conflictingSeats: [] };

  const heldByOthers = new Set<string>();
  for (const other of bookings) {
    if (
      other.id !== booking.id &&
      other.tripId === trip.id &&
      (other.bookingStatus === 'CONFIRMED' ||
        other.bookingStatus === 'CHECKED_IN' ||
        other.bookingStatus === 'PENDING_PAYMENT')
    ) {
      other.passengers.forEach((p) =>
        heldByOthers.add(String(p.seatNumber).trim().toUpperCase()),
      );
    }
  }

  const conflictingSeats = booking.passengers
    .map((p) => String(p.seatNumber).trim().toUpperCase())
    .filter((s) => heldByOthers.has(s));

  return {
    available: conflictingSeats.length === 0,
    conflictingSeats,
  };
}

let seatLockIntervalStarted = false;

export function startSeatLockCleanupInterval(): void {
  if (seatLockIntervalStarted) return;
  seatLockIntervalStarted = true;
  const timer = setInterval(cleanupExpiredUnpaidBookings, 30 * 1000);
  timer.unref?.();
}

export function markBookingPaid(
  booking: Booking,
  mpesaCode: string,
  method?: 'MPESA' | 'CASH',
): void {
  if (booking.paymentStatus === 'PAID') {
    ensureBookingTickets(booking);
    return;
  }

  booking.paymentStatus = 'PAID';
  booking.bookingStatus = 'CONFIRMED';
  booking.ticketStatus = 'ISSUED';
  if (method) {
    booking.paymentMethod = method;
  }
  booking.mpesaTransactionCode = mpesaCode;
  booking.passengers.forEach((p) => {
    if (p.ticketStatus === 'EXPIRED' || p.ticketStatus === 'CANCELLED') {
      p.ticketStatus = 'ISSUED';
    }
  });

  const trip = trips.find((t) => t.id === booking.tripId);
  if (trip) {
    for (const p of booking.passengers) {
      const s = String(p.seatNumber).trim().toUpperCase();
      if (!trip.bookedSeatNumbers.includes(s)) {
        trip.bookedSeatNumbers.push(s);
      }
    }
    trip.availableSeats = Math.max(
      0,
      trip.totalSeats - trip.bookedSeatNumbers.length,
    );
  }

  ensureBookingTickets(booking);

  const channelLabel = booking.paymentMethod === 'CASH' ? `Cash (${mpesaCode})` : `M-Pesa ${mpesaCode}`;

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

export function isValidPassengerName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const t = name.trim();
  if (t.length < 5 || t.length > 50) return false;
  if (!/^[a-zA-Z\s'-]+$/.test(t)) return false;
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  const lower = t.toLowerCase().replace(/\s+/g, '');
  const dummyPats = ['qwerty', 'asdf', 'zxcv', 'rertgy', 'tyhjik', 'hjik', 'ghjk', 'dfgh', 'jklm', 'dummy', 'fake'];
  for (const pat of dummyPats) {
    if (lower.includes(pat)) return false;
  }
  return true;
}

export function isValidKenyanIdOrPassport(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const t = id.trim().toUpperCase();
  if (/^\d{7,8}$/.test(t)) {
    const dummies = ['1234567', '2345678', '3456789', '4567890', '12345678', '87654321', '0000000', '00000000', '11111111', '99999999'];
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
  const dummies = ['0700000000', '0712345678', '0711111111', '0722222222', '0787654321', '0799999999'];
  return !dummies.includes(cleaned);
}
