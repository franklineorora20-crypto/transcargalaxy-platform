import crypto from 'crypto';
import type { Booking } from '../../src/types/index.js';
import { pendingMpesaRequests } from '../store/index.js';

export function ensureMpesaCallbackUrl(): void {
  if (!process.env.MPESA_CALLBACK_URL || process.env.MPESA_CALLBACK_URL.includes('your-domain')) {
    process.env.MPESA_CALLBACK_URL = 'https://transcargalaxy-platform.vercel.app/api/mpesa/callback';
  }
}

export function darajaConfigured(): boolean {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE &&
      process.env.MPESA_PASSKEY &&
      process.env.MPESA_CALLBACK_URL &&
      !process.env.MPESA_CONSUMER_KEY.startsWith('your_') &&
      !process.env.MPESA_CONSUMER_SECRET.startsWith('your_') &&
      !process.env.MPESA_CALLBACK_URL.includes('your-domain'),
  );
}

export function mpesaBaseUrl(): string {
  return process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

export async function getDarajaAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString('base64');

  const response = await fetch(
    `${mpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Daraja OAuth request failed');
  }

  const data = (await response.json()) as {
    access_token?: string;
  };

  if (!data.access_token) {
    throw new Error('Daraja did not return an access token');
  }

  return data.access_token;
}

export function darajaTimestamp(): string {
  const date = new Date();

  const parts = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ];

  return parts
    .map((part) => String(part).padStart(2, '0'))
    .join('');
}

export async function initiateDarajaStkPush(params: {
  booking: Booking;
  phone: string;
  amount?: number;
}): Promise<{
  ok: boolean;
  statusCode: number;
  body: Record<string, any>;
}> {
  const { booking, phone, amount } = params;
  const authoritativeAmount = Math.round(Number(booking.totalFareKsh));

  if (
    amount !== undefined &&
    Math.round(Number(amount)) !== authoritativeAmount
  ) {
    return {
      ok: false,
      statusCode: 400,
      body: {
        error: `M-Pesa payment amount mismatch. Expected KES ${authoritativeAmount}.`,
      },
    };
  }

  if (!darajaConfigured()) {
    const fallbackCheckoutId = `ws_CO_${Date.now()}_${booking.bookingReference}`;
    pendingMpesaRequests.set(fallbackCheckoutId, {
      bookingReference: booking.bookingReference,
      amount: authoritativeAmount,
      phone,
    });
    return {
      ok: true,
      statusCode: 202,
      body: {
        status: 'PENDING',
        pending: true,
        checkoutRequestId: fallbackCheckoutId,
        customerMessage:
          'M-Pesa verification pending - admin must confirm. Daraja credentials are not configured.',
      },
    };
  }

  try {
    const timestamp = darajaTimestamp();
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
    ).toString('base64');

    const token = await getDarajaAccessToken();

    const response = await fetch(
      `${mpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: Number(process.env.MPESA_SHORTCODE),
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(Number(amount || booking.totalFareKsh)),
          PartyA: phone,
          PartyB: Number(process.env.MPESA_SHORTCODE),
          PhoneNumber: phone,
          CallBackURL: process.env.MPESA_CALLBACK_URL,
          AccountReference: booking.bookingReference,
          TransactionDesc: `Transcar Rongai booking ${booking.bookingReference}`,
        }),
      },
    );

    const data = (await response.json()) as {
      CheckoutRequestID?: string;
      ResponseDescription?: string;
      errorMessage?: string;
    };

    if (!response.ok || !data.CheckoutRequestID) {
      return {
        ok: false,
        statusCode: 502,
        body: {
          error:
            data.errorMessage ||
            data.ResponseDescription ||
            'Daraja STK push failed.',
        },
      };
    }

    pendingMpesaRequests.set(data.CheckoutRequestID, {
      bookingReference: booking.bookingReference,
      amount: Number(amount || booking.totalFareKsh),
      phone,
    });

    return {
      ok: true,
      statusCode: 200,
      body: {
        status: 'REQUEST_ACCEPTED',
        checkoutRequestId: data.CheckoutRequestID,
        customerMessage: `M-Pesa STK prompt sent to ${phone}. Enter your PIN to complete payment.`,
      },
    };
  } catch (error: any) {
    return {
      ok: false,
      statusCode: 502,
      body: {
        error: error.message || 'M-Pesa initiation failed.',
      },
    };
  }
}

export function verifyDarajaCallbackSignature(
  rawBody: Buffer,
  signature: string,
): { valid: boolean; error?: string } {
  const configuredSecret = process.env.MPESA_CALLBACK_SECRET;

  if (!configuredSecret || !signature) {
    return {
      valid: false,
      error: 'Missing callback signature.',
    };
  }

  const expected = crypto
    .createHmac('sha256', configuredSecret)
    .update(rawBody)
    .digest('hex');

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return {
      valid: false,
      error: 'Invalid callback signature.',
    };
  }

  return { valid: true };
}

export async function queryDarajaStkStatus(
  checkoutRequestId: string,
  booking: Booking,
): Promise<{
  statusCode: number;
  body: Record<string, any>;
}> {
  if (!darajaConfigured() || !checkoutRequestId) {
    return {
      statusCode: 202,
      body: {
        success: false,
        pending: true,
        message: 'M-Pesa verification pending - admin must confirm.',
        booking,
      },
    };
  }

  try {
    const timestamp = darajaTimestamp();
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
    ).toString('base64');

    const token = await getDarajaAccessToken();

    const response = await fetch(
      `${mpesaBaseUrl()}/mpesa/stkpushquery/v1/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: Number(process.env.MPESA_SHORTCODE),
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        }),
      },
    );

    const data = (await response.json()) as {
      ResultCode?: string | number;
      ResultDesc?: string;
    };

    if (!response.ok) {
      return {
        statusCode: 502,
        body: {
          error: data.ResultDesc || 'Daraja verification failed.',
        },
      };
    }

    if (String(data.ResultCode) !== '0') {
      return {
        statusCode: 202,
        body: {
          success: false,
          pending: true,
          message: 'M-Pesa verification pending - admin must confirm.',
          booking,
          providerMessage: data.ResultDesc,
        },
      };
    }

    return {
      statusCode: 202,
      body: {
        success: false,
        pending: true,
        message: 'M-Pesa verification callback pending - admin must confirm.',
        booking,
      },
    };
  } catch (error: any) {
    return {
      statusCode: 502,
      body: {
        error: error.message || 'M-Pesa verification failed.',
      },
    };
  }
}
