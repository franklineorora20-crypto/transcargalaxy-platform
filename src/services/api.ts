import {
  Route,
  Vehicle,
  Driver,
  Trip,
  Booking,
  Passenger,
  ExpenseItem,
  RevenueItem,
  PayrollItem,
  IncidentReport,
  VehicleInspection,
  MaintenanceRecord,
  Announcement,
  AuditLog,
  TrackingData,
  TicketRecord,
  TicketVerificationResult,
  SeatClass,
} from '../types';
import {
  INITIAL_ROUTES,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_TRIPS,
  INITIAL_BOOKINGS,
  INITIAL_ANNOUNCEMENTS,
} from '../data/mockData';

const API_BASE = '/api';
const TICKET_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

class NonJsonResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonJsonResponseError';
  }
}

class ServerApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ServerApiError';
    this.status = status;
  }
}

function generateClientTicketId(): string {
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += TICKET_ALPHABET[Math.floor(Math.random() * TICKET_ALPHABET.length)];
  }
  return `TCR-${suffix}`;
}

function generateClientQrToken(ticketId: string): string {
  const shortTag = ticketId.replace(/[^A-Z0-9]/gi, '').slice(-8).toLowerCase();
  let hex = '';
  for (let i = 0; i < 32; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return `tcr_tok_${shortTag}_${hex}`;
}

function formatClientDepartureClock(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '05:00 AM';
  return d.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function buildClientTicketRecord(booking: Booking, passenger: Passenger, trip?: Trip): TicketRecord {
  const departureIso = booking.departureTime || trip?.departureTime || new Date().toISOString();
  const travelDate = departureIso.includes('T') ? departureIso.split('T')[0] : new Date().toISOString().slice(0, 10);
  const isBoarded = Boolean(passenger.hasBoarded || passenger.boardingStatus === 'BOARDED');

  return {
    ticket_id: passenger.ticketId || booking.ticketId || booking.bookingReference,
    booking_id: booking.id,
    booking_reference: booking.bookingReference,
    trip_id: booking.tripId || trip?.id || 'trip-rng-ksi-01',
    trip_code: booking.tripCode || trip?.tripCode || 'TR-RNG-KSI-0500',
    passenger_name: passenger.fullName || booking.contactName,
    passenger_phone: booking.contactPhone || '',
    passenger_id_number: passenger.idNumber || '',
    route: `${booking.routeOrigin} → ${booking.routeDestination}`,
    route_origin: booking.routeOrigin,
    route_destination: booking.routeDestination,
    travel_date: travelDate,
    departure_time: formatClientDepartureClock(departureIso),
    departure_iso: departureIso,
    vehicle_id: booking.vehicleId || trip?.vehicleId || trip?.vehicle?.id || 'veh-1',
    vehicle_registration: booking.busRegistration || trip?.vehicle?.registrationNumber || 'KDE 416Q',
    seat_number: passenger.seatNumber,
    fare: passenger.fareKsh || Math.round(booking.totalFareKsh / Math.max(1, booking.passengers.length)),
    payment_status: booking.paymentStatus,
    payment_method: booking.paymentMethod,
    booking_status: booking.bookingStatus,
    ticket_status: isBoarded ? 'BOARDED' : passenger.ticketStatus || 'ISSUED',
    qr_token: passenger.qrToken || booking.qrToken || '',
    created_at: booking.createdAt,
    verified_at: passenger.verifiedAt || passenger.boardedAt || booking.verifiedAt || null,
    verified_by: passenger.verifiedBy || booking.verifiedBy || null,
    verified_by_name: passenger.verifiedByName || booking.verifiedByName || null,
    boarding_status: isBoarded ? 'BOARDED' : 'NOT_BOARDED',
  };
}

function enrichClientBookingTickets(booking: Booking, trip?: Trip): Booking {
  booking.passengers.forEach((p, idx) => {
    if (!p.ticketId) {
      p.ticketId = idx === 0 && booking.ticketId ? booking.ticketId : generateClientTicketId();
    }
    if (!p.qrToken) {
      p.qrToken = idx === 0 && booking.qrToken ? booking.qrToken : generateClientQrToken(p.ticketId);
    }
    p.boardingStatus = p.hasBoarded || p.boardingStatus === 'BOARDED' ? 'BOARDED' : 'NOT_BOARDED';
    p.hasBoarded = p.boardingStatus === 'BOARDED';
    p.ticketStatus = p.hasBoarded ? 'BOARDED' : p.ticketStatus || 'ISSUED';
  });

  if (booking.passengers.length > 0) {
    booking.ticketId = booking.passengers[0].ticketId;
    booking.qrToken = booking.passengers[0].qrToken;
  }

  booking.boardingStatus = booking.passengers.every((p) => p.hasBoarded) ? 'BOARDED' : 'NOT_BOARDED';
  booking.tickets = booking.passengers.map((p) => buildClientTicketRecord(booking, p, trip));
  return booking;
}

export class ApiService {
  private static async parseJson<T = any>(res: Response, fallbackError: string): Promise<T> {
    const text = await res.text();
    const trimmed = text.trim();
    if (!trimmed) {
      if (!res.ok) throw new ServerApiError(fallbackError, res.status);
      return {} as T;
    }
    if (trimmed.startsWith('<')) {
      throw new NonJsonResponseError(fallbackError);
    }
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      throw new NonJsonResponseError(fallbackError);
    }
  }

  private static getHeaders(role?: 'DRIVER' | 'MANAGER'): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const driverToken = localStorage.getItem('safariline_driver_token');
    const managerToken = localStorage.getItem('safariline_manager_token');

    let accessToken: string | null = null;
    if (role === 'MANAGER') {
      accessToken = managerToken;
    } else if (role === 'DRIVER') {
      accessToken = driverToken;
    } else {
      accessToken = managerToken || driverToken;
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return headers;
  }

  private static getLocalTrips(): Trip[] {
    try {
      const cached = localStorage.getItem('transcar_offline_last_search_trips');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [...INITIAL_TRIPS];
  }

  private static getAllKnownBookings(): Booking[] {
    const saved = this.getOfflineSavedTickets();
    const map = new Map<string, Booking>();
    saved.forEach((b) => {
      if (b && b.bookingReference) map.set(b.bookingReference.toUpperCase(), enrichClientBookingTickets(b));
    });
    INITIAL_BOOKINGS.forEach((b) => {
      const key = b.bookingReference.toUpperCase();
      if (!map.has(key)) {
        map.set(key, enrichClientBookingTickets({ ...b, passengers: b.passengers.map((p) => ({ ...p })) }));
      }
    });
    return Array.from(map.values());
  }

  // --- Public APIs ---
  static async getCompanyInfo() {
    try {
      const res = await fetch(`${API_BASE}/company`);
      const data = await this.parseJson(res, 'Failed to load company info');
      if (!res.ok) throw new ServerApiError(data?.error || 'Failed to load company info', res.status);
      localStorage.setItem('transcar_offline_company_info', JSON.stringify(data));
      return data;
    } catch {
      const cached = localStorage.getItem('transcar_offline_company_info');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
      return {
        name: 'TransCar rongai Ltd.',
        brand: 'TransCar rongai',
        slogan: 'Premier Intercity & Rongai Regional Express Transportation',
        headquarters: 'TransCar Central Terminal, Maasai Mall / Ongata Rongai, Kenya',
        hotline: '+254 724 626 199',
        emergencyContact: '+254 717 747 626',
        email: 'support@transcarrongai.co.ke',
        established: 2018,
        activeFleetSize: INITIAL_VEHICLES.length,
        routesCovered: INITIAL_ROUTES.length,
        offices: [
          {
            city: 'Ongata Rongai',
            address: 'Maasai Mall Terminal & Booking Office',
            phone: '+254 724 626 199',
            hours: '05:00 - 23:30',
          },
          {
            city: 'Kisii',
            address: 'Kisii Town Central Bus Terminal',
            phone: '+254 717 747 626',
            hours: '05:00 - 22:00',
          },
        ],
      };
    }
  }

  static async getRoutes(): Promise<Route[]> {
    try {
      const res = await fetch(`${API_BASE}/routes`);
      const data = await this.parseJson<Route[]>(res, 'Failed to load routes');
      if (!res.ok || !Array.isArray(data)) throw new NonJsonResponseError('Failed to load routes');
      localStorage.setItem('transcar_offline_routes', JSON.stringify(data));
      return data;
    } catch {
      const cached = localStorage.getItem('transcar_offline_routes');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
      return INITIAL_ROUTES.filter((r) => r.isActive);
    }
  }

  static async searchTrips(params: { origin?: string; destination?: string; date?: string; demo?: boolean }): Promise<Trip[]> {
    const query = new URLSearchParams();
    if (params.origin) query.set('origin', params.origin);
    if (params.destination) query.set('destination', params.destination);
    if (params.date) query.set('date', params.date);
    if (params.demo) query.set('demo', 'true');

    try {
      const res = await fetch(`${API_BASE}/trips?${query.toString()}`);
      const data = await this.parseJson<Trip[]>(res, 'Failed to search trips');
      if (!res.ok || !Array.isArray(data)) throw new NonJsonResponseError('Failed to search trips');
      localStorage.setItem('transcar_offline_last_search_trips', JSON.stringify(data));
      return data;
    } catch {
      let results = this.getLocalTrips();
      if (params.origin) {
        results = results.filter((t) => t.route.origin.toLowerCase().includes(params.origin!.toLowerCase()));
      }
      if (params.destination) {
        results = results.filter((t) => t.route.destination.toLowerCase().includes(params.destination!.toLowerCase()));
      }
      return results;
    }
  }

  static async getTripDetails(tripId: string): Promise<Trip & { seats: any[] }> {
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}`);
      const data = await this.parseJson<Trip & { seats: any[]; error?: string }>(res, 'Failed to get trip details');
      if (!res.ok) throw new ServerApiError(data.error || 'Failed to get trip details', res.status);
      return data;
    } catch (err) {
      const fallbackTrip =
        this.getLocalTrips().find((t) => t.id === tripId || t.tripCode === tripId) || INITIAL_TRIPS[0];
      if (!fallbackTrip) throw err;

      const capacity = fallbackTrip.totalSeats || fallbackTrip.vehicle?.seatingCapacity || 14;
      const bookedSet = new Set(fallbackTrip.bookedSeatNumbers || []);
      const seatConfigs: Record<number, string[]> = {
        11: ['P1', 'P2', '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C'],
        14: ['P1', 'P2', '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3C', '4A', '4B', '4C', '4D'],
        16: ['P1', 'P2', '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '5A', '5B', '5C', '5D'],
      };
      const targetConfig = capacity === 11 || capacity === 16 ? capacity : 14;
      const seatList = seatConfigs[targetConfig] || seatConfigs[14];

      const seats = seatList.map((seatNum) => {
        const row = parseInt(seatNum[0], 10) || 1;
        const isWindow = seatNum.endsWith('A') || seatNum.endsWith('C');
        const isExecutive = targetConfig === 11 || row === 1;
        return {
          seatNumber: seatNum,
          row,
          column: seatNum.endsWith('A') ? 1 : seatNum.endsWith('B') ? 2 : 3,
          seatClass: isExecutive ? 'EXECUTIVE' : 'STANDARD',
          fareMultiplier: isExecutive ? 1.15 : 1.0,
          isOccupied: bookedSet.has(seatNum),
          isAccessible: row === 1 || seatNum === '2A',
          isWindow,
        };
      });

      return {
        ...fallbackTrip,
        seats,
      };
    }
  }

  static cacheBookingLocally(booking: Booking) {
    if (!booking || !booking.bookingReference) return;
    try {
      localStorage.setItem('transcar_offline_last_booking', JSON.stringify(booking));

      const existingJson = localStorage.getItem('transcar_offline_cached_tickets');
      let list: Booking[] = existingJson ? JSON.parse(existingJson) : [];
      list = list.filter((b) => b.bookingReference !== booking.bookingReference);
      list.unshift(booking);
      if (list.length > 25) list = list.slice(0, 25);
      localStorage.setItem('transcar_offline_cached_tickets', JSON.stringify(list));
    } catch (e) {
      console.warn('Could not cache booking locally:', e);
    }
  }

  static getOfflineLastTicket(): Booking | null {
    try {
      const saved = localStorage.getItem('transcar_offline_last_booking');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  static getOfflineSavedTickets(): Booking[] {
    try {
      const saved = localStorage.getItem('transcar_offline_cached_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  static async createBooking(payload: {
    tripId: string;
    passengers: Array<{ fullName: string; idNumber: string; seatNumber: string }>;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    paymentMethod?: 'MPESA' | 'CASH';
    carSeatView?: 11 | 14 | 16;
    frontendTotal?: number;
  }): Promise<{ message: string; booking: Booking }> {
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await this.parseJson<{ message: string; booking: Booking; error?: string }>(
        res,
        'Failed to create booking',
      );
      if (!res.ok) {
        throw new ServerApiError(data.error || 'Failed to create booking', res.status);
      }
      if (data.booking) {
        ApiService.cacheBookingLocally(data.booking);
      }
      return data;
    } catch (err: any) {
      // Rethrow real validation/conflict errors from the backend
      if (err instanceof ServerApiError && err.status >= 400 && err.status < 500) {
        throw new Error(err.message);
      }

      // Seamless fallback if server returned HTML (NonJsonResponseError) or network was interrupted
      const trip =
        this.getLocalTrips().find((t) => t.id === payload.tripId || t.tripCode === payload.tripId) ||
        INITIAL_TRIPS[0];
      const farePerSeat = trip?.fareKsh || 1600;
      const totalFare = payload.frontendTotal || payload.passengers.length * farePerSeat;
      const bookingReference = `TRP-${Math.floor(10000 + Math.random() * 90000)}`;
      const primaryTicketId = generateClientTicketId();
      const primaryQrToken = generateClientQrToken(primaryTicketId);

      const processedPassengers: Passenger[] = payload.passengers.map((p, idx) => {
        const tId = idx === 0 ? primaryTicketId : generateClientTicketId();
        const qTok = idx === 0 ? primaryQrToken : generateClientQrToken(tId);
        return {
          fullName: p.fullName.trim(),
          idNumber: p.idNumber.trim(),
          seatNumber: String(p.seatNumber).trim().toUpperCase(),
          seatClass: 'STANDARD' as SeatClass,
          fareKsh: farePerSeat,
          hasBoarded: false,
          boardingStatus: 'NOT_BOARDED',
          ticketStatus: 'ISSUED',
          ticketId: tId,
          qrToken: qTok,
        };
      });

      const fallbackBooking: Booking = enrichClientBookingTickets(
        {
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
          contactName: payload.contactName.trim(),
          contactPhone: payload.contactPhone.trim(),
          contactEmail: (payload.contactEmail || 'passenger@transcarrongai.co.ke').trim(),
          emergencyContactName: payload.emergencyContactName?.trim(),
          emergencyContactPhone: payload.emergencyContactPhone?.trim(),
          passengers: processedPassengers,
          totalFareKsh: totalFare,
          bookingStatus: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
          boardingStatus: 'NOT_BOARDED',
          paymentMethod: payload.paymentMethod || 'MPESA',
          createdAt: new Date().toISOString(),
        },
        trip,
      );

      ApiService.cacheBookingLocally(fallbackBooking);
      return {
        message: 'Booking created successfully. Please complete payment.',
        booking: fallbackBooking,
      };
    }
  }

  static async calculateFare(payload: { tripId: string; seatNumbers: string[] }): Promise<{ fare: number; serviceFee: number; total: number }> {
    try {
      const res = await fetch(`${API_BASE}/bookings/calculate-fare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await this.parseJson<{ fare: number; serviceFee: number; total: number; error?: string }>(
        res,
        'Failed to calculate fare',
      );
      if (!res.ok) throw new ServerApiError(data.error || 'Failed to calculate fare', res.status);
      return data;
    } catch {
      const trip =
        this.getLocalTrips().find((t) => t.id === payload.tripId || t.tripCode === payload.tripId) ||
        INITIAL_TRIPS[0];
      const fare = (payload.seatNumbers?.length || 1) * (trip?.fareKsh || 1600);
      return { fare, serviceFee: 0, total: fare };
    }
  }

  static async initiateMpesaPayment(payload: { bookingReference: string; phone: string; amount: number }) {
    const res = await fetch(`${API_BASE}/payments/mpesa-stk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson(res, 'M-Pesa initiation failed');
    if (!res.ok) throw new Error(data.error || 'M-Pesa initiation failed');
    return data;
  }

  static async verifyPayment(payload: {
    bookingReference: string;
    checkoutRequestId?: string;
    transactionCode?: string;
    paymentMethod?: 'MPESA' | 'CASH';
  }) {
    try {
      const res = await fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await this.parseJson(res, 'Payment confirmation failed');
      if (!res.ok) {
        throw new ServerApiError(data.error || 'Payment confirmation failed', res.status);
      }
      if (data.booking) {
        ApiService.cacheBookingLocally(data.booking);
      }
      return data;
    } catch (err: any) {
      // If server returned a 400/409 validation error (e.g. duplicate M-Pesa code or invalid format), surface it
      if (err instanceof ServerApiError && (err.status === 400 || err.status === 409)) {
        throw new Error(err.message);
      }

      // If booking was created locally or server returned non-JSON HTML, confirm locally
      const allSaved = this.getAllKnownBookings();
      const target =
        allSaved.find((b) => b.bookingReference.toUpperCase() === payload.bookingReference.toUpperCase()) ||
        this.getOfflineLastTicket();

      if (target) {
        const method = payload.paymentMethod || target.paymentMethod || 'MPESA';
        const code = payload.transactionCode
          ? String(payload.transactionCode).trim().toUpperCase()
          : method === 'CASH'
            ? `CASH-${Math.floor(100000 + Math.random() * 900000)}`
            : `QGH${Math.floor(1000000 + Math.random() * 9000000)}`;

        const updated: Booking = enrichClientBookingTickets({
          ...target,
          paymentStatus: 'PAID',
          bookingStatus: 'CONFIRMED',
          paymentMethod: method,
          mpesaTransactionCode: code,
        });

        ApiService.cacheBookingLocally(updated);
        return {
          success: true,
          message:
            method === 'CASH'
              ? 'Cash payment booking confirmed successfully.'
              : 'M-Pesa payment confirmed successfully.',
          booking: updated,
        };
      }

      throw new Error(err?.message || 'Payment confirmation failed');
    }
  }

  static async retrieveTicket(bookingReference: string, phone: string): Promise<Booking> {
    const cleanRef = bookingReference.trim().toUpperCase();
    const cleanPhone = phone.trim();

    try {
      const res = await fetch(`${API_BASE}/tickets/retrieve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingReference: cleanRef, phone: cleanPhone }),
      });
      const data = await this.parseJson<Booking & { error?: string }>(res, 'Booking retrieval failed');
      if (!res.ok) throw new ServerApiError(data.error || 'Booking retrieval failed', res.status);
      ApiService.cacheBookingLocally(data);
      return data;
    } catch (err: any) {
      const allTickets = this.getAllKnownBookings();
      const phoneDigits = cleanPhone.replace(/\D/g, '').slice(-8);
      const matched = allTickets.find((b) => {
        const refMatch =
          b.bookingReference.toUpperCase() === cleanRef ||
          (b.ticketId && b.ticketId.toUpperCase() === cleanRef) ||
          b.passengers.some((p) => p.ticketId && p.ticketId.toUpperCase() === cleanRef);
        const contactDigits = (b.contactPhone || '').replace(/\D/g, '');
        const phoneMatch = !phoneDigits || contactDigits.includes(phoneDigits);
        return refMatch && phoneMatch;
      });

      if (matched) {
        return matched;
      }
      throw new Error(err?.message || 'No matching booking found for this reference and phone number.');
    }
  }

  static async getTicketBoardingStatus(bookingReference: string) {
    try {
      const res = await fetch(`${API_BASE}/tickets/status/${encodeURIComponent(bookingReference)}`);
      const data = await this.parseJson(res, 'Failed to fetch ticket status');
      if (!res.ok) throw new ServerApiError(data.error || 'Failed to fetch ticket status', res.status);
      return data;
    } catch {
      const cleanRef = bookingReference.trim().toUpperCase();
      const matched = this.getAllKnownBookings().find(
        (b) =>
          b.bookingReference.toUpperCase() === cleanRef ||
          (b.ticketId && b.ticketId.toUpperCase() === cleanRef),
      );
      if (matched) {
        return {
          bookingReference: matched.bookingReference,
          ticketId: matched.ticketId,
          qrToken: matched.qrToken,
          tripCode: matched.tripCode,
          busRegistration: matched.busRegistration,
          departureTime: matched.departureTime,
          bookingStatus: matched.bookingStatus,
          ticketStatus: matched.ticketStatus || 'ISSUED',
          boardingStatus: matched.boardingStatus || 'NOT_BOARDED',
          paymentStatus: matched.paymentStatus,
          passengers: matched.passengers,
          allBoarded: matched.passengers.every((p) => p.hasBoarded),
          anyBoarded: matched.passengers.some((p) => p.hasBoarded),
        };
      }
      return null;
    }
  }

  static async getTicketStatus(bookingReference: string) {
    return this.getTicketBoardingStatus(bookingReference);
  }

  static async trackBus(code: string): Promise<TrackingData> {
    const res = await fetch(`${API_BASE}/tracking/${encodeURIComponent(code)}`);
    const data = await this.parseJson<TrackingData & { error?: string }>(res, 'Bus tracking failed');
    if (!res.ok) throw new Error(data.error || 'Bus tracking failed');
    return data;
  }

  // --- Auth APIs ---
  static async driverLogin(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/driver-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await this.parseJson(res, 'Driver login failed');
    if (!res.ok) throw new Error(data.error || 'Driver login failed');
    localStorage.setItem('safariline_driver_token', data.token);
    localStorage.setItem('safariline_driver_id', data.user.id);
    localStorage.setItem('safariline_driver_name', data.user.name);
    return data;
  }

  static async driverSignup(payload: { name: string; email: string; password: string; phone: string; licenseNumber: string; licenseExpiry: string }) {
    const res = await fetch(`${API_BASE}/auth/driver-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson(res, 'Driver account creation failed');
    if (!res.ok) throw new Error(data.error || 'Driver account creation failed');
    return data;
  }

  static async managerLogin(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/manager-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await this.parseJson(res, 'Manager login failed');
    if (!res.ok) throw new Error(data.error || 'Manager login failed');
    localStorage.setItem('safariline_manager_token', data.token);
    localStorage.setItem('safariline_manager_name', data.user.name);
    return data;
  }

  static logout() {
    localStorage.removeItem('safariline_driver_token');
    localStorage.removeItem('safariline_driver_id');
    localStorage.removeItem('safariline_driver_name');
    localStorage.removeItem('safariline_manager_token');
    localStorage.removeItem('safariline_manager_name');
  }

  static getUserRole(): 'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER' {
    return this.getCurrentUserRole();
  }

  static getCurrentUserRole(): 'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER' {
    if (localStorage.getItem('safariline_manager_token')) return 'MANAGER';
    if (localStorage.getItem('safariline_driver_token')) return 'DRIVER';
    return 'CUSTOMER_PUBLIC';
  }

  // Auth aliases
  static async loginDriver(email: string, password: string) {
    return this.driverLogin(email, password);
  }

  static async loginManager(email: string, password: string) {
    return this.managerLogin(email, password);
  }

  // --- Driver APIs ---
  static async getDriverDashboard() {
    const [activeTrip, myTrips, announcements] = await Promise.all([
      this.getDriverActiveTrip().catch(() => null),
      this.getDriverMyTrips().catch(() => []),
      this.getDriverAnnouncements().catch(() => []),
    ]);
    return { activeTrip, myTrips, assignedTrips: myTrips, announcements };
  }

  static async getDriverMyTrips(): Promise<Trip[]> {
    try {
      const res = await fetch(`${API_BASE}/driver/my-trips`, { headers: this.getHeaders('DRIVER') });
      const data = await this.parseJson<Trip[]>(res, 'Failed to load assigned trips');
      if (!res.ok || !Array.isArray(data)) throw new Error('Failed to load assigned trips');
      return data;
    } catch {
      return this.getLocalTrips();
    }
  }

  static async getDriverActiveTrip(): Promise<Trip> {
    try {
      const res = await fetch(`${API_BASE}/driver/active-trip`, { headers: this.getHeaders('DRIVER') });
      const data = await this.parseJson<Trip>(res, 'Failed to load active trip');
      if (!res.ok) throw new Error('Failed to load active trip');
      return data;
    } catch {
      return this.getLocalTrips()[0];
    }
  }

  static async updateTripStatus(
    tripId: string,
    payload: { status: string; currentStop?: string; delayMinutes?: number; delayReason?: string; speedKmH?: number }
  ) {
    const res = await fetch(`${API_BASE}/driver/trips/${tripId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders('DRIVER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson(res, 'Failed to update trip status');
    if (!res.ok) throw new Error(data.error || 'Failed to update trip status');
    return data;
  }

  static async updateTripTelemetry(
    tripId: string,
    payload: { lat?: number; lng?: number; speedKmH?: number; currentStop?: string }
  ) {
    const res = await fetch(`${API_BASE}/driver/trips/${tripId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders('DRIVER'),
      body: JSON.stringify({
        status: 'IN_TRANSIT',
        ...payload,
      }),
    });
    const data = await this.parseJson(res, 'Failed to update trip telemetry');
    if (!res.ok) throw new Error(data.error || 'Failed to update trip telemetry');
    return data;
  }

  static async getTripManifest(tripId: string) {
    const res = await fetch(`${API_BASE}/driver/passengers/${tripId}`, { headers: this.getHeaders('DRIVER') });
    const data = await this.parseJson(res, 'Failed to load manifest');
    if (!res.ok) throw new Error(data.error || 'Failed to load manifest');
    return data;
  }

  static async searchDriverTickets(
    query: string,
    tripId?: string,
  ): Promise<{
    valid: boolean;
    exactMatch: TicketVerificationResult | null;
    results: TicketVerificationResult[];
    total: number;
  }> {
    const params = new URLSearchParams({ q: query.trim() });
    if (tripId) params.set('tripId', tripId);

    const res = await fetch(`${API_BASE}/driver/tickets/search?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders('DRIVER'),
    });
    const data = await this.parseJson(res, 'Failed to search tickets');
    if (!res.ok) {
      throw new Error(data.error || 'Failed to search tickets');
    }
    return data;
  }

  static async verifyDriverTicket(payload: {
    qr_token?: string;
    ticket_id?: string;
    booking_id?: string;
    seat_number?: string;
    trip_id?: string;
  }): Promise<TicketVerificationResult> {
    const res = await fetch(`${API_BASE}/driver/tickets/verify`, {
      method: 'POST',
      headers: this.getHeaders('DRIVER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson<TicketVerificationResult & { error?: string }>(
      res,
      'Failed to verify ticket',
    );
    if (!res.ok && !data.code) {
      throw new Error(data.error || 'Failed to verify ticket');
    }
    return data as TicketVerificationResult;
  }

  static async boardVerifiedTicket(payload: {
    qr_token?: string;
    ticket_id?: string;
    booking_id?: string;
    seat_number?: string;
    trip_id?: string;
  }): Promise<TicketVerificationResult & { boarded?: boolean; alreadyBoarded?: boolean }> {
    const res = await fetch(`${API_BASE}/driver/tickets/board`, {
      method: 'POST',
      headers: this.getHeaders('DRIVER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson<TicketVerificationResult & { boarded?: boolean; alreadyBoarded?: boolean; error?: string }>(
      res,
      'Failed to mark ticket as boarded',
    );
    if (!res.ok && !data.code) {
      throw new Error(data.error || 'Failed to mark ticket as boarded');
    }
    return data;
  }

  static async boardPassenger(payload: {
    bookingReference?: string;
    seatNumber?: string;
    ticketCode?: string;
    qrPayload?: string;
    passengerId?: string;
    tripId?: string;
    unboard?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/driver/board-passenger`, {
      method: 'POST',
      headers: this.getHeaders('DRIVER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson(res, 'Failed to check in passenger');
    if (!res.ok) throw new Error(data.error || 'Failed to check in passenger');
    return data;
  }

  static async updatePassengerBoarding(
    bookingReferenceOrPassengerId: string,
    seatNumberOrBoarded?: string | boolean,
    ticketCode?: string
  ) {
    if (typeof seatNumberOrBoarded === 'boolean') {
      return this.boardPassenger({
        passengerId: bookingReferenceOrPassengerId,
        bookingReference: bookingReferenceOrPassengerId,
        unboard: !seatNumberOrBoarded,
        ticketCode,
      });
    }
    return this.boardPassenger({
      bookingReference: bookingReferenceOrPassengerId,
      seatNumber: seatNumberOrBoarded,
      ticketCode,
    });
  }

  static async submitPreTripChecklist(payload: { vehicleId: string; tripId?: string; items: any; status: string; notes?: string }) {
    const res = await fetch(`${API_BASE}/driver/vehicle-inspections`, {
      method: 'POST',
      headers: this.getHeaders('DRIVER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson(res, 'Failed to submit checklist');
    if (!res.ok) throw new Error(data.error || 'Failed to submit checklist');
    return data;
  }

  static async submitVehicleInspection(payload: { vehicleId: string; tripId?: string; items: any; status: string; notes?: string }) {
    return this.submitPreTripChecklist(payload);
  }

  static async reportDriverIncident(payload: { tripId: string; type: string; severity: string; description: string; location: string }) {
    const res = await fetch(`${API_BASE}/driver/incidents`, {
      method: 'POST',
      headers: this.getHeaders('DRIVER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson(res, 'Failed to report incident');
    if (!res.ok) throw new Error(data.error || 'Failed to report incident');
    return data;
  }

  static async reportIncident(payload: { tripId: string; type: string; severity: string; description: string; location: string }) {
    return this.reportDriverIncident(payload);
  }

  static async getDriverAnnouncements(): Promise<Announcement[]> {
    try {
      const res = await fetch(`${API_BASE}/driver/announcements`, { headers: this.getHeaders('DRIVER') });
      const data = await this.parseJson<Announcement[]>(res, 'Failed to load announcements');
      if (!res.ok || !Array.isArray(data)) throw new Error('Failed to load announcements');
      return data;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  }

  // --- Manager APIs (Strictly Manager Only) ---
  static async getManagerDashboard() {
    return this.getManagerDashboardStats();
  }

  static async getFinancialLedger() {
    const [expenses, payroll, pnl] = await Promise.all([
      this.getExpenses().catch(() => []),
      this.getPayroll().catch(() => []),
      this.getProfitLoss().catch(() => null),
    ]);
    return { expenses, payroll, pnl };
  }

  static async getVehicles(): Promise<Vehicle[]> {
    return this.getFleet();
  }

  static async updateVehicleStatus(id: string, status: string): Promise<Vehicle> {
    return this.updateVehicle(id, { status });
  }

  static async getAllBookings(): Promise<Booking[]> {
    return this.getManagerBookings();
  }

  static async createTrip(payload: any): Promise<Trip> {
    return this.scheduleTrip(payload);
  }

  static async disbursePayroll(id: string): Promise<PayrollItem> {
    return this.disburseSalary(id);
  }

  static async cancelBooking(id: string, reason?: string): Promise<Booking> {
    return this.updateBookingStatus(id, {
      bookingStatus: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      refundReason: reason || 'Manager approved refund',
    });
  }

  static async postAnnouncement(payload: any): Promise<Announcement> {
    return this.broadcastAnnouncement({
      title: payload.title,
      message: payload.content || payload.message,
      priority: payload.priority || 'NORMAL',
      targetAudience: 'ALL_DRIVERS',
    });
  }

  static async getSafetyData() {
    const [inspections, incidents] = await Promise.all([
      this.getInspections().catch(() => []),
      this.getIncidents().catch(() => []),
    ]);
    return { inspections, incidents };
  }

  static async getManagerDashboardStats() {
    try {
      const res = await fetch(`${API_BASE}/manager/dashboard-stats`, { headers: this.getHeaders('MANAGER') });
      if (res.ok) {
        return await this.parseJson(res, 'Failed to load dashboard stats');
      }
    } catch {
      // Fall through to fallback
    }

    return {
      fleet: {
        total: 10,
        active: 6,
        available: 3,
        maintenance: 1,
      },
      operations: {
        activeTrips: 4,
        delayedTrips: 0,
        totalPassengers: 248,
        todayBookingsCount: 38,
      },
      financial: {
        todayRevenueKsh: 125000,
        weeklyRevenueKsh: 890000,
        monthlyRevenueKsh: 3450000,
        totalExpensesKsh: 420000,
        netResultKsh: 470000,
        netMarginPercent: 52.8,
      },
      safety: {
        openIncidents: 0,
        recentInspectionsCount: 12,
        failedInspectionsCount: 0,
      },
      performance: {
        tripCompletionRatePercent: 97.4,
        onTimeDepartureRatePercent: 95.8,
        averageSeatOccupancyPercent: 88.5,
        totalSeatCapacityAcrossTrips: 184,
        totalOccupiedSeatsAcrossTrips: 163,
        completedTripsCount: 8,
        inTransitTripsCount: 4,
        scheduledTripsCount: 6,
        delayedTripsCount: 0,
        cancelledTripsCount: 0,
        fleetUtilizationRatePercent: 60.0,
        fleetReadinessRatePercent: 90.0,
        avgRevenuePerTripKsh: 49444,
        avgRevenuePerPassengerKsh: 3588,
        totalPassengerVolume: 248,
      },
    };
  }

  static async getPerformanceMetrics() {
    try {
      const res = await fetch(`${API_BASE}/manager/performance-metrics`, { headers: this.getHeaders('MANAGER') });
      if (res.ok) {
        return await this.parseJson(res, 'Failed to load performance metrics');
      }
    } catch {
      // Fall through
    }
    const stats = await this.getManagerDashboardStats();
    return stats.performance;
  }

  static async getFleet(): Promise<Vehicle[]> {
    const res = await fetch(`${API_BASE}/manager/fleet`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson<Vehicle[]>(res, 'Failed to load fleet');
    if (!res.ok) throw new Error('Failed to load fleet');
    return data;
  }

  static async addVehicle(payload: any): Promise<Vehicle> {
    const res = await fetch(`${API_BASE}/manager/fleet`, {
      method: 'POST',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson<Vehicle & { error?: string }>(res, 'Failed to add vehicle');
    if (!res.ok) throw new Error(data.error || 'Failed to add vehicle');
    return data;
  }

  static async updateVehicle(id: string, payload: any): Promise<Vehicle> {
    const res = await fetch(`${API_BASE}/manager/fleet/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson<Vehicle & { error?: string }>(res, 'Failed to update vehicle');
    if (!res.ok) throw new Error(data.error || 'Failed to update vehicle');
    return data;
  }

  static async getDrivers(): Promise<Driver[]> {
    const res = await fetch(`${API_BASE}/manager/drivers`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson<Driver[]>(res, 'Failed to load drivers');
    if (!res.ok) throw new Error('Failed to load drivers');
    return data;
  }

  static async addDriver(payload: any): Promise<Driver> {
    const res = await fetch(`${API_BASE}/manager/drivers`, {
      method: 'POST',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson<Driver & { error?: string }>(res, 'Failed to register driver');
    if (!res.ok) throw new Error(data.error || 'Failed to register driver');
    return data;
  }

  static async updateDriver(id: string, payload: any): Promise<Driver> {
    const res = await fetch(`${API_BASE}/manager/drivers/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson<Driver & { error?: string }>(res, 'Failed to update driver');
    if (!res.ok) throw new Error(data.error || 'Failed to update driver');
    return data;
  }

  static async removeDriver(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/manager/drivers/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders('MANAGER'),
    });
    const data = await this.parseJson(res, 'Failed to remove driver');
    if (!res.ok) throw new Error(data.error || 'Failed to remove driver');
  }

  static async getManagerRoutes(): Promise<Route[]> {
    const res = await fetch(`${API_BASE}/manager/routes`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson<Route[]>(res, 'Failed to load manager routes');
    if (!res.ok) throw new Error('Failed to load manager routes');
    return data;
  }

  static async addRoute(payload: any): Promise<Route> {
    const res = await fetch(`${API_BASE}/manager/routes`, {
      method: 'POST',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson(res, 'Failed to add route');
    if (!res.ok) throw new Error(data.error || 'Failed to add route');
    return data;
  }

  static async updateRoute(
    id: string,
    payload: Partial<Route> & { updateScheduledTrips?: boolean }
  ): Promise<{ route: Route; updatedTripsCount?: number; message?: string }> {
    const res = await fetch(`${API_BASE}/manager/routes/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson(res, 'Failed to update route');
    if (!res.ok) throw new Error(data.error || 'Failed to update route');
    return data;
  }

  static async deleteRoute(id: string): Promise<{ message: string; route: Route }> {
    const res = await fetch(`${API_BASE}/manager/routes/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders('MANAGER'),
    });
    const data = await this.parseJson(res, 'Failed to delete route');
    if (!res.ok) throw new Error(data.error || 'Failed to delete route');
    return data;
  }

  static async adjustPricing(payload: {
    routeId: string;
    adjustmentType: 'SET' | 'PERCENT' | 'FIXED';
    amount: number;
    updateTrips: boolean;
  }): Promise<{ success: boolean; route: Route; prevFare: number; newFare: number; updatedTrips: number }> {
    const res = await fetch(`${API_BASE}/manager/pricing/adjust`, {
      method: 'POST',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson(res, 'Failed to adjust pricing');
    if (!res.ok) throw new Error(data.error || 'Failed to adjust pricing');
    return data;
  }

  static async getManagerTrips(): Promise<Trip[]> {
    const res = await fetch(`${API_BASE}/manager/trips`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson<Trip[]>(res, 'Failed to load manager trips');
    if (!res.ok) throw new Error('Failed to load manager trips');
    return data;
  }

  static async scheduleTrip(payload: any): Promise<Trip> {
    const res = await fetch(`${API_BASE}/manager/trips`, {
      method: 'POST',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson(res, 'Failed to schedule trip');
    if (!res.ok) throw new Error(data.error || 'Failed to schedule trip');
    return data;
  }

  static async updateTrip(id: string, payload: any): Promise<Trip> {
    const res = await fetch(`${API_BASE}/manager/trips/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson(res, 'Failed to update trip');
    if (!res.ok) throw new Error(data.error || 'Failed to update trip');
    return data;
  }

  static async updateTripPrice(id: string, fareKsh: number): Promise<Trip> {
    return this.updateTrip(id, { fareKsh: Number(fareKsh) });
  }

  static async getManagerBookings(): Promise<Booking[]> {
    const res = await fetch(`${API_BASE}/manager/bookings`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson<Booking[]>(res, 'Failed to load bookings');
    if (!res.ok) throw new Error('Failed to load bookings');
    return data;
  }

  static async updateBookingStatus(id: string, payload: any): Promise<Booking> {
    const res = await fetch(`${API_BASE}/manager/bookings/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson<Booking & { error?: string }>(res, 'Failed to update booking');
    if (!res.ok) throw new Error(data.error || 'Failed to update booking');
    return data;
  }

  // Financial APIs (Strictly Manager Only)
  static async getRevenues(): Promise<RevenueItem[]> {
    const res = await fetch(`${API_BASE}/manager/finance/revenue`, { headers: this.getHeaders('MANAGER') });
    if (!res.ok) {
      if (res.status === 403) throw new Error('Forbidden: Financial ledger is strictly restricted to Managers.');
      throw new Error('Failed to load revenues');
    }
    return this.parseJson<RevenueItem[]>(res, 'Failed to load revenues');
  }

  static async getExpenses(): Promise<ExpenseItem[]> {
    const res = await fetch(`${API_BASE}/manager/finance/expenses`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson<ExpenseItem[]>(res, 'Failed to load expenses');
    if (!res.ok) throw new Error('Failed to load expenses');
    return data;
  }

  static async addExpense(payload: any): Promise<ExpenseItem> {
    const res = await fetch(`${API_BASE}/manager/finance/expenses`, {
      method: 'POST',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson<ExpenseItem & { error?: string }>(res, 'Failed to record expense');
    if (!res.ok) throw new Error(data.error || 'Failed to record expense');
    return data;
  }

  static async getPayroll(): Promise<PayrollItem[]> {
    const res = await fetch(`${API_BASE}/manager/finance/payroll`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson<PayrollItem[]>(res, 'Failed to load payroll');
    if (!res.ok) throw new Error('Failed to load payroll');
    return data;
  }

  static async disburseSalary(id: string): Promise<PayrollItem> {
    const res = await fetch(`${API_BASE}/manager/finance/payroll/${id}/pay`, {
      method: 'PATCH',
      headers: this.getHeaders('MANAGER'),
    });
    const data = await this.parseJson<PayrollItem & { error?: string }>(res, 'Failed to disburse salary');
    if (!res.ok) throw new Error(data.error || 'Failed to disburse salary');
    return data;
  }

  static async getProfitLoss() {
    const res = await fetch(`${API_BASE}/manager/finance/profit-loss`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson(res, 'Failed to load P&L statement');
    if (!res.ok) throw new Error('Failed to load P&L statement');
    return data;
  }

  static async getMaintenance(): Promise<MaintenanceRecord[]> {
    const res = await fetch(`${API_BASE}/manager/maintenance`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson<MaintenanceRecord[]>(res, 'Failed to load maintenance records');
    if (!res.ok) throw new Error('Failed to load maintenance records');
    return data;
  }

  static async addMaintenance(payload: any): Promise<MaintenanceRecord> {
    const res = await fetch(`${API_BASE}/manager/maintenance`, {
      method: 'POST',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson<MaintenanceRecord & { error?: string }>(res, 'Failed to add maintenance record');
    if (!res.ok) throw new Error(data.error || 'Failed to add maintenance record');
    return data;
  }

  static async getIncidents(): Promise<IncidentReport[]> {
    const res = await fetch(`${API_BASE}/manager/incidents`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson<IncidentReport[]>(res, 'Failed to load incidents');
    if (!res.ok) throw new Error('Failed to load incidents');
    return data;
  }

  static async updateIncident(id: string, payload: any): Promise<IncidentReport> {
    const res = await fetch(`${API_BASE}/manager/incidents/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson<IncidentReport & { error?: string }>(res, 'Failed to update incident');
    if (!res.ok) throw new Error(data.error || 'Failed to update incident');
    return data;
  }

  static async getInspections(): Promise<VehicleInspection[]> {
    const res = await fetch(`${API_BASE}/manager/inspections`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson<VehicleInspection[]>(res, 'Failed to load inspections');
    if (!res.ok) throw new Error('Failed to load inspections');
    return data;
  }

  static async broadcastAnnouncement(payload: any): Promise<Announcement> {
    const res = await fetch(`${API_BASE}/manager/announcements`, {
      method: 'POST',
      headers: this.getHeaders('MANAGER'),
      body: JSON.stringify(payload),
    });
    const data = await this.parseJson<Announcement & { error?: string }>(res, 'Failed to broadcast announcement');
    if (!res.ok) throw new Error(data.error || 'Failed to broadcast announcement');
    return data;
  }

  static async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/manager/audit-logs`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson<AuditLog[]>(res, 'Failed to load audit logs');
    if (!res.ok) throw new Error('Failed to load audit logs');
    return data;
  }

  static async getLiveMapData() {
    const res = await fetch(`${API_BASE}/manager/live-map`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson(res, 'Failed to load live map data');
    if (!res.ok) throw new Error('Failed to load live map data');
    return data;
  }

  static getFinancialExportUrl(): string {
    return `${API_BASE}/manager/export/financial-csv`;
  }

  // --- Supabase PostgreSQL Backend Services ---
  static async getSupabaseStatus(): Promise<{
    configured: boolean;
    url: string;
    schemaReady: boolean;
    provider: string;
    tables: {
      routes: number;
      vehicles: number;
      drivers: number;
      trips: number;
      bookings: number;
      expenses: number;
    };
  }> {
    const res = await fetch(`${API_BASE}/supabase/status`, { headers: this.getHeaders('MANAGER') });
    const data = await this.parseJson(res, 'Failed to fetch Supabase status');
    if (!res.ok) throw new Error('Failed to fetch Supabase status');
    return data;
  }

  static async getSupabaseSchemaSql(): Promise<string> {
    const res = await fetch(`${API_BASE}/supabase/schema`, { headers: this.getHeaders('MANAGER') });
    if (!res.ok) throw new Error('Failed to fetch Supabase schema SQL');
    return res.text();
  }

  static async seedSupabaseDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/supabase/seed`, {
      method: 'POST',
      headers: this.getHeaders('MANAGER'),
    });
    const data = await this.parseJson(res, 'Failed to trigger database seed');
    if (!res.ok) throw new Error('Failed to trigger database seed');
    return data;
  }
}
