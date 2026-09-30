import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { INITIAL_ROUTES } from '../../src/data/mockData';
import {
  Route,
  Vehicle,
  Driver,
  Trip,
  Booking,
  RevenueItem,
  ExpenseItem,
  PayrollItem,
  VehicleInspection,
  IncidentReport,
  MaintenanceRecord,
  Announcement,
  AuditLog,
} from '../../src/types';
import {
  routes,
  vehicles,
  drivers,
  trips,
  bookings,
  revenues,
  expenses,
  payroll,
  inspections,
  incidents,
  maintenance,
  announcements,
  auditLogs,
  runtimeState,
  replaceArrayInPlace,
} from './store';

type BookingNormalizer = (booking: Booking, tripsList?: Trip[]) => Booking;

let bookingNormalizer: BookingNormalizer | null = null;

export function registerBookingNormalizer(fn: BookingNormalizer): void {
  bookingNormalizer = fn;
}

export async function loadRuntimeState(): Promise<void> {
  if (bookingNormalizer) {
    bookings.forEach((b) => bookingNormalizer!(b, trips));
  }
  if (!supabaseAdmin) return;

  const { data, error } = await supabaseAdmin
    .from('runtime_state')
    .select('state_key, state_value');

  if (error) {
    console.warn(
      `Supabase runtime state unavailable: ${error.message}`,
    );
    return;
  }

  const values = new Map(
    (data || []).map((row: any) => [
      row.state_key,
      row.state_value,
    ]),
  );

  const deprecatedTowns = new Set(['oyugis', 'kendu bay', 'mogongo', 'bongo']);
  if (values.has('routes')) {
    const loadedRoutes = values.get('routes') as Route[];
    const hasDeprecated = loadedRoutes.some(
      (r) =>
        deprecatedTowns.has(r.origin.toLowerCase()) ||
        deprecatedTowns.has(r.destination.toLowerCase()),
    );
    const hasSirare = loadedRoutes.some(
      (r) =>
        r.destination.toLowerCase() === 'sirare' ||
        r.origin.toLowerCase() === 'sirare',
    );
    replaceArrayInPlace(
      routes,
      hasDeprecated || !hasSirare ? [...INITIAL_ROUTES] : loadedRoutes,
    );
  }

  if (values.has('vehicles')) {
    replaceArrayInPlace(vehicles, values.get('vehicles') as Vehicle[]);
  }

  if (values.has('drivers')) {
    replaceArrayInPlace(drivers, values.get('drivers') as Driver[]);
  }

  if (values.has('trips')) {
    const loadedTrips = values.get('trips') as Trip[];
    const todayStr = new Date().toISOString().split('T')[0];
    const hasTodayTrip = loadedTrips.some((t) => t.departureTime.startsWith(todayStr));
    if (!hasTodayTrip && loadedTrips.length > 0) {
      replaceArrayInPlace(
        trips,
        loadedTrips.map((t) => {
          const depTimePart = t.departureTime.includes('T') ? t.departureTime.split('T')[1] : '05:00:00.000Z';
          const arrTimePart = t.estimatedArrivalTime.includes('T') ? t.estimatedArrivalTime.split('T')[1] : '11:30:00.000Z';
          return {
            ...t,
            departureTime: `${todayStr}T${depTimePart}`,
            estimatedArrivalTime: `${todayStr}T${arrTimePart}`,
          };
        }),
      );
    } else {
      replaceArrayInPlace(trips, loadedTrips);
    }
  }

  if (values.has('bookings')) {
    const loadedBookings = values.get('bookings') as Booking[];
    replaceArrayInPlace(
      bookings,
      loadedBookings.map((b) => {
        const matchingTrip = trips.find(
          (t) => t.id === b.tripId || t.tripCode === b.tripCode,
        );
        return {
          ...b,
          departureTime: matchingTrip ? matchingTrip.departureTime : b.departureTime,
          ticketId: b.id === 'bk-1' && !b.ticketId ? 'TCR-7X4K9P2M' : b.ticketId,
          qrToken:
            b.id === 'bk-1' && !b.qrToken
              ? 'tcr_tok_7x4k9p2m_f9a8c3d2e1b0476589ab'
              : b.qrToken,
        };
      }),
    );
  }
  if (bookingNormalizer) {
    bookings.forEach((b) => bookingNormalizer!(b, trips));
  }

  if (values.has('revenues')) {
    replaceArrayInPlace(revenues, values.get('revenues') as RevenueItem[]);
  }

  if (values.has('expenses')) {
    replaceArrayInPlace(expenses, values.get('expenses') as ExpenseItem[]);
  }

  if (values.has('payroll')) {
    replaceArrayInPlace(payroll, values.get('payroll') as PayrollItem[]);
  }

  if (values.has('inspections')) {
    replaceArrayInPlace(inspections, values.get('inspections') as VehicleInspection[]);
  }

  if (values.has('incidents')) {
    replaceArrayInPlace(incidents, values.get('incidents') as IncidentReport[]);
  }

  if (values.has('maintenance')) {
    replaceArrayInPlace(maintenance, values.get('maintenance') as MaintenanceRecord[]);
  }

  if (values.has('announcements')) {
    replaceArrayInPlace(announcements, values.get('announcements') as Announcement[]);
  }

  if (values.has('auditLogs')) {
    replaceArrayInPlace(auditLogs, values.get('auditLogs') as AuditLog[]);
  }
}

export async function persistRuntimeState(): Promise<void> {
  if (!supabaseAdmin) return;

  const rows = Object.entries(runtimeState).map(
    ([state_key, getValue]) => ({
      state_key,
      state_value: getValue(),
      updated_at: new Date().toISOString(),
    }),
  );

  const { error } = await supabaseAdmin
    .from('runtime_state')
    .upsert(rows, {
      onConflict: 'state_key',
    });

  if (error) {
    console.error(
      `Supabase runtime state write failed: ${error.message}`,
    );
  }
}
