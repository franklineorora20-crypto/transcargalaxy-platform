import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Booking, Passenger } from '../types';

export function getTicketId(booking: Booking, passenger?: Passenger): string {
  if (passenger?.ticketId) return passenger.ticketId;
  if (booking.passengers?.length === 1 && booking.passengers[0]?.ticketId) {
    return booking.passengers[0].ticketId;
  }
  if (booking.ticketId) return booking.ticketId;
  return booking.bookingReference.replace(/^TRP-/i, 'TCR-');
}

export function getTicketQrToken(booking: Booking, passenger?: Passenger): string {
  if (passenger?.qrToken) return passenger.qrToken;
  if (booking.passengers?.length === 1 && booking.passengers[0]?.qrToken) {
    return booking.passengers[0].qrToken;
  }
  if (booking.qrToken) return booking.qrToken;
  return getTicketId(booking, passenger);
}

export function getTicketVerificationUrl(
  booking: Booking,
  passenger?: Passenger,
): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://transcar.co.ke';
  const token = getTicketQrToken(booking, passenger);
  return `${origin}/ticket/verify/${encodeURIComponent(token)}`;
}

export async function generateTicketPDF(booking: Booking, passengerIndex = 0) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [242, 125, 38]; // #F27D26
  const darkColor: [number, number, number] = [15, 23, 42]; // #0F172A
  const grayColor: [number, number, number] = [100, 116, 139]; // #64748B
  const lightGray: [number, number, number] = [241, 245, 249]; // #F1F5F9
  const greenColor: [number, number, number] = [22, 163, 74]; // #16A34A

  const targetPax = booking.passengers[passengerIndex] || booking.passengers[0];
  const ticketNumber = getTicketId(booking, targetPax);
  const issueDate = new Date(booking.createdAt).toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const travelDateStr = new Date(booking.departureTime).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const departureTimeStr = new Date(booking.departureTime).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Ticket Border
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 15, 180, 255, 4, 4, 'S');

  // Header Banner
  doc.setFillColor(...darkColor);
  doc.roundedRect(15, 15, 180, 38, 4, 4, 'F');
  doc.rect(15, 45, 180, 8, 'F');

  // Orange accent bar
  doc.setFillColor(...primaryColor);
  doc.rect(15, 51, 180, 2, 'F');

  // Company Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('TRANSCAR RONGAI LTD.', 23, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(242, 125, 38);
  doc.text('HIGHWAY LUXURY COACH • OFFICIAL PASSENGER E-TICKET', 23, 37);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.text('P.O. Box 14200 - 20100, Rongai / Nakuru, Kenya | Tel: +254 722 981 364', 23, 44);

  // Ticket Status Badge
  if (booking.paymentStatus === 'PAID') {
    doc.setFillColor(...greenColor);
  } else {
    doc.setFillColor(...primaryColor);
  }
  doc.roundedRect(148, 23, 40, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    booking.paymentStatus === 'PAID' ? 'PAID & CONFIRMED' : booking.paymentStatus,
    168,
    29.5,
    { align: 'center' }
  );

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`TICKET ID: ${ticketNumber}`, 187, 42, { align: 'right' });

  // Reference & Ticket Metadata Row
  doc.setFillColor(...lightGray);
  doc.rect(15.5, 53, 179, 20, 'F');

  doc.setTextColor(...grayColor);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TICKET ID', 23, 60);
  doc.text('BOOKING ID', 68, 60);
  doc.text('BOOKING STATUS', 112, 60);
  doc.text('PAYMENT STATUS', 155, 60);

  doc.setTextColor(...darkColor);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(ticketNumber, 23, 67);
  doc.text(booking.bookingReference, 68, 67);
  doc.text(booking.bookingStatus, 112, 67);
  doc.text(booking.paymentStatus, 155, 67);

  // Journey Details Section
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('JOURNEY & VEHICLE DETAILS', 23, 84);

  doc.setDrawColor(226, 232, 240);
  doc.line(23, 87, 187, 87);

  // Route Origin -> Destination
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ROUTE (ORIGIN → DESTINATION)', 23, 95);
  doc.text('TRAVEL DATE', 110, 95);
  doc.text('DEPARTURE TIME', 155, 95);

  doc.setTextColor(...darkColor);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`${booking.routeOrigin} -> ${booking.routeDestination}`, 23, 103);

  doc.setFontSize(10.5);
  doc.text(travelDateStr, 110, 103);
  doc.text(departureTimeStr, 155, 103);

  // Row 2 of Journey Details
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('VEHICLE REGISTRATION', 23, 115);
  doc.text('SEAT NUMBER(S)', 85, 115);
  doc.text('TRIP CODE', 135, 115);
  doc.text('ISSUED AT', 165, 115);

  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.busRegistration, 23, 122);
  doc.text(booking.passengers.map((p) => p.seatNumber).join(', '), 85, 122);
  doc.setFontSize(9.5);
  doc.text(booking.tripCode, 135, 122);
  doc.setFontSize(8);
  doc.text(issueDate, 165, 122);

  // Passenger Manifest Section
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PASSENGER DETAILS & SEAT ALLOCATION', 23, 136);
  doc.line(23, 139, 187, 139);

  // Table Header
  doc.setFillColor(...darkColor);
  doc.rect(23, 143, 164, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PASSENGER NAME', 27, 148.5);
  doc.text('TICKET ID', 85, 148.5);
  doc.text('SEAT', 125, 148.5);
  doc.text('CLASS', 143, 148.5);
  doc.text('FARE (KES)', 183, 148.5, { align: 'right' });

  let currentY = 157;
  booking.passengers.forEach((pax, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(...lightGray);
      doc.rect(23, currentY - 5.5, 164, 8, 'F');
    }
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(pax.fullName, 27, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(getTicketId(booking, pax), 85, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(pax.seatNumber, 125, currentY);

    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'normal');
    doc.text(pax.seatClass, 143, currentY);

    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.text(pax.fareKsh.toLocaleString(), 183, currentY, { align: 'right' });

    currentY += 8.5;
  });

  // Payment Summary Box
  const summaryY = Math.max(currentY + 4, 185);
  doc.setDrawColor(226, 232, 240);
  doc.line(23, summaryY, 187, summaryY);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(23, summaryY + 5, 100, 44, 3, 3, 'FD');

  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT & VERIFICATION RECEIPT', 29, summaryY + 13);

  doc.setFont('helvetica', 'normal');
  doc.text(`Customer Phone: ${booking.contactPhone}`, 29, summaryY + 20);
  doc.text(`Payment Method: ${booking.paymentMethod} (${booking.paymentStatus})`, 29, summaryY + 26);
  doc.text(
    `M-Pesa / Receipt Ref: ${booking.mpesaTransactionCode || booking.mpesaReceiptNumber || 'Verified Digital Booking'}`,
    29,
    summaryY + 32
  );

  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL FARE: KES ${booking.totalFareKsh.toLocaleString()}`, 29, summaryY + 42);

  // Secure QR Code Generation (encodes cryptographic verification URL, never raw personal info)
  const qrPayload = getTicketVerificationUrl(booking, targetPax);

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 3,
      width: 480,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(135, summaryY + 4, 50, 50, 3, 3, 'S');
    doc.addImage(qrDataUrl, 'PNG', 139, summaryY + 6, 42, 42);
    doc.setTextColor(...grayColor);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('SCAN QR TO VERIFY', 160, summaryY + 51.5, { align: 'center' });
  } catch (err) {
    console.error('Failed to generate QR code for PDF:', err);
  }

  // Footer Instructions
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    '1. Please arrive at the boarding point at least 30 minutes prior to scheduled departure.',
    23,
    252
  );
  doc.text(
    '2. Present this E-Ticket (printed, screenshot, or on mobile) and your National ID to the driver for QR verification.',
    23,
    257
  );
  doc.text(
    '3. Cryptographically secured by TransCar Rongai Ltd. Each QR token allows one-time boarding verification.',
    23,
    262
  );

  doc.save(`TransCar-Ticket-${ticketNumber}.pdf`);
}

export async function downloadTicketQrPng(booking: Booking, passengerIndex = 0) {
  const targetPax = booking.passengers[passengerIndex] || booking.passengers[0];
  const ticketNumber = getTicketId(booking, targetPax);
  const qrPayload = getTicketVerificationUrl(booking, targetPax);

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 600,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const link = document.createElement('a');
  link.href = qrDataUrl;
  link.download = `TransCar-QR-${ticketNumber}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const generateTicketPdf = generateTicketPDF;
export default generateTicketPDF;


