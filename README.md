# TransitOps — Smart Transport Operations Platform

> Team **Synora** · Odoo Hackathon 2026

TransitOps is a centralized platform for managing the full lifecycle of a transport/logistics operation — vehicles, drivers, dispatching, maintenance, fuel & expenses, and analytics — replacing spreadsheets and manual logbooks with a real-time operational command center.

## Highlights

- **Role-based command center** for Fleet Managers, Dispatchers, Safety Officers and Financial Analysts.
- **Trip dispatch state machine** with strict business-rule enforcement (capacity checks, license validity, no double-booking, automatic status transitions).
- **Live 3D fleet map & interactive globe** — vehicles move along their routes in real time.
- **Predictive maintenance & compliance radar** — service-due forecasting and licence-expiry alerts.
- **Analytics** — fleet utilization, fuel efficiency, operational cost and vehicle ROI, with CSV export.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + shadcn/ui
- **Prisma** + **PostgreSQL**
- **deck.gl** + **MapLibre** (live map) · **react-globe.gl** (command globe) · **React Three Fiber** (3D showcase)
- **Socket.IO** (real-time updates) · **Recharts** (analytics)

## Getting Started

```bash
npm install
cp .env.example .env          # set DATABASE_URL and JWT_SECRET
npx prisma migrate dev
npm run seed                  # load the demo fleet
npm run dev                   # http://localhost:3000
```

## Core Business Rules

- Registration numbers are unique; retired / in-shop vehicles are hidden from dispatch.
- Drivers with expired licences or suspended status cannot be assigned.
- A vehicle or driver already on a trip cannot be double-assigned.
- Cargo weight must not exceed the vehicle's maximum load capacity.
- Dispatch → both vehicle and driver become **On Trip**; completion/cancellation restores **Available**.
- Opening a maintenance record moves a vehicle to **In Shop**; closing restores **Available**.

## Team Synora

Built for the Odoo Virtual Hackathon 2026.
