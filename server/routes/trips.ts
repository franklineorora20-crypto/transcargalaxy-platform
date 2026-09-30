import { Router } from 'express';
import { Booking, Trip } from '../../src/types';
import { bookings, routes, trips, vehicles } from '../store';
import {
  buildTripDetailsWithSeats,
  resolveRouteBySlug,
  searchPublicTrips,
} from '../domain/trips/tripService';
import { cleanupExpiredUnpaidBookings } from '../domain/bookings/bookingService';

const router = Router();

// =============================================================
// COMPANY INFORMATION
// =============================================================

router.get('/api/company', (_req, res) => {
  res.json({
    name: 'TransCar rongai Ltd.',
    brand: 'TransCar rongai',
    slogan:
      'Premier Intercity & Rongai Regional Express Transportation',
    headquarters:
      'Next to Isalu Center, Magadi Road, Ongata Rongai / Haile Selassie Avenue, Nairobi, Kenya',
    hotline: '+254 700 800 900',
    emergencyContact: '+254 711 999 000',
    email: 'support@transcarrongai.co.ke',
    established: 2018,
    activeFleetSize: vehicles.length,
    routesCovered: routes.length,
    offices: [
      {
        city: 'Ongata Rongai',
        address:
          'Next to Isalu Center, Ongata Rongai Terminal & Booking Office',
        phone: '+254 700 800 900',
        hours: '05:00 - 23:30',
      },
      {
        city: 'Nairobi',
        address:
          'Haile Selassie Avenue Central Stage',
        phone: '+254 700 800 901',
        hours: '05:00 - 23:00',
      },
      {
        city: 'Kisii',
        address:
          'Kisii Town Central Bus Terminal',
        phone: '+254 724 626 199',
        hours: '05:00 - 22:00',
      },
      {
        city: 'Nakuru',
        address: 'George Morara Avenue Station',
        phone: '+254 700 800 904',
        hours: '06:00 - 21:00',
      },
      {
        city: 'Eldoret',
        address:
          'Uganda Road Intercity Stage',
        phone: '+254 700 800 905',
        hours: '06:00 - 21:00',
      },
    ],
  });
});

// =============================================================
// PUBLIC ROUTES
// =============================================================

router.get('/api/routes', (_req, res) => {
  res.json(routes.filter((r) => r.isActive));
});

router.get('/api/routes/by-slug/:slug', (req, res) => {
  const result = resolveRouteBySlug(req.params.slug);
  if (!result.found) {
    return res.status(404).json({
      error: `Corridor route '${result.slug}' not found`,
      availableSlugs: result.availableSlugs,
    });
  }
  return res.json(result);
});

// =============================================================
// PUBLIC TRIP SEARCH
// =============================================================

router.get('/api/trips', (req, res) => {
  cleanupExpiredUnpaidBookings();
  const {
    origin,
    destination,
    date,
    demo,
  } = req.query as {
    origin?: string;
    destination?: string;
    date?: string;
    demo?: string;
  };

  const results = searchPublicTrips({ origin, destination, date, demo });
  res.json(results);
});

// =============================================================
// PUBLIC TRIP DETAILS / SEATS
// =============================================================

router.get('/api/trips/:id', (req, res) => {
  cleanupExpiredUnpaidBookings();
  const trip = trips.find(
    (t) =>
      t.id === req.params.id ||
      t.tripCode === req.params.id,
  );

  if (!trip) {
    return res.status(404).json({
      error: 'Trip not found.',
    });
  }

  res.json(buildTripDetailsWithSeats(trip));
});

// =============================================================
// PUBLIC BUS TRACKING
// =============================================================

router.get('/api/tracking/:code', (req, res) => {
  const code = req.params.code.trim().toUpperCase();

  let matchedTrip: Trip | undefined;
  let bookingInfo: Booking | undefined;

  const matchedBooking = bookings.find(
    (b) => b.bookingReference.toUpperCase() === code,
  );

  if (matchedBooking) {
    bookingInfo = matchedBooking;

    matchedTrip = trips.find(
      (t) =>
        t.id === matchedBooking.tripId ||
        t.tripCode === matchedBooking.tripCode,
    );
  } else {
    matchedTrip = trips.find(
      (t) =>
        t.tripCode.toUpperCase() === code ||
        t.vehicle.registrationNumber.toUpperCase().replace(/\s+/g, '') ===
          code.replace(/\s+/g, ''),
    );
  }

  if (!matchedTrip) {
    return res.status(404).json({
      error:
        'No active bus or journey found matching that code. Please check your Booking Reference or Trip Code.',
    });
  }

  let percentCompleted = 10;

  if (matchedTrip.status === 'SCHEDULED') {
    percentCompleted = 0;
  } else if (matchedTrip.status === 'BOARDING') {
    percentCompleted = 5;
  } else if (matchedTrip.status === 'DEPARTED') {
    percentCompleted = 20;
  } else if (matchedTrip.status === 'IN_TRANSIT') {
    percentCompleted = 55;
  } else if (matchedTrip.status === 'AT_STOP') {
    percentCompleted = 65;
  } else if (matchedTrip.status === 'ARRIVED') {
    percentCompleted = 100;
  }

  const publicTrackingPayload = {
    tripCode: matchedTrip.tripCode,
    route: `${matchedTrip.route.origin} → ${matchedTrip.route.destination}`,
    origin: matchedTrip.route.origin,
    destination: matchedTrip.route.destination,
    busRegistration: matchedTrip.vehicle.registrationNumber,
    busModel: matchedTrip.vehicle.model,
    departureTime: matchedTrip.departureTime,
    estimatedArrivalTime: matchedTrip.estimatedArrivalTime,
    status: matchedTrip.status,
    currentStop:
      matchedTrip.currentStop ||
      (matchedTrip.status === 'IN_TRANSIT'
        ? 'Highway Corridor'
        : matchedTrip.route.origin === 'Rongai'
          ? 'Rongai Terminal (Next to Isalu Center)'
          : 'Origin Terminal'),
    nextStop:
      matchedTrip.route.stops[matchedTrip.route.stops.length - 1]?.name ||
      matchedTrip.route.destination,
    speedKmH: matchedTrip.status === 'IN_TRANSIT' ? 76 : 0,
    delayMinutes: matchedTrip.delayMinutes,
    delayReason:
      matchedTrip.delayReason ||
      (matchedTrip.delayMinutes > 0 ? 'Traffic slowdown' : undefined),
    percentCompleted,
    lastUpdated: new Date().toISOString(),
    coordinates: matchedTrip.currentLocationCoords || {
      lat: -1.286389,
      lng: 36.817223,
    },
    bookingReference: bookingInfo?.bookingReference,
  };

  res.json(publicTrackingPayload);
});

export default router;
