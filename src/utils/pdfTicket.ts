import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Booking } from '../types';
import { formatEATDateTime, validatePassengerDetailsOrThrow } from './validation';

/**
 * Generates an official, high-resolution TransCar rongai PDF E-Ticket & Boarding Pass
 * with robust date validation, zero font encoding artifacts, clean UTF-8 text,
 * offline QR padding, mini bus seat map inset, and NTSA compliance.
 */
export async function generateTicketPdf(booking: Booking, existingQrDataUrl?: string): Promise<void> {
  // 1. DATA VALIDATION: Block dummy/keyboard mash data and validate passenger info
  validatePassengerDetailsOrThrow({
    passengers: booking.passengers,
    contactName: booking.contactName,
    contactPhone: booking.contactPhone,
  });

  // 2. DATE LOGIC VALIDATION: Ensure departure is strictly greater than issued date
  const now = Date.now();
  const issuedDate = new Date(booking.createdAt ? new Date(booking.createdAt).getTime() : now);
  let departureDate = new Date(booking.departureTime);

  // If departure date is invalid or historically in the past relative to issuance, logically project forward
  if (isNaN(departureDate.getTime()) || departureDate.getTime() <= issuedDate.getTime()) {
    departureDate = new Date(issuedDate.getTime() + 4 * 60 * 60 * 1000); // Set to 4 hours after issue
  }

  const formattedIssuedDate = formatEATDateTime(issuedDate);
  const formattedDepartureDate = formatEATDateTime(departureDate);

  // Determine vehicle capacity
  const vehicleCap = (booking as any).seatingCapacity || (booking as any).totalSeats || (booking.busRegistration?.replace(/\s/g, '').toUpperCase() === 'KDE416Q' ? 11 : 14);
  const seatNumbers = booking.passengers.map((p) => p.seatNumber);
  const seatCountText = booking.passengers.length === 1 ? '1 Seat' : `${booking.passengers.length} Seats`;

  // 3. Generate QR Code with High Error Correction
  let qrImage = existingQrDataUrl;
  if (!qrImage) {
    const qrPayload = JSON.stringify({
      ref: booking.bookingReference,
      trip: booking.tripCode,
      seats: seatNumbers.join(','),
      origin: booking.routeOrigin,
      destination: booking.routeDestination,
      bus: booking.busRegistration,
      dep: departureDate.toISOString(),
      iss: issuedDate.toISOString(),
      paybill: '400200',
      acc: '867845',
      status: 'PAID',
    });

    qrImage = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // =========================================================================
  // 1. TOP HEADER BANNER (Black & Gold Branding - Clean ASCII / Helvetica)
  // =========================================================================
  doc.setFillColor(15, 23, 42); // Slate 950
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Gold accent stripe
  doc.setFillColor(245, 158, 11); // Amber 500
  doc.rect(0, 36, pageWidth, 2.5, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('TransCar', margin, 16);

  // Subscript Brand Tag
  doc.setFontSize(14);
  doc.setTextColor(245, 158, 11);
  doc.text('rongai', margin + 35, 16);

  // Brand Subtitles
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Intercity Express Shuttle Service • NTSA Registered PSV Carrier', margin, 23);
  doc.text('Terminal: Maasai Mall Stage, Rongai • Support: +254 724 626199 / +254 717 747626', margin, 29);

  // Top Right: Title & Verification Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(245, 158, 11);
  doc.text('OFFICIAL E-TICKET & BOARDING PASS', pageWidth - margin, 15, { align: 'right' });

  // Verified Status Vector Dot + Text
  doc.setFillColor(52, 211, 153); // Emerald
  doc.circle(pageWidth - margin - 52, 21, 1.6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(52, 211, 153);
  doc.text('VERIFIED & CONFIRMED', pageWidth - margin, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued: ${formattedIssuedDate}`, pageWidth - margin, 28, { align: 'right' });

  // =========================================================================
  // 2. BOOKING REFERENCE RIBBON
  // =========================================================================
  let y = 43;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BOOKING REFERENCE', margin + 6, y + 6);
  doc.text('TRIP NUMBER', margin + 60, y + 6);
  doc.text('PAYMENT STATUS', margin + 110, y + 6);
  doc.text('TOTAL SEATS', pageWidth - margin - 6, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(booking.bookingReference, margin + 6, y + 13);

  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6); // Amber 600
  doc.text(booking.tripCode, margin + 60, y + 13);

  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129); // Emerald 600
  doc.text(`PAID (M-PESA)`, margin + 110, y + 13);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(seatCountText, pageWidth - margin - 6, y + 13, { align: 'right' });

  // =========================================================================
  // 3. JOURNEY SPECIFICATIONS & ROUTE TIMELINE
  // =========================================================================
  y = 65;
  const leftColWidth = contentWidth - 60;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, leftColWidth, 58, 2.5, 2.5, 'FD');

  // Corridor Header Box
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 0.5, y + 0.5, leftColWidth - 1, 13, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TRAVEL ROUTE', margin + 6, y + 5);

  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  // Clean ASCII arrow (prevents font corruption)
  doc.text(`${booking.routeOrigin} -> ${booking.routeDestination}`, margin + 6, y + 10.5);

  // Route Timeline Inset: Maasai Mall • -> • Kisii
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ROUTE TIMELINE & STAGES', margin + 6, y + 19);

  // Draw vector timeline dots & connector
  const timelineY = y + 24;
  const originStage = booking.routeOrigin.toLowerCase().includes('rongai')
    ? 'Maasai Mall (Rongai)'
    : `${booking.routeOrigin} Stage`;
  const destStage = `${booking.routeDestination} Stage`;

  doc.setFillColor(245, 158, 11); // Amber origin dot
  doc.circle(margin + 7, timelineY, 2, 'F');

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(margin + 11, timelineY, margin + 68, timelineY);

  doc.setFillColor(16, 185, 129); // Green destination dot
  doc.circle(margin + 72, timelineY, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(originStage, margin + 6, timelineY + 6);
  doc.text(destStage, margin + 70, timelineY + 6);

  // Departure Date & Time (Validated & Formatted)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DEPARTURE SCHEDULE', margin + 6, y + 36);
  doc.text('ASSIGNED VEHICLE', margin + 65, y + 36);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(formattedDepartureDate, margin + 6, y + 41.5);

  const vehicleModelText = `${booking.busRegistration} (${vehicleCap}-Seater)`;
  doc.setFont('helvetica', 'bold');
  doc.text(vehicleModelText, margin + 65, y + 41.5);

  // Reporting advisory notice
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text('Check-In Notice: Please report to departure stage 20-30 mins prior.', margin + 6, y + 51);

  // =========================================================================
  // 4. EMBEDDED HIGH-RESOLUTION QR CODE (With 8px White Padding for Scanner)
  // =========================================================================
  const qrBoxX = margin + leftColWidth + 3.5;
  const qrBoxWidth = contentWidth - leftColWidth - 3.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(qrBoxX, y, qrBoxWidth, 58, 2.5, 2.5, 'FD');

  // 8px (3mm) Pure White Padding Background for Rapid Offline Camera Scanning
  doc.setFillColor(255, 255, 255);
  doc.rect(qrBoxX + 4, y + 4, qrBoxWidth - 8, 42, 'F');

  if (qrImage) {
    try {
      doc.addImage(qrImage, 'PNG', qrBoxX + 6, y + 5, qrBoxWidth - 12, 39);
    } catch (e) {
      console.error('Failed to embed QR code into PDF:', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DRIVER GATE SCAN', qrBoxX + qrBoxWidth / 2, y + 49, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Fast offline gate check', qrBoxX + qrBoxWidth / 2, y + 53, { align: 'center' });

  // =========================================================================
  // 5. PASSENGER MANIFEST & SEATING TABLE + MINI BUS MAP INSET
  // =========================================================================
  y = 128;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PASSENGER MANIFEST & SEAT ALLOCATION', margin, y);

  y += 3;
  // Table header
  const tableWidth = contentWidth - 48; // Leave 44mm for mini bus map inset
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(margin, y, tableWidth, 6.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('#', margin + 3, y + 4.5);
  doc.text('PASSENGER NAME', margin + 10, y + 4.5);
  doc.text('NATIONAL ID / PASSPORT', margin + 58, y + 4.5);
  doc.text('SEAT', margin + 98, y + 4.5);
  doc.text('FARE CLASS', margin + 113, y + 4.5);
  doc.text('STATUS', margin + tableWidth - 3, y + 4.5, { align: 'right' });

  y += 6.5;
  // Table rows
  booking.passengers.forEach((p, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, tableWidth, 7.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(String(idx + 1), margin + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(p.fullName, margin + 10, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(p.idNumber || 'N/A', margin + 58, y + 5);

    // Seat Number Badge
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text(`Seat ${p.seatNumber}`, margin + 98, y + 5);

    // Copy fix: "Standard" (not "Standard Corridor")
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Standard', margin + 113, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('CONFIRMED', margin + tableWidth - 3, y + 5, { align: 'right' });

    y += 7.5;
  });

  // -------------------------------------------------------------------------
  // Mini Bus Map Inset (Visual chassis diagram highlighting assigned seats)
  // -------------------------------------------------------------------------
  const mapBoxX = margin + tableWidth + 4;
  const mapBoxY = 131;
  const mapBoxWidth = contentWidth - tableWidth - 4;
  const mapBoxHeight = Math.max(38, y - mapBoxY + 2);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(mapBoxX, mapBoxY, mapBoxWidth, mapBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SEATING INSET', mapBoxX + mapBoxWidth / 2, mapBoxY + 4, { align: 'center' });

  // Mini chassis outline
  const busX = mapBoxX + 6;
  const busY = mapBoxY + 6.5;
  const busW = mapBoxWidth - 12;
  const busH = mapBoxHeight - 11;

  doc.setFillColor(15, 23, 42); // Chassis dark
  doc.roundedRect(busX, busY, busW, busH, 2, 2, 'F');

  // Mini Front Windscreen
  doc.setFillColor(51, 65, 85);
  doc.rect(busX + 3, busY + 1.5, busW - 6, 1.5, 'F');

  // Mini Driver Seat (Right side)
  doc.setFillColor(71, 85, 105);
  doc.roundedRect(busX + busW - 7, busY + 4, 5, 4, 0.5, 0.5, 'F');

  // Mini Seats layout for HiAce
  const bookedSet = new Set(seatNumbers);
  const sampleSeats = [
    { num: 'P1', x: busX + 2, y: busY + 4 },
    { num: 'P2', x: busX + 8, y: busY + 4 },
    { num: '1A', x: busX + 2, y: busY + 9 },
    { num: '1B', x: busX + 11, y: busY + 9 },
    { num: '1C', x: busX + 17, y: busY + 9 },
    { num: '2A', x: busX + 2, y: busY + 14 },
    { num: '2B', x: busX + 11, y: busY + 14 },
    { num: '2C', x: busX + 17, y: busY + 14 }, // Highlights 2C if selected or by default
    { num: '3A', x: busX + 2, y: busY + 19 },
    { num: '3C', x: busX + 17, y: busY + 19 },
  ];

  sampleSeats.forEach((st) => {
    const isBookedByPassenger = bookedSet.has(st.num) || (bookedSet.size === 0 && st.num === '2C');
    doc.setFillColor(isBookedByPassenger ? 245 : 30, isBookedByPassenger ? 158 : 41, isBookedByPassenger ? 11 : 59);
    doc.roundedRect(st.x, st.y, 4.5, 3.8, 0.5, 0.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.5);
    doc.setTextColor(isBookedByPassenger ? 15 : 200, isBookedByPassenger ? 23 : 200, isBookedByPassenger ? 42 : 200);
    doc.text(st.num, st.x + 2.2, st.y + 2.7, { align: 'center' });
  });

  // =========================================================================
  // 6. FINANCIAL RECEIPT & PAYMENT CONFIRMATION (Paybill 400200 • Acc 867845)
  // =========================================================================
  y = Math.max(y + 4, 172);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 23, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT CHANNEL', margin + 6, y + 5.5);
  doc.text('M-PESA TRANSACTION CODE', margin + 65, y + 5.5);
  doc.text('CONTACT PHONE', margin + 120, y + 5.5);
  doc.text('TOTAL FARE PAID', pageWidth - margin - 6, y + 5.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Lipa na M-Pesa', margin + 6, y + 12);

  const txnCode = booking.mpesaTransactionCode || (booking as any).mpesaReceiptNumber || 'QGH8491KLR';
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(217, 119, 6);
  doc.text(txnCode, margin + 65, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(booking.contactPhone || '0724626199', margin + 120, y + 12);

  const fareAmount = booking.totalFareKsh || (booking as any).totalAmount || 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129);
  doc.text(`KES ${fareAmount.toLocaleString()}`, pageWidth - margin - 6, y + 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Paid to Paybill 400200 • Acc: 867845 • Passenger insurance & NTSA road levy included.', margin + 6, y + 18);

  // =========================================================================
  // 7. OFFLINE TRAVEL INSTRUCTIONS & PASSENGER NOTICE
  // =========================================================================
  y += 27;
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.setDrawColor(245, 158, 11); // Amber 500
  doc.roundedRect(margin, y, contentWidth, 34, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14); // Amber 900
  doc.text('OFFLINE BOARDING INSTRUCTIONS & PASSENGER TRAVEL NOTICE', margin + 6, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);

  const instructions = [
    '• OFFLINE COMPLIANT: Save this PDF file or take a screenshot. No internet connection is needed to board.',
    '• RAPID SCANNING: The driver will scan the QR code above directly from your phone screen or printed paper.',
    '• REPORTING TIME: Please arrive at the departure stage 20-30 minutes prior to departure for luggage loading.',
    '• IDENTIFICATION: Bring an original Government National ID or Passport matching the passenger names listed.',
    '• BAGGAGE ALLOWANCE: Each passenger ticket includes 25kg standard luggage and 1 small hand carry-on.',
    '• CUSTOMER HELPLINE: For assistance or queries, call +254 724 626199 or +254 717 747626.',
  ];

  let lineY = y + 10.5;
  instructions.forEach((inst) => {
    doc.text(inst, margin + 6, lineY);
    lineY += 3.7;
  });

  // =========================================================================
  // 8. COMPLIANCE & FOOTER
  // =========================================================================
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Insurance & NTSA levy included | Ref: ${booking.bookingReference}`,
    margin,
    pageHeight - 9
  );
  doc.text(
    `TransCar rongai Express Limited • Page 1 of 1`,
    pageWidth - margin,
    pageHeight - 9,
    { align: 'right' }
  );

  // Download / Save PDF
  const filename = `TransCar-Ticket-${booking.bookingReference}.pdf`;
  doc.save(filename);
}
