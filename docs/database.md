# TransCar Galaxy - Database Documentation

## Overview

TransCar Galaxy utilizes a high-performance **Supabase PostgreSQL** relational database for all transactional, fleet, passenger, financial, safety, and operational state.

The database is architected with strict relational integrity, Row Level Security (RLS) policies, automated audit triggers, and database-level validation to support 24/7 passenger transport operations.

---

## Architecture & Schema Organization

The consolidated PostgreSQL reference schema is stored in `supabase/schema.sql`, with incremental change management tracked in `supabase/migrations/`.

### Core Application Entities

| Entity / Table | Description | Key Relationships |
| :--- | :--- | :--- |
| `profiles` | User accounts linked directly to `auth.users` | `id` (PK, references `auth.users`) |
| `routes` | Intercity and commuter corridor definitions | Referenced by `trips` |
| `vehicles` | Fleet inventory (11-seater, 14-seater, and 16-seater HiAce vans) | Referenced by `trips`, `vehicle_inspections`, `expenses` |
| `drivers` | PSV certified captain records and license numbers | Linked to `profiles`, assigned to `trips` |
| `trips` | Scheduled departures, timestamps, fares, and seat status | References `routes`, `vehicles`, `drivers` |
| `bookings` | Passenger booking orders and payment states | References `trips`, links to `passengers`, `payments` |
| `passengers` | Individual manifest records and assigned seat numbers | References `bookings` and `trips` |
| `payments` | M-Pesa STK Push / Paybill transaction receipts | References `bookings` |
| `expenses` | Itemized operational disbursements (Fuel, Workshop, Tolls) | Manager-only |
| `revenue_items` | Daily financial revenue rollups | Manager-only |
| `payroll_items` | Crew and staff monthly wage ledger | Manager-only |
| `vehicle_inspections` | NTSA roadworthiness & 80 km/h limiter audit checklists | References `vehicles`, logged by captains & managers |
| `incident_reports` | Road events, traffic delays, weather, mechanical faults | References `trips`, `vehicles`, `drivers` |
| `maintenance_records` | Workshop work orders and spare parts logs | References `vehicles` |
| `announcements` | Fleet dispatch advisories broadcast to driver cockpits | Created by managers, viewed by crew |
| `audit_logs` | Immutable security audit trail | Auto-recorded on sensitive actions |

---

## Authentication & Role-Based Access Control (RBAC)

The application enforces three distinct user roles:

1. **`customer` (`CUSTOMER_PUBLIC`)**:
   - Can view active routes, search schedules, book seats, verify M-Pesa payments, and retrieve digital tickets.
   - **No access** to internal operational logs, driver dashboards, vehicle maintenance, or financial data.

2. **`driver` (`DRIVER`)**:
   - Access restricted to assigned trips, passenger manifest check-in, QR ticket boarding validation, pre-trip roadworthiness walkaround checklists, and incident reporting.
   - **No access** to manager revenue, expense ledgers, payroll, or system audit logs.

3. **`manager` (`MANAGER`)**:
   - Full operational and business administration: route pricing, trip dispatching, fleet management, revenue ledgers, expense tracking, payroll authorization, and security audit inspection.

---

## Row Level Security (RLS) Policy Strategy

Row Level Security is enabled on all tables:

```sql
-- Example: Financial table RLS (Manager-Only)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view all operational expenses"
    ON public.expenses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'
        )
    );

CREATE POLICY "Managers can record operational expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'manager'
        )
    );
```

---

## Database Migrations & Version Control

- **Consolidated Reference**: `supabase/schema.sql` represents the complete idempotent target schema.
- **Migration History**: `supabase/migrations/` tracks incremental schema changes sequentially:
  * `20260914_transport_system.sql`
  * `20260917_000001_complete_transcar_galaxy_schema.sql`
  * `20260917_000002_transcar_seed_data.sql`
  * `20260919_000003_security_seats_and_driver_scope.sql`
  * `20260919_000004_runtime_state_persistence.sql`
  * `20260919_000005_mpesa_only.sql`
  * `20260919_000006_admin_role_alignment.sql`

**Production Safety Rule**: Never execute destructive commands (`DROP TABLE`, `TRUNCATE`, `DROP DATABASE`) against production. Schema updates must be applied via incremental, tested migration scripts.
