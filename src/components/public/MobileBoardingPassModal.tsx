import React from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode as QrIcon,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  Share2,
  Sun,
  Sparkles,
  Bus,
  MapPin,
  Smartphone,
  RefreshCw,
  ExternalLink,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Booking } from '../../types';
import { ApiService } from '../../services/api';
import { playBoardingSound } from '../../utils/audio';
import { generateTicketPdf } from '../../utils/pdfTicket';

interface MobileBoardingPassModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onOpenDriverPortal?: () => void;
}

export const MobileBoardingPassModal: React.FC<MobileBoardingPassModalProps> = ({
  booking,
  isOpen,
  onClose,
  onOpenDriverPortal,
}) => {
  const [selectedPassengerIndex, setSelectedPassengerIndex] = React.useState<number>(0);
  const [qrDataUrl, setQrDataUrl] = React.useState<string>('');
  const [highBrightness, setHighBrightness] = React.useState<boolean>(true);
  const [isSimulatingScan, setIsSimulatingScan] = React.useState(false);
  const [simulatedScanMsg, setSimulatedScanMsg] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);

  // Live polling state for passenger boarding status
  const [livePassengers, setLivePassengers] = React.useState(booking.passengers);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastCheckTime, setLastCheckTime] = React.useState<string>(new Date().toLocaleTimeString());

  const currentPassenger = livePassengers[selectedPassengerIndex] || livePassengers[0] || booking.passengers[0];

  // Refresh status function
  const refreshStatus = React.useCallback(async () => {
    if (!booking.bookingReference) return;
    try {
      setIsRefreshing(true);
      const statusData = await ApiService.getTicketBoardingStatus(booking.bookingReference);
      if (statusData && statusData.passengers) {
        setLivePassengers((prev) => {
          const updated = prev.map((p) => {
            const match = statusData.passengers.find((sp: any) => sp.seatNumber === p.seatNumber);
            return match ? { ...p, hasBoarded: match.hasBoarded, boardedAt: match.boardedAt } : p;
          });
          return updated;
        });
      }
      setLastCheckTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.debug('Status check suppressed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [booking.bookingReference]);

  // Poll for boarding status updates while modal is open
  React.useEffect(() => {
    if (!isOpen) return;
    refreshStatus();
    const interval = setInterval(refreshStatus, 4000);
    return () => clearInterval(interval);
  }, [isOpen, refreshStatus]);

  // Generate high-resolution QR code specifically formatted for driver camera scanner
  React.useEffect(() => {
    if (!isOpen || !currentPassenger) return;

    // Standardized boarding verification token payload
    const qrPayload = JSON.stringify({
      ref: booking.bookingReference,
      trip: booking.tripCode,
      seat: currentPassenger.seatNumber,
      seats: booking.passengers.map((p) => p.seatNumber).join(','),
      name: currentPassenger.fullName,
      id: currentPassenger.idNumber,
      bus: booking.busRegistration,
      origin: booking.routeOrigin,
      destination: booking.routeDestination,
      status: booking.paymentStatus,
      timestamp: booking.createdAt,
    });

    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      width: 360,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate mobile QR boarding code:', err));
  }, [isOpen, booking, currentPassenger]);

  if (!isOpen) return null;

  // Handle instant simulation of driver device scanning this ticket
  const handleSimulateDriverScan = async () => {
    setIsSimulatingScan(true);
    setSimulatedScanMsg(null);
    try {
      const res = await ApiService.boardPassenger({
        bookingReference: booking.bookingReference,
        seatNumber: currentPassenger.seatNumber,
        ticketCode: booking.bookingReference,
      });

      playBoardingSound('success');
      setSimulatedScanMsg(res.message || 'Boarding Approved!');

      // Update local state immediately
      setLivePassengers((prev) =>
        prev.map((p, idx) =>
          idx === selectedPassengerIndex
            ? { ...p, hasBoarded: true, boardedAt: new Date().toISOString() }
            : p
        )
      );
      setTimeout(() => setSimulatedScanMsg(null), 5000);
    } catch (err: any) {
      playBoardingSound('error');
      setSimulatedScanMsg(err.message || 'Validation failed.');
    } finally {
      setIsSimulatingScan(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `TransCar-BoardingPass-${booking.bookingReference}-${currentPassenger.seatNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await generateTicketPdf(booking, qrDataUrl || undefined);
    } catch (err) {
      console.error('Failed to generate PDF ticket:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyShare = () => {
    const text = `TransCar Shuttle Mobile Boarding Pass\nRef: ${booking.bookingReference}\nSeat: ${currentPassenger.seatNumber} (${currentPassenger.fullName})\nTrip: ${booking.tripCode} (${booking.routeOrigin} → ${booking.routeDestination})\nBus: ${booking.busRegistration}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const isBoarded = currentPassenger.hasBoarded;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4">
      <div className="relative w-full max-w-lg bg-neutral-950 text-white rounded-2xl sm:rounded-3xl border-2 border-amber-400 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in fade-in duration-200">
        {/* Top App Bar with Controls */}
        <div className="p-3.5 sm:p-5 bg-black border-b border-neutral-800 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400 flex items-center justify-center text-black shadow-md border border-black flex-shrink-0">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 truncate">
                <span className="truncate">Boarding Pass</span>
                <span className="bg-amber-400 text-black text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                  Driver Scan
                </span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">Present to driver at boarding</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setHighBrightness(!highBrightness)}
              title={highBrightness ? 'Normal Contrast' : 'Max Contrast for Scanner'}
              className={`p-1.5 sm:p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                highBrightness
                  ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[10px] hidden sm:inline">Bright</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Passenger Switcher Tabs (If multiple passengers) */}
        {livePassengers.length > 1 && (
          <div className="p-2 bg-neutral-900 border-b border-neutral-800 flex items-center gap-1 overflow-x-auto flex-shrink-0">
            <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 px-2 flex-shrink-0">
              Passengers:
            </span>
            {livePassengers.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPassengerIndex(idx)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
                  selectedPassengerIndex === idx
                    ? 'bg-amber-400 text-black shadow font-black'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <span>Seat {p.seatNumber}</span>
                <span className="text-[10px] opacity-80">({p.fullName.split(' ')[0]})</span>
                {p.hasBoarded && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              </button>
            ))}
          </div>
        )}

        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Real-time Boarding Status Indicator */}
          <div
            className={`p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all ${
              isBoarded
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : 'bg-amber-950/40 border-amber-500/80 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isBoarded ? 'bg-emerald-500 text-black' : 'bg-amber-400 text-black animate-pulse'
                }`}
              >
                {isBoarded ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <QrIcon className="w-5 h-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold block opacity-80">
                  Boarding Gate Status
                </span>
                <span className="text-xs font-black">
                  {isBoarded
                    ? `BOARDED & VERIFIED ${
                        currentPassenger.boardedAt
                          ? `(${new Date(currentPassenger.boardedAt).toLocaleTimeString('en-KE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })})`
                          : ''
                      }`
                    : 'AWAITING DRIVER CHECK-IN SCAN'}
                </span>
              </div>
            </div>

            <button
              onClick={refreshStatus}
              disabled={isRefreshing}
              title={`Checked at ${lastCheckTime}. Click to refresh status`}
              className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>

          {/* High-Contrast Presentation Card with QR Code */}
          <div
            className={`rounded-3xl p-6 text-black transition-all ${
              highBrightness
                ? 'bg-white shadow-[0_0_40px_rgba(251,191,36,0.25)] border-4 border-amber-400'
                : 'bg-neutral-100 border-2 border-neutral-300'
            }`}
          >
            {/* Header in ticket: Route & Seat */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">
                  Corridor Express
                </span>
                <span className="text-sm font-black text-black">
                  {booking.routeOrigin} → {booking.routeDestination}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">
                  Assigned Seat
                </span>
                <span className="text-2xl font-black font-mono text-black bg-amber-400 px-3 py-0.5 rounded-xl border border-black inline-block shadow-sm">
                  {currentPassenger.seatNumber}
                </span>
              </div>
            </div>

            {/* QR Code Presentation Canvas */}
            <div className="relative my-4 flex flex-col items-center justify-center">
              {/* Subtle animated scanning guide frame */}
              <div className="relative p-2 bg-white rounded-2xl border-2 border-neutral-300 shadow-inner">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code Boarding Pass for ${booking.bookingReference} Seat ${currentPassenger.seatNumber}`}
                    className="w-44 h-44 xs:w-56 xs:h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-44 h-44 xs:w-56 xs:h-56 sm:w-64 sm:h-64 bg-neutral-200 animate-pulse rounded-xl flex items-center justify-center">
                    <QrIcon className="w-10 h-10 text-neutral-400" />
                  </div>
                )}

                {/* Animated holographic scan indicator line */}
                {!isBoarded && (
                  <div className="absolute inset-x-4 top-2 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-pulse" />
                )}
              </div>

              {/* Security Verification Hash Tag */}
              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-neutral-600 font-bold bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>REF: {booking.bookingReference} • {booking.tripCode}</span>
              </div>
            </div>

            {/* Passenger & Coach Specs Summary */}
            <div className="pt-3 border-t-2 border-neutral-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-black text-neutral-500 block">Passenger</span>
                <span className="font-extrabold text-black block truncate">{currentPassenger.fullName}</span>
                <span className="text-[10px] font-mono text-neutral-600">ID: {currentPassenger.idNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-black text-neutral-500 block">Assigned Bus</span>
                <span className="font-extrabold font-mono text-black block">{booking.busRegistration}</span>
                <span className="text-[10px] text-emerald-700 font-black">PAID ({booking.paymentMethod})</span>
              </div>
            </div>
          </div>

          {/* Simulated scan feedback message */}
          {simulatedScanMsg && (
            <div className="p-3 bg-neutral-900 border border-amber-400 rounded-xl text-xs text-amber-300 font-bold text-center animate-in fade-in">
              {simulatedScanMsg}
            </div>
          )}

          {/* Quick Actions & Testing Tools */}
          <div className="space-y-2.5">
            {/* Simulation test tool for user/tester */}
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-[11px] font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Driver Device Scan</span>
                </span>
                <p className="text-[10px] text-neutral-400">
                  Simulates a driver scanning this QR code with their mobile terminal
                </p>
              </div>

              <button
                type="button"
                id="simulate-driver-scan-btn"
                disabled={isSimulatingScan}
                onClick={handleSimulateDriverScan}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isBoarded
                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'
                    : 'bg-amber-400 hover:bg-amber-300 text-black border border-black'
                }`}
              >
                <QrIcon className="w-3.5 h-3.5" />
                <span>{isBoarded ? 'Re-scan Ticket' : 'Simulate Scan Now'}</span>
              </button>
            </div>

            {/* Action buttons: Download QR, Copy details, and Driver Portal switch */}
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 pt-2 border-t border-neutral-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="modal-download-pdf-ticket-btn"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black border border-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[38px]"
                  title="Download Official PDF Ticket with QR Code for offline use"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  <span>{isDownloadingPdf ? 'Generating...' : 'Download PDF'}</span>
                </button>

                <button
                  type="button"
                  id="download-qr-ticket-btn"
                  onClick={handleDownloadQr}
                  className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-800 flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                  title="Save QR Code Image to Phone"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save QR</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyShare}
                  className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-800 flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Share Pass'}</span>
                </button>
              </div>

              {onOpenDriverPortal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDriverPortal();
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer pt-1 xs:pt-0"
                >
                  <span>Open Driver Cockpit</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
