import React from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Navigation,
  Clock,
  MapPin,
  Bus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode as QrIcon,
  Smartphone,
  Maximize2,
  FileDown,
  Loader2,
  Share2,
  Check,
} from 'lucide-react';
import { Booking } from '../../types';
import { MobileBoardingPassModal } from './MobileBoardingPassModal';
import { generateTicketPdf } from '../../utils/pdfTicket';
import { useToast } from '../common/Toast';

interface DigitalTicketProps {
  booking: Booking;
  onTrackBus?: (bookingRef: string) => void;
  onDone?: () => void;
  onOpenDriverPortal?: () => void;
}

export const DigitalTicket: React.FC<DigitalTicketProps> = ({
  booking,
  onTrackBus,
  onDone,
  onOpenDriverPortal,
}) => {
  const toast = useToast();
  const [qrDataUrl, setQrDataUrl] = React.useState<string>('');
  const [copied, setCopied] = React.useState(false);
  const [showMobilePassModal, setShowMobilePassModal] = React.useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);

  React.useEffect(() => {
    // Standard verified boarding token payload
    const qrPayload = JSON.stringify({
      ref: booking.bookingReference,
      trip: booking.tripCode,
      seats: booking.passengers.map((p) => p.seatNumber).join(','),
      origin: booking.routeOrigin,
      destination: booking.routeDestination,
      bus: booking.busRegistration,
      status: booking.paymentStatus,
      paybill: '400200',
      acc: '867845',
      txn: booking.mpesaTransactionCode,
    });

    QRCode.toDataURL(qrPayload, {
      width: 240,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [booking]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await generateTicketPdf(booking, qrDataUrl || undefined);
      toast.success('Boarding Pass Downloaded', `Saved PDF ticket for ${booking.bookingReference}.`);
    } catch (err) {
      console.error('Error generating PDF ticket:', err);
      toast.error('PDF Generation Error', 'Unable to generate PDF ticket. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(booking.bookingReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    toast.success('Copied to Clipboard', `Booking reference ${booking.bookingReference} copied.`);
  };

  const formattedDate = new Date(booking.departureTime).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(booking.departureTime).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isBoarded = booking.passengers.some((p) => p.hasBoarded);

  return (
    <div className="max-w-3xl mx-auto my-4 sm:my-6 px-3 sm:px-4">
      {/* Top Action Ribbon (Section 29) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="status-positive text-xs sm:text-sm px-3.5 py-2 rounded-xl font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>BOOKING CONFIRMED</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Download Ticket Button */}
          <button
            id="download-pdf-ticket-btn"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="craft-btn-amber flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
            title="Download PDF Ticket with QR Code for offline use"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>{isDownloadingPdf ? 'Generating...' : 'Download Ticket'}</span>
          </button>

          {/* Print Ticket Button */}
          <button
            id="print-ticket-btn"
            onClick={handlePrint}
            className="craft-btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ticket</span>
          </button>

          {/* Copy Reference Button */}
          <button
            id="copy-reference-btn"
            onClick={handleCopyReference}
            className="craft-btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Reference Copied' : 'Copy Reference'}</span>
          </button>

          {/* Present Mobile Ticket Button */}
          <button
            id="present-mobile-ticket-btn"
            onClick={() => setShowMobilePassModal(true)}
            className="craft-btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Mobile QR</span>
          </button>

          {onTrackBus && (
            <button
              id="track-from-ticket-btn"
              onClick={() => onTrackBus(booking.bookingReference)}
              className="craft-btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-600" />
              <span>Track Bus</span>
            </button>
          )}

          {onDone && (
            <button
              onClick={onDone}
              className="craft-btn-secondary px-3.5 py-2 text-xs font-bold"
            >
              Book Another Trip
            </button>
          )}
        </div>
      </div>

      {/* Main Boarding Pass Card (Streamlined & Spaced) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden print:border-none print:shadow-none">
        {/* Ticket Header */}
        <div className="bg-slate-950 p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-slate-950 shadow-sm font-black flex-shrink-0">
              <Bus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight inline-flex items-baseline text-white font-serif">
                TransCar
                <sub className="text-[11px] text-amber-400 font-bold lowercase font-sans ml-0.5 align-baseline">
                  rongai
                </sub>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">Official Electronic Boarding Pass</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Booking Reference</span>
            <div className="flex items-center gap-1.5 justify-start sm:justify-end mt-0.5">
              <span className="text-sm sm:text-base font-black font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {booking.bookingReference}
              </span>
              <button
                onClick={handleCopyReference}
                title="Copy Reference"
                className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors print:hidden cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Route Journey Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left w-full sm:w-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Origin</span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">{booking.routeOrigin}</h3>
              <p className="text-[11px] text-slate-600 flex items-center gap-1 justify-center sm:justify-start">
                <MapPin className="w-3 h-3 text-slate-800" />
                <span>Rongai Maasai Mall Terminal</span>
              </p>
            </div>

            <div className="flex-1 max-w-[180px] w-full px-2 text-center">
              <span className="text-[10px] font-mono font-bold text-slate-950 bg-amber-300 px-2 py-0.5 rounded border border-amber-400 inline-block">
                {booking.tripCode}
              </span>
              <div className="relative my-1 flex items-center justify-center">
                <div className="w-full h-px bg-slate-300" />
                <Bus className="w-3.5 h-3.5 text-amber-600 absolute bg-slate-50 px-0.5" />
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block">Direct Express</span>
            </div>

            <div className="space-y-0.5 text-center sm:text-right w-full sm:w-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Destination</span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">{booking.routeDestination}</h3>
              <p className="text-[11px] text-slate-600 flex items-center gap-1 justify-center sm:justify-end">
                <MapPin className="w-3 h-3 text-amber-600" />
                <span>Central Stage</span>
              </p>
            </div>
          </div>
        </div>

        {/* Boarding Information Grid (Compact & Clear) */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5 border-b border-slate-200 bg-white text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Date of Travel</span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">{formattedDate}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Departure Time</span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{formattedTime}</span>
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Assigned Bus</span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 font-mono">{booking.busRegistration}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Payment Status</span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold text-[11px]">
                PAID ({booking.paymentMethod})
              </span>
            </p>
          </div>
        </div>

        {/* Passenger & QR Verification Section */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-5 bg-white">
          {/* Passenger Table & Payment Receipt */}
          <div className="w-full md:w-2/3 space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Booked Passengers & Seats
            </span>

            <div className="space-y-2">
              {booking.passengers.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{p.fullName}</span>
                    <p className="text-[11px] text-slate-500">ID / Passport: <span className="font-mono font-bold text-slate-700">{p.idNumber}</span></p>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Seat</span>
                    <span className="text-sm sm:text-base font-black font-mono text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block">
                      {p.seatNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Verified Payment Summary */}
            <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-slate-600 text-[11px] space-y-0.5">
                {booking.paymentMethod === 'CASH' ? (
                  <>
                    <p>
                      <strong>Payment Channel:</strong> Cash at Stage / Counter
                    </p>
                    {booking.mpesaTransactionCode && (
                      <p className="font-mono text-slate-500">
                        Cash Ref: <strong className="text-slate-900">{booking.mpesaTransactionCode}</strong>
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Paybill:</strong> 400200 • <strong>Acc:</strong> 867845
                    </p>
                    {booking.mpesaTransactionCode && (
                      <p className="font-mono text-slate-500">
                        M-Pesa Ref: <strong className="text-slate-900">{booking.mpesaTransactionCode}</strong>
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[11px]">Total {booking.paymentMethod === 'CASH' ? 'Fare' : 'Paid'}: </span>
                <span className="text-sm sm:text-base font-black font-mono text-slate-950 bg-amber-300 px-2 py-0.5 rounded border border-amber-400">
                  KES {booking.totalFareKsh.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Scannable QR Code */}
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <button
              type="button"
              id="ticket-qr-code-clickable"
              onClick={() => setShowMobilePassModal(true)}
              className="relative group cursor-pointer p-1 bg-white rounded-lg border border-slate-300 hover:border-amber-400 shadow-sm transition-all focus:outline-none"
              title="Click to present full-screen mobile boarding pass for driver scan"
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for booking ${booking.bookingReference}`}
                  className="w-32 h-32 object-contain rounded"
                />
              ) : (
                <div className="w-32 h-32 bg-slate-200 animate-pulse rounded flex items-center justify-center">
                  <QrIcon className="w-6 h-6 text-slate-400" />
                </div>
              )}

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 rounded flex flex-col items-center justify-center text-white transition-opacity p-2">
                <Maximize2 className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] font-bold text-amber-300">Tap to Present</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowMobilePassModal(true)}
              className="w-full mt-2 justify-center px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3 h-3" />
              <span>Present on Mobile</span>
            </button>

            <p className="text-[9px] text-slate-500 mt-1">
              {isBoarded ? '✅ Passenger Boarded' : 'Driver scans this at vehicle entrance'}
            </p>
          </div>
        </div>

        {/* Boarding Notice Footer (Slim & Concise) */}
        <div className="p-3 bg-slate-900 text-slate-300 border-t border-slate-800 text-[11px] flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-slate-300 leading-tight">
            Please report to the departure stage <strong>20–30 mins</strong> prior. Bring your National ID/Passport. 25kg luggage allowance included.
          </p>
        </div>
      </div>

      {/* Full Mobile Presentation Modal */}
      <MobileBoardingPassModal
        booking={booking}
        isOpen={showMobilePassModal}
        onClose={() => setShowMobilePassModal(false)}
        onOpenDriverPortal={onOpenDriverPortal}
      />
    </div>
  );
};
