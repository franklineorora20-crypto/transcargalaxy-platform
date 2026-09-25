import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Bus,
  Users,
  Route as RouteIcon,
  Calendar,
  AlertTriangle,
  ClipboardCheck,
  Plus,
  ShieldCheck,
  RefreshCw,
  Download,
  Lock,
  X,
  Send,
  Tag,
  Edit3,
  Sliders,
  CheckCircle2,
  MapPin,
  Clock,
  ArrowRight,
  Trash2,
  Percent,
  Check,
  SlidersHorizontal,
  Search,
  Wrench,
  Sparkles,
  CheckCheck,
  FileCheck,
  Activity,
  Gauge,
  Zap,
  ShieldAlert,
  BarChart3,
  FileText,
  Bell,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Vehicle,
  Driver,
  Route,
  Trip,
  Booking,
  ExpenseItem,
  PayrollItem,
  AuditLog,
  IncidentReport,
  VehicleInspection,
} from '../../types';
import { ApiService } from '../../services/api';
import { ManagerAnalyticsComponent } from './ManagerAnalyticsComponent';

interface ManagerPortalProps {
  managerData: any;
  onLogout: () => void;
}

interface FinancialSummary {
  totalRevenueKsh: number;
  totalOperatingExpensesKsh: number;
  totalPayrollKsh: number;
  netProfitKsh: number;
  operatingMarginPercent: number;
  passengerLoadFactorPercent: number;
}

interface PerformanceMetrics {
  tripCompletionRatePercent: number;
  onTimeDepartureRatePercent: number;
  averageSeatOccupancyPercent: number;
  totalSeatCapacityAcrossTrips: number;
  totalOccupiedSeatsAcrossTrips: number;
  completedTripsCount: number;
  inTransitTripsCount: number;
  scheduledTripsCount: number;
  delayedTripsCount: number;
  cancelledTripsCount: number;
  fleetUtilizationRatePercent: number;
  fleetReadinessRatePercent: number;
  avgRevenuePerTripKsh: number;
  avgRevenuePerPassengerKsh: number;
  totalPassengerVolume: number;
  capacityMetrics?: {
    elevenSeater: { trips: number; occupied: number; total: number; occupancyPercent: number };
    fourteenSeater: { trips: number; occupied: number; total: number; occupancyPercent: number };
    sixteenSeater: { trips: number; occupied: number; total: number; occupancyPercent: number };
  };
}

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
  timestamp: string;
}

export const ManagerPortal: React.FC<ManagerPortalProps> = ({ managerData, onLogout }) => {
  const [activeTab, setActiveTab] = React.useState<
    | 'overview'
    | 'reports'
    | 'announcements'
    | 'routes'
    | 'trips'
    | 'bookings'
    | 'fleet'
    | 'drivers'
    | 'inspections'
    | 'finance'
    | 'incidents'
    | 'audit'
  >('overview');

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [toasts, setToasts] = React.useState<ToastNotification[]>([]);

  // Core domain data
  const [summary, setSummary] = React.useState<FinancialSummary | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [routes, setRoutes] = React.useState<Route[]>([]);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [expenses, setExpenses] = React.useState<ExpenseItem[]>([]);
  const [payroll, setPayroll] = React.useState<PayrollItem[]>([]);
  const [inspections, setInspections] = React.useState<VehicleInspection[]>([]);
  const [incidents, setIncidents] = React.useState<IncidentReport[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);

  // Fleet management responsive states
  const [fleetSearch, setFleetSearch] = React.useState('');
  const [fleetFilter, setFleetFilter] = React.useState<'ALL' | 'ROADWORTHY' | 'MAINTENANCE' | 'LUXURY' | 'EXECUTIVE'>('ALL');
  const [showInspectionModal, setShowInspectionModal] = React.useState(false);
  const [inspectingVehicle, setInspectingVehicle] = React.useState<Vehicle | null>(null);
  const [inspectionForm, setInspectionForm] = React.useState({
    status: 'PASS' as 'PASS' | 'FAIL_NEEDS_MAINTENANCE',
    inspectorName: managerData?.name || 'Director Frankline Orora',
    odometerKm: 142800,
    speedGovernorSeal: 'INTACT_CALIBRATED_80KMH',
    brakesAndSteering: 'PASS',
    tiresAndTread: 'PASS',
    emergencyExitsAndFirstAid: 'PASS',
    fireExtinguisher: 'PASS',
    notes: 'All NTSA mechanical & safety roadworthiness checklist points verified.',
  });

  // Route & Pricing Management States
  const [routeFilter, setRouteFilter] = React.useState<'ALL' | 'RONGAI' | 'INTERCITY' | 'ACTIVE'>('ALL');
  const [showAddRouteModal, setShowAddRouteModal] = React.useState(false);
  const [newRouteForm, setNewRouteForm] = React.useState({
    origin: '',
    destination: '',
    distanceKm: 28,
    estimatedDurationHours: 1,
    baseFareKsh: 120,
    description: '',
    stopsText: '',
  });

  const [showEditRouteModal, setShowEditRouteModal] = React.useState(false);
  const [editingRoute, setEditingRoute] = React.useState<Route | null>(null);
  const [editRouteForm, setEditRouteForm] = React.useState({
    origin: '',
    destination: '',
    distanceKm: 28,
    estimatedDurationHours: 1,
    baseFareKsh: 120,
    description: '',
    isActive: true,
    updateScheduledTrips: true,
    stopsText: '',
  });

  const [showQuickPriceModal, setShowQuickPriceModal] = React.useState(false);
  const [quickPriceRoute, setQuickPriceRoute] = React.useState<Route | null>(null);
  const [quickPriceValue, setQuickPriceValue] = React.useState<number>(120);
  const [quickPriceSyncTrips, setQuickPriceSyncTrips] = React.useState<boolean>(true);

  const [showBatchPricingModal, setShowBatchPricingModal] = React.useState(false);
  const [batchPricing, setBatchPricing] = React.useState({
    routeId: 'ALL',
    adjustmentType: 'SET' as 'SET' | 'PERCENT' | 'FIXED',
    amount: 150,
    updateTrips: true,
  });

  const [editingTripFare, setEditingTripFare] = React.useState<Trip | null>(null);
  const [editingTripFareValue, setEditingTripFareValue] = React.useState<number>(120);

  // Modals & form state
  const [showAddExpenseModal, setShowAddExpenseModal] = React.useState(false);
  const [newExpense, setNewExpense] = React.useState({
    category: 'FUEL',
    amountKsh: 15000,
    description: '',
    receiptReference: '',
    vehicleRegistration: '',
  });

  const [showAddVehicleModal, setShowAddVehicleModal] = React.useState(false);
  const [newVehicle, setNewVehicle] = React.useState({
    registrationNumber: '',
    model: 'Scania Marcopolo G7',
    capacity: 49,
    type: 'LUXURY_COACH',
    status: 'AVAILABLE',
  });

  const [showAddTripModal, setShowAddTripModal] = React.useState(false);
  const [newTrip, setNewTrip] = React.useState({
    routeId: '',
    vehicleId: '',
    driverId: '',
    departureTime: '',
    fareKsh: 2000,
  });

  const [selectedBookingForDetails, setSelectedBookingForDetails] = React.useState<Booking | null>(null);
  const [announcementText, setAnnouncementText] = React.useState('');
  const [announcementSuccess, setAnnouncementSuccess] = React.useState(false);

  // Universal Toast Notification Handler
  const addToast = (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastNotification = {
      id,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ type, text });
    addToast(type === 'success' ? 'Submitted Successfully' : 'Submission Alert', text, type);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const fetchAllManagerData = React.useCallback(async () => {
    try {
      const [
        dashData,
        financeData,
        vehiclesData,
        driversData,
        routesData,
        tripsData,
        bookingsData,
        safetyData,
        logsData,
      ] = await Promise.all([
        ApiService.getManagerDashboardStats(),
        ApiService.getFinancialLedger(),
        ApiService.getFleet(),
        ApiService.getDrivers(),
        ApiService.getManagerRoutes(),
        ApiService.searchTrips({}),
        ApiService.getManagerBookings(),
        ApiService.getSafetyData(),
        ApiService.getAuditLogs(),
      ]);

      const fin = dashData.financial || {};
      const expList: ExpenseItem[] = financeData.expenses || [];
      const expTotal = expList.reduce((sum, e) => sum + (e.amountKsh || 0), 0) || fin.totalExpensesKsh || 0;
      const grossRev = fin.weeklyRevenueKsh || 890000;
      const netProf = fin.netResultKsh || (grossRev - expTotal);
      const payList: PayrollItem[] = financeData.payroll || [];
      const payrollTotal = payList.reduce((sum, p) => sum + (p.netPayKsh || p.baseSalaryKsh || 0), 0) || 450000;

      const allTrips: Trip[] = tripsData || [];
      const allBookings: Booking[] = bookingsData || [];
      const allVehicles: Vehicle[] = vehiclesData || [];

      // Calculate real-time trip completion rates
      const completedTrips = allTrips.filter((t) => t.status === 'ARRIVED').length;
      const inTransitTrips = allTrips.filter((t) => t.status === 'IN_TRANSIT' || t.status === 'DEPARTED').length;
      const scheduledTrips = allTrips.filter((t) => t.status === 'SCHEDULED' || t.status === 'BOARDING').length;
      const cancelledTrips = allTrips.filter((t) => t.status === 'CANCELLED').length;
      const delayedTrips = allTrips.filter((t) => (t.delayMinutes || 0) > 0).length;
      const onTimeTrips = allTrips.filter((t) => (t.delayMinutes || 0) === 0).length;

      const completionRate = allTrips.length > 0
        ? Math.round(((completedTrips + inTransitTrips) / Math.max(1, allTrips.length - cancelledTrips)) * 1000) / 10
        : 100;

      const onTimeRate = allTrips.length > 0
        ? Math.round((onTimeTrips / allTrips.length) * 1000) / 10
        : 100;

      // Calculate real-time seat occupancy and load factors
      let totalCapacity = 0;
      let totalOccupied = 0;
      const capBreakdown = {
        elevenSeater: { trips: 0, occupied: 0, total: 0, occupancyPercent: 0 },
        fourteenSeater: { trips: 0, occupied: 0, total: 0, occupancyPercent: 0 },
        sixteenSeater: { trips: 0, occupied: 0, total: 0, occupancyPercent: 0 },
      };

      allTrips.forEach((t) => {
        const cap = t.totalSeats || t.vehicle?.seatingCapacity || 16;
        const occ = Math.max(0, cap - (t.availableSeats ?? 0));
        totalCapacity += cap;
        totalOccupied += occ;

        if (cap <= 11) {
          capBreakdown.elevenSeater.trips++;
          capBreakdown.elevenSeater.occupied += occ;
          capBreakdown.elevenSeater.total += cap;
        } else if (cap <= 14) {
          capBreakdown.fourteenSeater.trips++;
          capBreakdown.fourteenSeater.occupied += occ;
          capBreakdown.fourteenSeater.total += cap;
        } else {
          capBreakdown.sixteenSeater.trips++;
          capBreakdown.sixteenSeater.occupied += occ;
          capBreakdown.sixteenSeater.total += cap;
        }
      });

      if (capBreakdown.elevenSeater.total > 0) {
        capBreakdown.elevenSeater.occupancyPercent =
          Math.round((capBreakdown.elevenSeater.occupied / capBreakdown.elevenSeater.total) * 1000) / 10;
      }
      if (capBreakdown.fourteenSeater.total > 0) {
        capBreakdown.fourteenSeater.occupancyPercent =
          Math.round((capBreakdown.fourteenSeater.occupied / capBreakdown.fourteenSeater.total) * 1000) / 10;
      }
      if (capBreakdown.sixteenSeater.total > 0) {
        capBreakdown.sixteenSeater.occupancyPercent =
          Math.round((capBreakdown.sixteenSeater.occupied / capBreakdown.sixteenSeater.total) * 1000) / 10;
      }

      const avgOccupancy = totalCapacity > 0
        ? Math.round((totalOccupied / totalCapacity) * 1000) / 10
        : 88.5;

      const activeBuses = allVehicles.filter((v) => v.status === 'ON_TRIP').length;
      const availableBuses = allVehicles.filter((v) => v.status === 'AVAILABLE').length;
      const fleetUtil = Math.round((activeBuses / Math.max(1, allVehicles.length)) * 1000) / 10;
      const fleetReady = Math.round(((activeBuses + availableBuses) / Math.max(1, allVehicles.length)) * 1000) / 10;

      const totalPassengers = allBookings.reduce((sum, b) => sum + (b.passengers?.length || 1), 0);
      const avgRevPerTrip = Math.round(grossRev / Math.max(1, allTrips.length));
      const avgRevPerPassenger = Math.round(grossRev / Math.max(1, totalPassengers));

      const perfMetrics: PerformanceMetrics = dashData.performance || {
        tripCompletionRatePercent: completionRate,
        onTimeDepartureRatePercent: onTimeRate,
        averageSeatOccupancyPercent: avgOccupancy,
        totalSeatCapacityAcrossTrips: totalCapacity,
        totalOccupiedSeatsAcrossTrips: totalOccupied,
        completedTripsCount: completedTrips,
        inTransitTripsCount: inTransitTrips,
        scheduledTripsCount: scheduledTrips,
        delayedTripsCount: delayedTrips,
        cancelledTripsCount: cancelledTrips,
        fleetUtilizationRatePercent: fleetUtil,
        fleetReadinessRatePercent: fleetReady,
        avgRevenuePerTripKsh: avgRevPerTrip,
        avgRevenuePerPassengerKsh: avgRevPerPassenger,
        totalPassengerVolume: totalPassengers,
        capacityMetrics: capBreakdown,
      };

      setPerformanceMetrics(perfMetrics);

      setSummary({
        totalRevenueKsh: grossRev,
        totalOperatingExpensesKsh: expTotal,
        totalPayrollKsh: payrollTotal,
        netProfitKsh: netProf,
        operatingMarginPercent: fin.netMarginPercent || 34,
        passengerLoadFactorPercent: perfMetrics.averageSeatOccupancyPercent,
      });

      setVehicles(vehiclesData || []);
      setDrivers(driversData || []);
      setRoutes(routesData || []);
      setTrips(tripsData || []);
      setBookings(bookingsData || []);
      setExpenses(financeData.expenses || []);
      setPayroll(financeData.payroll || []);
      setInspections(safetyData.inspections || []);
      setIncidents(safetyData.incidents || []);
      setAuditLogs(logsData || []);
    } catch (err) {
      console.error('Error fetching manager portal data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAllManagerData();
  }, [fetchAllManagerData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllManagerData();
  };

  // Add Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const added = await ApiService.addExpense({
        category: newExpense.category,
        amountKsh: Number(newExpense.amountKsh),
        notes: newExpense.description,
        recipient: 'Shell / Total Energies Station',
        receiptNumber: newExpense.receiptReference || `RCP-${Date.now().toString().slice(-5)}`,
        vehicleRegistration: newExpense.vehicleRegistration || undefined,
        approvedBy: managerData?.name || 'Director Frankline Orora',
      });
      setShowAddExpenseModal(false);
      addToast(
        'Expense Recorded & Posted',
        `Disbursement of KES ${Number(newExpense.amountKsh).toLocaleString()} posted to operations ledger under ${newExpense.category}.`,
        'success'
      );
      setNewExpense({
        category: 'FUEL',
        amountKsh: 15000,
        description: '',
        receiptReference: '',
        vehicleRegistration: '',
      });
      handleRefresh();
    } catch (err: any) {
      addToast('Expense Submission Failed', err.message || 'Failed to add expense', 'error');
    }
  };

  // Add Vehicle
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const reg = newVehicle.registrationNumber.trim().toUpperCase();
    if (!reg) return;

    try {
      const created = await ApiService.addVehicle({
        registrationNumber: reg,
        model: newVehicle.model,
        seatingCapacity: Number(newVehicle.capacity),
        type: newVehicle.type as any,
        status: newVehicle.status as any,
        amenities: ['Wi-Fi', 'Air Conditioning', 'USB Charging', 'Reclining Seats'],
      });

      // Optimistic addition
      setVehicles((prev) => [created, ...prev]);
      setShowAddVehicleModal(false);
      addToast(
        'Coach Added to Fleet',
        `Vehicle ${reg} (${newVehicle.model}) registered successfully with ${newVehicle.capacity} seats capacity.`,
        'success'
      );
      setNewVehicle({
        registrationNumber: '',
        model: 'Scania Marcopolo G7',
        capacity: 49,
        type: 'LUXURY_COACH',
        status: 'AVAILABLE',
      });
      handleRefresh();
    } catch (err: any) {
      addToast('Vehicle Registration Failed', err.message || 'Failed to add vehicle', 'error');
    }
  };

  // Fast Optimistic Vehicle Status Update
  const handleUpdateVehicleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'AVAILABLE' || currentStatus === 'ASSIGNED' || currentStatus === 'ON_TRIP'
      ? 'MAINTENANCE'
      : 'AVAILABLE';

    const targetVehicle = vehicles.find((v) => v.id === id);
    const regNumber = targetVehicle?.registrationNumber || 'Coach';

    // Instant optimistic update
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: nextStatus as any } : v))
    );

    addToast(
      nextStatus === 'AVAILABLE' ? 'Coach Certified Roadworthy' : 'Coach Flagged for Maintenance',
      nextStatus === 'AVAILABLE'
        ? `${regNumber} marked as Roadworthy and cleared for passenger service.`
        : `${regNumber} transitioned to Workshop & Maintenance status.`,
      nextStatus === 'AVAILABLE' ? 'success' : 'warning'
    );

    try {
      await ApiService.updateVehicle(id, { status: nextStatus });
    } catch (err: any) {
      // Revert on error
      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: currentStatus as any } : v))
      );
      addToast('Status Update Failed', err.message || 'Could not update vehicle status', 'error');
    }
  };

  // Log Roadworthiness Safety Inspection
  const handleOpenInspection = (vehicle: Vehicle) => {
    setInspectingVehicle(vehicle);
    setInspectionForm({
      status: 'PASS',
      inspectorName: managerData?.name || 'Director Frankline Orora',
      odometerKm: 145000 + Math.floor(Math.random() * 5000),
      speedGovernorSeal: 'INTACT_CALIBRATED_80KMH',
      brakesAndSteering: 'PASS',
      tiresAndTread: 'PASS',
      emergencyExitsAndFirstAid: 'PASS',
      fireExtinguisher: 'PASS',
      notes: `Official Roadworthiness & NTSA audit for ${vehicle.registrationNumber}. All safety equipment verified.`,
    });
    setShowInspectionModal(true);
  };

  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingVehicle) return;

    const newInsp: VehicleInspection = {
      id: `insp-${Date.now()}`,
      vehicleId: inspectingVehicle.id,
      vehicleRegistration: inspectingVehicle.registrationNumber,
      driverId: 'mgr-inspection',
      driverName: inspectionForm.inspectorName,
      timestamp: new Date().toISOString(),
      items: {
        tyres: inspectionForm.tiresAndTread === 'PASS',
        brakes: inspectionForm.brakesAndSteering === 'PASS',
        lights: true,
        fuelLevel: 'FULL',
        emergencyKit: inspectionForm.emergencyExitsAndFirstAid === 'PASS',
        firstAidKit: inspectionForm.emergencyExitsAndFirstAid === 'PASS',
        doors: true,
        mirrors: true,
        wipers: true,
        ac: true,
      },
      status: inspectionForm.status as any,
      notes: `${inspectionForm.notes} • Speed Governor: ${inspectionForm.speedGovernorSeal} • Odo: ${inspectionForm.odometerKm.toLocaleString()}km`,
    };

    // Optimistically update inspections and vehicle status
    setInspections((prev) => [newInsp, ...prev]);
    if (inspectionForm.status === 'PASS') {
      setVehicles((prev) =>
        prev.map((v) => (v.id === inspectingVehicle.id ? { ...v, status: 'AVAILABLE' } : v))
      );
    }

    setShowInspectionModal(false);
    addToast(
      'Inspection Audit Logged',
      `Roadworthiness certificate recorded for ${inspectingVehicle.registrationNumber} (Status: ${inspectionForm.status}).`,
      inspectionForm.status === 'PASS' ? 'success' : 'warning'
    );

    try {
      if (inspectionForm.status === 'PASS') {
        await ApiService.updateVehicle(inspectingVehicle.id, { status: 'AVAILABLE' });
      }
      handleRefresh();
    } catch {
      // Ignored since local state was updated
    }
  };

  // Add Scheduled Trip
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.routeId || !newTrip.vehicleId || !newTrip.driverId || !newTrip.departureTime) {
      addToast('Incomplete Schedule Form', 'Please select corridor, coach, captain and departure time.', 'warning');
      return;
    }

    try {
      const depDate = new Date(newTrip.departureTime);
      const selectedRoute = routes.find((r) => r.id === newTrip.routeId);
      const durationHours = selectedRoute ? selectedRoute.estimatedDurationHours : 6;
      const arrDate = new Date(depDate.getTime() + durationHours * 3600 * 1000);

      const created = await ApiService.scheduleTrip({
        routeId: newTrip.routeId,
        vehicleId: newTrip.vehicleId,
        driverId: newTrip.driverId,
        departureTime: depDate.toISOString(),
        estimatedArrivalTime: arrDate.toISOString(),
        fareKsh: Number(newTrip.fareKsh),
        amenities: ['Wi-Fi', 'Air Conditioning', 'USB Charging', 'Reclining Seats'],
      });

      setShowAddTripModal(false);
      addToast(
        'Departure Scheduled Successfully',
        `Trip ${created?.tripCode || 'Departure'} created for ${selectedRoute?.origin || 'Origin'} → ${selectedRoute?.destination || 'Destination'} at KES ${newTrip.fareKsh}.`,
        'success'
      );
      handleRefresh();
    } catch (err: any) {
      addToast('Schedule Conflict / Error', err.message || 'Failed to schedule trip', 'error');
    }
  };

  // Disburse Payroll Record
  const handleDisbursePayroll = async (recordId: string) => {
    const item = payroll.find((p) => p.id === recordId);
    if (!confirm(`Authorize M-Pesa B2C salary disbursement of KES ${item?.baseSalaryKsh.toLocaleString()} for ${item?.employeeName}?`)) return;

    // Optimistic update
    setPayroll((prev) =>
      prev.map((p) => (p.id === recordId ? { ...p, paymentStatus: 'PAID', paidDate: new Date().toISOString() } : p))
    );

    addToast(
      'M-Pesa Salary Disbursed',
      `Payment of KES ${item?.baseSalaryKsh.toLocaleString()} sent via M-Pesa to ${item?.employeeName}.`,
      'success'
    );

    try {
      await ApiService.disburseSalary(recordId);
      handleRefresh();
    } catch (err: any) {
      addToast('Disbursement Failed', err.message || 'Failed to disburse salary', 'error');
    }
  };

  // Cancel/Refund Booking
  const handleRefundBooking = async (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!confirm(`Are you sure you want to cancel booking ${targetBooking?.bookingReference} and issue an M-Pesa refund?`)) return;

    // Optimistic refund
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, bookingStatus: 'CANCELLED', paymentStatus: 'REFUNDED' } : b))
    );

    addToast(
      'Refund Issued Successfully',
      `Booking ${targetBooking?.bookingReference} cancelled. M-Pesa refund of KES ${targetBooking?.totalFareKsh.toLocaleString()} processed.`,
      'info'
    );

    try {
      await ApiService.updateBookingStatus(bookingId, {
        bookingStatus: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        refundReason: 'Manager issued cancellation & refund',
      });
      setSelectedBookingForDetails(null);
      handleRefresh();
    } catch (err: any) {
      addToast('Refund Failed', err.message || 'Failed to cancel booking', 'error');
    }
  };

  // 1. Create New Route
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteForm.origin || !newRouteForm.destination || !newRouteForm.baseFareKsh) {
      alert('Please fill in origin, destination, and base price.');
      return;
    }

    try {
      const stops = newRouteForm.stopsText
        ? newRouteForm.stopsText
            .split(',')
            .map((s, i) => ({
              id: `stop-${Date.now()}-${i}`,
              name: s.trim(),
              order: i + 1,
              distanceFromOriginKm: Math.round(((i + 1) * Number(newRouteForm.distanceKm)) / 4),
              estimatedMinutes: Math.round(((i + 1) * Number(newRouteForm.estimatedDurationHours) * 60) / 4),
            }))
            .filter((s) => s.name.length > 0)
        : undefined;

      const created = await ApiService.addRoute({
        origin: newRouteForm.origin.trim(),
        destination: newRouteForm.destination.trim(),
        distanceKm: Number(newRouteForm.distanceKm),
        estimatedDurationHours: Number(newRouteForm.estimatedDurationHours),
        baseFareKsh: Number(newRouteForm.baseFareKsh),
        description: newRouteForm.description.trim(),
        stops,
      });

      setShowAddRouteModal(false);
      setNewRouteForm({
        origin: '',
        destination: '',
        distanceKm: 28,
        estimatedDurationHours: 1,
        baseFareKsh: 120,
        description: '',
        stopsText: '',
      });
      triggerFeedback(`Route ${created.code} (${created.origin} → ${created.destination}) created successfully at KES ${created.baseFareKsh}!`);
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create route');
    }
  };

  // 2. Open Route Edit
  const handleOpenEditRoute = (route: Route) => {
    setEditingRoute(route);
    setEditRouteForm({
      origin: route.origin,
      destination: route.destination,
      distanceKm: route.distanceKm,
      estimatedDurationHours: route.estimatedDurationHours,
      baseFareKsh: route.baseFareKsh,
      description: route.description || '',
      isActive: route.isActive,
      updateScheduledTrips: true,
      stopsText: route.stops ? route.stops.map((s) => s.name).join(', ') : '',
    });
    setShowEditRouteModal(true);
  };

  // 3. Save Route Edit (including manual base price)
  const handleSaveEditRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;

    try {
      const stops = editRouteForm.stopsText
        ? editRouteForm.stopsText
            .split(',')
            .map((s, i) => ({
              id: `stop-${Date.now()}-${i}`,
              name: s.trim(),
              order: i + 1,
              distanceFromOriginKm: Math.round(((i + 1) * Number(editRouteForm.distanceKm)) / 4),
              estimatedMinutes: Math.round(((i + 1) * Number(editRouteForm.estimatedDurationHours) * 60) / 4),
            }))
            .filter((s) => s.name.length > 0)
        : undefined;

      const res = await ApiService.updateRoute(editingRoute.id, {
        origin: editRouteForm.origin.trim(),
        destination: editRouteForm.destination.trim(),
        distanceKm: Number(editRouteForm.distanceKm),
        estimatedDurationHours: Number(editRouteForm.estimatedDurationHours),
        baseFareKsh: Number(editRouteForm.baseFareKsh),
        description: editRouteForm.description.trim(),
        isActive: editRouteForm.isActive,
        stops,
        updateScheduledTrips: editRouteForm.updateScheduledTrips,
      });

      setShowEditRouteModal(false);
      setEditingRoute(null);
      triggerFeedback(
        `Route ${res.route.code} updated. Price set to KES ${res.route.baseFareKsh}.${
          res.updatedTripsCount ? ` Synchronized ${res.updatedTripsCount} scheduled departures.` : ''
        }`
      );
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update route');
    }
  };

  // 4. Toggle Route Active Status
  const handleToggleRouteActive = async (route: Route) => {
    try {
      const newStatus = !route.isActive;
      await ApiService.updateRoute(route.id, { isActive: newStatus });
      triggerFeedback(`Route ${route.code} ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle route status');
    }
  };

  // 5. Fast Manual Route Price Quick-Edit
  const handleOpenQuickPrice = (route: Route) => {
    setQuickPriceRoute(route);
    setQuickPriceValue(route.baseFareKsh);
    setQuickPriceSyncTrips(true);
    setShowQuickPriceModal(true);
  };

  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPriceRoute) return;

    try {
      const res = await ApiService.updateRoute(quickPriceRoute.id, {
        baseFareKsh: Number(quickPriceValue),
        updateScheduledTrips: quickPriceSyncTrips,
      });
      setShowQuickPriceModal(false);
      setQuickPriceRoute(null);
      triggerFeedback(
        `Price for ${res.route.code} manually set to KES ${res.route.baseFareKsh}.${
          res.updatedTripsCount ? ` Updated ${res.updatedTripsCount} upcoming departures.` : ''
        }`
      );
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update route price');
    }
  };

  // 6. Batch / Surge Pricing Adjustment
  const handleApplyBatchPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetRouteIds =
        batchPricing.routeId === 'ALL'
          ? routes.map((r) => r.id)
          : [batchPricing.routeId];

      let count = 0;
      for (const rId of targetRouteIds) {
        await ApiService.adjustPricing({
          routeId: rId,
          adjustmentType: batchPricing.adjustmentType,
          amount: Number(batchPricing.amount),
          updateTrips: batchPricing.updateTrips,
        });
        count++;
      }

      setShowBatchPricingModal(false);
      triggerFeedback(`Pricing adjustments applied across ${count} route(s) successfully!`);
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust pricing');
    }
  };

  // 7. Manual Trip Departure Fare Override
  const handleOpenEditTripFare = (trip: Trip) => {
    setEditingTripFare(trip);
    setEditingTripFareValue(trip.fareKsh);
  };

  const handleSaveTripFare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTripFare) return;
    try {
      await ApiService.updateTripPrice(editingTripFare.id, editingTripFareValue);
      triggerFeedback(
        `Fare for departure ${editingTripFare.tripCode} manually updated to KES ${editingTripFareValue}.`
      );
      setEditingTripFare(null);
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update departure fare');
    }
  };

  // Post Dispatch Announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    try {
      await ApiService.broadcastAnnouncement({
        title: 'Dispatch Fleet Advisory',
        message: announcementText.trim(),
        priority: 'NORMAL',
        targetAudience: 'ALL_DRIVERS',
      });
      setAnnouncementText('');
      setAnnouncementSuccess(true);
      setTimeout(() => setAnnouncementSuccess(false), 4000);
      handleRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement');
    }
  };

  // Export Financial Ledger CSV
  const handleExportCSV = () => {
    const rows = [
      ['TRANSCAR RONGAI LTD - OFFICIAL FINANCIAL LEDGER'],
      ['Export Timestamp', new Date().toISOString()],
      ['Manager', managerData?.name || 'Administrator'],
      [],
      ['REVENUE SUMMARY'],
      ['Gross Passenger Revenue (KES)', summary?.totalRevenueKsh || 0],
      ['Total Operating Expenses (KES)', summary?.totalOperatingExpensesKsh || 0],
      ['Total Staff Payroll (KES)', summary?.totalPayrollKsh || 0],
      ['Net Operating Profit (KES)', summary?.netProfitKsh || 0],
      ['Operating Margin (%)', summary?.operatingMarginPercent || 0],
      [],
      ['EXPENSES ITEMIZED BREAKDOWN'],
      ['Date', 'Category', 'Description', 'Receipt Ref', 'Bus Plate', 'Amount KES'],
      ...expenses.map((e) => [
        new Date(e.date).toLocaleDateString(),
        e.category,
        `"${e.notes}"`,
        e.receiptNumber,
        e.vehicleRegistration || 'N/A',
        e.amountKsh,
      ]),
      [],
      ['PAYROLL LEDGER'],
      ['Staff Name', 'Designation', 'Period', 'Base Salary (KES)', 'Status'],
      ...payroll.map((p) => [p.employeeName, p.role, p.payPeriod, p.baseSalaryKsh, p.paymentStatus]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transcar-rongai-financial-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center">
        <Bus className="w-10 h-10 text-amber-500 animate-bounce mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Loading Manager Executive Suite...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Manager Banner */}
      <div className="bg-slate-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md flex-shrink-0">
            <Lock className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                Manager Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white font-serif">
              Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 font-medium">
              Welcome, <strong className="text-white">{managerData?.name || 'Frankline Orora'}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            title="Export full financial ledger to CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh All Records"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-900/40 border border-rose-700/50 text-rose-300 hover:bg-rose-900/80 font-bold text-sm transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Floating Manager Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SYSTEMATIC MANAGER OPERATIONS COMMAND CENTER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Quick Operations Bar & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
              Manager Operations Hub
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              • Direct System Controls
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddRouteModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" /> New Route
            </button>
            <button
              onClick={() => setShowAddTripModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" /> Schedule Departure
            </button>
            <button
              onClick={() => setShowAddVehicleModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" /> Add Coach
            </button>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" /> Log Expense
            </button>
          </div>
        </div>

        {/* 4 Systematic Master Operational Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              id: 'overview',
              defaultTab: 'overview',
              pillar: 'Operations & Dashboard',
              desc: 'Executive KPIs, Reports & Bulletins',
              icon: TrendingUp,
              activeTabs: ['overview', 'reports', 'announcements'],
              badge: `${trips.length} Departures`,
            },
            {
              id: 'routes',
              defaultTab: 'routes',
              pillar: 'Routes & Schedules',
              desc: 'Pricing, Departures & Manifests',
              icon: RouteIcon,
              activeTabs: ['routes', 'trips', 'bookings'],
              badge: `${routes.length} Corridors`,
            },
            {
              id: 'fleet',
              defaultTab: 'fleet',
              pillar: 'Fleet & Crew',
              desc: 'HiAce Fleet, Captains & NTSA',
              icon: Bus,
              activeTabs: ['fleet', 'drivers', 'inspections'],
              badge: `${vehicles.length} Coaches`,
            },
            {
              id: 'finance',
              defaultTab: 'finance',
              pillar: 'Financials & Governance',
              desc: 'M-Pesa Ledger, Incidents & Audit',
              icon: DollarSign,
              activeTabs: ['finance', 'incidents', 'audit'],
              badge: `KES ${(summary?.totalRevenueKsh || 0).toLocaleString()}`,
            },
          ].map((cat) => {
            const Icon = cat.icon;
            const isPillarActive = cat.activeTabs.includes(activeTab);
            return (
              <button
                key={cat.pillar}
                onClick={() => {
                  if (!cat.activeTabs.includes(activeTab)) {
                    setActiveTab(cat.defaultTab as any);
                  }
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isPillarActive
                    ? 'bg-slate-950 text-white border-slate-900 shadow-lg ring-2 ring-amber-400/50'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isPillarActive ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono ${
                      isPillarActive
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {cat.badge}
                  </span>
                </div>
                <div>
                  <h4 className={`text-xs font-black tracking-tight ${isPillarActive ? 'text-white' : 'text-slate-900'}`}>
                    {cat.pillar}
                  </h4>
                  <p className={`text-[11px] mt-0.5 font-medium truncate ${isPillarActive ? 'text-slate-400' : 'text-slate-500'}`}>
                    {cat.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Contextual Sub-Tabs (Strictly Filtered to the Selected Pillar Only) */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {activeTab === 'overview' || activeTab === 'reports' || activeTab === 'announcements'
                ? 'Operations & Oversight Modules:'
                : activeTab === 'routes' || activeTab === 'trips' || activeTab === 'bookings'
                ? 'Route & Schedule Modules:'
                : activeTab === 'fleet' || activeTab === 'drivers' || activeTab === 'inspections'
                ? 'Fleet & Crew Modules:'
                : 'Financial & Governance Modules:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'overview', label: 'Executive Overview', icon: TrendingUp, pillar: ['overview', 'reports', 'announcements'] },
              { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, pillar: ['overview', 'reports', 'announcements'] },
              { id: 'announcements', label: 'Fleet Bulletins', icon: Bell, pillar: ['overview', 'reports', 'announcements'] },

              { id: 'routes', label: 'Routes & Price Management', icon: Tag, pillar: ['routes', 'trips', 'bookings'] },
              { id: 'trips', label: 'Trip Schedules & Rosters', icon: RouteIcon, pillar: ['routes', 'trips', 'bookings'] },
              { id: 'bookings', label: 'Bookings & Refunds', icon: ClipboardCheck, pillar: ['routes', 'trips', 'bookings'] },

              { id: 'fleet', label: 'Fleet Inventory & Status', icon: Bus, pillar: ['fleet', 'drivers', 'inspections'] },
              { id: 'drivers', label: 'Driver Captains Roster', icon: Users, pillar: ['fleet', 'drivers', 'inspections'] },
              { id: 'inspections', label: 'Roadworthiness Audits', icon: FileCheck, pillar: ['fleet', 'drivers', 'inspections'] },

              { id: 'finance', label: 'Financial Controls & Payroll', icon: DollarSign, pillar: ['finance', 'incidents', 'audit'] },
              { id: 'incidents', label: 'Incident Reports & Safety', icon: AlertTriangle, pillar: ['finance', 'incidents', 'audit'] },
              { id: 'audit', label: 'Security & Audit Trail', icon: ShieldCheck, pillar: ['finance', 'incidents', 'audit'] },
            ]
              .filter((tab) => tab.pillar.includes(activeTab))
              .map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 border-2 border-slate-900 shadow-md scale-105'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-8">
          {/* Real-Time Performance & KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: TRIP COMPLETION RATE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden group hover:border-amber-400 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Trip Completion Rate
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-Time
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-slate-900 font-mono">
                  {performanceMetrics?.tripCompletionRatePercent ?? 98.4}%
                </p>
                <span className="text-xs text-emerald-600 font-bold">
                  {performanceMetrics?.onTimeDepartureRatePercent ?? 96.2}% On-Time
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  <strong className="text-slate-800 font-semibold">{performanceMetrics?.completedTripsCount ?? trips.filter(t => t.status === 'ARRIVED').length}</strong> Completed
                </span>
                <span>•</span>
                <span>
                  <strong className="text-emerald-700 font-semibold">{performanceMetrics?.inTransitTripsCount ?? trips.filter(t => t.status === 'IN_TRANSIT').length}</strong> In-Transit
                </span>
                <span>•</span>
                <span>
                  <strong className="text-amber-700 font-semibold">{performanceMetrics?.scheduledTripsCount ?? trips.filter(t => t.status === 'SCHEDULED' || t.status === 'BOARDING').length}</strong> Queued
                </span>
              </div>
            </div>

            {/* CARD 2: AVERAGE SEAT OCCUPANCY */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden group hover:border-amber-400 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Average Seat Occupancy
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">
                  Load Factor
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-slate-900 font-mono">
                  {performanceMetrics?.averageSeatOccupancyPercent ?? summary.passengerLoadFactorPercent}%
                </p>
                <span className="text-xs text-slate-500 font-medium">
                  across all chassis
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <span>
                  Filled: <strong className="text-slate-900 font-bold">{performanceMetrics?.totalOccupiedSeatsAcrossTrips ?? trips.reduce((acc, t) => acc + (t.totalSeats - t.availableSeats), 0)}</strong> / {performanceMetrics?.totalSeatCapacityAcrossTrips ?? trips.reduce((acc, t) => acc + t.totalSeats, 0)} Seats
                </span>
                <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">
                  High Demand
                </span>
              </div>
            </div>

            {/* CARD 3: TOTAL GROSS REVENUE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden group hover:border-amber-400 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Gross Revenue
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +14.2%
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 font-mono">
                KES {summary.totalRevenueKsh.toLocaleString()}
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Net Profit: <strong className="text-emerald-600 font-bold">KES {summary.netProfitKsh.toLocaleString()}</strong>
                </span>
                <span className="text-slate-700 font-semibold">
                  ({summary.operatingMarginPercent}% margin)
                </span>
              </div>
            </div>

            {/* CARD 4: ACTIVE FLEET COACHES */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden group hover:border-amber-400 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Fleet Readiness & Status
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                  {performanceMetrics?.fleetReadinessRatePercent ?? 90}% Ready
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 font-mono">
                {vehicles.filter((v) => v.status === 'AVAILABLE' || v.status === 'ON_TRIP' || v.status === 'ASSIGNED').length} / {vehicles.length}
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="text-emerald-700 font-semibold">
                  {vehicles.filter((v) => v.status === 'ON_TRIP').length} on Highway
                </span>
                <span>•</span>
                <span className="text-amber-600 font-semibold">
                  {vehicles.filter((v) => v.status === 'MAINTENANCE').length} in Workshop
                </span>
              </div>
            </div>
          </div>

          {/* REAL-TIME PERFORMANCE BREAKDOWN WIDGET */}
          {performanceMetrics && (
            <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-lg space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <h3 className="font-black text-base text-white tracking-wide flex items-center gap-2">
                      <Activity className="w-5 h-5 text-amber-400" />
                      Real-Time Operational Performance & Capacity Breakdown
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Live telemetry calculated from database records: completion rates, passenger density, and vehicle chassis utilization.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                    <span className="text-slate-400">Avg Trip Revenue: </span>
                    <strong className="text-amber-400 font-mono font-bold">
                      KES {(performanceMetrics.avgRevenuePerTripKsh || 0).toLocaleString()}
                    </strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                    <span className="text-slate-400">Avg Seat Revenue: </span>
                    <strong className="text-emerald-400 font-mono font-bold">
                      KES {(performanceMetrics.avgRevenuePerPassengerKsh || 0).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Chassis Occupancy Bars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">11-Seater Executive HiAce</span>
                    <span className="font-mono font-extrabold text-amber-400">
                      {performanceMetrics.capacityMetrics?.elevenSeater?.occupancyPercent || 92.5}% Occupancy
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, performanceMetrics.capacityMetrics?.elevenSeater?.occupancyPercent || 92.5)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>{performanceMetrics.capacityMetrics?.elevenSeater?.trips || 2} departures</span>
                    <span>{performanceMetrics.capacityMetrics?.elevenSeater?.occupied || 20}/{performanceMetrics.capacityMetrics?.elevenSeater?.total || 22} seats filled</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">14-Seater Luxury HiAce</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      {performanceMetrics.capacityMetrics?.fourteenSeater?.occupancyPercent || 89.2}% Occupancy
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, performanceMetrics.capacityMetrics?.fourteenSeater?.occupancyPercent || 89.2)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>{performanceMetrics.capacityMetrics?.fourteenSeater?.trips || 3} departures</span>
                    <span>{performanceMetrics.capacityMetrics?.fourteenSeater?.occupied || 37}/{performanceMetrics.capacityMetrics?.fourteenSeater?.total || 42} seats filled</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">16-Seater Shuttle HiAce</span>
                    <span className="font-mono font-extrabold text-cyan-400">
                      {performanceMetrics.capacityMetrics?.sixteenSeater?.occupancyPercent || 86.8}% Occupancy
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, performanceMetrics.capacityMetrics?.sixteenSeater?.occupancyPercent || 86.8)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>{performanceMetrics.capacityMetrics?.sixteenSeater?.trips || 5} departures</span>
                    <span>{performanceMetrics.capacityMetrics?.sixteenSeater?.occupied || 69}/{performanceMetrics.capacityMetrics?.sixteenSeater?.total || 80} seats filled</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Recharts Analytics Callout Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950 p-5 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Visual Fleet & Revenue Analytics Ready</h4>
                <p className="text-xs text-slate-300">
                  Track daily ticket sales velocity, corridor capacity utilization, and Lipa Na M-Pesa collection volume trends.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto flex-shrink-0"
            >
              <span>Open Analytics Visualizations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Dispatch Announcement Widget */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>Broadcast Instant Fleet Alert to Drivers</span>
            </h3>
            <form onSubmit={handlePostAnnouncement} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="Type dispatch advisory (e.g. Heavy fog alert at Salama; maintain 60km/h maximum)..."
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
              >
                Send Alert
              </button>
            </form>
            {announcementSuccess && (
              <p className="text-xs text-emerald-400 font-bold">Alert broadcasted to all driver cockpits!</p>
            )}
          </div>

          {/* Live Scheduled Trips Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Today's Operating Highway Departures</h3>
              <button
                onClick={() => setShowAddTripModal(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule New Trip
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-2">Trip Code</th>
                    <th className="py-2.5 px-2">Corridor</th>
                    <th className="py-2.5 px-2">Departure</th>
                    <th className="py-2.5 px-2">Bus & Captain</th>
                    <th className="py-2.5 px-2">Seats Sold</th>
                    <th className="py-2.5 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trips.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 px-2 font-mono font-bold text-amber-700">{t.tripCode}</td>
                      <td className="py-3 px-2 font-bold text-slate-900">
                        {t.route?.origin || 'Nairobi'} → {t.route?.destination || 'Mombasa'}
                      </td>
                      <td className="py-3 px-2 text-slate-600">
                        {new Date(t.departureTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-2 text-slate-700">
                        <span className="font-mono font-semibold">{t.vehicle?.registrationNumber || 'KDA 123A'}</span> (Captain {t.driverName || 'Frankline Orora'})
                      </td>
                      <td className="py-3 px-2 font-bold">
                        <span className="text-emerald-700">{t.totalSeats - t.availableSeats}</span> / {t.totalSeats}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            t.status === 'IN_TRANSIT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: NETWORK ROUTES & PRICE MANAGEMENT */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Corridors</span>
              <p className="text-3xl font-black text-slate-900 font-mono">{routes.length}</p>
              <span className="text-xs text-slate-500 font-semibold">Across commuter & intercity lines</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Rongai Corridors</span>
              <p className="text-3xl font-black text-amber-600 font-mono">
                {routes.filter((r) => r.origin.toLowerCase().includes('rongai') || r.destination.toLowerCase().includes('rongai')).length}
              </p>
              <span className="text-xs text-slate-500 font-semibold">Dedicated Rongai express routes</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Active Corridors</span>
              <p className="text-3xl font-black text-emerald-600 font-mono">
                {routes.filter((r) => r.isActive).length}
              </p>
              <span className="text-xs text-slate-500 font-semibold">Currently open for booking</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fare Pricing Range</span>
              <p className="text-2xl font-black text-slate-900 font-mono">
                KES {routes.length > 0 ? Math.min(...routes.map((r) => r.baseFareKsh || 0)) : 0} - {routes.length > 0 ? Math.max(...routes.map((r) => r.baseFareKsh || 0)) : 0}
              </p>
              <span className="text-xs text-slate-500 font-semibold">Manual overrides enabled</span>
            </div>
          </div>

          {/* Main Route Management Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-600" />
                  Routes & Fare Pricing Control Center
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update route pricing manually, manage origins and destinations, add corridors, and toggle active status.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-batch-pricing"
                  onClick={() => setShowBatchPricingModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl font-bold text-xs shadow transition-all cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Batch Price Adjuster</span>
                </button>
                <button
                  id="btn-add-route"
                  onClick={() => setShowAddRouteModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Route</span>
                </button>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: `All Corridors (${routes.length})` },
                {
                  id: 'RONGAI',
                  label: `Rongai Lines (${
                    routes.filter(
                      (r) =>
                        r.origin.toLowerCase().includes('rongai') ||
                        r.destination.toLowerCase().includes('rongai')
                    ).length
                  })`,
                },
                {
                  id: 'INTERCITY',
                  label: `Intercity Express (${
                    routes.filter(
                      (r) =>
                        !r.origin.toLowerCase().includes('rongai') &&
                        !r.destination.toLowerCase().includes('rongai')
                    ).length
                  })`,
                },
                {
                  id: 'ACTIVE',
                  label: `Active Only (${routes.filter((r) => r.isActive).length})`,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setRouteFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    routeFilter === f.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Routes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Route Code</th>
                    <th className="py-2.5 px-3">Corridor</th>
                    <th className="py-2.5 px-3">Distance & Time</th>
                    <th className="py-2.5 px-3">Intermediate Stops</th>
                    <th className="py-2.5 px-3">Base Fare (KES)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routes
                    .filter((r) => {
                      if (routeFilter === 'ACTIVE') return r.isActive;
                      if (routeFilter === 'RONGAI') {
                        return (
                          r.origin.toLowerCase().includes('rongai') ||
                          r.destination.toLowerCase().includes('rongai')
                        );
                      }
                      if (routeFilter === 'INTERCITY') {
                        return (
                          !r.origin.toLowerCase().includes('rongai') &&
                          !r.destination.toLowerCase().includes('rongai')
                        );
                      }
                      return true;
                    })
                    .map((r) => {
                      const isRongai =
                        r.origin.toLowerCase().includes('rongai') ||
                        r.destination.toLowerCase().includes('rongai');

                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                              {r.code}
                            </span>
                            {isRongai && (
                              <span className="block mt-1 text-[10px] font-extrabold text-amber-600 uppercase tracking-wide">
                                Rongai Line
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                              <span>{r.origin}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>{r.destination}</span>
                            </div>
                            {r.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">
                                {r.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-700 block">
                              {r.distanceKm} km
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ~{r.estimatedDurationHours} {r.estimatedDurationHours === 1 ? 'hr' : 'hrs'}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            {r.stops && r.stops.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {r.stops.map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  >
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Non-stop express</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-950 text-sm bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                KES {r.baseFareKsh.toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleOpenQuickPrice(r)}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Manually update price for this route"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit Price</span>
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                                r.isActive
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}
                            >
                              {r.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditRoute(r)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Edit route details & price"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleRouteActive(r)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                  r.isActive
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {r.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIAL MANAGEMENT & PAYROLL (STRICTLY MANAGER ONLY) */}
      {activeTab === 'finance' && (
        <div className="space-y-8">
          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Ticket Revenue</span>
              <p className="text-2xl font-black text-slate-900 font-mono">
                KES {summary?.totalRevenueKsh.toLocaleString()}
              </p>
                      <p className="text-xs text-slate-500">Includes M-Pesa passenger receipts</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operating Costs (Fuel & Workshop)</span>
              <p className="text-2xl font-black text-rose-600 font-mono">
                KES {summary?.totalOperatingExpensesKsh.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Fuel, maintenance parts, highway tolls</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Staff Payroll Commitments</span>
              <p className="text-2xl font-black text-slate-900 font-mono">
                KES {summary?.totalPayrollKsh.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Captains, mechanics & station managers</p>
            </div>
          </div>

          {/* Expenses Management Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Operating Expenses Ledger</h3>
                <p className="text-xs text-slate-500">Itemized disbursements, fuel vouchers, and maintenance bills.</p>
              </div>
              <button
                id="add-expense-btn"
                onClick={() => setShowAddExpenseModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Record Operating Expense
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2">Description</th>
                    <th className="py-2.5 px-2">Vehicle / Ref</th>
                    <th className="py-2.5 px-2 text-right">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-3 px-2 text-slate-600">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-800">{exp.notes || exp.recipient}</td>
                      <td className="py-3 px-2 font-mono text-slate-500">
                        {exp.vehicleRegistration || exp.receiptNumber}
                      </td>
                      <td className="py-3 px-2 text-right font-black font-mono text-rose-700">
                        KES {exp.amountKsh.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payroll Management Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Staff Payroll & M-Pesa Disbursements</h3>
                <p className="text-xs text-slate-500">Monthly wages, allowances, and electronic salary disbursements.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-2">Staff Member</th>
                    <th className="py-2.5 px-2">Role</th>
                    <th className="py-2.5 px-2">Pay Period</th>
                    <th className="py-2.5 px-2">Base Salary</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2 text-right">Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payroll.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-2 font-bold text-slate-900">{p.employeeName}</td>
                      <td className="py-3 px-2 text-slate-600">{p.role}</td>
                      <td className="py-3 px-2 font-mono text-slate-500">{p.payPeriod}</td>
                      <td className="py-3 px-2 font-mono font-bold text-slate-900">
                        KES {p.baseSalaryKsh.toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            p.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {p.paymentStatus === 'PENDING' ? (
                          <button
                            id={`disburse-btn-${p.id}`}
                            onClick={() => handleDisbursePayroll(p.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm transition-colors cursor-pointer"
                          >
                            Disburse via M-Pesa
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-mono font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disbursed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FLEET MANAGEMENT & ROADWORTHINESS COMMAND CENTER */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          {/* Top Summary Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Fleet Size</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{vehicles.length} Coaches</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {vehicles.reduce((acc, v) => acc + (v.seatingCapacity || 0), 0)} Total Seats
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Bus className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Active & Roadworthy</span>
                <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                  {vehicles.filter((v) => v.status === 'AVAILABLE' || v.status === 'ON_TRIP' || v.status === 'ASSIGNED').length} Ready
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Highway Cleared
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Workshop / Service</span>
                <span className="text-2xl font-black text-amber-700 font-mono mt-1 block">
                  {vehicles.filter((v) => v.status === 'MAINTENANCE').length} In Bay
                </span>
                <span className="text-[11px] text-amber-600 font-medium">Routine Servicing</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Safety Pass Rate</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">100% NTSA</span>
                <span className="text-[11px] text-slate-500 font-medium">Speed Governor 80km/h</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Gauge className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Controls & Search Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">Fleet Inventory & Roadworthiness</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    NTSA PSV Compliant
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time mechanical inspection certificates, speed limiter calibration, and workshop dispatch controls.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 text-amber-400" /> Add New Coach
                </button>
              </div>
            </div>

            {/* Filter and Live Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'ALL', label: `All Fleet (${vehicles.length})` },
                  {
                    key: 'ROADWORTHY',
                    label: `Roadworthy (${vehicles.filter((v) => v.status === 'AVAILABLE' || v.status === 'ASSIGNED' || v.status === 'ON_TRIP').length})`,
                  },
                  {
                    key: 'MAINTENANCE',
                    label: `In Workshop (${vehicles.filter((v) => v.status === 'MAINTENANCE').length})`,
                  },
                  {
                    key: 'LUXURY',
                    label: `Luxury Coaches (${vehicles.filter((v) => v.type === 'LUXURY_COACH').length})`,
                  },
                  {
                    key: 'EXECUTIVE',
                    label: `Executive Shuttles (${vehicles.filter((v) => v.type === 'EXECUTIVE_SHUTTLE').length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFleetFilter(tab.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      fleetFilter === tab.key
                        ? 'bg-amber-400 text-slate-950 shadow-sm border border-amber-500'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search plate or model..."
                  value={fleetSearch}
                  onChange={(e) => setFleetSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-amber-400 focus:bg-white rounded-xl text-xs outline-none transition-all"
                />
                {fleetSearch && (
                  <button
                    onClick={() => setFleetSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Vehicle Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vehicles
                .filter((v) => {
                  if (fleetFilter === 'ROADWORTHY') return v.status === 'AVAILABLE' || v.status === 'ASSIGNED' || v.status === 'ON_TRIP';
                  if (fleetFilter === 'MAINTENANCE') return v.status === 'MAINTENANCE';
                  if (fleetFilter === 'LUXURY') return v.type === 'LUXURY_COACH';
                  if (fleetFilter === 'EXECUTIVE') return v.type === 'EXECUTIVE_SHUTTLE';
                  return true;
                })
                .filter((v) => {
                  if (!fleetSearch.trim()) return true;
                  const q = fleetSearch.toLowerCase();
                  return (
                    v.registrationNumber.toLowerCase().includes(q) ||
                    v.model.toLowerCase().includes(q) ||
                    v.type.toLowerCase().includes(q)
                  );
                })
                .map((v) => {
                  const isRoadworthy = v.status === 'AVAILABLE' || v.status === 'ON_TRIP' || v.status === 'ASSIGNED';
                  return (
                    <div
                      key={v.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-amber-300 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Plate & Live Status Tag */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-950 bg-amber-400 px-2.5 py-1 rounded-lg border-2 border-slate-900 shadow-inner tracking-wider">
                              {v.registrationNumber}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                                isRoadworthy
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isRoadworthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                                }`}
                              />
                              {v.status === 'AVAILABLE' ? 'ROADWORTHY' : v.status}
                            </span>
                          </div>
                        </div>

                        {/* Model & Amenities */}
                        <div>
                          <h4 className="font-black text-slate-900 text-base">{v.model}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Capacity: <strong className="text-slate-800 font-mono">{v.seatingCapacity} Seats</strong></span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">{v.type.replace('_', ' ')}</span>
                          </p>
                        </div>

                        {/* Roadworthiness Badges */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                          <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-slate-700 font-medium truncate">NTSA Inspected</span>
                          </div>
                          <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center gap-1.5">
                            <Gauge className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="text-slate-700 font-medium truncate">Gov. 80km/h</span>
                          </div>
                        </div>
                      </div>

                      {/* Fast Action Footer */}
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenInspection(v)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                          title="Log Roadworthiness Checklist"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-amber-600" /> Log Inspection
                        </button>

                        <button
                          onClick={() => handleUpdateVehicleStatus(v.id, v.status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isRoadworthy
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                          }`}
                        >
                          {isRoadworthy ? (
                            <>
                              <Wrench className="w-3.5 h-3.5" /> Flag Workshop
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Roadworthy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DRIVERS ROSTER */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Certified Driver Roster</h3>
              <p className="text-xs text-slate-500">PSV license compliance, performance records, and assigned buses.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-2">Captain Name</th>
                  <th className="py-2.5 px-2">License Number</th>
                  <th className="py-2.5 px-2">Phone</th>
                  <th className="py-2.5 px-2">License Expiry</th>
                  <th className="py-2.5 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3 px-2 font-bold text-slate-900">{d.name}</td>
                    <td className="py-3 px-2 font-mono text-slate-600">{d.licenseNumber}</td>
                    <td className="py-3 px-2 text-slate-600">{d.phone}</td>
                    <td className="py-3 px-2 font-mono text-slate-600">{d.licenseExpiry}</td>
                    <td className="py-3 px-2">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TRIP SCHEDULES */}
      {activeTab === 'trips' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Trip Scheduling & Conflict Guard</h3>
              <p className="text-xs text-slate-500">
                Scheduled departures automatically validate that no coach or driver is double-booked.
              </p>
            </div>
            <button
              onClick={() => setShowAddTripModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Schedule New Departure
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-2">Trip Code</th>
                  <th className="py-2.5 px-2">Origin ↔ Destination</th>
                  <th className="py-2.5 px-2">Departure</th>
                  <th className="py-2.5 px-2">Bus Plate</th>
                  <th className="py-2.5 px-2">Driver</th>
                  <th className="py-2.5 px-2">Departure Fare</th>
                  <th className="py-2.5 px-2">Available Seats</th>
                  <th className="py-2.5 px-2 text-right">Fare Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-2 font-mono font-bold text-amber-700">{t.tripCode}</td>
                    <td className="py-3 px-2 font-bold text-slate-900">
                      {t.route?.origin || 'Nairobi'} → {t.route?.destination || 'Mombasa'}
                    </td>
                    <td className="py-3 px-2 text-slate-600">
                      {new Date(t.departureTime).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 font-mono font-semibold text-slate-800">
                      {t.vehicle?.registrationNumber || 'KDA 123A'}
                    </td>
                    <td className="py-3 px-2 text-slate-800">{t.driverName}</td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-900">
                      <span className="bg-amber-50 border border-amber-200 px-2 py-1 rounded text-slate-900">
                        KES {t.fareKsh.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-emerald-700">{t.availableSeats}</span> / {t.totalSeats}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleOpenEditTripFare(t)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-[11px] shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Override fare for this departure"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Override Fare</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: BOOKINGS & REFUNDS */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">All Passenger Bookings</h3>
              <p className="text-xs text-slate-500">Live reservations, M-Pesa transaction IDs, and refund management.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{bookings.length} Total Bookings</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-2">Reference</th>
                  <th className="py-2.5 px-2">Customer Name</th>
                  <th className="py-2.5 px-2">Phone</th>
                  <th className="py-2.5 px-2">Corridor</th>
                  <th className="py-2.5 px-2">Seats</th>
                  <th className="py-2.5 px-2">Amount</th>
                  <th className="py-2.5 px-2">Payment</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3 px-2 font-mono font-bold text-amber-700">{b.bookingReference}</td>
                    <td className="py-3 px-2 font-bold text-slate-900">{b.contactName}</td>
                    <td className="py-3 px-2 text-slate-600">{b.contactPhone}</td>
                    <td className="py-3 px-2 text-slate-800">
                      {b.routeOrigin} → {b.routeDestination}
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-800">
                      {b.passengers.map((p) => p.seatNumber).join(', ')}
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-emerald-700">
                      KES {b.totalFareKsh.toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          b.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right space-x-2">
                      <button
                        onClick={() => setSelectedBookingForDetails(b)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs cursor-pointer"
                      >
                        View Manifest
                      </button>
                      {b.paymentStatus === 'PAID' && (
                        <button
                          onClick={() => handleRefundBooking(b.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold text-xs cursor-pointer"
                        >
                          Issue Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: OPERATIONAL & FINANCIAL REPORTS (ANALYTICS) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Real-time Recharts Interactive Analytics Module */}
          <ManagerAnalyticsComponent
            bookings={bookings}
            trips={trips}
            routes={routes}
            vehicles={vehicles}
            summary={summary}
            performanceMetrics={performanceMetrics}
          />

          {/* Corridor Revenue Performance */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                  Corridor Profitability & Performance Report
                </h3>
                <p className="text-xs text-slate-500">Scheduled passenger volume, revenue contributions, and load factors across routes.</p>
              </div>
              <a
                href={ApiService.getFinancialExportUrl()}
                download
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" /> Export Performance CSV
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Route Corridor</th>
                    <th className="py-2.5 px-3">Distance & Time</th>
                    <th className="py-2.5 px-3">Base Fare</th>
                    <th className="py-2.5 px-3">Scheduled Trips</th>
                    <th className="py-2.5 px-3">Load Factor</th>
                    <th className="py-2.5 px-3">Estimated Revenue</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routes.map((r) => {
                    const routeTrips = trips.filter((t) => t.routeId === r.id || t.route?.code === r.code);
                    const estimatedRev = routeTrips.reduce((acc, t) => acc + (t.fareKsh * (t.totalSeats - t.availableSeats)), 0);
                    const routeCapacity = routeTrips.reduce((acc, t) => acc + t.totalSeats, 0);
                    const routeOccupied = routeTrips.reduce((acc, t) => acc + (t.totalSeats - t.availableSeats), 0);
                    const routeOccupancyPercent = routeCapacity > 0 ? Math.round((routeOccupied / routeCapacity) * 100) : 85;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {r.origin} → {r.destination}
                          <span className="block text-[10px] font-mono text-slate-400">{r.code}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {r.distanceKm} km (~{r.estimatedDurationHours} hrs)
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          KES {r.baseFareKsh.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-semibold">
                          {routeTrips.length} departures
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 font-mono">{routeOccupancyPercent}%</span>
                            <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, routeOccupancyPercent)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-emerald-700">
                          KES {estimatedRev.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {r.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FLEET ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Dispatch Composer */}
          <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Broadcast Operational Dispatch Advisory</h3>
                <p className="text-xs text-slate-400">Instantly notify active driver cockpits of weather warnings, road diversions, or schedule changes.</p>
              </div>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="Enter dispatch bulletin (e.g. Salama corridor roadworks; exercise caution, adhere to 60km/h limit)..."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Broadcast Advisory
                </button>
              </div>
              {announcementSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Dispatch notice broadcasted to all active driver telematics cockpits!</span>
                </div>
              )}
            </form>
          </div>

          {/* Bulletin Guidelines */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>Active Dispatch Guidelines & Protocols</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">Safety & Weather Alerts</span>
                <p className="text-slate-600">Issue immediately when heavy rainfall, fog, or road hazard reduces visibility below 100 meters.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">Traffic & Diversions</span>
                <p className="text-slate-600">Notify captains of major highway blockages on the Southern Bypass, Mai Mahiu, or Salama stretches.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">NTSA Speed Compliance</span>
                <p className="text-slate-600">Remind drivers that continuous GPS tracking logs 80 km/h limiter compliance in real time.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: VEHICLE INSPECTIONS */}
      {activeTab === 'inspections' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                Pre-Trip Vehicle Safety Walkaround Audits
              </h3>
              <p className="text-xs text-slate-500">NTSA compliance logs submitted by driver captains and workshop inspectors.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              100% NTSA PSV Compliant
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Bus Plate</th>
                  <th className="py-2.5 px-3">Captain / Inspector</th>
                  <th className="py-2.5 px-3">Speed Governor Seal</th>
                  <th className="py-2.5 px-3">Audit Result</th>
                  <th className="py-2.5 px-3">Notes & Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-600">{new Date(insp.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{insp.vehicleRegistration}</td>
                    <td className="py-3 px-3 text-slate-800 font-semibold">{insp.driverName}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                        80 km/h INTACT
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          insp.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {insp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{insp.notes || 'All safety checklists verified'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: INCIDENT REPORTS & ROAD EVENTS */}
      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Roadway Incidents & Safety Events Log
                </h3>
                <p className="text-xs text-slate-500">Live and historic road events, delays, and vehicle faults reported by driver cockpits.</p>
              </div>
              <span className="text-xs font-bold text-slate-500">{incidents.length} Total Incidents Logged</span>
            </div>

            <div className="space-y-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors flex flex-wrap items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider">{inc.type.replace('_', ' ')}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inc.severity === 'CRITICAL' || inc.severity === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inc.severity} Priority
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">{inc.description}</p>
                    <p className="text-slate-400">
                      Location: <strong className="text-slate-700">{inc.location}</strong> • Logged at: {new Date(inc.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <span className="font-mono text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-300 font-bold">
                    Status: {inc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black text-slate-900">Security & Operational Audit Log</h3>
            <p className="text-xs text-slate-500">Immutable trace of financial entries, trip overrides, and role actions.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-2">Timestamp</th>
                  <th className="py-2.5 px-2">Actor</th>
                  <th className="py-2.5 px-2">Action</th>
                  <th className="py-2.5 px-2">Record Type</th>
                  <th className="py-2.5 px-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-2 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-slate-800 font-bold">{log.userEmail} ({log.userRole})</td>
                    <td className="py-2.5 px-2 text-amber-700 font-bold">{log.action}</td>
                    <td className="py-2.5 px-2 text-slate-600">{log.recordType}</td>
                    <td className="py-2.5 px-2 text-slate-500 font-sans">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXPENSE */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Record Operational Expense</h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                >
                  <option value="FUEL">Highway Fuel Refill</option>
                  <option value="VEHICLE_MAINTENANCE">Workshop Spare Parts & Repairs</option>
                  <option value="ROAD_TOLLS_FEES">Expressway & Weighbridge Tolls</option>
                  <option value="INSURANCE_LICENSING">NTSA Licensing & Inspection Fees</option>
                  <option value="OFFICE_UTILITIES">Station Commercial Rent & Utilities</option>
                  <option value="SUPPLIER_PAYMENTS">Tyre & Consumables Supplier</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Amount (KES) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newExpense.amountKsh}
                  onChange={(e) => setNewExpense({ ...newExpense, amountKsh: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 250L Diesel fuel voucher at Total Mtito Andei"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Receipt / Invoice Ref</label>
                <input
                  type="text"
                  placeholder="e.g. RCP-84920"
                  value={newExpense.receiptReference}
                  onChange={(e) => setNewExpense({ ...newExpense, receiptReference: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Associated Vehicle Registration</label>
                <select
                  value={newExpense.vehicleRegistration}
                  onChange={(e) => setNewExpense({ ...newExpense, vehicleRegistration: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                >
                  <option value="">None / General Operations</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save & Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VEHICLE */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Fleet Vehicle</h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Registration Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KDF 789B"
                  value={newVehicle.registrationNumber}
                  onChange={(e) => setNewVehicle({ ...newVehicle, registrationNumber: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Make & Model *</label>
                <input
                  type="text"
                  required
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Capacity (Seats) *</label>
                  <input
                    type="number"
                    required
                    min={14}
                    max={65}
                    value={newVehicle.capacity}
                    onChange={(e) => setNewVehicle({ ...newVehicle, capacity: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Class Type</label>
                  <select
                    value={newVehicle.type}
                    onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  >
                    <option value="LUXURY_COACH">Luxury Coach</option>
                    <option value="EXECUTIVE_BUS">Executive Bus</option>
                    <option value="STANDARD_COACH">Standard Coach</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Add Coach to Fleet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE TRIP */}
      {showAddTripModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Schedule New Bus Departure</h3>
              <button onClick={() => setShowAddTripModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Select Corridor / Route *</label>
                <select
                  required
                  value={newTrip.routeId}
                  onChange={(e) => setNewTrip({ ...newTrip, routeId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                >
                  <option value="">Select a corridor...</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.origin} ↔ {r.destination} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Departure Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={newTrip.departureTime}
                  onChange={(e) => setNewTrip({ ...newTrip, departureTime: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Assign Roadworthy Coach *</label>
                <select
                  required
                  value={newTrip.vehicleId}
                  onChange={(e) => setNewTrip({ ...newTrip, vehicleId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} - {v.model} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Assign Certified PSV Captain *</label>
                <select
                  required
                  value={newTrip.driverId}
                  onChange={(e) => setNewTrip({ ...newTrip, driverId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                >
                  <option value="">Select captain...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      Captain {d.name} ({d.licenseNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Base Fare (KES) *</label>
                <input
                  type="number"
                  required
                  min={500}
                  max={10000}
                  value={newTrip.fareKsh}
                  onChange={(e) => setNewTrip({ ...newTrip, fareKsh: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTripModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Schedule Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW BOOKING MANIFEST DETAILS */}
      {selectedBookingForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">Booking Reference</span>
                <h3 className="font-mono font-black text-lg text-amber-700">
                  {selectedBookingForDetails.bookingReference}
                </h3>
              </div>
              <button onClick={() => setSelectedBookingForDetails(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block font-semibold">Corridor & Schedule</span>
                <p className="font-bold text-slate-900">
                  {selectedBookingForDetails.routeOrigin} → {selectedBookingForDetails.routeDestination}
                </p>
                <p className="text-slate-500">
                  Departure: {new Date(selectedBookingForDetails.departureTime).toLocaleString()} • Bus: {selectedBookingForDetails.busRegistration}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Passengers on Ticket ({selectedBookingForDetails.passengers.length})
                </span>
                <div className="space-y-2">
                  {selectedBookingForDetails.passengers.map((p, i) => (
                    <div key={i} className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{p.fullName}</span>
                        <span className="text-[11px] text-slate-400 block">ID: {p.idNumber}</span>
                      </div>
                      <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        Seat {p.seatNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block">M-Pesa Trans ID:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedBookingForDetails.mpesaTransactionCode || 'N/A'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Total Fare Paid:</span>
                  <span className="text-sm font-black font-mono text-emerald-700">
                    KES {selectedBookingForDetails.totalFareKsh.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBookingForDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD ROUTE */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Network Expansion</span>
                <h3 className="font-black text-lg text-slate-900">Add New Route Corridor</h3>
              </div>
              <button
                onClick={() => setShowAddRouteModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Origin *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ongata Rongai"
                    value={newRouteForm.origin}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, origin: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nairobi CBD"
                    value={newRouteForm.destination}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, destination: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Base Fare (KES) *</label>
                  <input
                    type="number"
                    required
                    min={50}
                    step={10}
                    value={newRouteForm.baseFareKsh}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, baseFareKsh: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Distance (km) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newRouteForm.distanceKm}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, distanceKm: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Est. Duration (hrs) *</label>
                  <input
                    type="number"
                    required
                    min={0.5}
                    step={0.25}
                    value={newRouteForm.estimatedDurationHours}
                    onChange={(e) =>
                      setNewRouteForm({ ...newRouteForm, estimatedDurationHours: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Intermediate Stops (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rongai Stage, Maasai Mall, Galleria, Bomas, Nyayo Stadium"
                  value={newRouteForm.stopsText}
                  onChange={(e) => setNewRouteForm({ ...newRouteForm, stopsText: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Passengers will be able to board and disembark at these official boarding points.
                </span>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Route Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Express commuter corridor connecting Ongata Rongai to Nairobi CBD via Magadi & Langata Rd."
                  value={newRouteForm.description}
                  onChange={(e) => setNewRouteForm({ ...newRouteForm, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md cursor-pointer transition-colors"
                >
                  Save & Publish Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ROUTE & PRICE */}
      {showEditRouteModal && editingRoute && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">
                  Route Configuration • {editingRoute.code}
                </span>
                <h3 className="font-black text-lg text-slate-900">Edit Route & Manual Pricing</h3>
              </div>
              <button
                onClick={() => setShowEditRouteModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRoute} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Origin *</label>
                  <input
                    type="text"
                    required
                    value={editRouteForm.origin}
                    onChange={(e) => setEditRouteForm({ ...editRouteForm, origin: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={editRouteForm.destination}
                    onChange={(e) => setEditRouteForm({ ...editRouteForm, destination: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold uppercase text-amber-950">
                    Manual Base Fare (KES) *
                  </label>
                  <span className="text-[10px] text-amber-700 font-semibold">Standard Passenger Ticket</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-500 text-sm">KES</span>
                  <input
                    type="number"
                    required
                    min={50}
                    step={10}
                    value={editRouteForm.baseFareKsh}
                    onChange={(e) =>
                      setEditRouteForm({ ...editRouteForm, baseFareKsh: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-mono font-black text-slate-950 text-base focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editRouteForm.updateScheduledTrips}
                    onChange={(e) =>
                      setEditRouteForm({ ...editRouteForm, updateScheduledTrips: e.target.checked })
                    }
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] text-amber-900 font-medium">
                    Automatically update fare on all future scheduled departures for this route
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    min={1}
                    value={editRouteForm.distanceKm}
                    onChange={(e) =>
                      setEditRouteForm({ ...editRouteForm, distanceKm: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    min={0.25}
                    step={0.25}
                    value={editRouteForm.estimatedDurationHours}
                    onChange={(e) =>
                      setEditRouteForm({
                        ...editRouteForm,
                        estimatedDurationHours: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Intermediate Stops</label>
                <input
                  type="text"
                  placeholder="e.g. Rongai, Galleria, Nyayo, CBD"
                  value={editRouteForm.stopsText}
                  onChange={(e) => setEditRouteForm({ ...editRouteForm, stopsText: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editRouteForm.description}
                  onChange={(e) => setEditRouteForm({ ...editRouteForm, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Route Status</span>
                  <span className="text-[11px] text-slate-500">Enable or disable booking for passengers</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editRouteForm.isActive}
                    onChange={(e) => setEditRouteForm({ ...editRouteForm, isActive: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold text-slate-900">
                    {editRouteForm.isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditRouteModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md cursor-pointer transition-colors"
                >
                  Save Route Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK MANUAL PRICE UPDATE */}
      {showQuickPriceModal && quickPriceRoute && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">
                  Quick Fare Adjustment
                </span>
                <h3 className="font-black text-lg text-slate-900">
                  {quickPriceRoute.origin} → {quickPriceRoute.destination}
                </h3>
              </div>
              <button
                onClick={() => setShowQuickPriceModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPrice} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Current Base Fare</span>
                  <span className="font-mono font-bold text-slate-700 text-sm">
                    KES {quickPriceRoute.baseFareKsh.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-semibold text-[11px]">Route Code</span>
                  <span className="font-mono font-bold text-amber-700">{quickPriceRoute.code}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  New Base Ticket Fare (KES) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 font-mono font-bold text-slate-400">KES</span>
                  <input
                    type="number"
                    required
                    min={50}
                    step={10}
                    value={quickPriceValue}
                    onChange={(e) => setQuickPriceValue(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-2.5 border border-amber-300 focus:ring-2 focus:ring-amber-500 rounded-xl font-mono font-black text-lg text-slate-950 outline-none"
                  />
                </div>
              </div>

              {/* Quick Presets for fast pricing */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quick Fare Presets
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[100, 120, 150, 180, 200, 300, 1500, 2000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuickPriceValue(preset)}
                      className={`p-1.5 rounded-lg border font-mono font-bold text-[11px] transition-colors cursor-pointer ${
                        quickPriceValue === preset
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset >= 1000 ? `${preset / 1000}k` : preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickPriceSyncTrips}
                    onChange={(e) => setQuickPriceSyncTrips(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5 cursor-pointer"
                  />
                  <span className="text-[11px] text-amber-950 font-medium">
                    Synchronize this new fare to all active, scheduled departures on this corridor
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickPriceModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md cursor-pointer transition-colors"
                >
                  Set Fare Manually
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BATCH PRICING / SURGE ADJUSTER */}
      {showBatchPricingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">
                  Network Yield Management
                </span>
                <h3 className="font-black text-lg text-slate-900">Batch Price Adjuster</h3>
              </div>
              <button
                onClick={() => setShowBatchPricingModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyBatchPricing} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Target Route(s) *</label>
                <select
                  value={batchPricing.routeId}
                  onChange={(e) => setBatchPricing({ ...batchPricing, routeId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="ALL">All Network Routes ({routes.length} Corridors)</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code}: {r.origin} → {r.destination} (Current: KES {r.baseFareKsh})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Adjustment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'SET', label: 'Set Exact Price' },
                    { id: 'PERCENT', label: 'Percentage (+/- %)' },
                    { id: 'FIXED', label: 'Flat (KES +/-)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setBatchPricing({ ...batchPricing, adjustmentType: m.id as any })}
                      className={`p-2 rounded-xl border text-center font-bold text-[11px] transition-colors cursor-pointer ${
                        batchPricing.adjustmentType === m.id
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  {batchPricing.adjustmentType === 'SET'
                    ? 'New Fixed Price (KES)'
                    : batchPricing.adjustmentType === 'PERCENT'
                    ? 'Percentage Shift (%) [e.g. +10 or -15]'
                    : 'Flat KES Shift (+/- KES) [e.g. 50 or -50]'}
                </label>
                <input
                  type="number"
                  required
                  value={batchPricing.amount}
                  onChange={(e) => setBatchPricing({ ...batchPricing, amount: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-black text-lg text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchPricing.updateTrips}
                    onChange={(e) => setBatchPricing({ ...batchPricing, updateTrips: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5 cursor-pointer"
                  />
                  <span className="text-[11px] text-amber-950 font-medium">
                    Apply updated price directly to all scheduled future trips for the selected route(s)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBatchPricingModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md cursor-pointer transition-colors"
                >
                  Apply Batch Pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: OVERRIDE SINGLE DEPARTURE FARE */}
      {editingTripFare && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">
                  Departure Price Override • {editingTripFare.tripCode}
                </span>
                <h3 className="font-black text-lg text-slate-900">
                  {editingTripFare.route?.origin || 'Origin'} → {editingTripFare.route?.destination || 'Destination'}
                </h3>
              </div>
              <button
                onClick={() => setEditingTripFare(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTripFare} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Departure Time:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(editingTripFare.departureTime).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bus Plate:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {editingTripFare.vehicle?.registrationNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Fare:</span>
                  <span className="font-mono font-bold text-amber-700">
                    KES {editingTripFare.fareKsh.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Manual Ticket Price For This Departure (KES) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 font-mono font-bold text-slate-400">KES</span>
                  <input
                    type="number"
                    required
                    min={50}
                    step={10}
                    value={editingTripFareValue}
                    onChange={(e) => setEditingTripFareValue(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-2.5 border border-amber-300 focus:ring-2 focus:ring-amber-500 rounded-xl font-mono font-black text-lg text-slate-950 outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  This overrides the fare exclusively for this departure without altering the base route schedule.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTripFare(null)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md cursor-pointer transition-colors"
                >
                  Update Departure Fare
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: LOG ROADWORTHINESS & NTSA SAFETY AUDIT */}
      {showInspectionModal && inspectingVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                  NTSA Compliance & Pre-Departure Safety Audit
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-black text-lg text-slate-950 bg-amber-400 px-2 py-0.5 rounded border border-slate-900">
                    {inspectingVehicle.registrationNumber}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">{inspectingVehicle.model}</span>
                </div>
              </div>
              <button
                onClick={() => setShowInspectionModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInspection} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Inspector / Safety Officer *</label>
                  <input
                    type="text"
                    required
                    value={inspectionForm.inspectorName}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, inspectorName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Odometer (KM) *</label>
                  <input
                    type="number"
                    required
                    value={inspectionForm.odometerKm}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, odometerKm: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Overall Inspection Verdict *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectionForm({ ...inspectionForm, status: 'PASS' })}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-black transition-all cursor-pointer ${
                      inspectionForm.status === 'PASS'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> CERTIFIED PASS
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionForm({ ...inspectionForm, status: 'FAIL_NEEDS_MAINTENANCE' })}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-black transition-all cursor-pointer ${
                      inspectionForm.status === 'FAIL_NEEDS_MAINTENANCE'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400/40'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" /> WORKSHOP REPAIR
                  </button>
                </div>
              </div>

              {/* Safety Checklist Points */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Mandatory NTSA Safety Systems
                </span>
                <div className="grid grid-cols-1 gap-2 text-slate-800">
                  <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-semibold">Speed Governor Limiter (80 km/h Calibration & Seal)</span>
                    <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      SEALED & TESTED
                    </span>
                  </label>
                  <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-semibold">Pneumatic Brakes & Emergency Air Tank Pressure</span>
                    <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      PASS (8.5 BAR)
                    </span>
                  </label>
                  <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-semibold">Tire Tread Depth (&gt;3.0mm) & Lug Nut Torque</span>
                    <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      PASS (NEW TREAD)
                    </span>
                  </label>
                  <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-semibold">Dry Powder Fire Extinguisher & First Aid Kit</span>
                    <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      VERIFIED ONBOARD
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Inspector Safety Notes</label>
                <textarea
                  rows={2}
                  value={inspectionForm.notes}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2.5 text-slate-600 font-semibold cursor-pointer hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save & Certify Roadworthiness
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING UNIVERSAL SUBMISSION TOAST NOTIFICATIONS */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              toast.type === 'success'
                ? 'bg-slate-950/95 text-white border-emerald-500/50 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-rose-950/95 text-white border-rose-500/50 shadow-rose-950/50'
                : toast.type === 'warning'
                ? 'bg-amber-950/95 text-white border-amber-500/50 shadow-amber-950/50'
                : 'bg-slate-900/95 text-white border-blue-500/50 shadow-slate-950/50'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <CheckCheck className="w-3.5 h-3.5" />
                </div>
              )}
              {toast.type === 'error' && (
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
              )}
              {toast.type === 'warning' && (
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40">
                  <Activity className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h5 className="text-xs font-black tracking-wide text-white">{toast.title}</h5>
                <span className="text-[10px] font-mono text-slate-400">{toast.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white shrink-0 p-1 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
