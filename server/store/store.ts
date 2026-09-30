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
} from '../../src/data/mockData';
import {
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
  UserRole,
} from '../../src/types';

export const routes: Route[] = [...INITIAL_ROUTES];
export const vehicles: Vehicle[] = [...INITIAL_VEHICLES];
export const drivers: Driver[] = [...INITIAL_DRIVERS];
export const trips: Trip[] = [...INITIAL_TRIPS];
export const bookings: Booking[] = [...INITIAL_BOOKINGS];
export const revenues: RevenueItem[] = [...INITIAL_REVENUES];
export const expenses: ExpenseItem[] = [...INITIAL_EXPENSES];
export const payroll: PayrollItem[] = [...INITIAL_PAYROLL];
export const inspections: VehicleInspection[] = [...INITIAL_INSPECTIONS];
export const incidents: IncidentReport[] = [...INITIAL_INCIDENTS];
export const maintenance: MaintenanceRecord[] = [...INITIAL_MAINTENANCE];
export const announcements: Announcement[] = [...INITIAL_ANNOUNCEMENTS];
export const auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

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

export function replaceArrayInPlace<T>(target: T[], nextItems: T[]): void {
  target.splice(0, target.length, ...nextItems);
}

export function logAuditAction(
  userEmail: string,
  userRole: UserRole,
  action: string,
  recordType: string,
  recordId: string,
  details: string,
): void {
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
