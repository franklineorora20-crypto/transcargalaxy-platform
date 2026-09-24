# TransCar Galaxy - System Architecture

## Architectural Overview

TransCar Galaxy is a full-stack transport management platform providing real-time booking, vehicle telematics, driver dispatch, and executive financial operations.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Web Layer                              │
│  ┌──────────────────────┬──────────────────────┬──────────────────────┐  │
│  │   Passenger Public   │    Driver Cockpit    │    Manager Portal    │  │
│  │   (Search / Book /   │   (QR Check-in /     │   (Fleet / Routes /  │  │
│  │    Track / Ticket)   │    NTSA Checklist)   │    Ledger / Reports) │  │
│  └──────────────────────┴──────────────────────┴──────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST / JSON
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Node.js / Express API Backend                      │
│  - Authentication & JWT Token Verification                              │
│  - Role-Based Access Control (RBAC Middleware)                          │
│  - M-Pesa Daraja STK Push & C2B Webhook Processor                       │
│  - Conflict Guard & Seat Lock Engine                                    │
│  - Security Audit Logging                                               │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ PostgreSQL Protocol (TLS)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Supabase PostgreSQL Database                       │
│  - Row Level Security (RLS) Enforced Tables                             │
│  - Foreign Key Constraints & Triggers                                   │
│  - State Synchronization & Immutable Audit Logs                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Separation of Concerns

The codebase maintains strict interface and access boundaries:

### 1. Public / Passenger-Facing Layer (`src/components/public/`)
- **HomePage**: Fast search bar, featured routes, fleet highlights, customer trust badges.
- **TripSearchPage**: Filter trips by date, origin, destination, vehicle class, and seat availability.
- **BookingFlow**: Interactive Toyota HiAce seat selector (11, 14, 16 seats), passenger details, and M-Pesa payment prompt.
- **TripTrackingPage**: Live GPS telematics, estimated arrival times, intermediate stop tracking.
- **TicketRetrievalPage**: Retrieve digital e-tickets via booking reference or phone number.

### 2. Driver Interface (`src/components/driver/`)
- **DriverCockpit**: Assigned upcoming trips, passenger manifest checklist, status progression (`SCHEDULED` → `BOARDING` → `IN_TRANSIT` → `ARRIVED`).
- **QR Validator**: Built-in camera & file-upload QR decoder with audio boarding confirmation.
- **Pre-Trip Checklist**: NTSA safety walkaround (speed governor seal, pneumatic brakes, tire tread, fire extinguisher).
- **Incident Reporting**: Real-time traffic, weather, or breakdown logger.

### 3. Manager Interface (`src/components/manager/`)
- **Executive Dashboard**: Real-time KPIs (Departures, Fleet status, Passenger counts, Load factor, Financials).
- **Trips & Schedules**: Schedule departures, vehicle & captain assignment, status overrides.
- **Bookings & Manifests**: Passenger records, M-Pesa payment references, refund issuance.
- **Routes & Dynamic Pricing**: Base fare adjustments, manual overrides, network batch adjuster.
- **Fleet Management**: 6 HiAce vehicle inventory, maintenance flags, inspection records.
- **Drivers Roster**: PSV licensing records, captain duty status.
- **Manager-Only Financials**: Operating expense ledger, payroll disbursement, CSV export.
- **Reports & Analytics**: Route profitability, capacity utilization, expense breakdown.
- **Safety & Incident Management**: Pre-trip audit inspection logs and incident reports.
- **Security Audit Logs**: Chronological log of manager and dispatch actions.

### 4. Developer / Database Layer (Repository Only)
- Reference schema (`supabase/schema.sql`).
- Incremental migrations (`supabase/migrations/`).
- Architecture & deployment documentation (`docs/`).
- **Strictly excluded from production UI.**

---

## Data Flow & State Management

1. **Client Requests**: Frontend components make typed requests through `ApiService` (`src/services/api.ts`).
2. **Authentication**: Requests carry Bearer tokens verified by server-side middleware.
3. **Persistence**: Server executes queries against Supabase PostgreSQL or persists runtime state via transaction-safe methods.
4. **Optimistic Updates**: Manager and Driver portals apply instantaneous state updates with automatic rollback on network failure.
