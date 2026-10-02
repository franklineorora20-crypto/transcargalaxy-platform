import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { INITIAL_ROUTES } from '../../src/data/mockData.js';
import type {
  Route,
  Vehicle,
  Driver,
  Trip,
  Booking,
  ExpenseItem,
  RevenueItem,
  PayrollItem,
  IncidentReport,
  VehicleInspection,
  MaintenanceRecord,
  Announcement,
  AuditLog,
} from '../../src/types/index.js';
import {
  bookings,
  trips,
  runtimeState,
  setRoutes,
  setVehicles,
  setDrivers,
  setTrips,
  setBookings,
  setRevenues,
  setExpenses,
  setPayroll,
  setInspections,
  setIncidents,
  setMaintenance,
  setAnnouncements,
  setAuditLogs,
} from './store.js';
import { ensureBookingTickets } from '../domain/tickets/ticketService.js';

let activePersistPromise: Promise<void> | null = null;

export async function loadRuntimeState() {
  if (activePersistPromise) {
    try {
      await activePersistPromise;
    } catch {
      // Ignore prior persist error before loading
    }
  }

  bookings.forEach((b) => ensureBookingTickets(b, trips));
  if (!supabaseAdmin) return;

  const { data, error } = await supabaseAdmin
    .from('runtime_state')
    .select('state_key, state_value');

  if (error) {
    console.warn(`Supabase runtime state unavailable: ${error.message}`);
    return;
  }

  const values = new Map(
    (data || []).map((row: any) => [row.state_key, row.state_value]),
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
    setRoutes(hasDeprecated || !hasSirare ? [...INITIAL_ROUTES] : loadedRoutes);
  }

  if (values.has('vehicles')) {
    setVehicles(values.get('vehicles') as Vehicle[]);
  }

  if (values.has('drivers')) {
    setDrivers(values.get('drivers') as Driver[]);
  }

  if (values.has('trips')) {
    const loadedTrips = values.get('trips') as Trip[];
    const todayStr = new Date().toISOString().split('T')[0];
    const hasTodayTrip = loadedTrips.some((t) => t.departureTime.startsWith(todayStr));
    if (!hasTodayTrip && loadedTrips.length > 0) {
      setTrips(
        loadedTrips.map((t) => {
          const depTimePart = t.departureTime.includes('T')
            ? t.departureTime.split('T')[1]
            : '05:00:00.000Z';
          const arrTimePart = t.estimatedArrivalTime.includes('T')
            ? t.estimatedArrivalTime.split('T')[1]
            : '11:30:00.000Z';
          return {
            ...t,
            departureTime: `${todayStr}T${depTimePart}`,
            estimatedArrivalTime: `${todayStr}T${arrTimePart}`,
          };
        }),
      );
    } else {
      setTrips(loadedTrips);
    }
  }

  if (values.has('bookings')) {
    const loadedBookings = values.get('bookings') as Booking[];
    setBookings(
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
  bookings.forEach((b) => ensureBookingTickets(b, trips));

  if (values.has('revenues')) {
    setRevenues(values.get('revenues') as RevenueItem[]);
  }

  if (values.has('expenses')) {
    setExpenses(values.get('expenses') as ExpenseItem[]);
  }

  if (values.has('payroll')) {
    setPayroll(values.get('payroll') as PayrollItem[]);
  }

  if (values.has('inspections')) {
    setInspections(values.get('inspections') as VehicleInspection[]);
  }

  if (values.has('incidents')) {
    setIncidents(values.get('incidents') as IncidentReport[]);
  }

  if (values.has('maintenance')) {
    setMaintenance(values.get('maintenance') as MaintenanceRecord[]);
  }

  if (values.has('announcements')) {
    setAnnouncements(values.get('announcements') as Announcement[]);
  }

  if (values.has('auditLogs')) {
    setAuditLogs(values.get('auditLogs') as AuditLog[]);
  }
}

export async function persistRuntimeState() {
  if (!supabaseAdmin) return;

  const runPersist = async () => {
    const rows = Object.entries(runtimeState).map(([state_key, getValue]) => ({
      state_key,
      state_value: getValue(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin.from('runtime_state').upsert(rows, {
      onConflict: 'state_key',
    });

    if (error) {
      console.error(`Supabase runtime state write failed: ${error.message}`);
    }
  };

  const nextPromise = (activePersistPromise || Promise.resolve())
    .catch(() => {})
    .then(runPersist);

  activePersistPromise = nextPromise;
  try {
    await nextPromise;
  } finally {
    if (activePersistPromise === nextPromise) {
      activePersistPromise = null;
    }
  }
}
