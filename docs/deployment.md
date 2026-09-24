# TransCar Galaxy - Deployment Guide

## Overview

This guide outlines deployment procedures, configuration requirements, and environment variable specifications for hosting TransCar Galaxy.

---

## Environment Variables

All sensitive values must be configured via environment variables in the host environment. **Never commit actual secret values into version control.**

### Required Variables (Server & Database)

| Variable Name | Description | Environment |
| :--- | :--- | :--- |
| `PORT` | Web server listening port (Default: `3000`) | Server |
| `JWT_SECRET` | Secret key for generating and verifying JSON Web Tokens | Server |
| `INITIAL_MANAGER_EMAIL` | Default manager account email for initial bootstrapping | Server |
| `INITIAL_MANAGER_PASSWORD` | Default manager account password for initial bootstrapping | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase backend service-role API key (server-side only) | Server |
| `MPESA_ENV` | M-Pesa environment (`sandbox` or `production`) | Server |
| `MPESA_CONSUMER_KEY` | Safaricom Daraja API Consumer Key | Server |
| `MPESA_CONSUMER_SECRET` | Safaricom Daraja API Consumer Secret | Server |
| `MPESA_PASSKEY` | Safaricom Daraja STK Push Passkey | Server |
| `MPESA_SHORTCODE` | Business Paybill / Till Shortcode | Server |
| `MPESA_CALLBACK_URL` | Webhook URL for M-Pesa IPN notifications | Server |
| `MPESA_CALLBACK_SECRET` | Secret key for verifying callback signature | Server |

### Client-Side Variables (Vite Prefix)

| Variable Name | Description | Environment |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Public Supabase project REST & Auth endpoint | Client & Server |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase Anonymous Key (safe for frontend) | Client & Server |

---

## Build Process

```bash
# 1. Install dependencies
npm install

# 2. Compile TypeScript & build client assets
npm run build
```

The build output is generated in the `dist/` directory.

---

## Deployment Targets

### 1. Node.js Full-Stack (Default)
In full-stack mode, `server.ts` serves both the Express API routes (`/api/*`) and static client assets from `dist/`:

```bash
npm start
```

### 2. Vercel / Serverless Deployment
Configured via `vercel.json`:
- Static assets route to `dist/`
- API calls route to serverless handler functions in `api/`

---

## Supabase Database Setup

1. **New Database Provisioning**:
   - Create a new project in the Supabase Dashboard.
   - Run the consolidated schema from `supabase/schema.sql` or apply migrations in `supabase/migrations/` in sequential order using the Supabase CLI:
     ```bash
     supabase db push
     ```

2. **Row Level Security (RLS)**:
   - Ensure RLS is active on all tables.
   - Policies defined in `supabase/schema.sql` automatically restrict manager-only tables (financials, audit logs) while allowing public read access on routes and active departures.

3. **Service Role Security**:
   - The `SUPABASE_SERVICE_ROLE_KEY` must **only** be supplied to server-side environments (`server.ts` or serverless functions).
   - Frontend client code must exclusively use `VITE_SUPABASE_ANON_KEY`.
