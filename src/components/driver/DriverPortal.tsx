import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bus,
  UserCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Gauge,
  AlertTriangle,
  ClipboardCheck,
  Users,
  ShieldCheck,
  Search,
  Check,
  Send,
  Bell,
  RefreshCw,
  Sparkles,
  QrCode,
  Scan,
  Zap,
  Smartphone,
  Volume2,
  Camera,
  AlertCircle,
  X,
  SwitchCamera,
  Upload,
  Image as ImageIcon,
  Loader2,
  Radio,
  Printer,
  Navigation,
  Compass,
  PhoneCall,
  Siren,
  Fuel,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
  Trip,
  Passenger,
  VehicleInspection,
  IncidentReport,
  TicketRecord,
  TicketVerificationResult,
} from '../../types';
import { ApiService } from '../../services/api';
import { playBoardingSound } from '../../utils/audio';

interface DriverPortalProps {
  driverData: any;
  onLogout: () => void;
  initialVerifyToken?: string | null;
  initialVerifyTripId?: string | null;
  onClearInitialVerify?: () => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({
  driverData,
  onLogout,
  initialVerifyToken,
  initialVerifyTripId,
  onClearInitialVerify,
}) => {
  const [allAssignedTrips, setAllAssignedTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [assignedVehicle, setAssignedVehicle] = useState<any>(null);
  const [manifestPassengers, setManifestPassengers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Live GPS Broadcast state
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsTrackingError, setGpsTrackingError] = useState<string | null>(null);

  // Emergency SOS Modal state
  const [showSosModal, setShowSosModal] = useState(false);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [sosSentSuccess, setSosSentSuccess] = useState(false);

  // Fuel & Expense Logger Modal
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [fuelLitres, setFuelLitres] = useState('45');
  const [fuelCostKsh, setFuelCostKsh] = useState('9500');
  const [fuelStation, setFuelStation] = useState('Shell Rongai Express Hub');
  const [isLoggingFuel, setIsLoggingFuel] = useState(false);

  // QR Boarding Validator & Unified Ticket Verification State
  const [qrScanInput, setQrScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isBoardingConfirming, setIsBoardingConfirming] = useState(false);
  const [verificationResult, setVerificationResult] = useState<TicketVerificationResult | null>(null);
  const [searchMatches, setSearchMatches] = useState<TicketVerificationResult[]>([]);
  const [scanResult, setScanResult] = useState<{
    status: 'SUCCESS' | 'ALREADY_BOARDED' | 'ERROR';
    message: string;
    passenger?: any;
    booking?: any;
  } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanFlash, setScanFlash] = useState(false);
  const [isDecodingFile, setIsDecodingFile] = useState(false);
  const [showSampleQrCards, setShowSampleQrCards] = useState(false);
  const [sampleQrImages, setSampleQrImages] = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScannedCodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Manifest search & filter
  const [searchManifest, setSearchManifest] = useState('');
  const [filterBoarded, setFilterBoarded] = useState<'ALL' | 'BOARDED' | 'PENDING'>('ALL');

  // Status Updater modal / state
  const [currentStatus, setCurrentStatus] = useState<string>('IN_TRANSIT');
  const [currentStopName, setCurrentStopName] = useState('Machakos Junction');
  const [currentSpeed, setCurrentSpeed] = useState(74);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [delayReason, setDelayReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Pre-Trip Checklist state
  const [checklist, setChecklist] = useState({
    tiresChecked: true,
    brakesChecked: true,
    lightsChecked: true,
    wipersChecked: true,
    emergencyExitsChecked: true,
    firstAidKitChecked: true,
    fireExtinguisherChecked: true,
    speedGovernorSealChecked: true,
  });
  const [checklistNotes, setChecklistNotes] = useState('');
  const [checklistStatus, setChecklistStatus] = useState<'PASS' | 'FAIL_NEEDS_MAINTENANCE'>('PASS');
  const [checklistSubmitted, setChecklistSubmitted] = useState(false);
  const [isSubmittingChecklist, setIsSubmittingChecklist] = useState(false);

  // Incident reporting state
  const [incidentType, setIncidentType] = useState<
    'TRAFFIC_DELAY' | 'MECHANICAL_FAULT' | 'BREAKDOWN' | 'MEDICAL_EMERGENCY' | 'ACCIDENT' | 'WEATHER'
  >('TRAFFIC_DELAY');
  const [incidentSeverity, setIncidentSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [incidentSuccessMsg, setIncidentSuccessMsg] = useState('');

  // Waypoints for quick one-tap location picking
  const waypoints = [
    'Rongai Main Terminal',
    'Maasai Mall Gate',
    'Kiserian Town Stage',
    'Ngong Milele Mall',
    'Suswa Escarpment Viewpoint',
    'Narok Town Stage',
    'Bomet Highway Hub',
    'Sotik Junction',
    'Kericho Tea Highlands',
    'Kisii Express Terminal',
  ];

  const loadDriverDashboard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await ApiService.getDriverDashboard();
      if (data.assignedTrips && data.assignedTrips.length > 0) {
        setAllAssignedTrips(data.assignedTrips);
        const preferredTrip =
          (initialVerifyTripId
            ? data.assignedTrips.find(
                (t: Trip) => t.id === initialVerifyTripId || t.tripCode === initialVerifyTripId,
              )
            : null) ||
          (activeTrip
            ? data.assignedTrips.find((t: Trip) => t.id === activeTrip.id)
            : null) ||
          data.assignedTrips[0];

        const trip = preferredTrip || data.assignedTrips[0];
        setActiveTrip(trip);
        setAssignedVehicle(trip.vehicle);
        setCurrentStatus(trip.status);
        setCurrentStopName(trip.currentStop || trip.route.origin);
        setCurrentSpeed(trip.speedKmH || 72);
        setDelayMinutes(trip.delayMinutes || 0);

        // Fetch manifest
        const manifestData = await ApiService.getTripManifest(trip.id);
        const loadedManifest = manifestData.manifest || manifestData.passengers || [];
        setManifestPassengers(loadedManifest);
        try {
          localStorage.setItem(
            `transcar_offline_manifest_${trip.id}`,
            JSON.stringify(loadedManifest),
          );
        } catch {
          // ignore storage quota
        }
      }
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Error loading driver dashboard:', err);
      showToast('Could not load latest telemetry from dispatch.', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [initialVerifyTripId]);

  const handleSelectDriverTrip = async (tripId: string) => {
    const chosen = allAssignedTrips.find((t) => t.id === tripId || t.tripCode === tripId);
    if (!chosen) return;
    setActiveTrip(chosen);
    setAssignedVehicle(chosen.vehicle);
    setCurrentStatus(chosen.status);
    setCurrentStopName(chosen.currentStop || chosen.route.origin);
    setCurrentSpeed(chosen.speedKmH || 72);
    setDelayMinutes(chosen.delayMinutes || 0);
    try {
      const manifestData = await ApiService.getTripManifest(chosen.id);
      const loadedManifest = manifestData.manifest || manifestData.passengers || [];
      setManifestPassengers(loadedManifest);
      showToast(`Switched active cockpit to ${chosen.route.origin} → ${chosen.route.destination} (${chosen.tripCode})`, 'info');
    } catch {
      showToast('Could not load manifest for selected trip.', 'warning');
    }
  };

  useEffect(() => {
    loadDriverDashboard();
  }, [loadDriverDashboard]);

  // Real-time GPS Geolocation Tracker
  useEffect(() => {
    let watchId: number | null = null;
    if (gpsActive && navigator.geolocation) {
      setGpsTrackingError(null);
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          setGpsCoords({ lat: latitude, lng: longitude });
          if (speed !== null && speed >= 0) {
            setCurrentSpeed(Math.min(80, Math.round(speed * 3.6))); // Convert m/s to km/h with 80 governor cap
          }
          if (activeTrip) {
            ApiService.updateTripTelemetry(activeTrip.id, {
              lat: latitude,
              lng: longitude,
              speedKmH: Math.min(80, Math.round((speed || 20) * 3.6)),
              currentStop: currentStopName,
            }).catch(console.warn);
          }
        },
        (err) => {
          console.warn('GPS location tracking error:', err);
          setGpsTrackingError(err.message || 'GPS Signal unavailable. Using manual odometer.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [gpsActive, activeTrip, currentStopName]);

  // Handle Trip Status & Telemetry Broadcast
  const handleUpdateStatus = async (overrideStatus?: string) => {
    if (!activeTrip) return;
    const targetStatus = overrideStatus || currentStatus;
    setIsUpdatingStatus(true);

    try {
      const res = await ApiService.updateTripStatus(activeTrip.id, {
        status: targetStatus,
        currentStop: currentStopName,
        speedKmH: currentSpeed,
        delayMinutes: Number(delayMinutes),
        delayReason: delayReason || undefined,
      });
      setActiveTrip(res.trip);
      setCurrentStatus(targetStatus);
      playBoardingSound('success');
      showToast(`Trip telemetry & status updated to: ${targetStatus.replace('_', ' ')}!`, 'success');
    } catch (err: any) {
      playBoardingSound('error');
      showToast(err.message || 'Could not broadcast telemetry.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Unified Ticket Verification (Search + QR Scan use the same server-side verification pipeline)
  const handleValidateTicket = async (
    ticketCodeToValidate?: string,
    mode: 'SEARCH' | 'QR' = 'SEARCH',
    overrideTripId?: string,
  ) => {
    const rawInput = (ticketCodeToValidate ?? qrScanInput).trim();
    if (!rawInput) {
      showToast(
        'Enter a Ticket ID, Booking ID, passenger name, or phone number.',
        'warning',
      );
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    const targetTripId = overrideTripId || activeTrip?.id;

    try {
      const looksLikeQrPayload =
        mode === 'QR' ||
        rawInput.includes('/ticket/verify/') ||
        rawInput.toLowerCase().startsWith('tcr_tok_') ||
        rawInput.startsWith('{');

      if (looksLikeQrPayload) {
        const result = await ApiService.verifyDriverTicket({
          qr_token: rawInput,
          trip_id: targetTripId,
        });
        setVerificationResult(result);
        setSearchMatches([]);

        if (result.valid) {
          playBoardingSound('success');
          showToast(
            `Valid Ticket: ${result.ticket?.passenger_name} (Seat ${result.ticket?.seat_number}) — Ready for Boarding`,
            'success',
          );
        } else if (result.code === 'ALREADY_BOARDED') {
          playBoardingSound('warning');
          showToast(result.title, 'warning');
        } else {
          playBoardingSound('error');
          showToast(result.title || 'Ticket verification failed', 'error');
        }
      } else {
        const searchResponse = await ApiService.searchDriverTickets(
          rawInput,
          targetTripId,
        );
        const primary =
          searchResponse.exactMatch || searchResponse.results[0] || null;
        setVerificationResult(primary);
        setSearchMatches(
          searchResponse.results.length > 1 ? searchResponse.results : [],
        );

        if (primary?.valid) {
          playBoardingSound('success');
          showToast(
            `Ticket Found: ${primary.ticket?.passenger_name} (${primary.ticket?.ticket_id})`,
            'success',
          );
        } else if (primary?.code === 'ALREADY_BOARDED') {
          playBoardingSound('warning');
          showToast(primary.title, 'warning');
        } else {
          playBoardingSound('error');
          showToast(primary?.title || 'Ticket not found', 'error');
        }
      }
    } catch (err: any) {
      // Offline / Poor Network Fallback using cached trip manifest
      const offlineMatch = manifestPassengers.find((p) => {
        const q = rawInput.toUpperCase();
        return (
          (p.ticketId && p.ticketId.toUpperCase() === q) ||
          (p.bookingReference && p.bookingReference.toUpperCase() === q) ||
          (p.qrToken && rawInput.includes(p.qrToken)) ||
          (p.fullName && p.fullName.toUpperCase().includes(q)) ||
          (p.contactPhone && p.contactPhone.replace(/\D+/g, '').includes(rawInput.replace(/\D+/g, '')))
        );
      });

      if (offlineMatch && offlineMatch.ticket) {
        const isAlreadyBoarded =
          offlineMatch.boarded || offlineMatch.hasBoarded;
        const fallbackResult: TicketVerificationResult = {
          valid: !isAlreadyBoarded && offlineMatch.paymentStatus === 'PAID',
          code: isAlreadyBoarded
            ? 'ALREADY_BOARDED'
            : offlineMatch.paymentStatus !== 'PAID'
              ? 'PAYMENT_PENDING'
              : 'VALID',
          title: isAlreadyBoarded
            ? '⚠️ ALREADY BOARDED'
            : offlineMatch.paymentStatus !== 'PAID'
              ? '⚠️ Payment Pending'
              : '✓ VALID TICKET (Offline Cache)',
          message: isAlreadyBoarded
            ? 'Passenger was already marked as boarded.'
            : 'READY FOR BOARDING (Verified via Offline Trip Cache)',
          ticket: offlineMatch.ticket,
        };
        setVerificationResult(fallbackResult);
        playBoardingSound(fallbackResult.valid ? 'success' : 'warning');
      } else {
        playBoardingSound('error');
        setVerificationResult({
          valid: false,
          code: 'NOT_FOUND',
          title: '❌ Ticket Not Found',
          message:
            err.message ||
            'Could not verify ticket. Check network connection or ticket ID.',
        });
        showToast(err.message || 'Ticket verification failed.', 'error');
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Boarding Confirmation when Driver presses MARK AS BOARDED
  const handleConfirmBoarding = async (ticketToBoard?: TicketRecord) => {
    const targetTicket = ticketToBoard || verificationResult?.ticket;
    if (!targetTicket) return;

    setIsBoardingConfirming(true);
    try {
      const res = await ApiService.boardVerifiedTicket({
        qr_token: targetTicket.qr_token,
        ticket_id: targetTicket.ticket_id,
        booking_id: targetTicket.booking_reference,
        seat_number: targetTicket.seat_number,
        trip_id: activeTrip?.id,
      });

      setVerificationResult(res);
      setSearchMatches((prev) =>
        prev.map((m) =>
          m.ticket?.ticket_id === targetTicket.ticket_id ? res : m,
        ),
      );

      if (res.alreadyBoarded) {
        playBoardingSound('warning');
        showToast(
          `Already Boarded: ${targetTicket.passenger_name} (Seat ${targetTicket.seat_number})`,
          'warning',
        );
      } else if (res.boarded || res.code === 'BOARDED') {
        playBoardingSound('success');
        showToast(
          `✓ PASSENGER BOARDED: ${targetTicket.passenger_name} (Seat ${targetTicket.seat_number})`,
          'success',
        );

        const nowIso = res.ticket?.verified_at || new Date().toISOString();
        setManifestPassengers((prev) => {
          const updated = prev.map((p) => {
            const matchesTicket =
              (p.ticketId && p.ticketId === targetTicket.ticket_id) ||
              (p.bookingReference === targetTicket.booking_reference &&
                p.seatNumber === targetTicket.seat_number);
            if (matchesTicket) {
              return {
                ...p,
                boarded: true,
                hasBoarded: true,
                boardingStatus: 'BOARDED',
                ticketStatus: 'BOARDED',
                boardedAt: nowIso,
                verifiedAt: nowIso,
                verifiedBy: res.ticket?.verified_by,
                verifiedByName: res.ticket?.verified_by_name,
                ticket: res.ticket || p.ticket,
              };
            }
            return p;
          });
          if (activeTrip) {
            try {
              localStorage.setItem(
                `transcar_offline_manifest_${activeTrip.id}`,
                JSON.stringify(updated),
              );
            } catch {
              // ignore quota
            }
          }
          return updated;
        });

        if (activeTrip) {
          ApiService.getTripManifest(activeTrip.id)
            .then((m) => {
              const list = m?.manifest || m?.passengers;
              if (list) setManifestPassengers(list);
            })
            .catch(() => {});
        }
      } else {
        playBoardingSound('error');
        showToast(res.message || 'Boarding denied.', 'error');
      }
    } catch (err: any) {
      playBoardingSound('error');
      showToast(err.message || 'Failed to confirm boarding.', 'error');
    } finally {
      setIsBoardingConfirming(false);
    }
  };

  // Automatically verify ticket if opened via QR URL deep link (/ticket/verify/:token) or customer ticket handoff
  useEffect(() => {
    if (!loading && activeTrip && initialVerifyToken) {
      const tokenToVerify = initialVerifyToken;
      const tripToUse = initialVerifyTripId || activeTrip.id;
      setQrScanInput(tokenToVerify);
      handleValidateTicket(tokenToVerify, 'QR', tripToUse);
      if (onClearInitialVerify) onClearInitialVerify();
      setTimeout(() => {
        const card = document.getElementById('passenger-verification-card') || document.getElementById('driver-manifest-panel');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    }
  }, [loading, activeTrip, initialVerifyToken, initialVerifyTripId]);

  // Generate sample scannable QR images when the sample QR drawer is opened
  useEffect(() => {
    if (!showSampleQrCards) return;
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://transcar.co.ke';

    const sampleTokens: Record<string, string> = {
      'TCR-7X4K9P2M': `${origin}/ticket/verify/tcr_tok_7x4k9p2m_f9a8c3d2e1b0476589ab`,
      'TCR-4M8Q2L9K': `${origin}/ticket/verify/tcr_tok_4m8q2l9k_81c4d7e2a9f30b1654cd`,
      'TCR-5P2H8K6D': `${origin}/ticket/verify/tcr_tok_5p2h8k6d_90f1e4c7b2a83d6519cd`,
      'TCR-9W3N5V8R': `${origin}/ticket/verify/tcr_tok_9w3n5v8r_32d7b4a9c6e180f523ab`,
    };

    const recentBooking = ApiService.getOfflineLastTicket();
    if (recentBooking) {
      const recentPax = recentBooking.passengers?.[0];
      const recentId = recentPax?.ticketId || recentBooking.ticketId || recentBooking.bookingReference;
      const recentTok = recentPax?.qrToken || recentBooking.qrToken || recentId;
      sampleTokens[recentId] = `${origin}/ticket/verify/${encodeURIComponent(recentTok)}`;
    }

    Promise.all(
      Object.entries(sampleTokens).map(async ([id, url]) => {
        const dataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: 'M',
          margin: 3,
          width: 320,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        return [id, dataUrl] as const;
      }),
    )
      .then((entries) => {
        setSampleQrImages(Object.fromEntries(entries));
      })
      .catch(console.error);
  }, [showSampleQrCards]);

  // Camera video stream handling & dual-engine (BarcodeDetector + multi-region jsQR) frame scanner loop
  useEffect(() => {
    let stream: MediaStream | null = null;
    let scanIntervalTimer: any = null;
    let isCancelled = false;

    if (cameraActive) {
      setCameraLoading(true);
      setCameraError(null);

      let nativeDetector: any = null;
      try {
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          nativeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        }
      } catch {
        nativeDetector = null;
      }

      const triggerDetectedQr = (rawCode: string) => {
        const detected = rawCode.trim();
        if (!detected) return;
        const now = Date.now();
        if (
          detected !== lastScannedCodeRef.current.code ||
          now - lastScannedCodeRef.current.time > 2500
        ) {
          lastScannedCodeRef.current = { code: detected, time: now };
          setScanFlash(true);
          setTimeout(() => setScanFlash(false), 1000);
          setQrScanInput(detected);
          handleValidateTicket(detected, 'QR');
          setCameraActive(false);
        }
      };

      const startCamera = async () => {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API is not supported by your browser environment.');
          }

          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: cameraFacing },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            });
          } catch (constraintErr) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
          }

          if (isCancelled) {
            if (stream) stream.getTracks().forEach((t) => t.stop());
            return;
          }

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.muted = true;
            try {
              await videoRef.current.play();
            } catch (pErr) {
              console.warn('Video playback deferred:', pErr);
            }
          }
          setCameraLoading(false);

          // Continuous Dual-Engine Frame Scanning Loop
          const processFrame = async () => {
            if (isCancelled || !cameraActive) return;

            const video = videoRef.current;
            if (
              video &&
              video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
              video.videoWidth > 0 &&
              video.videoHeight > 0
            ) {
              // Engine 1: Hardware-accelerated BarcodeDetector API when available
              if (nativeDetector) {
                try {
                  const barcodes = await nativeDetector.detect(video);
                  if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
                    triggerDetectedQr(barcodes[0].rawValue);
                    return;
                  }
                } catch {
                  // Fall through to jsQR canvas engine
                }
              }

              // Engine 2: High-resolution jsQR (Full Frame + 1:1 Native Center Viewfinder Crop)
              if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
              }
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (!ctx) return;

              const vw = video.videoWidth;
              const vh = video.videoHeight;

              // Pass A: Full frame at up to 960px
              const maxDim = Math.max(vw, vh);
              const scale = maxDim > 960 ? 960 / maxDim : 1;
              const w = Math.floor(vw * scale);
              const h = Math.floor(vh * scale);

              canvas.width = w;
              canvas.height = h;
              ctx.drawImage(video, 0, 0, w, h);
              const fullImageData = ctx.getImageData(0, 0, w, h);
              try {
                const qrFull = jsQR(fullImageData.data, fullImageData.width, fullImageData.height, {
                  inversionAttempts: 'attemptBoth',
                });
                if (qrFull && qrFull.data && qrFull.data.trim()) {
                  triggerDetectedQr(qrFull.data);
                  return;
                }
              } catch {
                // ignore
              }

              // Pass B: 1:1 Native Resolution Center Crop (Viewfinder Target Box)
              const cropSize = Math.floor(Math.min(vw, vh) * 0.65);
              if (cropSize > 120) {
                const sx = Math.floor((vw - cropSize) / 2);
                const sy = Math.floor((vh - cropSize) / 2);
                canvas.width = cropSize;
                canvas.height = cropSize;
                ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, cropSize, cropSize);
                const cropData = ctx.getImageData(0, 0, cropSize, cropSize);
                try {
                  const qrCrop = jsQR(cropData.data, cropData.width, cropData.height, {
                    inversionAttempts: 'attemptBoth',
                  });
                  if (qrCrop && qrCrop.data && qrCrop.data.trim()) {
                    triggerDetectedQr(qrCrop.data);
                    return;
                  }
                } catch {
                  // ignore
                }
              }
            }
          };

          scanIntervalTimer = setInterval(processFrame, 85);
        } catch (err: any) {
          console.error('Camera access error:', err);
          setCameraLoading(false);
          let msg = 'Could not access device camera.';
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            msg = 'Camera permission was blocked. Please allow camera permissions in your browser URL bar.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            msg = 'No camera device found on this system. You can upload a QR image or use Ticket Search.';
          } else if (err.name === 'NotReadableError') {
            msg = 'Camera is in use by another tab. Please close other camera apps and retry.';
          }
          setCameraError(msg);
        }
      };

      startCamera();
    }

    return () => {
      isCancelled = true;
      if (scanIntervalTimer) clearInterval(scanIntervalTimer);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraActive, cameraFacing]);

  // Handle QR image file upload (supports standalone QR PNGs, mobile screenshots, and full ticket photos)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          // 1. Try hardware BarcodeDetector first if available
          if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
            try {
              const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
              const found = await detector.detect(img);
              if (found && found.length > 0 && found[0]?.rawValue) {
                const decoded = found[0].rawValue.trim();
                setScanFlash(true);
                setTimeout(() => setScanFlash(false), 1000);
                setQrScanInput(decoded);
                handleValidateTicket(decoded, 'QR');
                return;
              }
            } catch {
              // Fall through to multi-scale jsQR
            }
          }

          // 2. Multi-scale & multi-region jsQR decoding
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) throw new Error('Canvas rendering context unavailable');

          const natW = img.naturalWidth || img.width;
          const natH = img.naturalHeight || img.height;

          const tryDecodeRegion = (
            sx: number,
            sy: number,
            sw: number,
            sh: number,
            targetMaxDim: number,
          ): string | null => {
            const maxDim = Math.max(sw, sh);
            const scale = maxDim > targetMaxDim ? targetMaxDim / maxDim : 1;
            const dw = Math.max(1, Math.floor(sw * scale));
            const dh = Math.max(1, Math.floor(sh * scale));
            canvas.width = dw;
            canvas.height = dh;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, dw, dh);
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
            const imageData = ctx.getImageData(0, 0, dw, dh);
            const qr = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });
            return qr && qr.data && qr.data.trim() ? qr.data.trim() : null;
          };

          const attempts: Array<() => string | null> = [
            () => tryDecodeRegion(0, 0, natW, natH, 1200),
            () => tryDecodeRegion(0, 0, natW, natH, 700),
            () => tryDecodeRegion(0, 0, natW, natH, 1800),
            // Center crop (for mobile boarding pass screenshots)
            () => tryDecodeRegion(natW * 0.1, natH * 0.15, natW * 0.8, natH * 0.7, 1000),
            // Right-half crop (for desktop ticket screenshots where QR is on the right column)
            () => tryDecodeRegion(natW * 0.45, 0, natW * 0.55, natH, 1000),
            // Bottom-half crop
            () => tryDecodeRegion(0, natH * 0.35, natW, natH * 0.65, 1000),
          ];

          let decodedPayload: string | null = null;
          for (const attempt of attempts) {
            decodedPayload = attempt();
            if (decodedPayload) break;
          }

          if (decodedPayload) {
            setScanFlash(true);
            setTimeout(() => setScanFlash(false), 1000);
            setQrScanInput(decodedPayload);
            handleValidateTicket(decodedPayload, 'QR');
          } else {
            showToast('No readable QR code found in this image. Try saving the QR PNG directly from the ticket.', 'warning');
          }
        } catch (err: any) {
          console.error('Failed to parse uploaded QR image:', err);
          showToast('Error processing ticket image.', 'error');
        } finally {
          setIsDecodingFile(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      img.onerror = () => {
        setIsDecodingFile(false);
        showToast('Could not load the selected image file.', 'error');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Mark Single Passenger as Boarded / Unboarded
  const handleToggleBoarding = async (passengerId: string, currentVal: boolean) => {
    try {
      await ApiService.updatePassengerBoarding(passengerId, !currentVal);
      setManifestPassengers((prev) =>
        prev.map((p) => (p.id === passengerId ? { ...p, boarded: !currentVal } : p))
      );
      if (!currentVal) {
        playBoardingSound('success');
        showToast('Passenger checked in successfully!', 'success');
      } else {
        showToast('Passenger check-in cancelled.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not update boarding status.', 'error');
    }
  };

  // Board all remaining manifest passengers at once
  const handleBoardAllRemaining = async () => {
    const unboarded = manifestPassengers.filter((p) => !p.boarded);
    if (unboarded.length === 0) {
      showToast('All passengers on this manifest are already checked in!', 'info');
      return;
    }

    try {
      for (const p of unboarded) {
        await ApiService.updatePassengerBoarding(p.id, true);
      }
      setManifestPassengers((prev) => prev.map((p) => ({ ...p, boarded: true })));
      playBoardingSound('success');
      showToast(`All ${unboarded.length} remaining passengers checked in!`, 'success');
    } catch (err: any) {
      showToast('Error checking in all passengers.', 'error');
    }
  };

  // Print / Export Boarding Manifest
  const handlePrintManifest = () => {
    if (!activeTrip) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to print manifest.', 'warning');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>TransCar Rongai - Official Boarding Manifest ${activeTrip.tripCode}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
            .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 12px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 4px; }
            .boarded { background-color: #dcfce7; color: #166534; }
            .pending { background-color: #fef3c7; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TransCar Rongai Galaxy • Passenger Boarding Manifest</h1>
            <p style="font-size: 12px; color: #475569; margin: 0;">NTSA Regulated Intercity PSV Transport • Trip Code: <strong>${activeTrip.tripCode}</strong></p>
          </div>
          <div class="meta">
            <div><strong>Route:</strong> ${activeTrip.route.origin} → ${activeTrip.route.destination}</div>
            <div><strong>Vehicle:</strong> ${assignedVehicle?.registrationNumber || 'KDE 416Q'} (${assignedVehicle?.model || 'HiAce'})</div>
            <div><strong>Captain:</strong> Frankline Orora (DL-FRK8492)</div>
            <div><strong>Departure:</strong> ${new Date(activeTrip.departureTime).toLocaleString()}</div>
            <div><strong>Total Seats:</strong> ${manifestPassengers.length} booked</div>
            <div><strong>Boarded Count:</strong> ${manifestPassengers.filter((p) => p.boarded).length} verified</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Seat</th>
                <th>Passenger Legal Name</th>
                <th>ID / Passport</th>
                <th>Booking Ref</th>
                <th>Boarding Status</th>
              </tr>
            </thead>
            <tbody>
              ${manifestPassengers
                .map(
                  (p) => `
                <tr>
                  <td><strong>${p.seatNumber}</strong></td>
                  <td>${p.fullName}</td>
                  <td>${p.idNumber || 'N/A'}</td>
                  <td>${p.bookingReference || 'N/A'}</td>
                  <td><span class="badge ${p.boarded ? 'boarded' : 'pending'}">${p.boarded ? 'BOARDED' : 'PENDING'}</span></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div style="margin-top: 30px; font-size: 11px; display: flex; justify-content: space-between;">
            <div>Driver Signature: _______________________</div>
            <div>Station Agent Sign: _______________________</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  // Pre-Trip Inspection Submission
  const handleSubmitChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip || !assignedVehicle) return;

    setIsSubmittingChecklist(true);
    try {
      await ApiService.submitVehicleInspection({
        vehicleId: assignedVehicle.id,
        tripId: activeTrip.id,
        status: checklistStatus,
        notes: checklistNotes || (checklistStatus === 'PASS' ? 'All safety systems nominal' : 'Attention required'),
        items: checklist,
      });
      setChecklistSubmitted(true);
      playBoardingSound('success');
      showToast('Pre-trip inspection logged & cleared for departure!', 'success');
      setTimeout(() => setChecklistSubmitted(false), 5000);
    } catch (err: any) {
      playBoardingSound('error');
      showToast(err.message || 'Inspection could not be submitted.', 'error');
    } finally {
      setIsSubmittingChecklist(false);
    }
  };

  // Quick Check All Inspection Items
  const handleCheckAllInspection = () => {
    setChecklist({
      tiresChecked: true,
      brakesChecked: true,
      lightsChecked: true,
      wipersChecked: true,
      emergencyExitsChecked: true,
      firstAidKitChecked: true,
      fireExtinguisherChecked: true,
      speedGovernorSealChecked: true,
    });
    setChecklistStatus('PASS');
    showToast('All 8 safety items marked as PASS.', 'info');
  };

  // Incident Report Submission
  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;

    setIsSubmittingIncident(true);
    try {
      await ApiService.reportIncident({
        tripId: activeTrip.id,
        type: incidentType,
        severity: incidentSeverity,
        location: incidentLocation || currentStopName,
        description: incidentDesc,
      });
      playBoardingSound('warning');
      setIncidentSuccessMsg('Incident reported to Central Dispatch. Response team alerted.');
      setIncidentDesc('');
      showToast('Incident report dispatched to control center!', 'warning');
      setTimeout(() => setIncidentSuccessMsg(''), 5000);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit incident report.', 'error');
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  // Emergency SOS Trigger
  const handleTriggerSos = async () => {
    if (!activeTrip) return;
    setIsSendingSos(true);
    try {
      await ApiService.reportIncident({
        tripId: activeTrip.id,
        type: 'ACCIDENT',
        severity: 'CRITICAL',
        location: `${currentStopName} (${gpsCoords ? `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'En-route'})`,
        description: '🚨 CRITICAL EMERGENCY SOS ACTIVATED BY DRIVER FROM HIGHWAY COCKPIT',
      });
      playBoardingSound('error');
      setSosSentSuccess(true);
      showToast('🚨 SOS DISTRESS BROADCAST SENT TO DISPATCH & EMERGENCY SERVICES!', 'error');
      setTimeout(() => {
        setShowSosModal(false);
        setSosSentSuccess(false);
      }, 3000);
    } catch (err: any) {
      showToast('Could not dispatch SOS distress beacon.', 'error');
    } finally {
      setIsSendingSos(false);
    }
  };

  // Log Fuel Expense
  const handleLogFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingFuel(true);
    try {
      showToast(`Fuel refill of ${fuelLitres}L (KES ${Number(fuelCostKsh).toLocaleString()}) logged at ${fuelStation}.`, 'success');
      playBoardingSound('success');
      setShowFuelModal(false);
    } catch (err: any) {
      showToast('Failed to log fuel entry.', 'error');
    } finally {
      setIsLoggingFuel(false);
    }
  };

  const filteredPassengers = manifestPassengers.filter((p) => {
    if (filterBoarded === 'BOARDED' && !p.boarded) return false;
    if (filterBoarded === 'PENDING' && p.boarded) return false;

    if (searchManifest.trim()) {
      const q = searchManifest.toLowerCase();
      return (
        p.fullName?.toLowerCase().includes(q) ||
        p.seatNumber?.toLowerCase().includes(q) ||
        p.idNumber?.toLowerCase().includes(q) ||
        p.bookingReference?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const boardedCount = manifestPassengers.filter((p) => p.boarded).length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center space-y-4">
        <Bus className="w-12 h-12 text-amber-500 animate-bounce mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Loading TransCar Driver Operations Cockpit...</h2>
        <p className="text-xs text-slate-500 font-bold">Synchronizing real-time telemetry, passenger manifest and gate scanner</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Real-Time Toast Notification Bar */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl border-2 flex items-center gap-3 text-xs font-black animate-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-500'
              : toastMessage.type === 'warning'
              ? 'bg-amber-950 text-amber-100 border-amber-500'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-500'
              : 'bg-slate-950 text-white border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
          {toastMessage.type === 'info' && <Radio className="w-5 h-5 text-sky-400 flex-shrink-0" />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/20 rounded-lg ml-auto cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Driver Profile Header Banner */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400 border-2 border-slate-950 flex items-center justify-center text-slate-950 shadow-lg flex-shrink-0">
            <UserCheck className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest bg-amber-400 px-2.5 py-0.5 rounded-md border border-slate-950">
                CERTIFIED PSV CAPTAIN
              </span>
              <span className="text-xs text-slate-300 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                DL: {driverData?.licenseNumber || 'DL-FRK8492'}
              </span>
              {gpsActive && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  GPS Tracking ON
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              Captain Frankline Orora
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Assigned Shuttle:{' '}
              <span className="font-mono font-black text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-amber-400/40">
                {assignedVehicle?.registrationNumber || 'KDE 416Q'}
              </span>{' '}
              ({assignedVehicle?.model || 'Toyota HiAce Executive 11-Seater'})
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* Audio Chime Test */}
          <button
            type="button"
            onClick={() => {
              playBoardingSound('success');
              showToast('Audio speaker chime tested successfully!', 'info');
            }}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 hover:border-amber-400 transition-all cursor-pointer active:scale-95"
            title="Test Boarding Gate Sound Chime"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* GPS Broadcast Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !gpsActive;
              setGpsActive(next);
              showToast(next ? 'Live GPS Geolocation Telemetry Active!' : 'Live GPS Geolocation turned off.', next ? 'success' : 'info');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              gpsActive
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${gpsActive ? 'animate-pulse' : ''}`} />
            <span>{gpsActive ? 'Live GPS Active' : 'Enable GPS'}</span>
          </button>

          {/* Fuel / Expense Log */}
          <button
            type="button"
            onClick={() => setShowFuelModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Log Highway Fuel or Toll"
          >
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Log Fuel</span>
          </button>

          {/* Emergency SOS Button */}
          <button
            type="button"
            onClick={() => setShowSosModal(true)}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black border border-rose-400 shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Broadcast Emergency SOS Beacon"
          >
            <Siren className="w-3.5 h-3.5 animate-bounce" />
            <span>SOS</span>
          </button>

          {/* Refresh Data */}
          <button
            type="button"
            onClick={loadDriverDashboard}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
            title="Refresh Manifest & Highway Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900 font-bold text-xs transition-all cursor-pointer active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Internal Announcements Bar */}
      {announcements.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-xs font-black text-amber-950 uppercase tracking-wider block">
              Central Dispatch Live Notification
            </span>
            <p className="text-xs text-amber-900 mt-0.5 font-medium">{announcements[0]?.content}</p>
          </div>
        </div>
      )}

      {/* 31. DRIVER PORTAL: TODAY'S TRIP MOBILE-FIRST SUMMARY */}
      {activeTrip && (
        <div className="craft-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-amber-400">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 block">
              TODAY&apos;S TRIP
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              {activeTrip.route.origin} → {activeTrip.route.destination}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700 pt-0.5">
              <span className="font-mono font-bold text-slate-950">
                {new Date(activeTrip.departureTime).toLocaleTimeString('en-KE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="text-slate-300">•</span>
              <span>{assignedVehicle?.seatingCapacity || activeTrip.totalSeats || 14}-Seater</span>
              <span className="text-slate-300">•</span>
              <span className="status-positive font-mono">
                {manifestPassengers.length} / {assignedVehicle?.seatingCapacity || activeTrip.totalSeats || 14} passengers booked
              </span>
            </div>
          </div>

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('driver-manifest-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="craft-btn-secondary px-4 py-2.5 text-xs font-bold min-h-[44px]"
            >
              View Manifest
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('driver-status-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="craft-btn-amber px-4 py-2.5 text-xs font-bold min-h-[44px]"
            >
              Update Trip Status
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Trip Telematics & Passenger Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Trip Status Cockpit */}
        <div id="driver-status-panel" className="lg:col-span-1 space-y-6">
          {/* Active Trip Telematics Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-amber-500" />
                <span>Assigned Highway Trip</span>
              </h3>
              {activeTrip && (
                <span className="text-xs font-mono font-black text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-lg border border-slate-950">
                  {activeTrip.tripCode}
                </span>
              )}
            </div>

            {activeTrip ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">
                    Route Corridor
                  </span>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {activeTrip.route.origin} → {activeTrip.route.destination}
                  </p>
                  <p className="text-slate-500 text-[11px]">{activeTrip.route.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">Departure</span>
                    <span className="font-black text-slate-900 text-sm mt-0.5 block">
                      {new Date(activeTrip.departureTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">Est. Arrival</span>
                    <span className="font-black text-slate-900 text-sm mt-0.5 block">
                      {new Date(activeTrip.estimatedArrivalTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Quick Status One-Tap Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                    Quick Status Broadcast:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { id: 'SCHEDULED', label: 'At Terminal', color: 'bg-slate-100 hover:bg-slate-200 text-slate-800' },
                      { id: 'BOARDING', label: 'Boarding Gate', color: 'bg-sky-100 hover:bg-sky-200 text-sky-900' },
                      { id: 'IN_TRANSIT', label: 'In Transit', color: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900' },
                      { id: 'AT_STOP', label: 'Rest Break', color: 'bg-amber-100 hover:bg-amber-200 text-amber-900' },
                      { id: 'DELAYED', label: 'Congestion', color: 'bg-rose-100 hover:bg-rose-200 text-rose-900' },
                      { id: 'ARRIVED', label: 'Arrived', color: 'bg-purple-100 hover:bg-purple-200 text-purple-900' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleUpdateStatus(st.id)}
                        disabled={isUpdatingStatus}
                        className={`px-2 py-1.5 rounded-xl font-black text-[11px] border transition-all cursor-pointer active:scale-95 ${
                          currentStatus === st.id
                            ? 'bg-slate-950 text-amber-400 border-slate-950 shadow-md ring-2 ring-amber-400/40'
                            : `${st.color} border-transparent`
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Waypoint Quick Picker */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                    Current Waypoint:
                  </label>
                  <input
                    type="text"
                    required
                    value={currentStopName}
                    onChange={(e) => setCurrentStopName(e.target.value)}
                    placeholder="e.g. Narok Town Stage"
                    className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-xl font-bold focus:border-slate-950 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {waypoints.slice(0, 5).map((wp) => (
                      <button
                        key={wp}
                        type="button"
                        onClick={() => {
                          setCurrentStopName(wp);
                          showToast(`Waypoint set to ${wp}`, 'info');
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 transition-colors cursor-pointer"
                      >
                        {wp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed & Delay Controls */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1">
                      Speed: {currentSpeed} km/h
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[0, 40, 60, 80].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setCurrentSpeed(spd)}
                          className={`py-1 text-[10px] font-mono font-black rounded-lg border transition-all cursor-pointer active:scale-95 ${
                            currentSpeed === spd
                              ? 'bg-slate-950 text-amber-400 border-slate-950'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          {spd}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1">
                      Delay: {delayMinutes}m
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {[0, 15, 30].map((dm) => (
                        <button
                          key={dm}
                          type="button"
                          onClick={() => setDelayMinutes(dm)}
                          className={`py-1 text-[10px] font-mono font-black rounded-lg border transition-all cursor-pointer active:scale-95 ${
                            delayMinutes === dm
                              ? 'bg-amber-400 text-slate-950 border-slate-950'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          {dm === 0 ? '0' : `+${dm}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus()}
                  disabled={isUpdatingStatus}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs rounded-xl shadow-lg border-2 border-slate-950 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Broadcast Telematics & Status</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">No trips currently assigned for today.</p>
            )}
          </div>

          {/* Pre-Trip Vehicle Inspection Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-500" />
                <span>NTSA Pre-Trip Inspection</span>
              </h3>
              <button
                type="button"
                onClick={handleCheckAllInspection}
                className="text-[11px] font-black text-amber-700 hover:text-black underline cursor-pointer"
              >
                Pass All
              </button>
            </div>

            <form onSubmit={handleSubmitChecklist} className="space-y-3 text-xs">
              <div className="space-y-1.5">
                {[
                  { key: 'tiresChecked', label: 'Tires & Tread Depth (Min 3mm)' },
                  { key: 'brakesChecked', label: 'Brakes & Air Pressure Gauges' },
                  { key: 'lightsChecked', label: 'Headlamps & Brake Lights' },
                  { key: 'wipersChecked', label: 'Windshield Wipers & Washer Fluid' },
                  { key: 'emergencyExitsChecked', label: 'Emergency Exit Doors & Hammers' },
                  { key: 'firstAidKitChecked', label: 'Stocked First Aid Medical Kit' },
                  { key: 'fireExtinguisherChecked', label: 'Fire Extinguisher Charged' },
                  { key: 'speedGovernorSealChecked', label: '80 km/h Governor Seal Intact' },
                ].map((item) => {
                  const isChecked = (checklist as any)[item.key];
                  return (
                    <label
                      key={item.key}
                      onClick={() => setChecklist((prev) => ({ ...prev, [item.key]: !isChecked }))}
                      className="flex items-center gap-2.5 text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-colors select-none"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className={isChecked ? 'font-bold text-slate-900' : 'text-slate-600'}>
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Inspection Outcome
                </label>
                <select
                  value={checklistStatus}
                  onChange={(e) => setChecklistStatus(e.target.value as any)}
                  className={`w-full p-2 rounded-xl text-xs font-black border-2 ${
                    checklistStatus === 'PASS'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  <option value="PASS">PASS: Coach Cleared for Departure</option>
                  <option value="FAIL_NEEDS_MAINTENANCE">FAIL: Flag Workshop Maintenance</option>
                </select>
              </div>

              {checklistSubmitted && (
                <div className="p-2.5 bg-emerald-50 border-2 border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Inspection logged to central database. Roadworthy!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingChecklist}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingChecklist ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                <span>Submit Safety Inspection</span>
              </button>
            </form>
          </div>

          {/* Incident Report Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Report Highway Incident</span>
            </h3>

            <form onSubmit={handleSubmitIncident} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Incident Type
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as any)}
                  className="w-full p-2 rounded-xl text-xs font-bold border-2 border-slate-200 bg-slate-50 focus:border-slate-950 focus:outline-none"
                >
                  <option value="TRAFFIC_DELAY">Heavy Traffic / Roadwork Delay</option>
                  <option value="MECHANICAL_FAULT">Mechanical Warning Light</option>
                  <option value="BREAKDOWN">Vehicle Puncture / Breakdown</option>
                  <option value="MEDICAL_EMERGENCY">Passenger Medical Issue</option>
                  <option value="ACCIDENT">Road Obstruction / Collision</option>
                  <option value="WEATHER">Severe Rain / Flooding</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Salama Stretch"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-xl font-bold focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Context / Notes
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Briefly describe the situation..."
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  className="w-full text-xs p-2.5 border-2 border-slate-200 rounded-xl font-medium focus:border-slate-950 focus:outline-none"
                />
              </div>

              {incidentSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border-2 border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl">
                  {incidentSuccessMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingIncident}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingIncident ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                <span>Send Incident Alert</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Columns (Span 2): Verify Passenger (Search + QR Scanner) & Passenger Manifest */}
        <div id="driver-manifest-panel" className="lg:col-span-2 space-y-6">
          {/* VERIFY PASSENGER SECTION (Unified Ticket Search + QR Scanner) */}
          <div className="bg-slate-950 text-white rounded-3xl border-2 border-amber-400 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md border border-slate-950">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Verify Passenger
                    </h2>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                      Search + QR
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">Assigned Trip:</span>
                    {allAssignedTrips.length > 1 ? (
                      <select
                        value={activeTrip?.id || ''}
                        onChange={(e) => handleSelectDriverTrip(e.target.value)}
                        className="bg-slate-900 text-amber-400 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-700 focus:border-amber-400 focus:outline-none cursor-pointer"
                      >
                        {allAssignedTrips.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.route.origin} → {t.route.destination} (
                            {new Date(t.departureTime).toLocaleTimeString('en-KE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            ) • {t.vehicle?.registrationNumber}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <strong className="text-amber-400 text-xs">
                        {activeTrip
                          ? `${activeTrip.route.origin} → ${activeTrip.route.destination} (${new Date(
                              activeTrip.departureTime,
                            ).toLocaleTimeString('en-KE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })})`
                          : 'Loading Trip...'}
                      </strong>
                    )}
                    <span className="text-xs text-slate-400">
                      • Vehicle:{' '}
                      <strong className="text-white font-mono">
                        {assignedVehicle?.registrationNumber ||
                          activeTrip?.vehicle?.registrationNumber ||
                          'KDE 416Q'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Dedicated "Scan Ticket QR" Primary Action Button */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="toggle-driver-camera-btn"
                  onClick={() => {
                    setCameraError(null);
                    setCameraActive(!cameraActive);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                    cameraActive
                      ? 'bg-rose-600 text-white border-rose-400 shadow-lg'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-lg'
                  }`}
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>{cameraActive ? 'Close QR Scanner' : '📷 Scan Ticket QR'}</span>
                </button>

                {cameraActive && (
                  <button
                    type="button"
                    onClick={() =>
                      setCameraFacing((prev) =>
                        prev === 'environment' ? 'user' : 'environment',
                      )
                    }
                    className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Switch Rear / Front Camera"
                  >
                    <SwitchCamera className="w-4 h-4 text-amber-400" />
                    <span>{cameraFacing === 'environment' ? 'Rear Cam' : 'Front Cam'}</span>
                  </button>
                )}

                <button
                  type="button"
                  id="upload-qr-photo-btn"
                  disabled={isDecodingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Upload or take a photo of a ticket QR code"
                >
                  {isDecodingFile ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Upload className="w-4 h-4 text-amber-400" />
                  )}
                  <span>{isDecodingFile ? 'Reading QR...' : 'Upload QR'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Interactive Sample Scannable QR Cards Drawer */}
            {showSampleQrCards && (
              <div className="p-4 rounded-2xl bg-slate-900/95 border border-slate-700 space-y-3 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" />
                      Live Scannable Passenger QR Codes (Test Camera, Upload, or 1-Tap Scan)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Scan any QR below with another device camera, save its PNG to test &quot;Upload QR&quot;, or click &quot;Simulate QR Scan&quot;.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSampleQrCards(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'TCR-7X4K9P2M',
                      tokenUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://transcar.co.ke'}/ticket/verify/tcr_tok_7x4k9p2m_f9a8c3d2e1b0476589ab`,
                      label: 'Valid Ticket • Seat 2B',
                      pax: 'Frankline Gwaro',
                      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    },
                    {
                      id: 'TCR-4M8Q2L9K',
                      tokenUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://transcar.co.ke'}/ticket/verify/tcr_tok_4m8q2l9k_81c4d7e2a9f30b1654cd`,
                      label: 'Already Boarded • Seat 1A',
                      pax: 'Frankline Orora',
                      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    },
                    {
                      id: 'TCR-5P2H8K6D',
                      tokenUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://transcar.co.ke'}/ticket/verify/tcr_tok_5p2h8k6d_90f1e4c7b2a83d6519cd`,
                      label: 'Payment Pending • Seat 3A',
                      pax: 'Brian Ochieng Otieno',
                      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    },
                    {
                      id: 'TCR-9W3N5V8R',
                      tokenUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://transcar.co.ke'}/ticket/verify/tcr_tok_9w3n5v8r_32d7b4a9c6e180f523ab`,
                      label: 'Wrong Trip • 07:00 AM',
                      pax: 'Kelvin Mogaka Ombati',
                      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center gap-2"
                    >
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${item.badge}`}>
                        {item.label}
                      </span>
                      <div className="bg-white p-2 rounded-xl border border-slate-700">
                        {sampleQrImages[item.id] ? (
                          <img
                            src={sampleQrImages[item.id]}
                            alt={item.id}
                            className="w-28 h-28 object-contain"
                          />
                        ) : (
                          <div className="w-28 h-28 flex items-center justify-center text-[10px] text-slate-400">
                            Generating...
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{item.pax}</p>
                        <p className="text-[11px] font-mono text-amber-400 font-bold">{item.id}</p>
                      </div>
                      <div className="flex items-center gap-1.5 w-full pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setQrScanInput(item.tokenUrl);
                            handleValidateTicket(item.tokenUrl, 'QR');
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] cursor-pointer"
                        >
                          Simulate QR Scan
                        </button>
                        {sampleQrImages[item.id] && (
                          <a
                            href={sampleQrImages[item.id]}
                            download={`TransCar-QR-${item.id}.png`}
                            className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px]"
                            title="Download QR PNG to test Upload QR"
                          >
                            PNG
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Camera Viewfinder & QR Frame Processor */}
            {cameraActive && (
              <div className="relative rounded-2xl overflow-hidden bg-neutral-950 border-2 border-amber-400 max-w-lg mx-auto aspect-video flex items-center justify-center shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    cameraLoading || cameraError ? 'opacity-0' : 'opacity-100'
                  }`}
                />

                {cameraLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/90 text-amber-400 gap-3 p-4 text-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        Starting Rear Camera QR Scanner...
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Point camera at passenger&apos;s TransCar QR code
                      </p>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 text-white gap-3 p-6 text-center z-20">
                    <div className="w-10 h-10 rounded-full bg-rose-900/50 border border-rose-500/50 flex items-center justify-center text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">
                        Camera Unavailable
                      </h4>
                      <p className="text-xs text-neutral-300 max-w-sm mt-1 leading-relaxed">
                        {cameraError}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer"
                      >
                        Upload Ticket Photo Instead
                      </button>
                      <button
                        type="button"
                        onClick={() => setCameraActive(false)}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Use Ticket Search
                      </button>
                    </div>
                  </div>
                )}

                {!cameraLoading && !cameraError && (
                  <>
                    <div className="absolute inset-10 sm:inset-12 border-2 border-dashed border-amber-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
                      <div className="w-full h-0.5 bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-pulse" />
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                    </div>

                    {scanFlash && (
                      <div className="absolute inset-0 bg-emerald-500/30 border-4 border-emerald-400 rounded-2xl flex items-center justify-center z-10 animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-2xl flex items-center gap-2 border-2 border-white">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>QR TOKEN EXTRACTED • VALIDATING...</span>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-neutral-700 px-2.5 py-1 rounded-lg text-[10px] text-amber-300 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>REAR CAMERA QR SCANNER ACTIVE</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCameraActive(false)}
                      className="absolute top-3 right-3 p-1.5 bg-black/80 hover:bg-black border border-neutral-700 rounded-lg text-white text-xs cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Ticket / Booking / Passenger Search Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidateTicket(qrScanInput, 'SEARCH');
              }}
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    id="driver-qr-scan-input"
                    value={qrScanInput}
                    onChange={(e) => setQrScanInput(e.target.value)}
                    placeholder="Search ticket ID, booking ID, passenger name or phone number"
                    className="w-full pl-10 pr-10 py-3 bg-slate-900 text-white placeholder:text-slate-400 text-xs sm:text-sm font-medium rounded-xl border-2 border-slate-700 focus:border-amber-400 focus:outline-none transition-all"
                  />
                  {qrScanInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setQrScanInput('');
                        setVerificationResult(null);
                        setSearchMatches([]);
                      }}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  id="driver-validate-ticket-btn"
                  disabled={isScanning || !qrScanInput.trim()}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm border-2 border-amber-300 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isScanning ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <Search className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>🔍 Search Ticket</span>
                </button>
              </div>

              {/* Quick Verification Simulators for Testing All Scenarios */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Quick Verify Tests:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setQrScanInput('TCR-7X4K9P2M');
                    handleValidateTicket('TCR-7X4K9P2M', 'SEARCH');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>TCR-7X4K9P2M (Valid)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrScanInput('TCR-5B8W4K9P');
                    handleValidateTicket('TCR-5B8W4K9P', 'SEARCH');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>TCR-5B8W4K9P (Payment Pending)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrScanInput('TCR-8H2N6V4Q');
                    handleValidateTicket('TCR-8H2N6V4Q', 'SEARCH');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-orange-300 border border-slate-700 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>TCR-8H2N6V4Q (Wrong Trip)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrScanInput('TCR-INVALID99');
                    handleValidateTicket('TCR-INVALID99', 'SEARCH');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-700 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>TCR-INVALID99 (Not Found)</span>
                </button>
              </div>
            </form>

            {/* Multiple Search Results Selector (if phone/name matched several passengers) */}
            {searchMatches.length > 1 && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Matching Tickets Found ({searchMatches.length}) — Select Passenger:
                </span>
                <div className="flex flex-wrap gap-2">
                  {searchMatches.map((match, idx) => {
                    const t = match.ticket;
                    if (!t) return null;
                    const isSelected =
                      verificationResult?.ticket?.ticket_id === t.ticket_id;
                    return (
                      <button
                        key={t.ticket_id || idx}
                        type="button"
                        onClick={() => setVerificationResult(match)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                            : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-amber-400'
                        }`}
                      >
                        {t.passenger_name} • Seat {t.seat_number} ({t.ticket_id})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PASSENGER VERIFICATION CARD */}
            {verificationResult && (
              <div
                id="passenger-verification-card"
                className={`rounded-3xl border-2 p-5 sm:p-6 animate-in fade-in duration-150 space-y-5 ${
                  verificationResult.code === 'VALID' ||
                  verificationResult.code === 'BOARDED'
                    ? 'bg-emerald-950/95 border-emerald-400 text-white'
                    : verificationResult.code === 'ALREADY_BOARDED' ||
                        verificationResult.code === 'WRONG_TRIP' ||
                        verificationResult.code === 'DATE_MISMATCH' ||
                        verificationResult.code === 'PAYMENT_PENDING'
                      ? 'bg-amber-950/95 border-amber-400 text-white'
                      : 'bg-rose-950/95 border-rose-500 text-white'
                }`}
              >
                {/* Verification Header Row */}
                <div className="flex items-start justify-between gap-3 border-b border-white/15 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black ${
                        verificationResult.code === 'VALID' ||
                        verificationResult.code === 'BOARDED'
                          ? 'bg-emerald-400 text-slate-950'
                          : verificationResult.code === 'ALREADY_BOARDED' ||
                              verificationResult.code === 'WRONG_TRIP' ||
                              verificationResult.code === 'DATE_MISMATCH' ||
                              verificationResult.code === 'PAYMENT_PENDING'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-rose-500 text-white'
                      }`}
                    >
                      {verificationResult.code === 'VALID' ||
                      verificationResult.code === 'BOARDED' ? (
                        <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black tracking-wide uppercase">
                        {verificationResult.title}
                      </h3>
                      <p className="text-xs text-white/80 font-medium mt-0.5">
                        {verificationResult.message}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setVerificationResult(null);
                      setSearchMatches([]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/70 text-xs font-bold text-white/80 hover:text-white border border-white/15 cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {/* Detailed Ticket Data when a Ticket Record exists */}
                {verificationResult.ticket && (
                  <div className="space-y-4">
                    {/* Passenger Name & Primary Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/35 p-4 rounded-2xl border border-white/10">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block">
                          PASSENGER
                        </span>
                        <p className="text-xl sm:text-2xl font-black text-white">
                          {verificationResult.ticket.passenger_name}
                        </p>
                        <span className="text-xs text-white/75 font-mono">
                          Phone: {verificationResult.ticket.passenger_phone}
                        </span>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 block">
                          STATUS
                        </span>
                        <span
                          className={`inline-block mt-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                            verificationResult.code === 'VALID'
                              ? 'bg-emerald-400 text-slate-950 border-white'
                              : verificationResult.code === 'BOARDED'
                                ? 'bg-emerald-300 text-slate-950 border-white'
                                : verificationResult.code === 'ALREADY_BOARDED'
                                  ? 'bg-amber-400 text-slate-950 border-amber-200'
                                  : 'bg-rose-500 text-white border-rose-300'
                          }`}
                        >
                          {verificationResult.code === 'VALID'
                            ? 'READY FOR BOARDING'
                            : verificationResult.code === 'BOARDED'
                              ? '✓ PASSENGER BOARDED'
                              : verificationResult.code.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Wrong Trip Comparison Box (Section 10) */}
                    {verificationResult.code === 'WRONG_TRIP' &&
                      verificationResult.expectedTrip && (
                        <div className="p-4 rounded-2xl bg-black/50 border-2 border-amber-400/80 text-xs space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-rose-300 block">
                                THIS TICKET BELONGS TO:
                              </span>
                              <p className="font-black text-sm text-white">
                                {verificationResult.ticket.route}
                              </p>
                              <p className="text-white/80 font-mono">
                                Departure:{' '}
                                <strong>
                                  {verificationResult.ticket.departure_time}
                                </strong>{' '}
                                • Vehicle:{' '}
                                <strong>
                                  {verificationResult.ticket.vehicle_registration}
                                </strong>
                              </p>
                            </div>
                            <div className="space-y-1 sm:border-l border-white/15 sm:pl-3">
                              <span className="text-[10px] font-black uppercase text-emerald-300 block">
                                CURRENT DRIVER TRIP:
                              </span>
                              <p className="font-black text-sm text-white">
                                {verificationResult.expectedTrip.route}
                              </p>
                              <p className="text-white/80 font-mono">
                                Departure:{' '}
                                <strong>
                                  {verificationResult.expectedTrip.departureTime}
                                </strong>{' '}
                                • Vehicle:{' '}
                                <strong>
                                  {
                                    verificationResult.expectedTrip
                                      .vehicleRegistration
                                  }
                                </strong>
                              </p>
                            </div>
                          </div>
                          {verificationResult.ticket.trip_id &&
                            allAssignedTrips.some(
                              (t) => t.id === verificationResult.ticket?.trip_id,
                            ) && (
                              <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-amber-200">
                                  Operating {verificationResult.ticket.route} ({verificationResult.ticket.departure_time}) instead?
                                </span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const targetId = verificationResult.ticket!.trip_id;
                                    await handleSelectDriverTrip(targetId);
                                    handleValidateTicket(
                                      verificationResult.ticket!.qr_token ||
                                        verificationResult.ticket!.ticket_id,
                                      'QR',
                                      targetId,
                                    );
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shrink-0"
                                >
                                  Switch Driver Trip & Re-Verify
                                </button>
                              </div>
                            )}
                        </div>
                      )}

                    {/* Already Boarded Protection Details (Section 9) */}
                    {(verificationResult.code === 'ALREADY_BOARDED' ||
                      verificationResult.code === 'BOARDED') && (
                      <div className="p-4 rounded-2xl bg-black/45 border border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/60 block">
                            Passenger
                          </span>
                          <span className="font-black text-white">
                            {verificationResult.ticket.passenger_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/60 block">
                            Seat
                          </span>
                          <span className="font-black font-mono text-amber-300 text-sm">
                            {verificationResult.ticket.seat_number}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/60 block">
                            Boarded At
                          </span>
                          <span className="font-black font-mono text-white">
                            {verificationResult.ticket.verified_at
                              ? new Date(
                                  verificationResult.ticket.verified_at,
                                ).toLocaleTimeString('en-KE', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Just now'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/60 block">
                            Verified By
                          </span>
                          <span className="font-black text-emerald-300">
                            {verificationResult.ticket.verified_by_name ||
                              driverData?.name ||
                              'Frankline Orora'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Ticket Attributes Grid (Section 7) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-white/60 block">
                          Ticket
                        </span>
                        <span className="font-mono font-black text-amber-300 text-sm">
                          {verificationResult.ticket.ticket_id}
                        </span>
                        <span className="text-[10px] font-mono text-white/60 block">
                          Ref: {verificationResult.ticket.booking_reference}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-white/60 block">
                          Route
                        </span>
                        <span className="font-black text-white text-sm block">
                          {verificationResult.ticket.route}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-white/60 block">
                          Travel Date
                        </span>
                        <span className="font-black text-white block">
                          {new Date(
                            verificationResult.ticket.travel_date,
                          ).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-white/60 block">
                          Departure
                        </span>
                        <span className="font-black font-mono text-white text-sm block">
                          {verificationResult.ticket.departure_time}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-white/60 block">
                          Seat
                        </span>
                        <span className="font-black font-mono text-amber-300 text-base block">
                          {verificationResult.ticket.seat_number}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-white/60 block">
                          Vehicle
                        </span>
                        <span className="font-black font-mono text-white text-sm block">
                          {verificationResult.ticket.vehicle_registration}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-white/60 block">
                          Payment
                        </span>
                        <span
                          className={`font-black text-sm block ${
                            verificationResult.ticket.payment_status === 'PAID'
                              ? 'text-emerald-300'
                              : 'text-amber-300'
                          }`}
                        >
                          {verificationResult.ticket.payment_status} (KES{' '}
                          {verificationResult.ticket.fare.toLocaleString()})
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                        <span className="text-[10px] font-bold uppercase text-white/60 block">
                          Booking Status
                        </span>
                        <span className="font-black text-white text-sm block">
                          {verificationResult.ticket.booking_status}
                        </span>
                      </div>
                    </div>

                    {/* Large Touch Action: MARK AS BOARDED (Sections 7 & 8) */}
                    {verificationResult.valid &&
                      verificationResult.code === 'VALID' && (
                        <button
                          type="button"
                          id="mark-as-boarded-btn"
                          disabled={isBoardingConfirming}
                          onClick={() =>
                            handleConfirmBoarding(verificationResult.ticket)
                          }
                          className="w-full py-4 px-6 rounded-2xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-black text-base sm:text-lg tracking-wide uppercase shadow-xl border-2 border-white flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
                        >
                          {isBoardingConfirming ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <UserCheck className="w-6 h-6 stroke-[2.5]" />
                          )}
                          <span>MARK AS BOARDED</span>
                        </button>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Passenger Boarding Manifest Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>Passenger Boarding Manifest</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify National ID/Passport at sliding door and check in boarding passengers
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-950 bg-amber-400 border border-slate-950 px-3 py-1 rounded-xl shadow-sm">
                  Boarded: {boardedCount} / {manifestPassengers.length}
                </span>

                <button
                  type="button"
                  onClick={handleBoardAllRemaining}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                  title="Check in all remaining unboarded passengers"
                >
                  Check In All
                </button>

                <button
                  type="button"
                  onClick={handlePrintManifest}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Print or export passenger manifest"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Sheet</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search passenger name, ID, seat number..."
                  value={searchManifest}
                  onChange={(e) => setSearchManifest(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border-2 border-slate-200 rounded-xl font-bold focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1">
                {(['ALL', 'PENDING', 'BOARDED'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setFilterBoarded(filter)}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
                      filterBoarded === filter
                        ? 'bg-slate-950 text-amber-400 shadow-md border border-slate-950'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'ALL' ? 'All Seats' : filter === 'PENDING' ? 'Awaiting' : 'Boarded'}
                  </button>
                ))}
              </div>
            </div>

            {/* Manifest Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-2">Seat</th>
                    <th className="py-3 px-2">Passenger Legal Name</th>
                    <th className="py-3 px-2">ID / Phone</th>
                    <th className="py-3 px-2">Ticket ID / Ref</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPassengers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                        No passengers found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPassengers.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-2">
                          <span className="font-mono font-black text-sm text-slate-950 bg-amber-400/30 px-2.5 py-1 rounded-lg border border-amber-400/60">
                            {p.seatNumber}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-bold text-slate-900 block">{p.fullName}</span>
                          <span className="text-[10px] text-slate-400">Class: {p.seatClass || 'Standard'}</span>
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-700">
                          <span className="block">{p.idNumber || '—'}</span>
                          {p.contactPhone && (
                            <span className="text-[10px] text-slate-400 block">{p.contactPhone}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 font-mono">
                          <span className="text-slate-900 font-black block">
                            {p.ticketId || p.bookingReference}
                          </span>
                          {p.ticketId && (
                            <span className="text-[10px] text-amber-700 font-bold block">
                              Ref: {p.bookingReference}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit ${
                              p.boarded
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {p.boarded ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Boarded</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Awaiting</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const codeToVerify = p.ticketId || p.bookingReference || p.id;
                                setQrScanInput(codeToVerify);
                                handleValidateTicket(codeToVerify, 'SEARCH');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold text-[11px] border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                              title="Verify passenger ticket"
                            >
                              <Scan className="w-3 h-3 text-amber-600" />
                              <span className="hidden sm:inline">Verify</span>
                            </button>

                            <button
                              id={`board-btn-${p.id}`}
                              onClick={() => handleToggleBoarding(p.id, p.boarded)}
                              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer active:scale-95 ${
                                p.boarded
                                  ? 'bg-slate-200 text-slate-700 hover:bg-rose-100 hover:text-rose-700 border border-slate-300'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
                              }`}
                            >
                              {p.boarded ? 'Undo' : 'Check In'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-950 rounded-3xl border-4 border-rose-600 max-w-md w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                <Siren className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-rose-500 tracking-tight">EMERGENCY SOS BEACON</h3>
              <p className="text-xs text-slate-300">
                Instantly alert Central Fleet Dispatch, Highway Police, and Emergency Medical Services with live GPS coordinates.
              </p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1 font-mono">
              <div><strong>Vehicle:</strong> {assignedVehicle?.registrationNumber || 'KDE 416Q'}</div>
              <div><strong>Captain:</strong> Frankline Orora</div>
              <div><strong>Location:</strong> {currentStopName}</div>
            </div>

            {sosSentSuccess && (
              <div className="p-3 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs font-bold rounded-xl text-center">
                ✅ Distress beacon received by Central Operations! Help dispatched.
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingSos}
                onClick={handleTriggerSos}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSendingSos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Siren className="w-4 h-4" />}
                <span>Confirm SOS Distress</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fuel / Expense Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border-2 border-black max-w-md w-full p-6 text-black space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black">Log Highway Fuel Expense</h3>
              </div>
              <button onClick={() => setShowFuelModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogFuel} className="space-y-3 text-xs">
              <div>
                <label className="block font-black mb-1">Fuel Station</label>
                <input
                  type="text"
                  required
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black mb-1">Litres Dispensed</label>
                  <input
                    type="number"
                    required
                    value={fuelLitres}
                    onChange={(e) => setFuelLitres(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl font-mono font-bold focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-black mb-1">Total Cost (KES)</label>
                  <input
                    type="number"
                    required
                    value={fuelCostKsh}
                    onChange={(e) => setFuelCostKsh(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl font-mono font-bold focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="px-4 py-2 border-2 border-neutral-200 rounded-xl font-bold hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingFuel}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-xl border border-black shadow flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {isLoggingFuel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Fuel Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
