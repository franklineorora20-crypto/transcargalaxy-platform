import {
  INITIAL_ROUTES,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_TRIPS,
  INITIAL_BOOKINGS,
  INITIAL_REVENUES,
  INITIAL_EXPENSES,
  INITIAL_PAYROLL,
  INITIAL_INSPECTIONS,
  INITIAL_INCIDENTS,
  INITIAL_MAINTENANCE,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS,
} from '../../src/data/mockData.js';
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

export let routes: Route[] = [...INITIAL_ROUTES];
export let vehicles: Vehicle[] = [...INITIAL_VEHICLES];
export let drivers: Driver[] = [...INITIAL_DRIVERS];
export let trips: Trip[] = [...INITIAL_TRIPS];
export let bookings: Booking[] = [...INITIAL_BOOKINGS];
export let revenues: RevenueItem[] = [...INITIAL_REVENUES];
export let expenses: ExpenseItem[] = [...INITIAL_EXPENSES];
export let payroll: PayrollItem[] = [...INITIAL_PAYROLL];
export let inspections: VehicleInspection[] = [...INITIAL_INSPECTIONS];
export let incidents: IncidentReport[] = [...INITIAL_INCIDENTS];
export let maintenance: MaintenanceRecord[] = [...INITIAL_MAINTENANCE];
export let announcements: Announcement[] = [...INITIAL_ANNOUNCEMENTS];
export let auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

export function setRoutes(val: Route[]) { routes.splice(0, routes.length, ...val); }
export function setVehicles(val: Vehicle[]) { vehicles.splice(0, vehicles.length, ...val); }
export function setDrivers(val: Driver[]) { drivers.splice(0, drivers.length, ...val); }
export function setTrips(val: Trip[]) { trips.splice(0, trips.length, ...val); }
export function setBookings(val: Booking[]) { bookings.splice(0, bookings.length, ...val); }
export function setRevenues(val: RevenueItem[]) { revenues.splice(0, revenues.length, ...val); }
export function setExpenses(val: ExpenseItem[]) { expenses.splice(0, expenses.length, ...val); }
export function setPayroll(val: PayrollItem[]) { payroll.splice(0, payroll.length, ...val); }
export function setInspections(val: VehicleInspection[]) { inspections.splice(0, inspections.length, ...val); }
export function setIncidents(val: IncidentReport[]) { incidents.splice(0, incidents.length, ...val); }
export function setMaintenance(val: MaintenanceRecord[]) { maintenance.splice(0, maintenance.length, ...val); }
export function setAnnouncements(val: Announcement[]) { announcements.splice(0, announcements.length, ...val); }
export function setAuditLogs(val: AuditLog[]) { auditLogs.splice(0, auditLogs.length, ...val); }

export const pendingMpesaRequests = new Map<
  string,
  {
    bookingReference: string;
    amount: number;
    phone: string;
  }
>();

export const runtimeState = {
  routes: () => routes,
  vehicles: () => vehicles,
  drivers: () => drivers,
  trips: () => trips,
  bookings: () => bookings,
  revenues: () => revenues,
  expenses: () => expenses,
  payroll: () => payroll,
  inspections: () => inspections,
  incidents: () => incidents,
  maintenance: () => maintenance,
  announcements: () => announcements,
  auditLogs: () => auditLogs,
};

export function logAuditAction(
  userEmail: string,
  userRole: any,
  action: string,
  recordType: string,
  recordId: string,
  details: string,
) {
  const log: AuditLog = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userEmail,
    userRole,
    action,
    recordType,
    recordId,
    timestamp: new Date().toISOString(),
    details,
  };

  auditLogs.unshift(log);

  if (auditLogs.length > 200) {
    auditLogs.pop();
  }
}
