export type UserRole = 'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER';

export type TripStatus =
  | 'SCHEDULED'
  | 'BOARDING'
  | 'DEPARTED'
  | 'IN_TRANSIT'
  | 'AT_STOP'
  | 'DELAYED'
  | 'ARRIVED'
  | 'CANCELLED';

export type VehicleStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'ON_TRIP'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CANCELLED'
  | 'REFUNDED';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type InspectionStatus = 'PASS' | 'ISSUE_FOUND';

export type SeatClass = 'STANDARD' | 'EXECUTIVE';

export interface RouteStop {
  id: string;
  name: string;
  order: number;
  distanceFromOriginKm: number;
  estimatedMinutes: number;
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationHours: number;
  baseFareKsh: number;
  stops: RouteStop[];
  isActive: boolean;
  code: string;
  description: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string; // e.g. KDE 416Q, KDV 149E
  model: string; // e.g. Toyota HiAce 14-Seater
  type: 'LUXURY_COACH' | 'EXECUTIVE_BUS' | 'STANDARD_COACH';
  seatingCapacity: number; // e.g. 16, 45
  status: VehicleStatus;
  currentLocation: string;
  insuranceExpiry: string;
  inspectionExpiry: string;
  lastServiceDate: string;
  mileageKm: number;
  amenities: string[];
  assignedDriverId?: string;
  imageUrl?: string;
  tagline?: string;
  specialEdition?: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  assignedVehicleId?: string;
  totalTripsCompleted: number;
  rating: number;
  joinedDate: string;
}

export interface Seat {
  id: string;
  seatNumber: string; // e.g. "1A", "1B", "12D"
  row: number;
  column: number; // 1, 2, (aisle), 3, 4
  seatClass: SeatClass;
  fareMultiplier: number; // 1.0 for standard, 1.2 for executive
  isOccupied: boolean;
  isAccessible?: boolean;
}

export interface Trip {
  id: string;
  tripCode: string; // e.g. "SL-NBO-MBS-01"
  routeId: string;
  route: Route;
  vehicleId: string;
  vehicle: Vehicle;
  driverId: string;
  driverName: string;
  departureTime: string; // ISO date-time or string
  estimatedArrivalTime: string;
  fareKsh: number;
  status: TripStatus;
  currentStop?: string;
  delayMinutes: number;
  delayReason?: string;
  totalSeats: number;
  availableSeats: number;
  bookedSeatNumbers: string[];
  currentLocationCoords?: { lat: number; lng: number };
  amenities: string[];
}

export interface Passenger {
  fullName: string;
  idNumber: string;
  seatNumber: string;
  seatClass: SeatClass;
  fareKsh: number;
  hasBoarded: boolean;
  boardedAt?: string;
}

export interface Booking {
  id: string;
  bookingReference: string; // e.g. "TRP-48291"
  tripId: string;
  tripCode: string;
  routeOrigin: string;
  routeDestination: string;
  departureTime: string;
  busRegistration: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  passengers: Passenger[];
  totalFareKsh: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'MPESA';
  mpesaTransactionCode?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  bookingReference: string;
  amountKsh: number;
  paymentMethod: 'MPESA';
  status: PaymentStatus;
  transactionReference: string;
  phone: string;
  timestamp: string;
  refundReason?: string;
}

export interface IncidentReport {
  id: string;
  tripId: string;
  tripCode: string;
  driverId: string;
  driverName: string;
  vehicleRegistration: string;
  type: 'BREAKDOWN' | 'ACCIDENT' | 'MECHANICAL' | 'PASSENGER_EMERGENCY' | 'TRAFFIC_DELAY' | 'ROAD_CLOSURE' | 'SECURITY';
  severity: IncidentSeverity;
  description: string;
  location: string;
  timestamp: string;
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED';
  resolutionNotes?: string;
}

export interface VehicleInspection {
  id: string;
  vehicleId: string;
  vehicleRegistration: string;
  driverId: string;
  driverName: string;
  tripId?: string;
  timestamp: string;
  items: {
    tyres: boolean;
    brakes: boolean;
    lights: boolean;
    fuelLevel: 'FULL' | 'THREE_QUARTERS' | 'HALF' | 'LOW';
    emergencyKit: boolean;
    firstAidKit: boolean;
    doors: boolean;
    mirrors: boolean;
    wipers: boolean;
    ac: boolean;
  };
  status: InspectionStatus;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleRegistration: string;
  issue: string;
  type: 'SCHEDULED_SERVICE' | 'EMERGENCY_REPAIR' | 'TYRE_REPLACEMENT' | 'BRAKE_SERVICE' | 'ENGINE_OVERHAUL';
  date: string;
  costKsh: number; // Strictly Manager-Only
  serviceProvider: string;
  nextServiceDate: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  notes: string;
}

// Strictly Manager-Only Financial Interfaces
export interface RevenueItem {
  id: string;
  date: string;
  category: 'PASSENGER_TICKETS' | 'PARCEL_CARGO' | 'SPECIAL_CHARTER' | 'OTHER';
  amountKsh: number;
  routeOrigin?: string;
  routeDestination?: string;
  vehicleRegistration?: string;
  tripCode?: string;
  description: string;
}

export interface ExpenseItem {
  id: string;
  date: string;
  category:
    | 'FUEL'
    | 'VEHICLE_MAINTENANCE'
    | 'STAFF_SALARIES'
    | 'INSURANCE_LICENSING'
    | 'ROAD_TOLLS_FEES'
    | 'OFFICE_UTILITIES'
    | 'SUPPLIER_PAYMENTS';
  amountKsh: number;
  vehicleRegistration?: string;
  recipient: string;
  receiptNumber: string;
  notes: string;
  approvedBy: string;
}

export interface PayrollItem {
  id: string;
  employeeName: string;
  employeeId: string;
  role: 'SENIOR_DRIVER' | 'EXPRESS_DRIVER' | 'MECHANIC' | 'STATION_AGENT' | 'FLEET_MANAGER';
  baseSalaryKsh: number;
  allowancesKsh: number;
  deductionsKsh: number;
  netPayKsh: number;
  paymentStatus: 'PAID' | 'PENDING';
  payPeriod: string; // e.g. "September 2026"
  paymentDate?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  targetAudience: 'ALL_DRIVERS' | 'SPECIFIC_ROUTE' | 'ALL_STAFF';
  createdAt: string;
  authorName: string;
}

export interface AuditLog {
  id: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  recordType: string;
  recordId: string;
  timestamp: string;
  details: string;
}

export interface TrackingData {
  tripCode: string;
  bookingReference?: string;
  route: string;
  origin: string;
  destination: string;
  busRegistration: string;
  departureTime: string;
  estimatedArrivalTime: string;
  status: TripStatus;
  currentStop: string;
  nextStop: string;
  speedKmH: number;
  delayMinutes: number;
  delayReason?: string;
  percentCompleted: number;
  lastUpdated: string;
  coordinates: { lat: number; lng: number };
}
