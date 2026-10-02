import type { Trip } from '../../../src/types/index.js';
import { routes, trips } from '../../store/index.js';

export function calculateTripFare(
  trip: Trip,
  seatNumbers: string[],
) {
  const fares = seatNumbers.map(() => trip.fareKsh);

  const fare = fares.reduce((sum, value) => sum + value, 0);

  const serviceFee = 0;

  return {
    fare,
    serviceFee,
    total: fare + serviceFee,
  };
}

export function searchPublicTrips(params: {
  origin?: string;
  destination?: string;
  date?: string;
  demo?: string;
}): Trip[] {
  const { origin, destination, date, demo } = params;
  let results = [...trips];

  if (origin) {
    results = results.filter((t) =>
      t.route.origin.toLowerCase().includes(origin.toLowerCase()),
    );
  }

  if (destination) {
    results = results.filter((t) =>
      t.route.destination.toLowerCase().includes(destination.toLowerCase()),
    );
  }

  if (date && demo !== 'true') {
    const searchDay = date.split('T')[0];
    results = results.filter((t) => t.departureTime.startsWith(searchDay));
  }

  if (demo === 'true' && process.env.NODE_ENV !== 'production') {
    const demoDate = date
      ? date.split('T')[0]
      : new Date().toISOString().split('T')[0];

    results = results.map((trip) => ({
      ...trip,
      departureTime: `${demoDate}T01:00:00.000Z`,
      estimatedArrivalTime: `${demoDate}T07:30:00.000Z`,
      status: 'SCHEDULED' as const,
    }));
  }

  return results;
}

export function buildTripDetailsWithSeats(trip: Trip) {
  const capacity = trip.totalSeats || trip.vehicle?.seatingCapacity || 14;
  const bookedSet = new Set(trip.bookedSeatNumbers || []);

  const seatConfigs: { [key: number]: string[] } = {
    11: ['P1', 'P2', '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C'],
    14: ['P1', 'P2', '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C'],
    16: ['P1', 'P2', '1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '5A', '5B', '5C'],
  };

  const targetConfig = capacity === 11 || capacity === 16 ? capacity : 14;
  const seatList = seatConfigs[targetConfig] || seatConfigs[14];

  const seats = seatList.map((seatNum) => {
    const row = parseInt(seatNum[0], 10);
    const isWindow = seatNum.endsWith('A') || seatNum.endsWith('C');
    const isExecutive = targetConfig === 11 || row === 1;

    return {
      seatNumber: seatNum,
      row,
      column: seatNum.endsWith('A') ? 1 : seatNum.endsWith('B') ? 2 : 3,
      seatClass: isExecutive ? 'EXECUTIVE' : 'STANDARD',
      fareMultiplier: isExecutive ? 1.15 : 1.0,
      isOccupied: bookedSet.has(seatNum),
      isAccessible: row === 1 || seatNum === '2A',
      isWindow,
      description:
        seatNum === '1A'
          ? 'Front Co-Driver Panoramic Window'
          : seatNum === '1B'
          ? 'Front Center Passenger Seat'
          : isWindow
          ? 'Scenic Highway Window View'
          : 'Comfort Aisle Seat',
    };
  });

  return {
    ...trip,
    seats,
    chassisConfiguration:
      targetConfig === 11
        ? '11_SEATER_VIP'
        : targetConfig === 16
        ? '16_SEATER_MAXI'
        : '14_SEATER_STANDARD',
  };
}

export const CORRIDOR_SLUG_MAP: Record<
  string,
  { origin: string; destination: string; title: string }
> = {
  'massai-mall-kisii': { origin: 'Rongai', destination: 'Kisii', title: 'Maasai Mall / Ongata Rongai to Kisii Express' },
  'ongata-rongai-kisii': { origin: 'Rongai', destination: 'Kisii', title: 'Ongata Rongai to Kisii Express' },
  'kisii-massai-mall': { origin: 'Kisii', destination: 'Rongai', title: 'Kisii to Maasai Mall / Rongai Express' },
  'kisii-ongata-rongai': { origin: 'Kisii', destination: 'Rongai', title: 'Kisii to Ongata Rongai Express' },
  'ngong-kisii': { origin: 'Ngong', destination: 'Kisii', title: 'Ngong to Kisii Express' },
  'kisii-ngong': { origin: 'Kisii', destination: 'Ngong', title: 'Kisii to Ngong Express' },
  'kiserian-kisii': { origin: 'Kiserian', destination: 'Kisii', title: 'Kiserian to Kisii Express' },
  'kisii-kiserian': { origin: 'Kisii', destination: 'Kiserian', title: 'Kisii to Kiserian Express' },
  'massai-mall-sirare': { origin: 'Rongai', destination: 'Sirare', title: 'Rongai to Sirare Express' },
  'ongata-rongai-sirare': { origin: 'Rongai', destination: 'Sirare', title: 'Ongata Rongai to Sirare Express' },
  'sirare-massai-mall': { origin: 'Sirare', destination: 'Rongai', title: 'Sirare to Rongai Express' },
  'massai-mall-migori': { origin: 'Rongai', destination: 'Migori', title: 'Rongai to Migori Express' },
  'ongata-rongai-migori': { origin: 'Rongai', destination: 'Migori', title: 'Ongata Rongai to Migori Express' },
  'migori-massai-mall': { origin: 'Migori', destination: 'Rongai', title: 'Migori to Rongai Express' },
  'massai-mall-awendo': { origin: 'Rongai', destination: 'Awendo', title: 'Rongai to Awendo Express' },
  'ongata-rongai-awendo': { origin: 'Rongai', destination: 'Awendo', title: 'Ongata Rongai to Awendo Express' },
  'awendo-massai-mall': { origin: 'Awendo', destination: 'Rongai', title: 'Awendo to Rongai Express' },
  'massai-mall-rongo': { origin: 'Rongai', destination: 'Rongo', title: 'Rongai to Rongo Express' },
  'rongo-massai-mall': { origin: 'Rongo', destination: 'Rongai', title: 'Rongo to Rongai Express' },
  'massai-mall-kehancha': { origin: 'Rongai', destination: 'Kehancha', title: 'Rongai to Kehancha Express' },
  'kehancha-massai-mall': { origin: 'Kehancha', destination: 'Rongai', title: 'Kehancha to Rongai Express' },
};

export function resolveRouteBySlug(rawSlug: string) {
  const slug = rawSlug.toLowerCase().trim();
  const match = CORRIDOR_SLUG_MAP[slug];

  if (!match) {
    const fuzzy = routes.find((r) => {
      const codeSlug = `${r.origin.toLowerCase()}-${r.destination.toLowerCase()}`.replace(/\s+/g, '-');
      return slug.includes(codeSlug) || codeSlug.includes(slug);
    });

    if (fuzzy) {
      return {
        found: true as const,
        slug,
        route: fuzzy,
        origin: fuzzy.origin,
        destination: fuzzy.destination,
        title: `${fuzzy.origin} to ${fuzzy.destination} Express`,
      };
    }

    return {
      found: false as const,
      slug,
      availableSlugs: Object.keys(CORRIDOR_SLUG_MAP),
    };
  }

  const route =
    routes.find(
      (r) =>
        r.origin.toLowerCase().includes(match.origin.toLowerCase()) &&
        r.destination.toLowerCase().includes(match.destination.toLowerCase()),
    ) || routes[0];

  return {
    found: true as const,
    slug,
    title: match.title,
    origin: match.origin,
    destination: match.destination,
    route,
  };
}
