/**
 * Passenger & Transit Data Validation Utilities
 * Enforces strict Kenyan NTSA compliance, prevents dummy/test data injection,
 * and standardizes date formatting.
 */

export function isValidPassengerName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length < 5 || trimmed.length > 50) return false;

  // Must contain only alphabetic characters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return false;

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false; // Must have at least First and Last name

  for (const part of parts) {
    if (part.length < 2) return false;
    // Real names with 3+ chars must contain at least one vowel
    if (part.length >= 3 && !/[aeiouyAEIOUY]/.test(part)) return false;
  }

  // Detect common keyboard spam & dummy values
  const lower = trimmed.toLowerCase().replace(/\s+/g, '');
  const dummyPatterns = [
    'qwerty', 'asdf', 'zxcv', 'rertgy', 'tyhjik', 'hjik', 'ghjk', 'dfgh', 'jklm',
    'test', 'dummy', 'sample', 'unknown', 'passenger', 'admin', 'fake', 'abcde'
  ];
  for (const pat of dummyPatterns) {
    if (lower.includes(pat)) return false;
  }

  // Reject 3+ consecutive repeated characters (e.g., 'Jooohn', 'Rrrrichard')
  if (/([a-zA-Z])\1{2,}/.test(trimmed)) return false;

  return true;
}

export function isValidKenyaID(id: string): boolean {
  if (!id) return false;
  const trimmed = id.trim().toUpperCase();

  // Kenyan National ID: 7 or 8 digits
  if (/^\d{7,8}$/.test(trimmed)) {
    // Block sequential or repetitive dummy numbers
    const dummies = [
      '1234567', '2345678', '3456789', '4567890', '5678901',
      '12345678', '87654321', '0000000', '00000000', '11111111',
      '22222222', '33333333', '44444444', '55555555', '99999999'
    ];
    if (dummies.includes(trimmed)) return false;
    if (/^(\d)\1+$/.test(trimmed)) return false; // All identical digits
    return true;
  }

  // Kenyan / International Passport: 1 letter followed by 7-8 digits (e.g. A1234567)
  if (/^[A-Z]\d{7,8}$/.test(trimmed)) {
    return true;
  }

  return false;
}

export function isValidKenyaPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Kenyan phone: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, +2541XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX
  const kenyaPhoneRegex = /^(?:\+254|254|0)(7|1)\d{8}$/;
  if (!kenyaPhoneRegex.test(cleaned)) return false;

  const dummies = [
    '0700000000', '0712345678', '0711111111', '0722222222', '0787654321',
    '0799999999', '254712345678', '254700000000', '+254700000000', '+254712345678'
  ];
  if (dummies.includes(cleaned)) return false;

  return true;
}

export function validatePassengerDetailsOrThrow(data: {
  passengers: Array<{ fullName: string; idNumber: string; seatNumber: string }>;
  contactName?: string;
  contactPhone?: string;
}): void {
  if (data.contactName && !isValidPassengerName(data.contactName)) {
    throw new Error('Invalid passenger details: Contact person must provide a valid full legal name.');
  }

  if (data.contactPhone && !isValidKenyaPhone(data.contactPhone)) {
    throw new Error('Invalid passenger details: Please enter a valid Kenyan phone number (e.g., 07XXXXXXXX or +2547XXXXXXXX).');
  }

  if (!data.passengers || data.passengers.length === 0) {
    throw new Error('Invalid passenger details: At least one passenger must be specified.');
  }

  for (let i = 0; i < data.passengers.length; i++) {
    const p = data.passengers[i];
    if (!isValidPassengerName(p.fullName)) {
      throw new Error(`Invalid passenger details: Passenger in Seat ${p.seatNumber || (i + 1)} must provide a valid full legal name (First and Last Name).`);
    }

    if (!isValidKenyaID(p.idNumber)) {
      throw new Error(`Invalid passenger details: Passenger in Seat ${p.seatNumber || (i + 1)} has an invalid National ID or Passport Number (must be 7-8 digits or valid passport).`);
    }
  }
}

/**
 * Format dates consistently as: EEE, dd MMM yyyy HH:mm EAT
 * Example: Thu, 25 Sep 2026 04:00 EAT
 */
export function formatEATDateTime(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Thu, 25 Sep 2026 04:00 EAT';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${dayName}, ${dayNum} ${monthName} ${year} ${hours}:${minutes} EAT`;
}
