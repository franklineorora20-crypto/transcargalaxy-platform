import React from 'react';
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
} from 'lucide-react';
import jsQR from 'jsqr';
import { Trip, Passenger, VehicleInspection, IncidentReport } from '../../types';
import { ApiService } from '../../services/api';
import { playBoardingSound } from '../../utils/audio';

interface DriverPortalProps {
  driverData: any;
  onLogout: () => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({ driverData, onLogout }) => {
  const [activeTrip, setActiveTrip] = React.useState<Trip | null>(null);
  const [assignedVehicle, setAssignedVehicle] = React.useState<any>(null);
  const [manifestPassengers, setManifestPassengers] = React.useState<any[]>([]);
  const [announcements, setAnnouncements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // QR Boarding Validator State
  const [qrScanInput, setQrScanInput] = React.useState('');
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<{
    status: 'SUCCESS' | 'ALREADY_BOARDED' | 'ERROR';
    message: string;
    passenger?: any;
    booking?: any;
  } | null>(null);
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraFacing, setCameraFacing] = React.useState<'environment' | 'user'>('environment');
  const [cameraLoading, setCameraLoading] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [scanFlash, setScanFlash] = React.useState(false);
  const [isDecodingFile, setIsDecodingFile] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const lastScannedCodeRef = React.useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Manifest search & filter
  const [searchManifest, setSearchManifest] = React.useState('');
  const [filterBoarded, setFilterBoarded] = React.useState<'ALL' | 'BOARDED' | 'PENDING'>('ALL');

  // Status Updater modal / state
  const [currentStatus, setCurrentStatus] = React.useState<string>('IN_TRANSIT');
  const [currentStopName, setCurrentStopName] = React.useState('Machakos Junction');
  const [currentSpeed, setCurrentSpeed] = React.useState(74);
  const [delayMinutes, setDelayMinutes] = React.useState(0);
  const [delayReason, setDelayReason] = React.useState('');
  const [statusSuccessMsg, setStatusSuccessMsg] = React.useState('');

  // Pre-Trip Checklist state
  const [checklist, setChecklist] = React.useState({
    tiresChecked: true,
    brakesChecked: true,
    lightsChecked: true,
    wipersChecked: true,
    emergencyExitsChecked: true,
    firstAidKitChecked: true,
    fireExtinguisherChecked: true,
    speedGovernorSealChecked: true,
  });
  const [checklistNotes, setChecklistNotes] = React.useState('');
  const [checklistStatus, setChecklistStatus] = React.useState<'PASS' | 'FAIL_NEEDS_MAINTENANCE'>('PASS');
  const [checklistSubmitted, setChecklistSubmitted] = React.useState(false);

  // Incident reporting state
  const [incidentType, setIncidentType] = React.useState<
    'TRAFFIC_DELAY' | 'MECHANICAL_FAULT' | 'BREAKDOWN' | 'MEDICAL_EMERGENCY' | 'ACCIDENT' | 'WEATHER'
  >('TRAFFIC_DELAY');
  const [incidentSeverity, setIncidentSeverity] = React.useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [incidentLocation, setIncidentLocation] = React.useState('');
  const [incidentDesc, setIncidentDesc] = React.useState('');
  const [incidentSuccessMsg, setIncidentSuccessMsg] = React.useState('');

  const loadDriverDashboard = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.getDriverDashboard();
      if (data.assignedTrips && data.assignedTrips.length > 0) {
        const trip = data.assignedTrips[0];
        setActiveTrip(trip);
        setAssignedVehicle(trip.vehicle);
        setCurrentStatus(trip.status);
        setCurrentStopName(trip.currentStop || trip.route.origin);
        setCurrentSpeed(trip.speedKmH || 72);
        setDelayMinutes(trip.delayMinutes || 0);

        // Fetch manifest
        const manifestData = await ApiService.getTripManifest(trip.id);
        setManifestPassengers(manifestData.passengers || []);
      }
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Error loading driver dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDriverDashboard();
  }, [loadDriverDashboard]);

  // Handle Trip Status Update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;

    try {
      const res = await ApiService.updateTripStatus(activeTrip.id, {
        status: currentStatus,
        currentStop: currentStopName,
        speedKmH: currentSpeed,
        delayMinutes: Number(delayMinutes),
        delayReason: delayReason || undefined,
      });
      setActiveTrip(res.trip);
      setStatusSuccessMsg('Trip telemetry & passenger status broadcast updated successfully!');
      setTimeout(() => setStatusSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Could not update status');
    }
  };

  // Handle Quick QR Code / Barcode Boarding Validation
  const handleValidateTicket = async (ticketCodeToValidate?: string) => {
    const code = (ticketCodeToValidate || qrScanInput).trim();
    if (!code) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await ApiService.boardPassenger({
        ticketCode: code,
        tripId: activeTrip?.id,
      });

      if (res.alreadyBoarded) {
        playBoardingSound('warning');
        setScanResult({
          status: 'ALREADY_BOARDED',
          message: res.message || 'Passenger already checked in.',
          passenger: res.passenger,
          booking: res.booking,
        });
      } else {
        playBoardingSound('success');
        setScanResult({
          status: 'SUCCESS',
          message: res.message || 'Passenger verified and boarded successfully!',
          passenger: res.passenger,
          booking: res.booking,
        });
      }

      // Update passenger status in manifest table immediately
      if (res.passenger) {
        setManifestPassengers((prev) =>
          prev.map((p) => {
            const matchesSeat = p.seatNumber === res.passenger.seatNumber;
            const matchesRef = res.booking ? p.bookingReference === res.booking.bookingReference : true;
            if (matchesSeat && matchesRef) {
              return { ...p, boarded: true, hasBoarded: true, boardedAt: new Date().toISOString() };
            }
            return p;
          })
        );
      } else if (activeTrip) {
        // Refresh manifest from backend
        ApiService.getTripManifest(activeTrip.id).then((m) => {
          if (m?.passengers) setManifestPassengers(m.passengers);
        });
      }

      setQrScanInput('');
    } catch (err: any) {
      playBoardingSound('error');
      setScanResult({
        status: 'ERROR',
        message: err.message || 'Validation failed. Ticket invalid or not found on this trip.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Camera video stream handling & real-time frame QR scanner loop
  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let scanIntervalTimer: any = null;
    let isCancelled = false;

    if (cameraActive) {
      setCameraLoading(true);
      setCameraError(null);

      const startCamera = async () => {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API (getUserMedia) is not supported by your browser or environment.');
          }

          // Try requested camera facingMode (environment / user)
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: cameraFacing,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            });
          } catch (constraintErr) {
            console.warn('Camera constraint specific failed, trying default fallback:', constraintErr);
            // Fallback to basic video constraint if overconstrained (e.g. laptop webcam)
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
              console.warn('Video auto-playback deferred:', pErr);
            }
          }
          setCameraLoading(false);

          // Continuous Frame Scanning Loop using jsQR
          const processFrame = () => {
            if (isCancelled || !cameraActive) return;

            const video = videoRef.current;
            if (
              video &&
              video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
              video.videoWidth > 0 &&
              video.videoHeight > 0
            ) {
              if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
              }
              const canvas = canvasRef.current;
              // Target ~640px max dimension for optimal detection speed and accuracy
              const maxDim = Math.max(video.videoWidth, video.videoHeight);
              const scale = maxDim > 640 ? 640 / maxDim : 1;
              const w = Math.floor(video.videoWidth * scale);
              const h = Math.floor(video.videoHeight * scale);

              if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
              }

              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, w, h);
                const imageData = ctx.getImageData(0, 0, w, h);
                try {
                  const qr = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'attemptBoth',
                  });
                  if (qr && qr.data && qr.data.trim()) {
                    const detected = qr.data.trim();
                    const now = Date.now();
                    // Prevent duplicate re-scan within 3 seconds of the same ticket
                    if (
                      detected !== lastScannedCodeRef.current.code ||
                      now - lastScannedCodeRef.current.time > 3000
                    ) {
                      lastScannedCodeRef.current = { code: detected, time: now };
                      setScanFlash(true);
                      setTimeout(() => setScanFlash(false), 1000);
                      handleValidateTicket(detected);
                    }
                  }
                } catch (qrErr) {
                  // Ignore frame decode exceptions
                }
              }
            }
          };

          // Run scan every 90ms
          scanIntervalTimer = setInterval(processFrame, 90);
        } catch (err: any) {
          console.error('Camera access error:', err);
          setCameraLoading(false);
          let msg = 'Could not access device camera.';
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            msg = 'Camera permission was blocked. Please allow camera permissions in your browser URL bar, or use the "Upload QR Photo" button below.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            msg = 'No camera device found on this system. You can upload an image or type the booking reference.';
          } else if (err.name === 'NotReadableError') {
            msg = 'Camera is in use by another application or tab. Please close other camera apps and retry.';
          } else if (err.message) {
            msg = `Camera issue: ${err.message}. You can use Photo Upload or manual ticket input.`;
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

  // Handle QR image file upload / snapshot decoding
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) throw new Error('Canvas rendering context unavailable');

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const qr = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (qr && qr.data && qr.data.trim()) {
            setScanFlash(true);
            setTimeout(() => setScanFlash(false), 1000);
            handleValidateTicket(qr.data.trim());
          } else {
            alert('No readable QR code found in this image. Please ensure the QR code is clear, well-lit, and in sharp focus.');
          }
        } catch (err: any) {
          console.error('Failed to parse uploaded QR image:', err);
          alert('Error processing image: ' + (err.message || 'Unknown error'));
        } finally {
          setIsDecodingFile(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      img.onerror = () => {
        setIsDecodingFile(false);
        alert('Could not load the selected image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Mark Passenger as Boarded
  const handleToggleBoarding = async (passengerId: string, currentVal: boolean) => {
    try {
      await ApiService.updatePassengerBoarding(passengerId, !currentVal);
      setManifestPassengers((prev) =>
        prev.map((p) => (p.id === passengerId ? { ...p, boarded: !currentVal } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Pre-Trip Inspection Submission
  const handleSubmitChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip || !assignedVehicle) return;

    try {
      await ApiService.submitVehicleInspection({
        vehicleId: assignedVehicle.id,
        tripId: activeTrip.id,
        status: checklistStatus,
        notes: checklistNotes || (checklistStatus === 'PASS' ? 'All systems nominal' : 'Attention required'),
        items: checklist,
      });
      setChecklistSubmitted(true);
      setTimeout(() => setChecklistSubmitted(false), 5000);
    } catch (err: any) {
      alert(err.message || 'Inspection could not be submitted');
    }
  };

  // Handle Incident Report Submission
  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;

    try {
      await ApiService.reportIncident({
        tripId: activeTrip.id,
        type: incidentType,
        severity: incidentSeverity,
        location: incidentLocation || currentStopName,
        description: incidentDesc,
      });
      setIncidentSuccessMsg('Incident reported to Central Dispatch. Response team notified.');
      setIncidentDesc('');
      setTimeout(() => setIncidentSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit incident report');
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
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <Bus className="w-8 h-8 text-emerald-600 animate-bounce mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Loading Driver Operations Cockpit...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Driver Profile Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-500/40">
                ACTIVE PSV CAPTAIN
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {driverData?.licenseNumber || 'DL-8492019'}</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Captain {driverData?.name || 'John Mwangi'}
            </h1>
            <p className="text-xs text-slate-400">
              Assigned Bus:{' '}
              <span className="font-mono font-bold text-amber-400">
                {assignedVehicle?.registrationNumber || 'KDA 123A'}
              </span>{' '}
              ({assignedVehicle?.model || 'Scania Marcopolo G7'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDriverDashboard}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Manifest & Telematics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-900/40 border border-rose-700 text-rose-300 hover:bg-rose-900/80 font-bold text-xs transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Strict Access Boundary Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>
            <strong>Operational Scope:</strong> Assigned manifests, telemetry updates, and pre-trip checklists.
            Company financial records, payroll, and global fleet controls are restricted to the Manager portal.
          </span>
        </div>
      </div>

      {/* Internal Announcements Bar */}
      {announcements.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
              Central Dispatch Announcement
            </span>
            <p className="text-xs text-amber-800 mt-0.5">{announcements[0]?.content}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Trip Telematics & Passenger Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Trip Status Cockpit */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active Trip Telematics Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-600" />
                <span>Today's Assigned Trip</span>
              </h3>
              {activeTrip && (
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {activeTrip.tripCode}
                </span>
              )}
            </div>

            {activeTrip ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Route Corridor</span>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">
                    {activeTrip.route.origin} → {activeTrip.route.destination}
                  </p>
                  <p className="text-slate-500">{activeTrip.route.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-semibold block">Departure Time</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      {new Date(activeTrip.departureTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-semibold block">Est. Arrival</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      {new Date(activeTrip.estimatedArrivalTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Status Update Form */}
                <form onSubmit={handleUpdateStatus} className="pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Current Journey Status
                    </label>
                    <select
                      id="driver-status-select"
                      value={currentStatus}
                      onChange={(e) => setCurrentStatus(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500 font-bold"
                    >
                      <option value="SCHEDULED">SCHEDULED (At Terminal)</option>
                      <option value="BOARDING">BOARDING (Passengers Loading)</option>
                      <option value="IN_TRANSIT">IN TRANSIT (On Highway)</option>
                      <option value="AT_STOP">AT STOP (Rest / Meal Break)</option>
                      <option value="DELAYED">DELAYED (Traffic or Mechanical)</option>
                      <option value="ARRIVED">ARRIVED (Trip Completed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Current Location / Milestone
                    </label>
                    <input
                      id="driver-location-input"
                      type="text"
                      required
                      value={currentStopName}
                      onChange={(e) => setCurrentStopName(e.target.value)}
                      placeholder="e.g. Mtito Andei Rest Station"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Speed (km/h)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={80}
                        value={currentSpeed}
                        onChange={(e) => setCurrentSpeed(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Delay (Mins)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={delayMinutes}
                        onChange={(e) => setDelayMinutes(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {delayMinutes > 0 && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Delay Reason (Broadcasted to Passengers)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Heavy congestion at Mtito Andei"
                        value={delayReason}
                        onChange={(e) => setDelayReason(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {statusSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{statusSuccessMsg}</span>
                    </div>
                  )}

                  <button
                    id="driver-update-status-btn"
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast Telematics & Status</span>
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No trips currently assigned for today.</p>
            )}
          </div>

          {/* Pre-Trip Vehicle Inspection Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-amber-600" />
                <span>Pre-Trip Walkaround Inspection</span>
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Mandatory NTSA safety checklist prior to passenger boarding clearance.
            </p>

            <form onSubmit={handleSubmitChecklist} className="space-y-3 text-xs">
              <div className="space-y-2">
                {[
                  { key: 'tiresChecked', label: 'Tires & Tread Depth (Min 3mm)' },
                  { key: 'brakesChecked', label: 'Brake Fluid & Air Pressure Gauges' },
                  { key: 'lightsChecked', label: 'Headlamps, Indicators & Brake Lights' },
                  { key: 'wipersChecked', label: 'Windshield Wipers & Washer Fluid' },
                  { key: 'emergencyExitsChecked', label: 'Emergency Exit Doors & Safety Hammers' },
                  { key: 'firstAidKitChecked', label: 'Stocked First Aid Medical Kit' },
                  { key: 'fireExtinguisherChecked', label: 'Fire Extinguisher Charged & Inspected' },
                  { key: 'speedGovernorSealChecked', label: 'NTSA Speed Governor Intact & Sealed' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2.5 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(checklist as any)[item.key]}
                      onChange={(e) =>
                        setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Inspection Outcome
                </label>
                <select
                  value={checklistStatus}
                  onChange={(e) => setChecklistStatus(e.target.value as any)}
                  className={`w-full p-2 rounded-xl text-xs font-bold border ${
                    checklistStatus === 'PASS'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  <option value="PASS">PASS: Coach is Roadworthy & Cleared for Travel</option>
                  <option value="FAIL_NEEDS_MAINTENANCE">FAIL: Mechanical Issue (Flags Workshop Immediately)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Inspection Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Left rear tire pressure adjusted to 110 PSI"
                  value={checklistNotes}
                  onChange={(e) => setChecklistNotes(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              {checklistSubmitted && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Inspection logged to central database. Thank you Captain!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                Submit Pre-Trip Inspection
              </button>
            </form>
          </div>

          {/* Incident Report Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Report Route Incident</span>
            </h3>

            <form onSubmit={handleSubmitIncident} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Incident Type
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as any)}
                  className="w-full p-2 rounded-xl text-xs border border-slate-300 bg-slate-50"
                >
                  <option value="TRAFFIC_DELAY">Heavy Traffic / Roadwork Delay</option>
                  <option value="MECHANICAL_FAULT">Mechanical Warning Light</option>
                  <option value="BREAKDOWN">Vehicle Breakdown / Puncture</option>
                  <option value="MEDICAL_EMERGENCY">Passenger Medical Issue</option>
                  <option value="ACCIDENT">Road Obstruction or Accident</option>
                  <option value="WEATHER">Severe Rain / Flooding</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Incident Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Salama Highway Stretch"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description & Required Assistance
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Provide context for dispatch..."
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              {incidentSuccessMsg && (
                <div className="p-2 bg-emerald-50 text-emerald-800 text-xs rounded-lg">
                  {incidentSuccessMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                Send Incident Alert to Dispatch
              </button>
            </form>
          </div>
        </div>

        {/* Right Columns (Span 2): Live Passenger Manifest & Fast QR Boarding Scanner */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Boarding QR Scanner & Ticket Validator */}
          <div className="bg-black text-white rounded-3xl border-2 border-amber-400 p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black shadow-md border border-black">
                  <QrCode className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Mobile Ticket QR Boarding Scanner
                    </h2>
                    <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      Fast Gate Terminal
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Scan passenger's mobile phone ticket screen or enter booking reference for rapid check-in
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Toggle Live Camera */}
                <button
                  type="button"
                  id="toggle-driver-camera-btn"
                  onClick={() => {
                    setCameraError(null);
                    setCameraActive(!cameraActive);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    cameraActive
                      ? 'bg-amber-400 text-black border-amber-400 shadow-md font-black'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{cameraActive ? 'Stop Camera' : 'Camera Scanner'}</span>
                </button>

                {/* Flip Camera Facing Mode (Front vs Back) */}
                {cameraActive && (
                  <button
                    type="button"
                    onClick={() => setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Switch between front and back camera"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">{cameraFacing === 'environment' ? 'Rear Cam' : 'Front Cam'}</span>
                  </button>
                )}

                {/* Upload / Snap QR Photo Fallback (100% works in any browser / iframe) */}
                <button
                  type="button"
                  id="upload-qr-photo-btn"
                  disabled={isDecodingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Upload or take a photo of the QR code"
                >
                  {isDecodingFile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{isDecodingFile ? 'Scanning Image...' : 'Upload QR Photo'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-xl">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Audio Chime</span>
                </div>
              </div>
            </div>

            {/* Live Camera Viewfinder & QR Frame Processor */}
            {cameraActive && (
              <div className="relative rounded-2xl overflow-hidden bg-neutral-950 border-2 border-amber-400 max-w-lg mx-auto aspect-video flex items-center justify-center shadow-2xl">
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    cameraLoading || cameraError ? 'opacity-0' : 'opacity-100'
                  }`}
                />

                {/* Loading Camera State */}
                {cameraLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/90 text-amber-400 gap-3 p-4 text-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <div>
                      <p className="text-xs font-bold text-white">Initializing Optical QR Scanner...</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Please allow camera permissions in your browser</p>
                    </div>
                  </div>
                )}

                {/* Camera Permission / Access Error Diagnostic UI */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 text-white gap-3 p-6 text-center z-20">
                    <div className="w-10 h-10 rounded-full bg-rose-900/50 border border-rose-500/50 flex items-center justify-center text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">Camera Access Blocked</h4>
                      <p className="text-xs text-neutral-300 max-w-sm mt-1 leading-relaxed">{cameraError}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCameraError(null);
                          setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
                        }}
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black rounded-xl transition-all cursor-pointer"
                      >
                        Try Alternate Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl border border-neutral-700 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Upload Ticket Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCameraActive(false)}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Target Frame Reticle (Only when camera is streaming without error) */}
                {!cameraLoading && !cameraError && (
                  <>
                    {/* Scanner Target Frame Reticle */}
                    <div className="absolute inset-10 sm:inset-12 border-2 border-dashed border-amber-400/80 rounded-2xl pointer-events-none flex items-center justify-center transition-all">
                      {/* Laser scanning line */}
                      <div className="w-full h-0.5 bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-pulse" />
                      {/* Corner Target Markers */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                    </div>

                    {/* Active QR Code Detection Flash Overlay */}
                    {scanFlash && (
                      <div className="absolute inset-0 bg-emerald-500/30 border-4 border-emerald-400 rounded-2xl flex items-center justify-center z-10 animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-2xl flex items-center gap-2 border-2 border-white">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>QR CODE DETECTED • CHECKING PASS...</span>
                        </div>
                      </div>
                    )}

                    {/* Top Status Badge */}
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-neutral-700 px-2.5 py-1 rounded-lg text-[10px] text-amber-300 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>LIVE SCANNER ACTIVE ({cameraFacing === 'environment' ? 'REAR' : 'FRONT'})</span>
                    </div>

                    {/* Close Viewfinder Button */}
                    <button
                      type="button"
                      onClick={() => setCameraActive(false)}
                      className="absolute top-3 right-3 p-1.5 bg-black/80 hover:bg-black border border-neutral-700 rounded-lg text-white text-xs cursor-pointer"
                      title="Close Camera"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Bottom Guidance Instruction */}
                    <div className="absolute bottom-3 text-center text-[10px] text-neutral-200 font-bold bg-black/85 backdrop-blur-sm border border-neutral-700 px-3.5 py-1 rounded-full shadow-lg">
                      Point lens at passenger mobile screen or printed ticket QR code
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Scanner / Barcode Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidateTicket();
              }}
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Scan className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    id="driver-qr-scan-input"
                    value={qrScanInput}
                    onChange={(e) => setQrScanInput(e.target.value)}
                    placeholder="Scan QR barcode or enter Booking Ref (e.g. TRP-10492)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 text-white placeholder:text-neutral-500 text-xs sm:text-sm font-mono rounded-xl border-2 border-neutral-700 focus:border-amber-400 focus:outline-none transition-all"
                  />
                  {qrScanInput && (
                    <button
                      type="button"
                      onClick={() => setQrScanInput('')}
                      className="absolute right-3 top-3 text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  id="driver-validate-ticket-btn"
                  disabled={isScanning || !qrScanInput.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black text-xs sm:text-sm border border-black shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isScanning ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <Zap className="w-4 h-4 fill-black" />
                  )}
                  <span>Validate Ticket</span>
                </button>
              </div>

              {/* Quick Scan Test Shortcuts from Current Manifest */}
              {manifestPassengers.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Quick-Test Ticket Scans:</span>
                  </span>
                  {manifestPassengers.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleValidateTicket(p.bookingReference || p.id)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title={`Simulate scanning mobile ticket for Seat ${p.seatNumber}`}
                    >
                      <span>Seat {p.seatNumber}</span>
                      <span className="text-amber-400 font-mono">({p.bookingReference || 'REF'})</span>
                      {p.boarded ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Scan className="w-3 h-3 text-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Validation Feedback Display Banner */}
            {scanResult && (
              <div
                className={`p-4 rounded-2xl border-2 animate-in fade-in duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  scanResult.status === 'SUCCESS'
                    ? 'bg-emerald-950/90 border-emerald-500 text-white'
                    : scanResult.status === 'ALREADY_BOARDED'
                    ? 'bg-amber-950/90 border-amber-500 text-white'
                    : 'bg-rose-950/90 border-rose-500 text-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      scanResult.status === 'SUCCESS'
                        ? 'bg-emerald-500 text-black'
                        : scanResult.status === 'ALREADY_BOARDED'
                        ? 'bg-amber-400 text-black'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {scanResult.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    ) : scanResult.status === 'ALREADY_BOARDED' ? (
                      <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-widest font-black">
                        {scanResult.status === 'SUCCESS'
                          ? '✅ BOARDING APPROVED'
                          : scanResult.status === 'ALREADY_BOARDED'
                          ? '⚠️ ALREADY BOARDED'
                          : '❌ TICKET REJECTED'}
                      </span>
                      <span className="text-[10px] font-mono opacity-70">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-sm font-black mt-0.5">{scanResult.message}</p>

                    {scanResult.passenger && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="bg-black/60 px-2 py-0.5 rounded text-amber-300 font-mono font-bold">
                          Seat: {scanResult.passenger.seatNumber}
                        </span>
                        <span className="bg-black/60 px-2 py-0.5 rounded text-white font-bold">
                          {scanResult.passenger.fullName}
                        </span>
                        {scanResult.passenger.idNumber && (
                          <span className="bg-black/60 px-2 py-0.5 rounded text-neutral-300 font-mono text-[11px]">
                            ID: {scanResult.passenger.idNumber}
                          </span>
                        )}
                        {scanResult.booking && (
                          <span className="bg-black/60 px-2 py-0.5 rounded text-emerald-300 font-black text-[11px]">
                            PAID ({scanResult.booking.paymentMethod})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setScanResult(null)}
                  className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black text-neutral-300 hover:text-white text-xs font-bold border border-neutral-700 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Passenger Boarding Manifest Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 font-serif flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <span>Passenger Boarding Manifest</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify National ID/Passport at bus entrance and check in boarding passengers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-md">
                  Boarded: {boardedCount} / {manifestPassengers.length}
                </span>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search passenger name, ID, seat number..."
                  value={searchManifest}
                  onChange={(e) => setSearchManifest(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1">
                {(['ALL', 'PENDING', 'BOARDED'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setFilterBoarded(filter)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      filterBoarded === filter
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'ALL' ? 'All Seats' : filter === 'PENDING' ? 'Awaiting Boarding' : 'Boarded'}
                  </button>
                ))}
              </div>
            </div>

            {/* Manifest Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-2">Seat</th>
                    <th className="py-3 px-2">Passenger Legal Name</th>
                    <th className="py-3 px-2">ID / Passport</th>
                    <th className="py-3 px-2">Reference</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPassengers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No passengers found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPassengers.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-2">
                          <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {p.seatNumber}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-bold text-slate-900 block">{p.fullName}</span>
                          <span className="text-[10px] text-slate-400">Class: {p.seatClass}</span>
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-700">{p.idNumber}</td>
                        <td className="py-3 px-2 font-mono text-amber-700 font-bold">{p.bookingReference}</td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
                              p.boarded
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
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
                              onClick={() => handleValidateTicket(p.bookingReference || p.id)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold text-[11px] border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Validate with QR verification logic"
                            >
                              <Scan className="w-3 h-3 text-amber-600" />
                              <span className="hidden sm:inline">Validate</span>
                            </button>

                            <button
                              id={`board-btn-${p.id}`}
                              onClick={() => handleToggleBoarding(p.id, p.boarded)}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                p.boarded
                                  ? 'bg-slate-200 text-slate-700 hover:bg-rose-100 hover:text-rose-700'
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
    </div>
  );
};
