import { Booking, Passenger, TicketRecord, Trip } from '../types';

/**
 * Unambiguous alphanumeric character set used for TransCar Ticket IDs (TCR-XXXXXXXX).
 * Excludes easily confused characters (0, O, 1, I).
 */
export const TICKET_ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Canonical company & terminal metadata for E-Tickets and PDF Boarding Passes.
 */
export const TRANSCAR_COMPANY_NAME = 'TRANSCAR RONGAI LTD.';
export const RONGAI_TERMINAL_SUMMARY = 'Rongai Terminal: Next to Isalu Center, Ongata Rongai';
export const TRANSCAR_HOTLINE_DISPLAY = '+254 724 626199 / +254 717 747626';
export const PDF_TICKET_HEADER_CONTACT = `${RONGAI_TERMINAL_SUMMARY} | Tel: ${TRANSCAR_HOTLINE_DISPLAY}`;

export const PDF_BOARDING_INSTRUCTIONS: readonly string[] = [
  '1. Please arrive at the boarding point at least 30 minutes prior to scheduled departure.',
  '2. Present this E-Ticket (printed, screenshot, or on mobile) and your National ID to the driver for QR verification.',
  '3. Cryptographically secured by TransCar Rongai Ltd. Each QR token allows one-time boarding verification.',
];

/**
 * Resolves the authoritative Ticket ID for a passenger or booking.
 * Preserves compatibility with existing TCR- and legacy TRP- references.
 */
export function getTicketId(booking: Booking, passenger?: Passenger): string {
  if (passenger?.ticketId) return passenger.ticketId;
  if (booking.passengers?.length === 1 && booking.passengers[0]?.ticketId) {
    return booking.passengers[0].ticketId;
  }
  if (booking.ticketId) return booking.ticketId;
  return booking.bookingReference.replace(/^TRP-/i, 'TCR-');
}

/**
 * Resolves the QR verification token for a passenger or booking.
 */
export function getTicketQrToken(booking: Booking, passenger?: Passenger): string {
  if (passenger?.qrToken) return passenger.qrToken;
  if (booking.passengers?.length === 1 && booking.passengers[0]?.qrToken) {
    return booking.passengers[0].qrToken;
  }
  if (booking.qrToken) return booking.qrToken;
  return getTicketId(booking, passenger);
}

/**
 * Constructs the canonical verification URL encoded inside ticket QR codes.
 * Never embeds raw personal data in the QR payload.
 */
export function getTicketVerificationUrl(
  booking: Booking,
  passenger?: Passenger,
): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://transcar.co.ke';
  const token = getTicketQrToken(booking, passenger);
  return `${origin}/ticket/verify/${encodeURIComponent(token)}`;
}

/**
 * Extracts the normalized 8-character lowercase tag from a Ticket ID for QR token construction.
 */
export function formatQrTokenShortTag(ticketId: string): string {
  return ticketId.replace(/[^A-Z0-9]/gi, '').slice(-8).toLowerCase();
}

/**
 * Formats a QR token string given a ticket ID and a pre-generated hex entropy string.
 * Note: Authoritative cryptographic entropy generation remains server-side in server.ts.
 */
export function formatQrTokenWithEntropy(ticketId: string, entropyHex: string): string {
  const shortTag = formatQrTokenShortTag(ticketId);
  return `tcr_tok_${shortTag}_${entropyHex}`;
}

/**
 * Formats an ISO departure string into a YYYY-MM-DD travel date string.
 */
export function formatTravelDateIso(isoString?: string): string {
  if (!isoString) return new Date().toISOString().slice(0, 10);
  if (isoString.includes('T')) return isoString.split('T')[0];
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/**
 * Formats a departure timestamp into the full Kenyan travel date display
 * (e.g., "Thu, 17 September 2026") used on Digital Tickets and PDF Tickets.
 */
export function formatTravelDateLong(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats a departure timestamp into a compact travel date display (e.g., "17 Sept 2026").
 */
export function formatTravelDateShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a timestamp into a localized departure or boarding time string (e.g., "05:00 AM").
 */
export function formatDepartureTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats an ISO departure string into a 12-hour clock string with fallback ("05:00 AM"),
 * matching the TicketRecord.departure_time contract.
 */
export function formatDepartureClock12h(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '05:00 AM';
  return d.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats the booking creation timestamp for ticket metadata and footers.
 */
export function formatTicketIssueDate(isoString: string, style: 'medium' | 'default' = 'default'): string {
  const d = new Date(isoString);
  if (style === 'medium') {
    return d.toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  return d.toLocaleString('en-KE');
}

/**
 * Returns true if the route origin or destination involves the Rongai terminal.
 */
export function involvesRongaiTerminal(origin?: string, destination?: string): boolean {
  return origin === 'Rongai' || destination === 'Rongai';
}

/**
 * Returns the boarding stage reporting label for a given route origin.
 */
export function getBoardingTerminalLabel(origin: string): string {
  return origin === 'Rongai' ? 'Rongai — Next to Isalu Center' : `${origin} Stage`;
}

/**
 * Formats a route origin and destination pair for display on tickets.
 */
export function formatTicketRouteDisplay(
  origin: string,
  destination: string,
  separator: '→' | '->' = '→',
): string {
  return `${origin} ${separator} ${destination}`;
}

/**
 * Computes aggregate boarding progress flags across a booking's passengers.
 */
export function getBookingBoardingSummary(passengers: Passenger[]): {
  anyBoarded: boolean;
  allBoarded: boolean;
} {
  return {
    anyBoarded: passengers.some((p) => Boolean(p.hasBoarded)),
    allBoarded: passengers.length > 0 && passengers.every((p) => Boolean(p.hasBoarded)),
  };
}

/**
 * Resolves the canonical ticket_status for a passenger given their booking state.
 */
export function resolvePassengerTicketStatus(
  booking: Booking,
  passenger: Passenger,
): TicketRecord['ticket_status'] {
  const isBoarded = Boolean(passenger.hasBoarded || passenger.boardingStatus === 'BOARDED');
  if (booking.bookingStatus === 'CANCELLED') return 'CANCELLED';
  if (booking.bookingStatus === 'REFUNDED') return 'REFUNDED';
  if (booking.bookingStatus === 'EXPIRED') return 'EXPIRED';
  if (isBoarded) return 'BOARDED';
  return passenger.ticketStatus || 'ISSUED';
}

/**
 * Deterministic builder that maps a Booking + Passenger into a normalized TicketRecord.
 */
export function buildTicketRecordFromBooking(
  booking: Booking,
  passenger: Passenger,
  matchedTrip?: Trip,
): TicketRecord {
  const departureIso = booking.departureTime || matchedTrip?.departureTime || new Date().toISOString();
  const travelDate = formatTravelDateIso(departureIso);
  const isBoarded = Boolean(passenger.hasBoarded || passenger.boardingStatus === 'BOARDED');
  const ticketStatus = resolvePassengerTicketStatus(booking, passenger);

  return {
    ticket_id: passenger.ticketId || booking.ticketId || booking.bookingReference,
    booking_id: booking.id,
    booking_reference: booking.bookingReference,
    trip_id: booking.tripId || matchedTrip?.id || 'trip-rng-ksi-01',
    trip_code: booking.tripCode || matchedTrip?.tripCode || 'TR-RNG-KSI-0500',
    passenger_name: passenger.fullName || booking.contactName,
    passenger_phone: booking.contactPhone || '',
    passenger_id_number: passenger.idNumber || '',
    route: formatTicketRouteDisplay(booking.routeOrigin, booking.routeDestination, '→'),
    route_origin: booking.routeOrigin,
    route_destination: booking.routeDestination,
    travel_date: travelDate,
    departure_time: formatDepartureClock12h(departureIso),
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
    verified_by_name: passenger.verifiedByName || booking.verifiedByName || null,
    boarding_status: isBoarded ? 'BOARDED' : 'NOT_BOARDED',
  };
}
