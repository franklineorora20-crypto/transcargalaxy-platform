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
import { Trip, Passenger, VehicleInspection, IncidentReport } from '../../types';
import { ApiService } from '../../services/api';
import { playBoardingSound } from '../../utils/audio';

interface DriverPortalProps {
  driverData: any;
  onLogout: () => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({ driverData, onLogout }) => {
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

  // QR Boarding Validator State
  const [qrScanInput, setQrScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
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
    'Galleria Interchange',
    'Bomas of Kenya',
    'Nyayo National Stadium',
    'Machakos Junction',
    'Sultan Hamud Waypoint',
    'Mtito Andei Rest Oasis',
    'Nakuru Highway Hub',
    'Kericho Tea Highlands',
    'Kisii Express Terminal',
  ];

  const loadDriverDashboard = useCallback(async () => {
    setIsRefreshing(true);
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
      showToast('Could not load latest telemetry from dispatch.', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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

  // Handle Quick QR Code / Barcode Boarding Validation
  const handleValidateTicket = async (ticketCodeToValidate?: string) => {
    const code = (ticketCodeToValidate || qrScanInput).trim();
    if (!code) {
      showToast('Please provide a ticket code or booking reference.', 'warning');
      return;
    }

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
        showToast(`Passenger in Seat ${res.passenger?.seatNumber || ''} already boarded.`, 'warning');
      } else {
        playBoardingSound('success');
        setScanResult({
          status: 'SUCCESS',
          message: res.message || 'Passenger verified and boarded successfully!',
          passenger: res.passenger,
          booking: res.booking,
        });
        showToast(`Boarded passenger: ${res.passenger?.fullName || ''} (Seat ${res.passenger?.seatNumber || ''})`, 'success');
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
      showToast(err.message || 'Invalid or unregistered ticket code.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Camera video stream handling & real-time frame QR scanner loop
  useEffect(() => {
    let stream: MediaStream | null = null;
    let scanIntervalTimer: any = null;
    let isCancelled = false;

    if (cameraActive) {
      setCameraLoading(true);
      setCameraError(null);

      const startCamera = async () => {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API is not supported by your browser environment.');
          }

          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: cameraFacing,
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

          // Continuous Frame Scanning Loop
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

          scanIntervalTimer = setInterval(processFrame, 90);
        } catch (err: any) {
          console.error('Camera access error:', err);
          setCameraLoading(false);
          let msg = 'Could not access device camera.';
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            msg = 'Camera permission was blocked. Please allow camera permissions in your browser URL bar.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            msg = 'No camera device found on this system. You can upload an image or type the booking reference.';
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

  // Handle QR image file upload
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
            showToast('No readable QR code found in this photo. Try another image.', 'warning');
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

      {/* Main Grid: Trip Telematics & Passenger Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Trip Status Cockpit */}
        <div className="lg:col-span-1 space-y-6">
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
                    placeholder="e.g. Mtito Andei Rest Oasis"
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

        {/* Right Columns (Span 2): Fast QR Boarding Scanner & Passenger Manifest */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Boarding QR Scanner & Ticket Validator */}
          <div className="bg-slate-950 text-white rounded-3xl border-2 border-amber-400 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md border border-slate-950">
                  <QrCode className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Mobile Ticket QR Boarding Scanner
                    </h2>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                      Fast Gate
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Scan passenger phone screen or type booking reference for instant check-in
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    cameraActive
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{cameraActive ? 'Close Camera' : 'Camera Scanner'}</span>
                </button>

                {/* Flip Camera Facing Mode */}
                {cameraActive && (
                  <button
                    type="button"
                    onClick={() => setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Switch front and rear camera"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">{cameraFacing === 'environment' ? 'Rear' : 'Front'}</span>
                  </button>
                )}

                {/* Upload QR Photo */}
                <button
                  type="button"
                  id="upload-qr-photo-btn"
                  disabled={isDecodingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Upload or take a photo of the QR code"
                >
                  {isDecodingFile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{isDecodingFile ? 'Scanning Image...' : 'Upload QR'}</span>
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
                      <p className="text-xs font-bold text-white">Initializing Optical QR Scanner...</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Please allow camera permissions</p>
                    </div>
                  </div>
                )}

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
                        Dismiss
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
                          <span>QR CODE DETECTED • CHECKING PASS...</span>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-neutral-700 px-2.5 py-1 rounded-lg text-[10px] text-amber-300 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>LIVE SCANNER ACTIVE</span>
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 text-white placeholder:text-slate-500 text-xs sm:text-sm font-mono rounded-xl border-2 border-slate-700 focus:border-amber-400 focus:outline-none transition-all"
                  />
                  {qrScanInput && (
                    <button
                      type="button"
                      onClick={() => setQrScanInput('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  id="driver-validate-ticket-btn"
                  disabled={isScanning || !qrScanInput.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm border border-slate-950 shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isScanning ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <Zap className="w-4 h-4 fill-slate-950" />
                  )}
                  <span>Validate Ticket</span>
                </button>
              </div>

              {/* Quick Scan Test Shortcuts from Current Manifest */}
              {manifestPassengers.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Quick Scan Simulators:</span>
                  </span>
                  {manifestPassengers.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleValidateTicket(p.bookingReference || p.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
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
                        ? 'bg-emerald-500 text-slate-950'
                        : scanResult.status === 'ALREADY_BOARDED'
                        ? 'bg-amber-400 text-slate-950'
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
                          ? '⚠️ ALREADY CHECKED IN'
                          : '❌ TICKET REJECTED'}
                      </span>
                    </div>

                    <p className="text-sm font-black mt-0.5">{scanResult.message}</p>

                    {scanResult.passenger && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="bg-black/60 px-2.5 py-0.5 rounded text-amber-300 font-mono font-bold">
                          Seat: {scanResult.passenger.seatNumber}
                        </span>
                        <span className="bg-black/60 px-2.5 py-0.5 rounded text-white font-bold">
                          {scanResult.passenger.fullName}
                        </span>
                        {scanResult.passenger.idNumber && (
                          <span className="bg-black/60 px-2.5 py-0.5 rounded text-neutral-300 font-mono text-[11px]">
                            ID: {scanResult.passenger.idNumber}
                          </span>
                        )}
                        {scanResult.booking && (
                          <span className="bg-black/60 px-2.5 py-0.5 rounded text-emerald-300 font-black text-[11px]">
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
                    <th className="py-3 px-2">ID / Passport</th>
                    <th className="py-3 px-2">Reference</th>
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
                        <td className="py-3 px-2 font-mono font-bold text-slate-700">{p.idNumber || '—'}</td>
                        <td className="py-3 px-2 font-mono text-amber-700 font-bold">{p.bookingReference}</td>
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
                              onClick={() => handleValidateTicket(p.bookingReference || p.id)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold text-[11px] border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                              title="Validate passenger ticket"
                            >
                              <Scan className="w-3 h-3 text-amber-600" />
                              <span className="hidden sm:inline">Scan</span>
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
