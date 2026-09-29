<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/57ee0eca-15d9-4862-b768-3a7caa0d7e09

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

# TransCar Galaxy

### Premier Intercity & Rongai Regional Express Transportation

TransCar Galaxy is a web-based transport management and passenger booking platform designed for **TransCar Rongai Ltd.** The system provides a centralized platform for managing routes, vehicles, drivers, trips, passenger bookings, operations, finance, inspections, incidents, and internal announcements.

The platform combines a public-facing transport information and booking experience with secure operational interfaces for managers and drivers.

---

## Overview

TransCar Galaxy is designed to streamline day-to-day transportation operations through a centralized digital platform.

The system provides different experiences based on the user's role:

* **Public users** can view available routes, scheduled trips, transport information, and make bookings.
* **Drivers** can access assigned trips, passenger manifests, vehicle inspection tools, and operational reporting.
* **Managers** can manage transport operations, vehicles, drivers, routes, trips, bookings, finances, inspections, incidents, announcements, and audit information.

The application is built as a modern web application with a React-based frontend, Node.js/Express backend services, Supabase for authentication and data services, and Vercel for deployment.

---

## Core Features

### Public Transport Platform

* View available routes
* Search scheduled trips
* View trip information
* Check vehicle availability
* Passenger booking
* Booking confirmation
* Booking reference/tracking information
* Responsive mobile-friendly interface
* Transport service information
* Interactive first-time user onboarding tutorial

### Driver Operations

Authenticated drivers can access:

* Driver dashboard
* Assigned trips
* Trip manifests
* Passenger information
* Passenger boarding management
* Vehicle inspection
* Incident reporting
* Operational announcements
* Driver-specific operational information

### Manager Operations

Managers have access to centralized operational controls including:

* Dashboard
* Route management
* Trip management
* Vehicle management
* Driver management
* Booking management
* Passenger manifests
* Revenue management
* Expense management
* Payroll information
* Vehicle inspections
* Incident management
* Operational announcements
* Audit logs
* System monitoring

### Payments

The platform is designed to support digital payment workflows, including M-Pesa integration through the Safaricom Daraja API.

Payment functionality can be enabled through environment configuration without exposing payment credentials in the source code.

---

## User Roles

The platform uses role-based access control.

| Role        | Access                                            |
| ----------- | ------------------------------------------------- |
| Public User | Public transport information and booking          |
| Driver      | Driver cockpit and assigned operational functions |
| Manager     | Full operational and financial management         |

### Manager

Managers can access sensitive business functions including:

* Revenue
* Expenses
* Payroll
* Vehicle management
* Driver management
* Route management
* Trip management
* Booking management
* Operational reporting
* Audit information

### Driver

Drivers are restricted to operational functions required for their assigned responsibilities.

### Public User

Public users do not have access to internal management or financial information.

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express
* TypeScript
* REST API

### Database & Authentication

* Supabase
* PostgreSQL
* Supabase Authentication
* Row Level Security where applicable

### Deployment

* Vercel
* GitHub

### Payment Integration

* Safaricom M-Pesa Daraja API

---

## System Architecture

The application follows a client-server architecture.

```text
                         ┌─────────────────────┐
                         │    Public Users     │
                         │ Passenger Booking   │
                         └──────────┬──────────┘
                                    │
                                    ▼
┌─────────────────┐       ┌─────────────────────┐
│    Drivers      │──────►│   React Frontend    │
│ Driver Cockpit  │       │   Vite + TypeScript │
└─────────────────┘       └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │    Express API      │
                          │    Node.js Server   │
                          └──────────┬──────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
         ┌─────────────────────┐           ┌─────────────────────┐
         │      Supabase       │           │   Safaricom M-Pesa  │
         │ PostgreSQL + Auth   │           │     Daraja API      │
         └─────────────────────┘           └─────────────────────┘
```

---

## Project Structure

```text
├── api/                        # Serverless API entrypoints (Vercel)
├── docs/                       # Architecture, database, and deployment docs
│   ├── architecture.md
│   ├── database.md
│   └── deployment.md
├── lib/                        # Backend Supabase & utility helpers
├── public/                     # Static assets, PWA manifest, and icons
├── scripts/                    # Database & operational helper scripts
├── src/
│   ├── components/
│   │   ├── common/             # Shared UI components (BrandName, Toast, OfflineBanner, PWA)
│   │   ├── driver/             # Driver Login and Driver Cockpit Portal
│   │   ├── layout/             # Global Header and Footer navigation
│   │   ├── manager/            # Manager Login and Executive Operations Portal
│   │   └── public/             # Passenger Booking, Seat Selector, Tracking, Tickets, Tutorial
│   ├── lib/                    # Client-side libraries & utilities
│   ├── services/               # Typed API client service layer
│   ├── types/                  # Shared TypeScript interfaces
│   ├── App.tsx                 # Main application router & state container
│   ├── index.css               # Tailwind CSS & custom design tokens
│   └── main.tsx                # React DOM application entry point
├── supabase/
│   ├── migrations/             # Incremental PostgreSQL migration scripts
│   └── schema.sql              # Consolidated PostgreSQL reference schema & RLS policies
├── .env.example                # Environment variable template
├── index.html                  # HTML entry point & SEO metadata
├── package.json                # Dependencies and build scripts
├── server.ts                   # Full-stack Express + Vite server
├── tsconfig.json               # TypeScript configuration
├── vercel.json                 # Vercel routing & deployment configuration
└── vite.config.ts              # Vite bundler & PWA configuration
```

---

## Database & Security Architecture

TransCar Galaxy uses **Supabase PostgreSQL** with Row Level Security (RLS) to enforce role separation across operational tables:

* **`profiles`**: User identity and role mapping (`customer`, `driver`, `manager`)
* **`routes`**: Intercity and regional shuttle corridors, base fares, and intermediate stops
* **`vehicles`**: Fleet inventory (11-seater, 14-seater, and 16-seater PSV layouts)
* **`drivers`**: PSV-licensed captains and duty status
* **`trips`**: Scheduled departures, assigned vehicles/captains, and real-time status
* **`bookings` & `passengers`**: Seat reservations, passenger manifests, and boarding status
* **`payments`**: M-Pesa STK Push and C2B transaction records
* **`expenses`, `revenue_items`, `payroll_items`**: Manager-only financial ledgers
* **`vehicle_inspections` & `incident_reports`**: NTSA safety compliance and road incident logs
* **`announcements` & `audit_logs`**: Fleet dispatch broadcasts and immutable security audit trails

---

## Environment Variables

Copy `.env.example` to `.env.local` (for local development) or configure the following variables in your deployment environment:

| Variable | Description | Scope |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase project URL | Client & Server |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anonymous key | Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (never expose to client) | Server Only |
| `JWT_SECRET` | Secret key for signing and verifying session tokens | Server Only |
| `INITIAL_MANAGER_EMAIL` | Bootstrap email for the initial manager account | Server Only |
| `INITIAL_MANAGER_PASSWORD` | Bootstrap password for the initial manager account | Server Only |
| `MPESA_ENV` | Safaricom Daraja environment (`sandbox` or `production`) | Server Only |
| `MPESA_CONSUMER_KEY` | Safaricom Daraja API Consumer Key | Server Only |
| `MPESA_CONSUMER_SECRET` | Safaricom Daraja API Consumer Secret | Server Only |
| `MPESA_PASSKEY` | Safaricom Lipa Na M-Pesa Online Passkey | Server Only |
| `MPESA_SHORTCODE` | Business Paybill or Till Shortcode | Server Only |
| `MPESA_CALLBACK_URL` | Public HTTPS webhook endpoint for M-Pesa callbacks | Server Only |
| `MPESA_CALLBACK_SECRET` | Secret token for validating M-Pesa webhook callbacks | Server Only |

---

## Scripts & Deployment

* **Development Server**: `npm run dev` (starts Express + Vite middleware on port `3000`)
* **Type Check / Lint**: `npm run lint`
* **Production Build**: `npm run build` (builds client bundle to `dist/` and bundles `server.ts` to `server.js`)
* **Start Production Server**: `npm start`

