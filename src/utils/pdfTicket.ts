import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Booking } from '../types';

/**
 * Generates an official, high-resolution TransCar rongai PDF E-Ticket & Boarding Pass
 * optimized for offline storage, printing, and driver optical scanning.
 */
export async function generateTicketPdf(booking: Booking, existingQrDataUrl?: string): Promise<void> {
  // Generate QR Code if not passed in
  let qrImage = existingQrDataUrl;
  if (!qrImage) {
    const qrPayload = JSON.stringify({
      ref: booking.bookingReference,
      trip: booking.tripCode,
      seats: booking.passengers.map((p) => p.seatNumber).join(','),
      origin: booking.routeOrigin,
      destination: booking.routeDestination,
      bus: booking.busRegistration,
      status: booking.paymentStatus,
      passengers: booking.passengers.map((p) => ({
        name: p.fullName,
        seat: p.seatNumber,
        id: p.idNumber,
      })),
      timestamp: booking.createdAt,
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
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. TOP HEADER BANNER (Black & Gold)
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Gold accent stripe
  doc.setFillColor(245, 158, 11); // Amber 500
  doc.rect(0, 38, pageWidth, 2.5, 'F');

  // Company Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('TransCar', margin, 17);

  // Subscript brand tag
  doc.setFontSize(14);
  doc.setTextColor(245, 158, 11);
  doc.text('rongai', margin + 35, 17);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 200, 200);
  doc.text('Intercity & Rongai Regional Express Shuttle Service', margin, 24);
  doc.text('Hotline: +254 724 626199 / +254 717 747626 • Maasai Mall Stage, Rongai', margin, 30);

  // Top Right: Document Title & Verification Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(245, 158, 11);
  doc.text('OFFICIAL E-TICKET / BOARDING PASS', pageWidth - margin, 16, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(52, 211, 153); // Emerald text
  doc.text('● VERIFIED & CONFIRMED', pageWidth - margin, 23, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`Issued: ${new Date().toLocaleDateString('en-KE')} ${new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 30, { align: 'right' });

  // 2. BOOKING REFERENCE STRIP (Prominent identification)
  let y = 46;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BOOKING REFERENCE', margin + 6, y + 7);
  doc.text('TRIP NUMBER', margin + 65, y + 7);
  doc.text('PAYMENT STATUS', margin + 115, y + 7);
  doc.text('TOTAL SEATS', pageWidth - margin - 6, y + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(booking.bookingReference, margin + 6, y + 14);

  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6); // Amber 600
  doc.text(booking.tripCode, margin + 65, y + 14);

  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // Emerald 600
  doc.text(`PAID (${booking.paymentMethod})`, margin + 115, y + 14);

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`${booking.passengers.length} Seat(s)`, pageWidth - margin - 6, y + 14, { align: 'right' });

  // 3. JOURNEY & SCHEDULE SPECIFICATIONS
  y = 71;
  const leftColWidth = contentWidth - 62; // leave space on right for QR code

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, leftColWidth, 54, 3, 3, 'FD');

  // Corridor route banner
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 0.5, y + 0.5, leftColWidth - 1, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TRAVEL ROUTE', margin + 6, y + 6);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${booking.routeOrigin}   ➔   ${booking.routeDestination}`, margin + 6, y + 11);

  // Departure Date & Time
  const depDate = new Date(booking.departureTime).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const depTime = new Date(booking.departureTime).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DEPARTURE DATE', margin + 6, y + 21);
  doc.text('DEPARTURE TIME', margin + 60, y + 21);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(depDate, margin + 6, y + 27);
  doc.text(depTime, margin + 60, y + 27);

  // Boarding Point & Vehicle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BOARDING POINT / STAGE', margin + 6, y + 35);
  doc.text('ASSIGNED VEHICLE', margin + 60, y + 35);

  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const boardingLoc = booking.routeOrigin.toLowerCase().includes('rongai')
    ? 'Maasai Mall Stage, Rongai'
    : `${booking.routeOrigin} Main Shuttle Stage`;
  doc.text(boardingLoc, margin + 6, y + 41);
  const busModel = (booking as any).vehicleModel || 'TransCar Toyota HiAce Shuttle';
  doc.text(`${booking.busRegistration} (${busModel})`, margin + 60, y + 41);

  // Reporting advisory
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text('⚠️ Boarding gate opens 20 minutes before departure. Please be at terminal early.', margin + 6, y + 49);

  // 4. EMBEDDED HIGH-RESOLUTION QR CODE (Right side box)
  const qrBoxX = margin + leftColWidth + 4;
  const qrBoxWidth = contentWidth - leftColWidth - 4;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(qrBoxX, y, qrBoxWidth, 54, 3, 3, 'FD');

  if (qrImage) {
    try {
      doc.addImage(qrImage, 'PNG', qrBoxX + 5, y + 4, 48, 42);
    } catch (e) {
      console.error('Failed to embed QR code into PDF:', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('DRIVER GATE SCAN', qrBoxX + qrBoxWidth / 2, y + 49, { align: 'center' });
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Scannable offline at vehicle door', qrBoxX + qrBoxWidth / 2, y + 52, { align: 'center' });

  // 5. PASSENGER & ASSIGNED SEAT MANIFEST TABLE
  y = 131;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('PASSENGER MANIFEST & SEATING DETAILS', margin, y);

  y += 3;
  // Table header
  doc.setFillColor(15, 23, 42); // slate 900
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('#', margin + 4, y + 5);
  doc.text('PASSENGER NAME', margin + 14, y + 5);
  doc.text('ID / PASSPORT NO', margin + 68, y + 5);
  doc.text('SEAT NUMBER', margin + 115, y + 5);
  doc.text('FARE CLASS', margin + 145, y + 5);
  doc.text('STATUS', pageWidth - margin - 4, y + 5, { align: 'right' });

  y += 7;
  // Table rows
  booking.passengers.forEach((p, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 8, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(String(idx + 1), margin + 4, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(p.fullName, margin + 14, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(p.idNumber || 'N/A', margin + 68, y + 5.5);

    // Seat Number Badge
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text(`Seat ${p.seatNumber}`, margin + 115, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Standard Corridor', margin + 145, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(p.hasBoarded ? 'BOARDED' : 'CONFIRMED', pageWidth - margin - 4, y + 5.5, { align: 'right' });

    y += 8;
  });

  // 6. FINANCIAL RECEIPT & PAYMENT CONFIRMATION
  y += 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT RECEIPT', margin + 6, y + 6);
  doc.text('M-PESA / TRANSACTION CODE', margin + 65, y + 6);
  doc.text('CONTACT PHONE', margin + 120, y + 6);
  doc.text('TOTAL FARE PAID', pageWidth - margin - 6, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(booking.paymentMethod || 'M-PESA', margin + 6, y + 13);

  const txnCode = booking.mpesaTransactionCode || (booking as any).mpesaReceiptNumber || `MPESA-${booking.bookingReference.replace('TRP-', '')}`;
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(217, 119, 6);
  doc.text(txnCode, margin + 65, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(booking.contactPhone, margin + 120, y + 13);

  const fareAmount = booking.totalFareKsh || (booking as any).totalAmount || 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129);
  doc.text(`KES ${fareAmount.toLocaleString()}`, pageWidth - margin - 6, y + 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Includes passenger carriage insurance, road levies & terminal service fee.`, margin + 6, y + 19);

  // 7. OFFLINE TRAVEL INSTRUCTIONS & BOARDING CONDITIONS (Critical requirement)
  y += 30;
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.setDrawColor(245, 158, 11); // Amber 500
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14); // Amber 900
  doc.text('📱 OFFLINE USAGE INSTRUCTIONS & PASSENGER TRAVEL NOTICE', margin + 6, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);

  const instructions = [
    '• OFFLINE COMPLIANT: Save this PDF file to your smartphone storage or take a clear screenshot. An internet connection is NOT required to present this ticket to the driver.',
    '• RAPID SCANNING: The driver will scan the QR code above directly from your phone screen or printed paper using the TransCar driver gate terminal.',
    '• REPORTING TIME: Please arrive at the designated terminal stage at least 20 minutes before departure time to load luggage and complete seat boarding.',
    '• IDENTIFICATION: Bring an original government National ID, Alien Card, or Passport matching the passenger name listed on this ticket.',
    '• BAGGAGE ALLOWANCE: Each ticket includes 1 standard luggage piece (up to 20kg) and 1 small hand carry-on bag.',
    '• CUSTOMER CARE: For inquiries, lost items, or rerouting, contact +254 724 626199 or +254 717 747626.',
  ];

  let lineY = y + 11;
  instructions.forEach((inst) => {
    doc.text(inst, margin + 6, lineY);
    lineY += 3.7;
  });

  // 8. FOOTER
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('TransCar rongai Express Limited • Rongai Maasai Mall Main Terminal • Safe, Punctual & Comfortable Travel', margin, pageHeight - 10);
  doc.text(`Document Ref: ${booking.bookingReference} • Page 1 of 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  // Save the PDF
  const filename = `TransCar-Ticket-${booking.bookingReference}.pdf`;
  doc.save(filename);
}
