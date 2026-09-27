# Transcar Rongai

**Transcar Rongai** is a modern web-based transportation management and passenger booking platform developed for **Transcar Galaxy Rongai**. The application provides a centralized digital platform for public transport information, trip discovery, passenger bookings, driver operations, fleet management, and business administration.

The platform is designed to improve the efficiency of transport operations while providing passengers with a simple, accessible, and responsive booking experience.

---

## Overview

Transcar Rongai provides a unified digital environment for managing transportation services and day-to-day operational activities.

The platform supports three primary areas:

* **Public passenger services** — route discovery, trip information, and passenger bookings.
* **Driver operations** — assigned trips, passenger manifests, boarding management, vehicle inspections, incidents, and operational announcements.
* **Management operations** — routes, vehicles, drivers, trips, bookings, revenue, expenses, payroll, inspections, incidents, announcements, and operational records.

The application is built with a focus on:

* Simple and intuitive user experience
* Responsive design across desktop, tablet, and mobile devices
* Efficient transport and booking workflows
* Secure authentication and role-based access
* Reliable data management
* Clear separation of public and internal operations
* Maintainable and scalable architecture
* Fast and efficient user interactions

---

# Key Features

## Public Passenger Platform

Passengers and public users can:

* Browse available transport services
* Explore routes and destinations
* Search available trips
* View trip information
* Make passenger bookings
* Receive booking references
* Access relevant booking information
* Use the platform on desktop and mobile devices

The public interface is designed to provide passengers with the information they need without exposing internal business or financial operations.

---

## Driver Operations

Authenticated drivers have access to operational tools relevant to their assigned responsibilities.

Driver functionality includes:

* Driver dashboard
* Assigned trips
* Trip information
* Passenger manifests
* Passenger boarding management
* Vehicle inspection
* Incident reporting
* Operational announcements
* Trip-related information

Driver access is restricted according to the application's role-based authorization model.

---

## Management Operations

Authorized managers have access to the platform's operational management functions.

Management functionality includes:

* Management dashboard
* Route management
* Vehicle management
* Driver management
* Trip management
* Booking management
* Passenger manifest management
* Revenue management
* Expense management
* Payroll records
* Vehicle inspections
* Incident management
* Operational announcements
* Audit and operational records

Sensitive business and financial information is restricted to authorized management users.

---

## Booking Management

The booking system allows passengers to reserve available trips while providing management with centralized visibility of bookings.

Booking information can include:

* Passenger details
* Trip information
* Booking reference
* Seat information where applicable
* Booking status
* Payment status

The system is designed to support an organized passenger booking and boarding workflow.

---

## Fleet Management

The platform provides management functionality for maintaining vehicle information and operational status.

Vehicle records may include:

* Registration information
* Vehicle type
* Seating capacity
* Operational status
* Assigned trips
* Inspection records
* Incident records

Vehicle configuration and seating capacity can be managed according to the actual transport vehicles operated by the business.

---

## Driver Management

Management users can maintain driver information and operational assignments.

Driver management supports information such as:

* Driver details
* Contact information
* Driver status
* Assigned trips
* Operational assignments
* Inspection and incident records where applicable

---

## Trip Management

Trips can be organized around:

* Route
* Origin
* Destination
* Departure time
* Arrival information
* Assigned vehicle
* Assigned driver
* Passenger capacity
* Booking status
* Trip status

A typical operational workflow is:

```text
Route
   ↓
Trip Scheduled
   ↓
Vehicle Assigned
   ↓
Driver Assigned
   ↓
Passenger Bookings
   ↓
Passenger Manifest
   ↓
Vehicle Inspection
   ↓
Passenger Boarding
   ↓
Trip Operation
   ↓
Trip Completion
```

---

## Vehicle Inspection

The driver interface supports vehicle inspection workflows before or during transport operations.

Inspection records can cover areas such as:

* Tyres
* Brakes
* Lights
* Indicators
* Mirrors
* Seats
* Safety equipment
* General vehicle condition

Inspection information can be retained for operational and management reference.

---

## Incident Management

Authorized users can record and manage operational incidents.

Incident records may contain:

* Date and time
* Driver
* Vehicle
* Trip
* Incident type
* Description
* Status
* Follow-up information

This provides management with a structured method of maintaining operational records.

---

## Announcements

Management users can publish operational announcements for drivers and relevant staff.

Announcements may contain:

* Title
* Message
* Priority
* Target audience
* Publication status
* Date and time

---

# Authentication and Access Control

Authentication is handled through **Supabase Auth**, with application roles determining access to protected functionality.

The platform follows a role-based access model:

| User Type   | Access                                              |
| ----------- | --------------------------------------------------- |
| Public User | Public transport information and passenger booking  |
| Driver      | Driver dashboard and assigned operational functions |
| Manager     | Management, operational, and financial functions    |

Authentication and authorization are designed to ensure that users only access functionality appropriate to their role.

Sensitive management functionality, particularly financial information, is not exposed through public or driver interfaces.

---

# Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide React

## Backend

* Node.js
* Express
* TypeScript

## Database and Authentication

* Supabase
* PostgreSQL
* Supabase Authentication

## Payment Integration

* Safaricom M-Pesa Daraja API, where enabled

## Deployment

* Vercel
* GitHub

---

# System Architecture

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
                       ┌─────────────┴─────────────┐
                       ▼                           ▼
              ┌─────────────────┐        ┌─────────────────┐
              │     Supabase    │        │  M-Pesa Daraja  │
              │ PostgreSQL/Auth │        │      API        │
              └─────────────────┘        └─────────────────┘
```

---

# Project Structure

The project follows a modular application structure.

```text
transcar-rongai/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
│
├── api/
│   └── index.ts
│
├── supabase/
│   └── migrations/
│
├── server.ts
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md
```

> The exact structure may change as additional modules and functionality are introduced.

---

# Getting Started

## Prerequisites

Ensure the following are installed:

* Node.js
* npm
* Git

Verify Node.js:

```bash
node --version
```

Verify npm:

```bash
npm --version
```

---

# Installation

Clone the repository:

```bash
git clone [REPOSITORY_URL]
```

Move into the project directory:

```bash
cd [PROJECT_DIRECTORY]
```

Install dependencies:

```bash
npm install
```

---

# Environment Variables

Create a local environment file:

```text
.env.local
```

Configure the environment variables required by the application.

Example:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Where M-Pesa integration is enabled, the required Daraja credentials should also be configured securely through environment variables.

Example:

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=your_callback_url
```

Only include environment variables that are actually required by the deployed version of the application.

### Security

Never commit the following to the repository:

* Passwords
* API secrets
* Supabase service-role keys
* M-Pesa credentials
* Authentication tokens
* Private keys
* Other confidential credentials

Environment files should be excluded through `.gitignore`.

---

# Running the Application

Start the development server:

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

The application may typically be available at:

```text
http://localhost:5173
```

The actual port depends on the project's current Vite configuration.

---

# Production Build

Create an optimized production build:

```bash
npm run build
```

If the project uses a combined frontend and backend build process, the configured `build` script will handle the required build steps.

---

# Preview Production Build

To preview the production frontend locally:

```bash
npm run preview
```

---

# Configuration

Before running the application in production, configure all required external services and environment variables.

Depending on the enabled functionality, these may include:

* Supabase project configuration
* Supabase Authentication
* PostgreSQL database
* M-Pesa Daraja API
* Production API configuration
* Vercel environment variables

Configuration values should be stored securely as environment variables rather than hard-coded into the application.

---

# API

The application uses backend API endpoints to support server-side operations.

The API includes functionality for areas such as:

```text
Authentication
Routes
Trips
Bookings
Drivers
Vehicles
Payments
Inspections
Incidents
Announcements
Management operations
```

A health endpoint is also available for deployment and infrastructure verification:

```text
GET /api/health
```

A successful health check should return an operational status from the backend service.

---

# M-Pesa Integration

Where enabled, the application can integrate with Safaricom's M-Pesa Daraja API.

The general payment workflow is:

```text
Passenger
    ↓
Booking
    ↓
Payment Request
    ↓
M-Pesa STK Push
    ↓
Passenger Authorizes Payment
    ↓
M-Pesa Callback
    ↓
Backend
    ↓
Payment Status Updated
```

M-Pesa credentials must remain server-side and must not be exposed through frontend source code.

---

# Database

The application uses **Supabase PostgreSQL** for persistent application data and **Supabase Auth** for authentication.

The platform's data model supports operational entities including:

* User profiles
* Drivers
* Vehicles
* Routes
* Trips
* Bookings
* Payments
* Revenue
* Expenses
* Payroll
* Vehicle inspections
* Incidents
* Announcements
* Audit records

The exact database structure is subject to the current implementation and may evolve as the platform develops.

---

# Security

Security is a core consideration in the application's architecture.

The platform follows these principles:

* Authentication for protected functionality
* Role-based access control
* Server-side authorization for sensitive operations
* Environment-based secret management
* Restricted access to financial information
* Protection of passenger information
* Validation of user-submitted data
* Secure handling of payment credentials
* Separation of public and internal functionality

Frontend UI restrictions should not be treated as the sole security mechanism. Sensitive operations must also be protected at the backend and database levels where applicable.

---

# Development Guidelines

When modifying the project:

1. Create a separate branch for significant changes.
2. Keep components focused and reusable.
3. Maintain consistent TypeScript types.
4. Validate user input.
5. Handle API errors appropriately.
6. Avoid exposing sensitive credentials.
7. Keep business logic separated from presentation where practical.
8. Remove unused dependencies and components.
9. Test changes locally before deployment.
10. Run the production build before merging significant changes.

---

# Testing Checklist

Before deploying a production release, verify the following.

## Public Platform

* [ ] Application loads correctly
* [ ] Routes display correctly
* [ ] Trip search works
* [ ] Booking workflow works
* [ ] Booking reference is generated
* [ ] Payment workflow works where enabled
* [ ] Mobile layout works correctly

## Authentication

* [ ] Manager login works
* [ ] Driver login works
* [ ] Invalid credentials are rejected
* [ ] Logout works
* [ ] User sessions are handled correctly
* [ ] User roles are correctly identified

## Driver Operations

* [ ] Driver dashboard loads
* [ ] Assigned trips display correctly
* [ ] Passenger manifest works
* [ ] Boarding workflow works
* [ ] Vehicle inspection works
* [ ] Incident reporting works
* [ ] Announcements display correctly

## Management

* [ ] Manager dashboard loads
* [ ] Route management works
* [ ] Vehicle management works
* [ ] Driver management works
* [ ] Trip management works
* [ ] Booking management works
* [ ] Financial information is restricted
* [ ] Operational records are accessible

## Production

* [ ] Production build succeeds
* [ ] `/api/health` responds correctly
* [ ] Supabase connection works
* [ ] Authentication works
* [ ] Production environment variables are configured
* [ ] No secrets are committed
* [ ] HTTPS is enabled
* [ ] Public booking workflow works

---

# Deployment

The application is designed for deployment using **Vercel** with source code managed through **GitHub**.

Recommended workflow:

```text
Local Development
       ↓
Testing
       ↓
Git Commit
       ↓
GitHub
       ↓
Vercel Build
       ↓
Production Deployment
```

Before deploying:

```bash
npm run build
```

Ensure all required production environment variables have been configured in the Vercel project settings.

After deployment, verify:

```text
Production Website
        ↓
Authentication
        ↓
API Health
        ↓
Supabase
        ↓
Booking Workflow
        ↓
Manager/Driver Operations
```

---

# Maintenance

Future development may include:

* Additional transport services
* Enhanced passenger booking functionality
* Advanced fleet management
* Expanded driver operations
* Improved financial reporting
* Operational analytics
* Automated passenger notifications
* SMS integration
* Enhanced M-Pesa reconciliation
* GPS and vehicle tracking
* Digital receipts
* Progressive Web App functionality
* Expanded reporting and audit capabilities

Future features should be introduced according to the operational requirements of Transcar Galaxy Rongai.

---

# Project Status

**Status:** Active Development

Transcar Rongai is an actively developed transportation management and passenger booking platform. Application functionality, database structures, APIs, and user interfaces may evolve as development progresses.

---

# Ownership and License

This project is developed for **Transcar Galaxy Rongai**.

Unless otherwise agreed in writing between the developer and client, the source code, application architecture, business logic, design assets, and associated project materials remain subject to the ownership and usage terms established between the developer and the client.

This repository should not be redistributed, commercially reused, or repurposed without the appropriate authorization.

---

# Contact

**Developer:** Frankline Gwaro
**Client:** Transcar Galaxy Rongai
**Project:** Transcar Rongai

---

## Acknowledgements

Transcar Rongai is built using modern open-source technologies and third-party services, including:

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide React
* Node.js
* Express
* Supabase
* PostgreSQL
* Vercel
* Safaricom M-Pesa Daraja API

---

## Disclaimer

This README documents the intended functionality and architecture of the Transcar Rongai application.

Specific implementation details, API endpoints, database structures, environment variables, and available features may change as the application is updated.

For implementation-specific information, refer to the current source code, database configuration, and deployment environment.
