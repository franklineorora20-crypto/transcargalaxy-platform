import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import type { Server } from 'http';

const TEST_HMAC_SECRET = `pw-mpesa-hmac-${crypto.randomBytes(8).toString('hex')}`;
const TEST_MANAGER_SECRET = `pw-mgr-${crypto.randomBytes(8).toString('hex')}`;
const TEST_DRIVER_SECRET = `pw-drv-${crypto.randomBytes(8).toString('hex')}`;

process.env.VERCEL = '1';
process.env.MPESA_CALLBACK_SECRET = TEST_HMAC_SECRET;
process.env.INITIAL_MANAGER_EMAIL = 'manager@transcargalaxy.com';
process.env.INITIAL_MANAGER_PASSWORD = TEST_MANAGER_SECRET;
process.env.INITIAL_DRIVER_PASSWORD = TEST_DRIVER_SECRET;

import { app } from '../server';
import { trips } from '../server/store';

let server: Server;
let baseUrl = '';

function signDarajaCallback(payload: object): { raw: string; signature: string } {
  const raw = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', TEST_HMAC_SECRET)
    .update(Buffer.from(raw))
    .digest('hex');
  return { raw, signature };
}

test.describe('TransCar Galaxy — Phase 4 Critical E2E & Production Hardening Flow', () => {
  test.beforeAll(async () => {
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

  test.afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  test('Critical E2E Flow: Search → Select Trip → Select Seat → Passenger Details → Payment → Ticket → Driver Scan → Boarding', async ({
    request,
  }) => {
    // 1. Search available trips
    const searchRes = await request.get(`${baseUrl}/api/trips?origin=Rongai&destination=Kisii`);
    expect(searchRes.status()).toBe(200);
    const availableTrips = await searchRes.json();
    expect(Array.isArray(availableTrips)).toBe(true);
    expect(availableTrips.length).toBeGreaterThan(0);

    // 2. Select Trip & verify seat map availability
    const selectedTrip =
      availableTrips.find((t: any) => t.id === 'trip-rng-ksi-01') || availableTrips[0];
    const tripId = selectedTrip.id;
    const seatToBook = '3D';

    const storeTrip = trips.find((t) => t.id === tripId);
    if (storeTrip) {
      storeTrip.bookedSeatNumbers = storeTrip.bookedSeatNumbers.filter((s) => s !== seatToBook);
    }

    const detailRes = await request.get(`${baseUrl}/api/trips/${tripId}`);
    expect(detailRes.status()).toBe(200);
    const tripDetails = await detailRes.json();
    expect(tripDetails.id).toBe(tripId);

    // 3. Select Seat & Submit Passenger Details (Create Booking)
    const bookingRes = await request.post(`${baseUrl}/api/bookings`, {
      data: {
        tripId,
        passengers: [
          {
            fullName: 'Wycliffe Ochieng',
            idNumber: '29182736',
            seatNumber: seatToBook,
          },
        ],
        contactName: 'Wycliffe Ochieng',
        contactPhone: '0722446688',
        contactEmail: 'wycliffe@example.com',
        paymentMethod: 'MPESA',
      },
    });
    expect(bookingRes.status()).toBe(201);
    const bookingPayload = await bookingRes.json();
    const booking = bookingPayload.booking;
    expect(booking.bookingReference).toBeTruthy();
    expect(booking.paymentStatus).toBe('PENDING');

    const bookingRef = booking.bookingReference;
    const qrToken = booking.passengers[0].qrToken;

    // 4. Simultaneous seat-booking attempt by another user must fail with 409
    const conflictRes = await request.post(`${baseUrl}/api/bookings`, {
      data: {
        tripId,
        passengers: [
          {
            fullName: 'Competing Passenger',
            idNumber: '33445566',
            seatNumber: seatToBook,
          },
        ],
        contactName: 'Competing Passenger',
        contactPhone: '0799887766',
        paymentMethod: 'MPESA',
      },
    });
    expect(conflictRes.status()).toBe(409);

    // 5. Initiate M-Pesa STK Push & Process Signed Daraja Callback
    const stkRes = await request.post(`${baseUrl}/api/payments/mpesa-stk`, {
      data: {
        bookingReference: bookingRef,
        phone: '0722446688',
        amount: booking.totalFareKsh,
      },
    });
    expect(stkRes.status()).toBe(202);
    const stkBody = await stkRes.json();
    expect(stkBody.checkoutRequestId).toBeTruthy();

    const callbackPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: '19283-746512-1',
          CheckoutRequestID: stkBody.checkoutRequestId,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: booking.totalFareKsh },
              { Name: 'MpesaReceiptNumber', Value: 'QRT5566778' },
              { Name: 'PhoneNumber', Value: 254722446688 },
            ],
          },
        },
      },
    };
    const signedCb = signDarajaCallback(callbackPayload);
    const cbRes = await request.post(`${baseUrl}/api/mpesa/callback`, {
      headers: {
        'Content-Type': 'application/json',
        'x-mpesa-signature': signedCb.signature,
      },
      data: JSON.parse(signedCb.raw),
    });
    expect(cbRes.status()).toBe(200);

    // 6. Retrieve Confirmed Digital Ticket
    const ticketStatusRes = await request.get(`${baseUrl}/api/tickets/status/${bookingRef}`);
    expect(ticketStatusRes.status()).toBe(200);
    const ticketStatus = await ticketStatusRes.json();
    expect(ticketStatus.paymentStatus).toBe('PAID');
    expect(ticketStatus.bookingStatus).toBe('CONFIRMED');

    const retrieveRes = await request.post(`${baseUrl}/api/tickets/retrieve`, {
      data: {
        bookingReference: bookingRef,
        phone: '0722446688',
      },
    });
    expect(retrieveRes.status()).toBe(200);

    // 7. Driver Login, QR Scan Verification & Passenger Boarding
    const drvLoginRes = await request.post(`${baseUrl}/api/auth/driver-login`, {
      data: {
        email: 'driver@transcargalaxy.com',
        password: TEST_DRIVER_SECRET,
      },
    });
    expect(drvLoginRes.status()).toBe(200);
    const { token: driverToken } = await drvLoginRes.json();
    expect(driverToken).toContain('tc_drv_sess_');

    const verifyRes = await request.post(`${baseUrl}/api/driver/tickets/verify`, {
      headers: { Authorization: `Bearer ${driverToken}` },
      data: { qr_token: qrToken, trip_id: tripId },
    });
    expect(verifyRes.status()).toBe(200);
    const verifyBody = await verifyRes.json();
    expect(verifyBody.valid).toBe(true);
    expect(verifyBody.code).toBe('VALID');

    const boardRes = await request.post(`${baseUrl}/api/driver/tickets/board`, {
      headers: { Authorization: `Bearer ${driverToken}` },
      data: { qr_token: qrToken, trip_id: tripId },
    });
    expect(boardRes.status()).toBe(200);
    const boardBody = await boardRes.json();
    expect(boardBody.boarded).toBe(true);
    expect(boardBody.alreadyBoarded).toBe(false);

    // 8. Duplicate scan is blocked with ALREADY_BOARDED
    const dupBoardRes = await request.post(`${baseUrl}/api/driver/tickets/board`, {
      headers: { Authorization: `Bearer ${driverToken}` },
      data: { qr_token: qrToken, trip_id: tripId },
    });
    expect(dupBoardRes.status()).toBe(200);
    const dupBoardBody = await dupBoardRes.json();
    expect(dupBoardBody.valid).toBe(false);
    expect(dupBoardBody.code).toBe('ALREADY_BOARDED');
    expect(dupBoardBody.alreadyBoarded).toBe(true);
  });
});
