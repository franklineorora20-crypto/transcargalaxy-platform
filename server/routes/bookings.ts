import { Router, Request, Response } from 'express';
import { Booking, SeatClass } from '../../src/types';
import { limiter, stkLimiter } from '../middleware';
import { bookings, pendingMpesaRequests, trips } from '../store';
import {
  initiateDarajaStkPush,
  queryDarajaStkStatus,
  verifyDarajaCallbackSignature,
} from '../services/mpesaService';
import {
  ensureBookingTickets,
  generateSecureQrToken,
  generateUniqueTicketId,
} from '../domain/tickets/ticketService';
import { calculateTripFare } from '../domain/trips/tripService';
import {
  areBookingSeatsStillAvailable,
  cleanupExpiredUnpaidBookings,
  isValidKenyanIdOrPassport,
  isValidKenyanPhone,
  isValidPassengerName,
  markBookingPaid,
  SEAT_LOCK_TIMEOUT_MS,
} from '../domain/bookings/bookingService';

const router = Router();
const processedMpesaCallbacks = new Map<
  string,
  { resultCode: number; receipt?: string; processedAt: number }
>();

// =============================================================
// FARE CALCULATION
// =============================================================

router.post('/api/bookings/calculate-fare', (req, res) => {
  const { tripId, seatNumbers } = req.body;

  if (
    !tripId ||
    !Array.isArray(seatNumbers) ||
    seatNumbers.length === 0
  ) {
    return res.status(400).json({
      error: 'Trip and seat numbers are required.',
    });
  }

  const trip = trips.find((t) => t.id === tripId);

  if (!trip) {
    return res.status(404).json({
      error: 'Selected trip could not be found.',
    });
  }

  const quote = calculateTripFare(
    trip,
    seatNumbers.map((seat) => String(seat).trim().toUpperCase()),
  );

  res.json(quote);
});

// =============================================================
// PUBLIC BOOKING
// =============================================================

router.post('/api/bookings', limiter, (req, res) => {
  cleanupExpiredUnpaidBookings();
  const {
    tripId,
    passengers,
    contactName,
    contactPhone,
    contactEmail,
    emergencyContactName,
    emergencyContactPhone,
    paymentMethod = 'MPESA',
    carSeatView,
    frontendTotal,
  } = req.body;

  if (
    !tripId ||
    !passengers ||
    !Array.isArray(passengers) ||
    passengers.length === 0
  ) {
    return res.status(400).json({
      error: 'Invalid booking data. Trip and passengers are required.',
    });
  }

  if (paymentMethod !== 'MPESA' && paymentMethod !== 'CASH') {
    return res.status(400).json({
      error: 'Invalid payment method. Please select M-Pesa or Cash.',
    });
  }

  const trip = trips.find((t) => t.id === tripId);

  if (!trip) {
    return res.status(404).json({
      error: 'Selected trip could not be found.',
    });
  }

  const requestedSeatNumbers = passengers.map((p: any) =>
    String(p.seatNumber || '').trim().toUpperCase(),
  );

  const carSeatViewMap: Record<number, string[]> = {
    11: ['P1', 'P2', '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C'],
    14: ['P1', 'P2', '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3C', '4A', '4B', '4C', '4D'],
    16: ['P1', 'P2', '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '5A', '5B', '5C', '5D'],
  };

  if (carSeatView && carSeatViewMap[Number(carSeatView)]) {
    const allowedInView = carSeatViewMap[Number(carSeatView)];
    const invalidForView = requestedSeatNumbers.filter((s: string) => !allowedInView.includes(s));
    if (invalidForView.length > 0) {
      return res.status(400).json({
        error: `Seat(s) ${invalidForView.join(', ')} do not belong to the chosen ${carSeatView}-Seater car seat view.`,
      });
    }
  }

  const allowedSeatsPattern = /^(P[1-2]|F[1-2]|[1-6][A-D])$/;
  const invalidSeats = requestedSeatNumbers.filter(
    (seat: string) => !allowedSeatsPattern.test(seat),
  );

  if (invalidSeats.length > 0) {
    return res.status(400).json({
      error: `Invalid seat selection: ${invalidSeats.join(', ')}.`,
    });
  }

  const duplicateSeats = requestedSeatNumbers.filter(
    (seat, index) => requestedSeatNumbers.indexOf(seat) !== index,
  );

  if (duplicateSeats.length > 0) {
    return res.status(409).json({
      error: `Seat(s) ${Array.from(new Set(duplicateSeats)).join(', ')} were selected more than once.`,
    });
  }

  const fareQuote = calculateTripFare(trip, requestedSeatNumbers);

  if (
    frontendTotal !== undefined &&
    Number(frontendTotal) !== fareQuote.total
  ) {
    return res.status(409).json({
      error: 'Fare changed. Please refresh the fare quote and try again.',
      expectedTotal: fareQuote.total,
    });
  }

  // Idempotency check: if the exact same passenger/phone retries the exact same seats while PENDING_PAYMENT, return existing booking
  const normalizedRequestPhone = String(contactPhone || '').replace(/\D+/g, '').slice(-8);
  const existingIdenticalPending = bookings.find((b) => {
    if (
      b.tripId !== trip.id ||
      b.bookingStatus !== 'PENDING_PAYMENT' ||
      b.paymentStatus !== 'PENDING'
    ) {
      return false;
    }
    const ageMs = Date.now() - new Date(b.createdAt).getTime();
    if (ageMs > SEAT_LOCK_TIMEOUT_MS) return false;
    const bPhone = String(b.contactPhone || '').replace(/\D+/g, '').slice(-8);
    if (!normalizedRequestPhone || bPhone !== normalizedRequestPhone) return false;
    const bSeats = b.passengers
      .map((p) => String(p.seatNumber).trim().toUpperCase())
      .sort()
      .join(',');
    const reqSeatsSorted = [...requestedSeatNumbers].sort().join(',');
    return bSeats === reqSeatsSorted;
  });

  if (existingIdenticalPending) {
    return res.status(200).json({
      message: 'Booking already reserved. Please complete payment.',
      booking: existingIdenticalPending,
      idempotent: true,
    });
  }

  const activeTripBookingsSeats = new Set<string>(
    trip.bookedSeatNumbers.map((s) => String(s).trim().toUpperCase()),
  );
  for (const b of bookings) {
    if (
      b.tripId === trip.id &&
      (b.bookingStatus === 'CONFIRMED' ||
        b.bookingStatus === 'CHECKED_IN' ||
        b.bookingStatus === 'PENDING_PAYMENT')
    ) {
      b.passengers.forEach((p) =>
        activeTripBookingsSeats.add(String(p.seatNumber).trim().toUpperCase()),
      );
    }
  }

  const alreadyBooked = requestedSeatNumbers.filter((num: string) =>
    activeTripBookingsSeats.has(num),
  );

  if (alreadyBooked.length > 0) {
    return res.status(409).json({
      error: `Seat(s) ${alreadyBooked.join(', ')} were just reserved by another passenger. Please select alternative seats.`,
      conflictingSeats: alreadyBooked,
    });
  }

  if (contactName && !isValidPassengerName(contactName)) {
    return res.status(400).json({
      error: 'Invalid passenger details: Contact person must provide a valid full legal name (First & Last Name).',
    });
  }

  if (contactPhone && !isValidKenyanPhone(contactPhone)) {
    return res.status(400).json({
      error: 'Invalid passenger details: Please provide a valid Kenyan mobile phone number (e.g. 07XXXXXXXX or +2547XXXXXXXX).',
    });
  }

  for (let i = 0; i < passengers.length; i++) {
    const p = passengers[i];
    if (!isValidPassengerName(p.fullName)) {
      return res.status(400).json({
        error: `Invalid passenger details: Passenger in Seat ${p.seatNumber || (i + 1)} must provide a valid legal name (First & Last Name).`,
      });
    }
    if (!isValidKenyanIdOrPassport(p.idNumber)) {
      return res.status(400).json({
        error: `Invalid passenger details: Passenger in Seat ${p.seatNumber || (i + 1)} has an invalid National ID or Passport Number (must be 7-8 digits or valid passport).`,
      });
    }
  }

  const processedPassengers = passengers.map((p: any) => {
    const fare = trip.fareKsh;

    return {
      fullName: p.fullName.trim(),
      idNumber: p.idNumber.trim(),
      seatNumber: String(p.seatNumber).trim().toUpperCase(),
      seatClass: 'STANDARD' as SeatClass,
      fareKsh: fare,
      hasBoarded: false,
    };
  });

  const bookingReference = `TRP-${Math.floor(10000 + Math.random() * 90000)}`;
  const primaryTicketId = generateUniqueTicketId();
  const primaryQrToken = generateSecureQrToken(primaryTicketId);

  const newBooking: Booking = {
    id: `bk-${Date.now()}`,
    bookingReference,
    ticketId: primaryTicketId,
    qrToken: primaryQrToken,
    tripId: trip.id,
    tripCode: trip.tripCode,
    routeOrigin: trip.route.origin,
    routeDestination: trip.route.destination,
    departureTime: trip.departureTime,
    busRegistration: trip.vehicle.registrationNumber,
    vehicleId: trip.vehicle.id,
    contactName: String(contactName || '').trim(),
    contactPhone: String(contactPhone || '').trim(),
    contactEmail: String(contactEmail || 'passenger@transcarrongai.co.ke').trim(),
    emergencyContactName: emergencyContactName?.trim(),
    emergencyContactPhone: emergencyContactPhone?.trim(),
    passengers: processedPassengers,
    totalFareKsh: fareQuote.total,
    bookingStatus: 'PENDING_PAYMENT',
    paymentStatus: 'PENDING',
    boardingStatus: 'NOT_BOARDED',
    paymentMethod,
    createdAt: new Date().toISOString(),
  };

  ensureBookingTickets(newBooking, trips);

  trip.bookedSeatNumbers.push(...requestedSeatNumbers);

  trip.availableSeats = Math.max(
    0,
    trip.totalSeats - trip.bookedSeatNumbers.length,
  );

  bookings.unshift(newBooking);

  res.status(201).json({
    message: 'Booking created successfully. Please complete payment.',
    booking: newBooking,
  });
});

// =============================================================
// M-PESA STK PUSH
// =============================================================

const handleStkPush = async (req: Request, res: Response) => {
  cleanupExpiredUnpaidBookings();
  const { bookingReference, phone, amount } = req.body;

  if (!bookingReference || !phone) {
    return res.status(400).json({
      error: 'Booking reference and phone number required.',
    });
  }

  if (!isValidKenyanPhone(String(phone))) {
    return res.status(400).json({
      error: 'Invalid phone number format for M-Pesa STK Push.',
    });
  }

  const booking = bookings.find(
    (b) => b.bookingReference === bookingReference,
  );

  if (!booking) {
    return res.status(404).json({
      error: 'Booking not found.',
    });
  }

  if (
    booking.bookingStatus === 'CANCELLED' ||
    booking.bookingStatus === 'EXPIRED' ||
    booking.bookingStatus === 'REFUNDED'
  ) {
    return res.status(409).json({
      error: `Booking ${booking.bookingReference} is ${booking.bookingStatus} and cannot initiate payment.`,
    });
  }

  if (booking.paymentStatus === 'PAID') {
    return res.status(200).json({
      status: 'ALREADY_PAID',
      alreadyPaid: true,
      booking,
      customerMessage: 'Booking is already paid.',
    });
  }

  const result = await initiateDarajaStkPush({
    booking,
    phone,
    amount: amount !== undefined ? Number(amount) : undefined,
  });

  return res.status(result.statusCode).json(result.body);
};

router.post('/api/payments/mpesa-stk', stkLimiter, handleStkPush);
router.post('/api/mpesa/stkpush', stkLimiter, handleStkPush);

// =============================================================
// DARAJA CALLBACK
// =============================================================

router.post('/api/mpesa/callback', limiter, (req, res) => {
  cleanupExpiredUnpaidBookings();
  const rawBody = Buffer.isBuffer((req as any).rawBody)
    ? (req as any).rawBody
    : Buffer.from(JSON.stringify(req.body || {}));

  const signature = req.header('x-mpesa-signature') || '';

  const sigCheck = verifyDarajaCallbackSignature(rawBody, signature);
  if (!sigCheck.valid) {
    return res.status(401).json({
      error: sigCheck.error || 'Invalid callback signature.',
    });
  }

  let callback: any;
  try {
    callback = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({
      error: 'Malformed callback JSON payload.',
    });
  }

  const result = callback?.Body?.stkCallback;
  const requestId =
    typeof result?.CheckoutRequestID === 'string'
      ? result.CheckoutRequestID.trim()
      : '';

  if (!result || !requestId || result.ResultCode === undefined) {
    return res.status(400).json({
      error: 'Malformed M-Pesa stkCallback payload.',
    });
  }

  // Idempotent duplicate callback handling
  if (processedMpesaCallbacks.has(requestId)) {
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted (Idempotent)',
      idempotent: true,
    });
  }

  const pending = pendingMpesaRequests.get(requestId);

  if (!pending) {
    return res.status(404).json({
      error: 'Unknown checkout request.',
    });
  }

  const booking = bookings.find(
    (item) => item.bookingReference === pending.bookingReference,
  );

  const numericResultCode = Number(result.ResultCode);

  if (numericResultCode === 0) {
    const metadata = Array.isArray(result.CallbackMetadata?.Item)
      ? result.CallbackMetadata.Item
      : [];
    const receipt = metadata.find(
      (item: any) => item && item.Name === 'MpesaReceiptNumber',
    )?.Value;

    if (!receipt) {
      return res.status(400).json({
        error: 'Successful callback did not include a transaction ID.',
      });
    }

    if (booking) {
      const seatCheck = areBookingSeatsStillAvailable(booking);
      if (!seatCheck.available) {
        booking.bookingStatus = 'CANCELLED';
        booking.paymentStatus = 'REFUNDED';
        booking.mpesaTransactionCode = String(receipt);
        processedMpesaCallbacks.set(requestId, {
          resultCode: numericResultCode,
          receipt: String(receipt),
          processedAt: Date.now(),
        });
        pendingMpesaRequests.delete(requestId);
        return res.status(409).json({
          ResultCode: 1,
          ResultDesc: `Late payment received after seat lock expiry; seat(s) ${seatCheck.conflictingSeats.join(', ')} already taken. Marked for refund.`,
        });
      }
      markBookingPaid(booking, String(receipt), 'MPESA');
    }

    processedMpesaCallbacks.set(requestId, {
      resultCode: 0,
      receipt: String(receipt),
      processedAt: Date.now(),
    });
  } else {
    // Non-zero ResultCode: failed, cancelled (1032), or timed out (1037)
    if (booking && booking.paymentStatus !== 'PAID') {
      booking.paymentStatus = 'FAILED';
    }
    processedMpesaCallbacks.set(requestId, {
      resultCode: numericResultCode,
      processedAt: Date.now(),
    });
  }

  pendingMpesaRequests.delete(requestId);

  res.json({
    ResultCode: 0,
    ResultDesc: 'Accepted',
  });
});

// =============================================================
// M-PESA VERIFICATION
// =============================================================

router.post('/api/payments/verify', async (req, res) => {
  cleanupExpiredUnpaidBookings();
  const {
    bookingReference,
    checkoutRequestId,
    transactionCode,
    paymentMethod,
  } = req.body;

  const booking = bookings.find(
    (b) => b.bookingReference === bookingReference,
  );

  if (!booking) {
    return res.status(404).json({
      error: 'Booking not found.',
    });
  }

  // Idempotent return if booking is already paid
  if (booking.paymentStatus === 'PAID') {
    ensureBookingTickets(booking, trips);
    return res.json({
      success: true,
      idempotent: true,
      message: 'Payment already confirmed.',
      booking,
    });
  }

  if (
    booking.bookingStatus === 'CANCELLED' ||
    booking.bookingStatus === 'EXPIRED' ||
    booking.bookingStatus === 'REFUNDED'
  ) {
    return res.status(409).json({
      error: `Booking ${booking.bookingReference} reservation has ${booking.bookingStatus.toLowerCase()}. Please create a new booking.`,
    });
  }

  const seatCheck = areBookingSeatsStillAvailable(booking);
  if (!seatCheck.available) {
    booking.bookingStatus = 'CANCELLED';
    booking.paymentStatus = 'FAILED';
    return res.status(409).json({
      error: `Seat(s) ${seatCheck.conflictingSeats.join(', ')} are no longer available.`,
    });
  }

  if (paymentMethod === 'CASH') {
    const cleanCashRef = transactionCode
      ? String(transactionCode).trim().toUpperCase()
      : `CASH-${Math.floor(100000 + Math.random() * 900000)}`;
    markBookingPaid(booking, cleanCashRef, 'CASH');
    return res.json({
      success: true,
      message: 'Cash payment booking confirmed successfully.',
      booking,
    });
  }

  if (transactionCode) {
    const code = String(transactionCode).trim().toUpperCase();
    if (!/^[A-Z0-9-]{6,16}$/.test(code)) {
      return res.status(400).json({
        error: 'Invalid M-Pesa transaction code format. Must be 8-12 alphanumeric characters (e.g. QGH8491KLR).',
      });
    }

    // Prevent replay attack / double usage of the same M-Pesa code
    const existingBookingWithCode = bookings.find(
      (b) => b.mpesaTransactionCode === code && b.id !== booking.id,
    );
    if (existingBookingWithCode) {
      return res.status(409).json({
        error: `M-Pesa transaction code ${code} has already been used for booking ${existingBookingWithCode.bookingReference}.`,
      });
    }

    markBookingPaid(booking, code, 'MPESA');
    return res.json({
      success: true,
      message: 'M-Pesa payment confirmed successfully.',
      booking,
    });
  }

  const queryResult = await queryDarajaStkStatus(checkoutRequestId, booking);
  return res.status(queryResult.statusCode).json(queryResult.body);
});

export default router;
