# Transcar Rongai Security Fixes

- [x] Removed `x-user-role`, `x-role`, and `x-driver-id` authorization paths.
- [x] Protected manager and driver APIs with Supabase Auth JWT validation.
- [x] Added `requireAuth` and role-aware `requireRole` middleware.
- [x] Removed simulated driver/manager token issuance and demo auto-provisioning.
- [x] Added server-only Supabase admin client with client-import protection.
- [x] Added leaked service-role fingerprint warning and startup configuration checks.
- [x] Replaced real credentials in `.env.example` with placeholders.
- [x] Cleared the local service-role value from `.env`; rotate the exposed key in Supabase.
- [x] Added seat inventory and atomic `book_seat` SQL RPC with row locking.
- [x] Added unique trip/seat/travel-date reservation constraint and API validation.
- [x] Scoped driver trip, manifest, status, and boarding access to the authenticated driver.
- [x] Added backend fare quote endpoint and server-side total validation.
- [x] Removed card payment UI and rejected non-M-Pesa bookings.
- [x] Removed fake M-Pesa receipts and automatic payment approval.
- [x] Added Daraja STK push, STK query, signed callback handling, and pending status.
- [x] Added Supabase runtime-state persistence so application data survives restarts when configured.

## Required Operations

1. Apply the migrations in `supabase/migrations/` to the Supabase project.
2. Set a newly rotated `SUPABASE_SERVICE_ROLE_KEY` in local `.env` or the deployment secret store.
3. Configure real Daraja credentials and `MPESA_CALLBACK_SECRET` before enabling live payment verification.
4. Create Supabase Auth users and assign `customer`, `driver`, or `manager` roles in metadata/profiles.
5. Never commit `.env` or place service-role credentials in any `VITE_` variable.
