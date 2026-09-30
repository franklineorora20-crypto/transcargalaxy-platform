import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import type { Server } from 'http';

const TEST_HMAC_SECRET = `test-mpesa-hmac-${crypto.randomBytes(8).toString('hex')}`;
const TEST_MANAGER_SECRET = `mgr-${crypto.randomBytes(8).toString('hex')}`;
const TEST_DRIVER_SECRET = `drv-${crypto.randomBytes(8).toString('hex')}`;

process.env.VERCEL = '1';
process.env.MPESA_CALLBACK_SECRET = TEST_HMAC_SECRET;
process.env.INITIAL_MANAGER_EMAIL = 'manager@transcargalaxy.com';
process.env.INITIAL_MANAGER_PASSWORD = TEST_MANAGER_SECRET;
process.env.INITIAL_DRIVER_PASSWORD = TEST_DRIVER_SECRET;

import { app } from '../server';
import { bookings, pendingMpesaRequests, revenues, trips, drivers } from '../server/store';
import {
  cleanupExpiredUnpaidBookings,
  SEAT_LOCK_TIMEOUT_MS,
} from '../server/domain/bookings/bookingService';

let server: Server;
let baseUrl = '';

async function requestJson(
  path: string,
  options: RequestInit = {},
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${baseUrl}${path}`, options);
  const text = await res.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // leave as text
  }
  return { status: res.status, body };
}

function signCallbackPayload(payload: object): { raw: string; signature: string } {
  const raw = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', process.env.MPESA_CALLBACK_SECRET!)
    .update(Buffer.from(raw))
    .digest('hex');
  return { raw, signature };
}

describe('Phase 4 — Production Hardening Suite', () => {
  let managerToken = '';
  let driverToken = '';

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('1. Security Audit — Authentication, RBAC & Session Revocation', () => {
    it('rejects unauthenticated requests to manager, driver, and supabase admin endpoints with 401', async () => {
      const endpoints = [
        '/api/manager/dashboard-stats',
        '/api/manager/finance/revenue',
        '/api/manager/finance/expenses',
        '/api/manager/bookings',
        '/api/driver/my-trips',
        '/api/supabase/status',
        '/api/supabase/schema',
      ];
      for (const ep of endpoints) {
        const res = await requestJson(ep);
        assert.equal(res.status, 401, `Expected 401 on unauthenticated ${ep}`);
      }
    });

    it('rejects forged, wildcard, and legacy demo tokens with 401', async () => {
      const forgedTokens = [
        'demo-manager-token',
        'demo-driver-token',
        'fake-admin-token',
        'manager-bypass',
        'director-override',
        'tc_mgr_sess_forged_token_without_valid_hmac',
        'tc_drv_sess_forged_token_without_valid_hmac',
      ];
      for (const tok of forgedTokens) {
        const res = await requestJson('/api/manager/dashboard-stats', {
          headers: { Authorization: `Bearer ${tok}` },
        });
        assert.equal(res.status, 401, `Forged token "${tok}" must be rejected with 401`);
      }
    });

    it('rejects invalid manager and driver login passwords with 401', async () => {
      const badMgr = await requestJson('/api/auth/manager-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'manager@transcargalaxy.com', password: 'wrongpassword' }),
      });
      assert.equal(badMgr.status, 401);

      const badDrv = await requestJson('/api/auth/driver-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'driver@transcargalaxy.com', password: 'wrongpassword' }),
      });
      assert.equal(badDrv.status, 401);
    });

    it('authenticates valid driver and manager accounts and enforces strict RBAC (Driver 403 on Manager routes)', async () => {
      const drvLogin = await requestJson('/api/auth/driver-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'driver@transcargalaxy.com', password: TEST_DRIVER_SECRET }),
      });
      assert.equal(drvLogin.status, 200);
      assert.ok(drvLogin.body.token?.startsWith('tc_drv_sess_'));
      driverToken = drvLogin.body.token;

      // Driver can access driver endpoints
      const drvTrips = await requestJson('/api/driver/my-trips', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      assert.equal(drvTrips.status, 200);

      // Driver CANNOT access manager endpoints (403 Forbidden)
      const drvToMgr = await requestJson('/api/manager/finance/revenue', {
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      assert.equal(drvToMgr.status, 403);

      const mgrLogin = await requestJson('/api/auth/manager-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'manager@transcargalaxy.com', password: TEST_MANAGER_SECRET }),
      });
      assert.equal(mgrLogin.status, 200);
      assert.ok(mgrLogin.body.token?.startsWith('tc_mgr_sess_'));
      managerToken = mgrLogin.body.token;

      const mgrStats = await requestJson('/api/manager/dashboard-stats', {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      assert.equal(mgrStats.status, 200);
    });

    it('revokes session token on POST /api/auth/logout so it cannot be reused', async () => {
      const tempLogin = await requestJson('/api/auth/manager-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'manager@transcargalaxy.com', password: TEST_MANAGER_SECRET }),
      });
      const tempToken = tempLogin.body.token;
      assert.ok(tempToken);

      const beforeLogout = await requestJson('/api/manager/dashboard-stats', {
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      assert.equal(beforeLogout.status, 200);

      const logoutRes = await requestJson('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      assert.equal(logoutRes.status, 200);

      const afterLogout = await requestJson('/api/manager/dashboard-stats', {
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      assert.equal(afterLogout.status, 401);
    });
  });

  describe('2. Booking Reliability & Seat-Lock Concurrency', () => {
    it('prevents simultaneous double-booking of the same seat while handling duplicate retries idempotently', async () => {
      const targetTrip = trips.find((t) => t.id === 'trip-rng-ksi-02')!;
      const testSeat = '4D';
      targetTrip.bookedSeatNumbers = targetTrip.bookedSeatNumbers.filter((s) => s !== testSeat);

      const payloadA = {
        tripId: targetTrip.id,
        passengers: [{ fullName: 'Alice Nyambura', idNumber: '29481023', seatNumber: testSeat }],
        contactName: 'Alice Nyambura',
        contactPhone: '0723456789',
        contactEmail: 'alice@example.com',
        paymentMethod: 'MPESA',
      };

      const payloadB = {
        tripId: targetTrip.id,
        passengers: [{ fullName: 'Brian Omondi', idNumber: '31849201', seatNumber: testSeat }],
        contactName: 'Brian Omondi',
        contactPhone: '0734567890',
        contactEmail: 'brian@example.com',
        paymentMethod: 'MPESA',
      };

      const [resA, resB] = await Promise.all([
        requestJson('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadA),
        }),
        requestJson('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadB),
        }),
      ]);

      assert.equal(resA.status, 201);
      assert.equal(resB.status, 409, 'Second passenger attempting to book the same seat must get 409');

      // Duplicate retry by Alice (same phone & seat while pending) returns idempotent 200
      const retryA = await requestJson('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadA),
      });
      assert.equal(retryA.status, 200);
      assert.equal(retryA.body.idempotent, true);
      assert.equal(retryA.body.booking.bookingReference, resA.body.booking.bookingReference);
    });

    it('rejects client-manipulated fare totals and enforces server-calculated fare', async () => {
      const targetTrip = trips.find((t) => t.id === 'trip-rng-ksi-02')!;
      const res = await requestJson('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: targetTrip.id,
          passengers: [{ fullName: 'Grace Moraa', idNumber: '28491024', seatNumber: '4C' }],
          contactName: 'Grace Moraa',
          contactPhone: '0745678901',
          frontendTotal: 50, // Tampered fare
        }),
      });
      assert.equal(res.status, 409);
      assert.equal(res.body.expectedTotal, targetTrip.fareKsh);
    });

    it('expires unpaid bookings after 10 minutes, releases seats, and blocks late payment if seat was re-booked', async () => {
      const targetTrip = trips.find((t) => t.id === 'trip-rng-ksi-02')!;
      const expirySeat = '4B';
      targetTrip.bookedSeatNumbers = targetTrip.bookedSeatNumbers.filter((s) => s !== expirySeat);

      const firstRes = await requestJson('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: targetTrip.id,
          passengers: [{ fullName: 'David Kiprop', idNumber: '27591823', seatNumber: expirySeat }],
          contactName: 'David Kiprop',
          contactPhone: '0756789012',
          paymentMethod: 'MPESA',
        }),
      });
      assert.equal(firstRes.status, 201);
      const expiredRef = firstRes.body.booking.bookingReference;

      // Age booking past 10-minute lock timeout
      const bookingObj = bookings.find((b) => b.bookingReference === expiredRef)!;
      bookingObj.createdAt = new Date(Date.now() - SEAT_LOCK_TIMEOUT_MS - 5000).toISOString();
      cleanupExpiredUnpaidBookings();

      assert.equal(bookingObj.bookingStatus, 'EXPIRED');
      assert.ok(!targetTrip.bookedSeatNumbers.includes(expirySeat), 'Seat must be released after expiry');

      // Another passenger can now book the released seat
      const secondRes = await requestJson('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: targetTrip.id,
          passengers: [{ fullName: 'Esther Wanjiku', idNumber: '30192834', seatNumber: expirySeat }],
          contactName: 'Esther Wanjiku',
          contactPhone: '0767890123',
          paymentMethod: 'MPESA',
        }),
      });
      assert.equal(secondRes.status, 201);

      // Late payment attempt on the expired booking must be rejected with 409
      const latePay = await requestJson('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingReference: expiredRef,
          transactionCode: 'QKL9988776',
          paymentMethod: 'MPESA',
        }),
      });
      assert.equal(latePay.status, 409);
    });
  });

  describe('3. M-Pesa Payment Lifecycle, Callbacks & Idempotency', () => {
    it('completes full Booking → STK Push → Signed Callback → Idempotent Retry → Ticket Confirmation lifecycle', async () => {
      const targetTrip = trips.find((t) => t.id === 'trip-rng-ksi-01')!;
      const seat = '3C';
      targetTrip.bookedSeatNumbers = targetTrip.bookedSeatNumbers.filter((s) => s !== seat);

      // 1. Create booking
      const createRes = await requestJson('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: targetTrip.id,
          passengers: [{ fullName: 'Samuel Bosire', idNumber: '26482910', seatNumber: seat }],
          contactName: 'Samuel Bosire',
          contactPhone: '0722334455',
          paymentMethod: 'MPESA',
        }),
      });
      assert.equal(createRes.status, 201);
      const bookingRef = createRes.body.booking.bookingReference;

      // 2. Initiate STK Push (rejects tampered amount first)
      const tamperedStk = await requestJson('/api/payments/mpesa-stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingReference: bookingRef, phone: '0722334455', amount: 100 }),
      });
      assert.equal(tamperedStk.status, 400);

      const stkRes = await requestJson('/api/payments/mpesa-stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingReference: bookingRef,
          phone: '0722334455',
          amount: targetTrip.fareKsh,
        }),
      });
      assert.equal(stkRes.status, 202);
      const checkoutRequestId = stkRes.body.checkoutRequestId;
      assert.ok(checkoutRequestId);

      // 3. Reject unsigned/invalid signature callback
      const badSigRes = await requestJson('/api/mpesa/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mpesa-signature': 'invalid-signature',
        },
        body: JSON.stringify({ Body: { stkCallback: { CheckoutRequestID: checkoutRequestId, ResultCode: 0 } } }),
      });
      assert.equal(badSigRes.status, 401);

      // 4. Process valid signed Daraja callback
      const revenueCountBefore = revenues.length;
      const callbackPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: '29115-34620561-1',
            CheckoutRequestID: checkoutRequestId,
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: targetTrip.fareKsh },
                { Name: 'MpesaReceiptNumber', Value: 'QWE7890123' },
                { Name: 'PhoneNumber', Value: 254722334455 },
              ],
            },
          },
        },
      };
      const signed = signCallbackPayload(callbackPayload);
      const cbRes = await requestJson('/api/mpesa/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mpesa-signature': signed.signature,
        },
        body: signed.raw,
      });
      assert.equal(cbRes.status, 200);
      assert.equal(revenues.length, revenueCountBefore + 1);

      // 5. Duplicate callback is idempotent and does not add duplicate revenue
      const dupCbRes = await requestJson('/api/mpesa/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mpesa-signature': signed.signature,
        },
        body: signed.raw,
      });
      assert.equal(dupCbRes.status, 200);
      assert.equal(dupCbRes.body.idempotent, true);
      assert.equal(revenues.length, revenueCountBefore + 1);

      // 6. Verify ticket status is PAID & CONFIRMED
      const statusRes = await requestJson(`/api/tickets/status/${bookingRef}`);
      assert.equal(statusRes.status, 200);
      assert.equal(statusRes.body.paymentStatus, 'PAID');
      assert.equal(statusRes.body.bookingStatus, 'CONFIRMED');
    });

    it('handles failed/cancelled M-Pesa callbacks (ResultCode 1032) and malformed callbacks safely', async () => {
      const checkoutId = `ws_CO_CANCEL_${Date.now()}`;
      const targetBooking = bookings.find((b) => b.paymentStatus === 'PENDING')!;
      pendingMpesaRequests.set(checkoutId, {
        bookingReference: targetBooking.bookingReference,
        amount: targetBooking.totalFareKsh,
        phone: targetBooking.contactPhone,
      });

      const cancelPayload = {
        Body: {
          stkCallback: {
            CheckoutRequestID: checkoutId,
            ResultCode: 1032,
            ResultDesc: 'Request cancelled by user',
          },
        },
      };
      const signed = signCallbackPayload(cancelPayload);
      const res = await requestJson('/api/mpesa/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mpesa-signature': signed.signature,
        },
        body: signed.raw,
      });
      assert.equal(res.status, 200);
      assert.equal(targetBooking.paymentStatus, 'FAILED');

      // Malformed callback without CheckoutRequestID returns 400
      const malformedSigned = signCallbackPayload({ Body: { stkCallback: {} } });
      const malformedRes = await requestJson('/api/mpesa/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mpesa-signature': malformedSigned.signature,
        },
        body: malformedSigned.raw,
      });
      assert.equal(malformedRes.status, 400);
    });
  });

  describe('4. Ticket + QR Security & End-to-End Driver Boarding Flow', () => {
    it('verifies valid ticket, blocks tampered QR / unpaid / wrong-trip / cancelled / expired tickets, and prevents duplicate boarding', async () => {
      const targetTrip = trips.find((t) => t.id === 'trip-rng-ksi-01')!;
      const seat = '3B';
      targetTrip.bookedSeatNumbers = targetTrip.bookedSeatNumbers.filter((s) => s !== seat);

      // 1. Create booking
      const bookRes = await requestJson('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: targetTrip.id,
          passengers: [{ fullName: 'agnes Kerubo', idNumber: '25491827', seatNumber: seat }],
          contactName: 'Agnes Kerubo',
          contactPhone: '0728112233',
          paymentMethod: 'MPESA',
        }),
      });
      assert.equal(bookRes.status, 201);
      const booking = bookRes.body.booking;
      const ticketId = booking.passengers[0].ticketId;
      const qrToken = booking.passengers[0].qrToken;

      // 2. Unpaid ticket verification returns PAYMENT_PENDING and blocks boarding
      const unpaidVerify = await requestJson('/api/driver/tickets/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ qr_token: qrToken, trip_id: targetTrip.id }),
      });
      assert.equal(unpaidVerify.status, 200);
      assert.equal(unpaidVerify.body.valid, false);
      assert.equal(unpaidVerify.body.code, 'PAYMENT_PENDING');

      const unpaidBoard = await requestJson('/api/driver/tickets/board', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ qr_token: qrToken, trip_id: targetTrip.id }),
      });
      assert.equal(unpaidBoard.status, 400);

      // 3. Complete payment
      const payRes = await requestJson('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingReference: booking.bookingReference,
          transactionCode: 'QZX1122334',
          paymentMethod: 'MPESA',
        }),
      });
      assert.equal(payRes.status, 200);

      // 4. Tampered QR token is rejected with NOT_FOUND
      const tamperedVerify = await requestJson('/api/driver/tickets/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          qr_token: `${qrToken.slice(0, -4)}ffff`,
          trip_id: targetTrip.id,
        }),
      });
      assert.equal(tamperedVerify.body.valid, false);
      assert.equal(tamperedVerify.body.code, 'NOT_FOUND');

      // 5. Wrong trip check returns WRONG_TRIP
      const wrongTripVerify = await requestJson('/api/driver/tickets/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ qr_token: qrToken, trip_id: 'trip-rng-ksi-02' }),
      });
      assert.equal(wrongTripVerify.body.valid, false);
      assert.equal(wrongTripVerify.body.code, 'WRONG_TRIP');

      // 6. Valid QR scan on assigned trip returns VALID
      const validVerify = await requestJson('/api/driver/tickets/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ qr_token: qrToken, trip_id: targetTrip.id }),
      });
      assert.equal(validVerify.body.valid, true);
      assert.equal(validVerify.body.code, 'VALID');

      // 7. First boarding scan succeeds
      const firstBoard = await requestJson('/api/driver/tickets/board', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ qr_token: qrToken, trip_id: targetTrip.id }),
      });
      assert.equal(firstBoard.status, 200);
      assert.equal(firstBoard.body.boarded, true);
      assert.equal(firstBoard.body.alreadyBoarded, false);

      // 8. Second / duplicate boarding scan returns ALREADY_BOARDED
      const secondBoard = await requestJson('/api/driver/tickets/board', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`,
        },
        body: JSON.stringify({ qr_token: qrToken, trip_id: targetTrip.id }),
      });
      assert.equal(secondBoard.status, 200);
      assert.equal(secondBoard.body.valid, false);
      assert.equal(secondBoard.body.code, 'ALREADY_BOARDED');
      assert.equal(secondBoard.body.alreadyBoarded, true);
    });
  });
});
