# TransitOps

**Smart Transport Operations Platform** · Team Synora · Odoo Hackathon 2026

TransitOps is a centralized platform for managing the full lifecycle of a transport and logistics operation: vehicles, drivers, dispatching, maintenance, fuel and expenses, and analytics. It replaces spreadsheets and manual logbooks with a real-time operational command center.

## Highlights

- Role-based command center for Fleet Managers, Dispatchers, Safety Officers and Financial Analysts.
- Trip dispatch state machine with strict business-rule enforcement (capacity checks, license validity, no double-booking, automatic status transitions).
- Live 3D fleet map and an interactive command globe where vehicles move along their routes in real time.
- Predictive maintenance and a compliance radar for service-due forecasting and licence-expiry alerts.
- Analytics for fleet utilization, fuel efficiency, operational cost and vehicle ROI, with CSV export.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 and shadcn/ui
- Prisma with SQLite (zero-config local database)
- deck.gl + MapLibre (live map), react-globe.gl (command globe), React Three Fiber (3D showcase)
- Socket.IO (real-time updates), Recharts (analytics)

## Getting Started

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run dev
```

Then open http://localhost:3000.

## Core Business Rules

- Registration numbers are unique; retired or in-shop vehicles are hidden from dispatch.
- Drivers with expired licences or suspended status cannot be assigned to trips.
- A vehicle or driver already on a trip cannot be double-assigned.
- Cargo weight must not exceed the vehicle's maximum load capacity.
- Dispatch sets both vehicle and driver to On Trip; completion and cancellation restore them to Available.
- Opening a maintenance record moves a vehicle to In Shop; closing restores it to Available.

## Team Synora

Built for the Odoo Virtual Hackathon 2026.
