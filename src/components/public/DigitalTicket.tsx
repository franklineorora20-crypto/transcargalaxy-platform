import React from 'react';
import QRCode from 'qrcode';
import {
  Ticket,
  Printer,
  Download,
  Share2,
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
} from 'lucide-react';
import { Booking } from '../../types';
import { MobileBoardingPassModal } from './MobileBoardingPassModal';
import { generateTicketPdf } from '../../utils/pdfTicket';

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
  const [qrDataUrl, setQrDataUrl] = React.useState<string>('');
  const [copied, setCopied] = React.useState(false);
  const [showMobilePassModal, setShowMobilePassModal] = React.useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);

  React.useEffect(() => {
    // Generate real QR code payload representing boarding pass verification
    const qrPayload = JSON.stringify({
      ref: booking.bookingReference,
      trip: booking.tripCode,
      seats: booking.passengers.map((p) => p.seatNumber).join(','),
      origin: booking.routeOrigin,
      destination: booking.routeDestination,
      status: booking.paymentStatus,
    });

    QRCode.toDataURL(qrPayload, {
      width: 260,
      margin: 2,
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
    } catch (err) {
      console.error('Error generating PDF ticket:', err);
      alert('Unable to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(booking.bookingReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const formattedDate = new Date(booking.departureTime).toLocaleDateString('en-KE', {
    weekday: 'long',
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
    <div className="max-w-3xl mx-auto my-8 px-4">
      {/* Top Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-black font-black text-sm bg-white border-2 border-black px-4 py-2 rounded-xl shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-amber-400 fill-black" />
          <span>Booking & Payment Confirmed: Boarding Pass Ready</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Download PDF Ticket Button */}
          <button
            id="download-pdf-ticket-btn"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black border-2 border-black shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            title="Download PDF Ticket with QR Code for offline use"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <FileDown className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Ticket'}</span>
          </button>

          {/* Main Present Mobile Ticket Button */}
          <button
            id="present-mobile-ticket-btn"
            onClick={() => setShowMobilePassModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold border border-neutral-700 shadow transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            <span>Present Mobile (QR)</span>
          </button>

          <button
            id="print-ticket-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black hover:bg-neutral-900 text-amber-400 text-xs font-black border border-amber-400 shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>

          {onTrackBus && (
            <button
              id="track-from-ticket-btn"
              onClick={() => onTrackBus(booking.bookingReference)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-black text-neutral-200 text-xs font-bold border border-neutral-700 shadow transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-amber-400" />
              <span>Track Bus</span>
            </button>
          )}

          {onDone && (
            <button
              onClick={onDone}
              className="px-3 py-2 rounded-xl border-2 border-neutral-300 hover:bg-neutral-100 text-black text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Digital Ticket Card */}
      <div className="bg-white rounded-3xl border-2 border-neutral-300 shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Ticket Header */}
        <div className="bg-black p-6 text-white flex flex-wrap items-center justify-between gap-4 border-b-4 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center text-black shadow-md border border-black">
              <Bus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight font-serif inline-flex items-baseline text-white">
                TransCar
                <sub className="text-xs text-amber-400 font-bold lowercase tracking-normal font-sans ml-0.5 align-baseline relative -bottom-[0.2em]">
                  rongai
                </sub>
              </h2>
              <p className="text-xs text-neutral-300 font-medium">Official Electronic Boarding Pass & Tax Invoice</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400">Booking Reference</span>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xl font-black font-mono text-amber-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">{booking.bookingReference}</span>
              <button
                onClick={handleCopyReference}
                title="Copy Reference"
                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors print:hidden cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            {copied && <span className="text-[10px] text-amber-400 font-bold block">Copied to clipboard!</span>}
          </div>
        </div>

        {/* Route Journey Bar */}
        <div className="p-6 bg-neutral-50 border-b-2 border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-black text-neutral-500 uppercase tracking-wider">Departure City</span>
              <h3 className="text-2xl font-black text-black">{booking.routeOrigin}</h3>
              <p className="text-xs text-neutral-600 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-black" />
                <span>Central Bus Terminal</span>
              </p>
            </div>

            <div className="flex-1 max-w-[200px] px-4 text-center">
              <span className="text-[11px] font-mono font-black text-black bg-amber-400 px-2.5 py-0.5 rounded-md border border-black">
                {booking.tripCode}
              </span>
              <div className="relative my-2 flex items-center justify-center">
                <div className="w-full h-0.5 bg-neutral-300" />
                <Bus className="w-5 h-5 text-amber-500 absolute bg-neutral-50 px-0.5" />
              </div>
              <span className="text-[11px] text-neutral-600 font-bold">Direct Express</span>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[11px] font-black text-neutral-500 uppercase tracking-wider">Destination</span>
              <h3 className="text-2xl font-black text-black">{booking.routeDestination}</h3>
              <p className="text-xs text-neutral-600 font-medium flex items-center gap-1 justify-end">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>City Commercial Stage</span>
              </p>
            </div>
          </div>
        </div>

        {/* Boarding Information Grid */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 border-b-2 border-neutral-200 bg-white">
          <div>
            <span className="text-[11px] font-black uppercase text-neutral-500">Date of Travel</span>
            <p className="text-sm font-black text-black mt-1">{formattedDate}</p>
          </div>

          <div>
            <span className="text-[11px] font-black uppercase text-neutral-500">Departure Time</span>
            <p className="text-sm font-black text-black mt-1 flex items-center gap-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{formattedTime}</span>
            </p>
          </div>

          <div>
            <span className="text-[11px] font-black uppercase text-neutral-500">Assigned Bus</span>
            <p className="text-sm font-black text-black mt-1 font-mono">{booking.busRegistration}</p>
          </div>

          <div>
            <span className="text-[11px] font-black uppercase text-neutral-500">Payment Status</span>
            <p className="text-sm font-black text-black mt-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span className="bg-amber-400 text-black px-2 py-0.5 rounded font-black text-xs border border-black">PAID ({booking.paymentMethod})</span>
            </p>
          </div>
        </div>

        {/* Passenger & QR Code Section */}
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-white">
          {/* Passenger Table */}
          <div className="w-full md:w-2/3 space-y-4">
            <h4 className="text-xs font-black text-neutral-500 uppercase tracking-wider">Booked Passengers & Seats</h4>

            <div className="space-y-2.5">
              {booking.passengers.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-neutral-50 border-2 border-neutral-200 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-sm font-black text-black">{p.fullName}</span>
                    <p className="text-xs text-neutral-600 font-medium">ID/Passport: <span className="font-mono font-bold text-black">{p.idNumber}</span></p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 uppercase font-black block">Seat</span>
                      <span className="text-lg font-black font-mono text-amber-400 bg-black px-2 py-0.5 rounded border border-neutral-800 inline-block">{p.seatNumber}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Recap */}
            <div className="pt-3 border-t-2 border-neutral-200 flex items-center justify-between text-xs">
              <div className="text-neutral-700 font-medium">
                <span>Contact: {booking.contactName} ({booking.contactPhone})</span>
                {booking.mpesaTransactionCode && (
                  <span className="block text-[11px] font-mono text-neutral-500 font-bold">
                    M-Pesa Trans ID: {booking.mpesaTransactionCode}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-neutral-600 font-bold">Total Fare: </span>
                <span className="text-base font-black text-black bg-amber-400 px-2 py-0.5 rounded border border-black">KES {booking.totalFareKsh.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Real Scannable QR Code */}
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-4 bg-neutral-50 rounded-2xl border-2 border-neutral-200 text-center">
            <button
              type="button"
              id="ticket-qr-code-clickable"
              onClick={() => setShowMobilePassModal(true)}
              className="relative group cursor-pointer p-1 bg-white rounded-xl border-2 border-neutral-300 hover:border-amber-400 shadow-sm transition-all focus:outline-none"
              title="Click to present full-screen mobile boarding pass for driver scan"
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for booking ${booking.bookingReference}`}
                  className="w-40 h-40 object-contain rounded-lg"
                />
              ) : (
                <div className="w-40 h-40 bg-neutral-200 animate-pulse rounded-lg flex items-center justify-center">
                  <QrIcon className="w-8 h-8 text-neutral-400" />
                </div>
              )}

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-lg flex flex-col items-center justify-center text-white transition-opacity p-2">
                <Maximize2 className="w-6 h-6 text-amber-400 mb-1" />
                <span className="text-[11px] font-black text-amber-300">Tap to Present</span>
                <span className="text-[9px] text-neutral-200">Full-Screen Driver Scan</span>
              </div>
            </button>

            <div className="flex flex-col gap-1.5 w-full mt-2.5">
              <button
                type="button"
                onClick={() => setShowMobilePassModal(true)}
                className="w-full justify-center px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-900 text-amber-400 border border-amber-400 text-[11px] font-black flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Present on Mobile</span>
              </button>

              <button
                type="button"
                id="ticket-download-pdf-side-btn"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="w-full justify-center px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black border border-black text-[11px] font-black flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>{isDownloadingPdf ? 'Generating...' : 'Download PDF (Offline)'}</span>
              </button>
            </div>

            <p className="text-[10px] text-neutral-500 font-medium mt-1">
              {isBoarded ? '✅ Passenger already boarded' : 'Driver scans this at the bus entrance'}
            </p>
          </div>
        </div>

        {/* Boarding Terms & Regulations */}
        <div className="p-5 bg-black text-neutral-200 border-t-2 border-amber-400 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <span className="font-black text-amber-400">Important Travel Instructions:</span>
            <p className="text-neutral-300">
              Please report to the departure terminal at least <strong>30 minutes prior</strong> to scheduled departure.
              Every passenger must present an official Government National ID or Passport alongside this boarding pass.
              Complimentary luggage allowance is 25kg per passenger.
            </p>
          </div>
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
