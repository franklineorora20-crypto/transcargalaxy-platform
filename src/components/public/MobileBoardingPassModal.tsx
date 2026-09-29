import React, { useState, useEffect } from 'react';
import { Booking } from '../../types';
import QRCode from 'qrcode';
import {
  X,
  Bus,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sun,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  generateTicketPDF,
  downloadTicketQrPng,
  getTicketId,
  getTicketVerificationUrl,
} from '../../utils/pdfTicket';
import { ApiService } from '../../services/api';

interface MobileBoardingPassModalProps {
  booking: Booking;
  onClose: () => void;
}

export const MobileBoardingPassModal: React.FC<MobileBoardingPassModalProps> = ({
  booking: initialBooking,
  onClose,
}) => {
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [selectedPaxIndex, setSelectedPaxIndex] = useState(0);
  const [highBrightness, setHighBrightness] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activePassenger =
    booking.passengers[selectedPaxIndex] || booking.passengers[0];
  const ticketNumber = getTicketId(booking, activePassenger);
  const qrPayload = getTicketVerificationUrl(booking, activePassenger);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 3,
      width: 480,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [qrPayload]);

  useEffect(() => {
    const checkStatus = async () => {
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
        // Ignore background poll error
      }
    };

    const interval = setInterval(checkStatus, 8000);
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

  const allBoarded = booking.passengers.every((p) => p.hasBoarded);
  const anyBoarded = booking.passengers.some((p) => p.hasBoarded);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Top Wallet Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b-4 border-[#F27D26]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F27D26] flex items-center justify-center text-white shadow-md">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight block leading-none">
                TRANSCAR RONGAI LTD.
              </span>
              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">
                MOBILE BOARDING PASS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setHighBrightness(!highBrightness)}
              title="Toggle Scanner Brightness"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                highBrightness
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Pass Content */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Live Boarding Status Pill */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                allBoarded
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : anyBoarded
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : booking.paymentStatus === 'PAID'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {allBoarded
                ? 'BOARDED & VERIFIED'
                : anyBoarded
                  ? 'PARTIALLY BOARDED'
                  : booking.paymentStatus === 'PAID'
                    ? 'READY FOR BOARDING'
                    : 'PAYMENT PENDING'}
            </span>

            <button
              onClick={handleManualRefresh}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <RefreshCw
                className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#F27D26]' : ''}`}
              />
              Sync
            </button>
          </div>

          {booking.passengers.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {booking.passengers.map((pax, idx) => (
                <button
                  key={pax.seatNumber}
                  type="button"
                  onClick={() => setSelectedPaxIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer ${
                    idx === selectedPaxIndex
                      ? 'bg-slate-900 text-amber-400 border-slate-900'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  Seat {pax.seatNumber} ({getTicketId(booking, pax)})
                </button>
              ))}
            </div>
          )}

          {/* Route Display */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Origin
                </span>
                <span className="text-lg font-black text-slate-900">
                  {booking.routeOrigin}
                </span>
              </div>
              <div className="flex flex-col items-center px-2">
                <span className="text-[9px] font-mono text-[#F27D26] font-bold">
                  {booking.tripCode}
                </span>
                <div className="w-12 h-0.5 bg-slate-300 my-1 relative">
                  <div className="w-2 h-2 rounded-full bg-[#F27D26] absolute -top-[3px] left-1/2 -translate-x-1/2" />
                </div>
                <span className="text-[9px] text-slate-400 font-semibold">
                  DIRECT
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Destination
                </span>
                <span className="text-lg font-black text-slate-900">
                  {booking.routeDestination}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-200/70 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#F27D26]" />
                {new Date(booking.departureTime).toLocaleDateString('en-KE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="flex items-center justify-end gap-1.5 text-slate-700 font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#F27D26]" />
                {new Date(booking.departureTime).toLocaleTimeString('en-KE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* High-Contrast QR Scanner Target */}
          <div
            className={`rounded-3xl p-5 flex flex-col items-center justify-center border-2 transition-all ${
              highBrightness
                ? 'bg-white border-[#F27D26] shadow-[0_0_30px_rgba(242,125,38,0.18)]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Ticket QR Code ${ticketNumber}`}
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
            <span className="mt-2 font-mono text-base font-black text-slate-900 tracking-widest">
              {ticketNumber}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Booking Ref: {booking.bookingReference} • Hold steady for Driver
              QR Scanner
            </span>
          </div>

          {/* Seat & Vehicle Strip */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-[9px] font-bold uppercase text-slate-400 block">
                SEAT
              </span>
              <span className="text-sm font-black font-mono text-[#F27D26]">
                {activePassenger?.seatNumber ||
                  booking.passengers.map((p) => p.seatNumber).join(', ')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-[9px] font-bold uppercase text-slate-400 block">
                VEHICLE
              </span>
              <span className="text-xs font-black font-mono text-slate-900">
                {booking.busRegistration}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-[9px] font-bold uppercase text-slate-400 block">
                FARE ({booking.paymentStatus})
              </span>
              <span className="text-xs font-black text-emerald-700">
                KES {(activePassenger?.fareKsh || booking.totalFareKsh).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Passenger Manifest List */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Passenger Check-In Status
            </span>
            {booking.passengers.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">
                    {p.fullName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Seat {p.seatNumber} • {getTicketId(booking, p)}
                  </span>
                </div>
                {p.hasBoarded ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    ✓ Boarded{' '}
                    {p.boardedAt
                      ? new Date(p.boardedAt).toLocaleTimeString('en-KE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                    Awaiting Scan
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <button
            onClick={() => downloadTicketQrPng(booking, selectedPaxIndex)}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            QR PNG
          </button>
          <button
            onClick={() => generateTicketPDF(booking, selectedPaxIndex)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#F27D26] hover:bg-[#d96a1b] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Save PDF Ticket
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
