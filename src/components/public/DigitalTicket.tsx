import React, { useState, useEffect } from 'react';
import { Booking } from '../../types';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Printer,
  Bus,
  MapPin,
  Calendar,
  Clock,
  User,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  Download,
  Smartphone,
  RefreshCw,
  Ticket,
  Copy,
  Check,
} from 'lucide-react';
import {
  generateTicketPDF,
  downloadTicketQrPng,
} from '../../utils/pdfTicket';
import {
  getTicketId,
  getTicketQrToken,
  getTicketVerificationUrl,
  formatTravelDateLong,
  formatDepartureTime,
  formatTicketIssueDate,
  formatTicketRouteDisplay,
  involvesRongaiTerminal,
  RONGAI_TERMINAL_SUMMARY,
  getBoardingTerminalLabel,
  getBookingBoardingSummary,
} from '../../utils/ticketHelpers';
import { MobileBoardingPassModal } from './MobileBoardingPassModal';
import { ApiService } from '../../services/api';

interface DigitalTicketProps {
  booking: Booking;
  onBackHome?: () => void;
  onDone?: () => void;
  onTrackBus?: (ref: string) => void;
  onOpenDriverPortal?: (verifyToken?: string, tripId?: string) => void;
}

export const DigitalTicket: React.FC<DigitalTicketProps> = ({
  booking: initialBooking,
  onBackHome,
  onDone,
  onTrackBus,
  onOpenDriverPortal,
}) => {
  const handleBackAction = () => {
    if (onBackHome) onBackHome();
    else if (onDone) onDone();
  };
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [selectedPaxIndex, setSelectedPaxIndex] = useState(0);
  const [showMobilePass, setShowMobilePass] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const activePassenger =
    booking.passengers[selectedPaxIndex] || booking.passengers[0];
  const ticketId = getTicketId(booking, activePassenger);
  const qrToken = getTicketQrToken(booking, activePassenger);
  const qrVerificationUrl = getTicketVerificationUrl(booking, activePassenger);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(qrVerificationUrl, {
      errorCorrectionLevel: 'M',
      margin: 3,
      width: 480,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [qrVerificationUrl]);

  // Live poll boarding status every 10 seconds
  useEffect(() => {
    const checkBoardingStatus = async () => {
      try {
        const status = await ApiService.getTicketStatus(
          booking.bookingReference,
        );
        if (status && status.passengers) {
          setBooking((prev) => ({
            ...prev,
            ticketId: status.ticketId || prev.ticketId,
            qrToken: status.qrToken || prev.qrToken,
            bookingStatus: status.bookingStatus || prev.bookingStatus,
            paymentStatus: status.paymentStatus || prev.paymentStatus,
            ticketStatus: status.ticketStatus || prev.ticketStatus,
            boardingStatus: status.boardingStatus || prev.boardingStatus,
            verifiedAt: status.verifiedAt || prev.verifiedAt,
            verifiedBy: status.verifiedBy || prev.verifiedBy,
            verifiedByName: status.verifiedByName || prev.verifiedByName,
            passengers: prev.passengers.map((p) => {
              const updated = status.passengers.find(
                (sp: any) => sp.seatNumber === p.seatNumber,
              );
              return updated
                ? {
                    ...p,
                    hasBoarded: updated.hasBoarded,
                    boardedAt: updated.boardedAt,
                    ticketId: updated.ticketId || p.ticketId,
                    qrToken: updated.qrToken || p.qrToken,
                    ticketStatus: updated.ticketStatus || p.ticketStatus,
                    boardingStatus: updated.boardingStatus || p.boardingStatus,
                    verifiedAt: updated.verifiedAt || p.verifiedAt,
                    verifiedBy: updated.verifiedBy || p.verifiedBy,
                    verifiedByName: updated.verifiedByName || p.verifiedByName,
                  }
                : p;
            }),
          }));
        }
      } catch {
        // Ignore background poll error
      }
    };

    const interval = setInterval(checkBoardingStatus, 10000);
    return () => clearInterval(interval);
  }, [booking.bookingReference]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const status = await ApiService.getTicketStatus(booking.bookingReference);
      if (status && status.passengers) {
        setBooking((prev) => ({
          ...prev,
          ticketId: status.ticketId || prev.ticketId,
          qrToken: status.qrToken || prev.qrToken,
          bookingStatus: status.bookingStatus || prev.bookingStatus,
          paymentStatus: status.paymentStatus || prev.paymentStatus,
          ticketStatus: status.ticketStatus || prev.ticketStatus,
          boardingStatus: status.boardingStatus || prev.boardingStatus,
          passengers: prev.passengers.map((p) => {
            const updated = status.passengers.find(
              (sp: any) => sp.seatNumber === p.seatNumber,
            );
            return updated
              ? {
                  ...p,
                  hasBoarded: updated.hasBoarded,
                  boardedAt: updated.boardedAt,
                  ticketId: updated.ticketId || p.ticketId,
                  qrToken: updated.qrToken || p.qrToken,
                }
              : p;
          }),
        }));
      }
    } catch {
      // Ignore error
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleCopyTicketId = () => {
    navigator.clipboard?.writeText(ticketId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    await generateTicketPDF(booking, selectedPaxIndex);
  };

  const travelDateFormatted = formatTravelDateLong(booking.departureTime);

  const departureTimeFormatted = formatDepartureTime(booking.departureTime);

  const { anyBoarded, allBoarded } = getBookingBoardingSummary(booking.passengers);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
        <button
          onClick={handleBackAction}
          className="inline-flex items-center gap-2 text-sm font-black text-black hover:text-amber-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {onTrackBus && (
            <button
              onClick={() => onTrackBus(booking.bookingReference)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs border border-neutral-300 transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              Track Bus
            </button>
          )}
          <button
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs border border-neutral-300 transition-all cursor-pointer"
            title="Refresh Live Boarding Status"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Sync Status
          </button>

          <button
            onClick={() => setShowMobilePass(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-amber-400 font-black text-xs shadow-md transition-all cursor-pointer border border-amber-400"
          >
            <Smartphone className="w-4 h-4" />
            Mobile Boarding Pass
          </button>

          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs shadow-md transition-all cursor-pointer border-2 border-black"
          >
            <Download className="w-4 h-4" />
            Download PDF Ticket
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs border-2 border-black transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Ticket
          </button>

          {onOpenDriverPortal && (
            <button
              onClick={() => onOpenDriverPortal(qrVerificationUrl, booking.tripId)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs border-2 border-black shadow-md transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify on Driver Page
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Banner */}
      <div
        className={`mb-6 p-4 rounded-2xl border-2 flex items-center gap-3 print:hidden ${
          allBoarded
            ? 'bg-emerald-950 text-white border-emerald-400'
            : booking.paymentStatus === 'PAID'
              ? 'bg-amber-50 border-amber-400 text-black'
              : 'bg-red-50 border-red-400 text-red-950'
        }`}
      >
        <CheckCircle2
          className={`w-6 h-6 shrink-0 ${
            allBoarded
              ? 'text-emerald-400'
              : booking.paymentStatus === 'PAID'
                ? 'text-black'
                : 'text-red-600'
          }`}
        />
        <div className="flex-1">
          <h3 className="text-sm font-black">
            {allBoarded
              ? 'Boarding Verified — Have a Safe Journey with TransCar Rongai Ltd.!'
              : anyBoarded
                ? 'Partial Boarding Completed — Remaining Passengers Ready for Check-in'
                : booking.paymentStatus === 'PAID'
                  ? 'Official TransCar Rongai E-Ticket Issued & Ready for Driver Verification'
                  : 'Booking Created — Payment Verification Pending'}
          </h3>
          <p
            className={`text-xs mt-0.5 font-medium ${
              allBoarded ? 'text-emerald-200' : 'text-neutral-700'
            }`}
          >
            Ticket ID:{' '}
            <strong className="font-mono font-black">{ticketId}</strong> •
            Booking Ref:{' '}
            <strong className="font-mono font-black">
              {booking.bookingReference}
            </strong>
            . Present this QR code or Ticket ID to the driver at boarding.
          </p>
        </div>
      </div>

      {/* Multi-passenger selector if more than 1 seat booked */}
      {booking.passengers.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-600">
            Select Passenger Ticket:
          </span>
          {booking.passengers.map((pax, idx) => {
            const paxTicketId = getTicketId(booking, pax);
            const isSelected = idx === selectedPaxIndex;
            return (
              <button
                key={pax.seatNumber}
                type="button"
                onClick={() => setSelectedPaxIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-black text-amber-400 border-amber-400 shadow-sm'
                    : 'bg-white text-black border-neutral-300 hover:border-black'
                }`}
              >
                Seat {pax.seatNumber} • {pax.fullName} ({paxTicketId})
              </button>
            );
          })}
        </div>
      )}

      {/* Official Ticket Card */}
      <div className="bg-white rounded-3xl border-2 border-black shadow-xl overflow-hidden print:shadow-none print:border">
        {/* Ticket Header */}
        <div className="bg-black text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-amber-400">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center text-black shadow-lg shadow-amber-400/20 border-2 border-white">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white">
                  TRANSCAR RONGAI LTD.
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400 text-black border border-white">
                  OFFICIAL E-TICKET
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 font-medium">
                Ongata Rongai • Nairobi • Kisii • Rongo • Awendo • Migori • Sirare
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 block font-bold">
              UNIQUE TICKET ID
            </span>
            <div className="inline-flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black font-mono text-amber-400 tracking-wider">
                {ticketId}
              </span>
              <button
                type="button"
                onClick={handleCopyTicketId}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-colors print:hidden cursor-pointer"
                title="Copy Ticket ID"
              >
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="mt-1 flex items-center sm:justify-end gap-1.5">
              <span className="text-[11px] font-mono text-neutral-300">
                Booking ID: <strong>{booking.bookingReference}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x-2 divide-dashed divide-neutral-300">
          {/* Left 2 Columns: Route, Schedule & Passenger Manifest */}
          <div className="lg:col-span-2 p-6 sm:p-8 space-y-6">
            {/* Route & Schedule Banner */}
            <div className="p-5 rounded-2xl bg-neutral-50 border-2 border-neutral-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-600" /> ROUTE
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-black mt-0.5">
                    {formatTicketRouteDisplay(booking.routeOrigin, booking.routeDestination, '→')}
                  </p>
                  {involvesRongaiTerminal(booking.routeOrigin, booking.routeDestination) && (
                    <p className="text-[11px] font-bold text-neutral-600 mt-0.5">
                      {RONGAI_TERMINAL_SUMMARY}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase border ${
                      booking.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                        : 'bg-amber-100 text-amber-900 border-amber-400'
                    }`}
                  >
                    PAYMENT: {booking.paymentStatus}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-black text-amber-400 border border-black">
                    STATUS: {booking.bookingStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-200">
                <div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-black" /> Travel Date
                  </span>
                  <span className="text-xs font-black text-black mt-0.5 block">
                    {travelDateFormatted}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-black" /> Departure Time
                  </span>
                  <span className="text-xs font-black text-black mt-0.5 block">
                    {departureTimeFormatted}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                    <Bus className="w-3 h-3 text-black" /> Vehicle Reg
                  </span>
                  <span className="text-xs font-black font-mono text-black mt-0.5 block">
                    {booking.busRegistration}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                    <Ticket className="w-3 h-3 text-black" /> Seat Number
                  </span>
                  <span className="text-sm font-black font-mono text-amber-600 mt-0.5 block">
                    {activePassenger
                      ? activePassenger.seatNumber
                      : booking.passengers.map((p) => p.seatNumber).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Passenger Card */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-black" /> Passenger & Ticket
                Details ({booking.passengers.length})
              </h4>

              <div className="border-2 border-neutral-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 text-[10px] font-black uppercase tracking-wider text-neutral-600 border-b-2 border-neutral-200">
                      <th className="py-2.5 px-4">Passenger Name</th>
                      <th className="py-2.5 px-4">Ticket ID</th>
                      <th className="py-2.5 px-4">Seat</th>
                      <th className="py-2.5 px-4">Boarding Status</th>
                      <th className="py-2.5 px-4 text-right">Fare</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-xs">
                    {booking.passengers.map((p, i) => {
                      const paxTicketId = getTicketId(booking, p);
                      return (
                        <tr
                          key={i}
                          onClick={() => setSelectedPaxIndex(i)}
                          className={`hover:bg-neutral-50 cursor-pointer ${
                            i === selectedPaxIndex ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-black text-black block">
                              {p.fullName}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">
                              Phone: {booking.contactPhone}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-black">
                            {paxTicketId}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-black font-mono text-xs bg-amber-400 text-black border border-black">
                              {p.seatNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {p.hasBoarded ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-black text-[10px] border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                BOARDED
                                {p.boardedAt
                                  ? ` (${formatDepartureTime(p.boardedAt)})`
                                  : ''}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                                READY FOR BOARDING
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-black">
                            KES {p.fareKsh.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment & Contact Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-neutral-50 border-2 border-neutral-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-neutral-500 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-black" /> Payment Summary
                </span>
                <p className="text-sm font-black text-black">
                  Total Fare: KES {booking.totalFareKsh.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-600 font-medium">
                  Method: {booking.paymentMethod} • Status:{' '}
                  <strong className="text-black">{booking.paymentStatus}</strong>
                </p>
                {booking.mpesaReceiptNumber && (
                  <p className="text-xs font-mono font-bold text-black">
                    M-Pesa Receipt: {booking.mpesaReceiptNumber}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border-2 border-neutral-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-neutral-500">
                  Passenger Contact Info
                </span>
                <p className="text-sm font-black text-black">
                  {activePassenger?.fullName || booking.contactName}
                </p>
                <p className="text-xs text-neutral-600 font-medium">
                  {booking.contactPhone}
                </p>
                <p className="text-[11px] text-neutral-500 font-mono truncate">
                  Trip Code: {booking.tripCode}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: High-Contrast Secure QR Code & Verification Stub */}
          <div className="p-6 sm:p-8 bg-neutral-50 flex flex-col items-center justify-between text-center">
            <div className="w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-3">
                SECURE DRIVER QR VERIFICATION
              </span>

              <div className="bg-white p-5 rounded-2xl border-2 border-black shadow-sm inline-block mx-auto">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Ticket QR Code ${ticketId}`}
                    className="w-44 h-44 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-neutral-400">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-xs font-mono font-black text-black tracking-wider">
                  {ticketId}
                </p>
                <p className="text-[11px] text-neutral-600 font-medium max-w-[220px] mx-auto">
                  Driver scans this cryptographic QR code or searches{' '}
                  <strong className="font-mono text-black">{ticketId}</strong> on
                  the Driver Page to verify boarding.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 print:hidden">
                  <button
                    type="button"
                    onClick={() => downloadTicketQrPng(booking, selectedPaxIndex)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-[11px] border border-black shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-600" />
                    Save QR PNG
                  </button>
                  {onOpenDriverPortal && (
                    <button
                      type="button"
                      onClick={() => onOpenDriverPortal(qrVerificationUrl, booking.tripId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-amber-400 font-black text-[11px] border border-black shadow-xs transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Scan in Driver App
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full pt-6 mt-6 border-t-2 border-neutral-200 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-black">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Cryptographically Secured Pass</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed font-medium">
                • Report at the terminal ({getBoardingTerminalLabel(booking.routeOrigin)}) 30 minutes before departure.
                <br />• QR token:{' '}
                <span className="font-mono text-[10px]">
                  {qrToken.slice(0, 18)}...
                </span>
                <br />• Valid for one-time boarding on assigned trip only.
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Footer */}
        <div className="bg-neutral-900 px-6 py-3.5 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-400 font-medium">
          <span>
            Issued on: {formatTicketIssueDate(booking.createdAt)}
          </span>
          <span className="text-amber-400 font-bold">
            TRANSCAR RONGAI LTD. • 24/7 Dispatch Hotline: +254 724 626199 / +254
            717 747626
          </span>
        </div>
      </div>

      {/* Mobile Boarding Pass Modal */}
      {showMobilePass && (
        <MobileBoardingPassModal
          booking={booking}
          onClose={() => setShowMobilePass(false)}
        />
      )}
    </div>
  );
};
