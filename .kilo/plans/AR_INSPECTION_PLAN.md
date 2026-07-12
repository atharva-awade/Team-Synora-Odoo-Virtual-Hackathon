# AR Vehicle Inspection — Implementation Plan

**Project:** TransitOps (Next.js + Prisma + TypeScript)  
**Feature:** T9 — AR Vehicle Inspection (WebAR)  
**Target Users:** Internal staff only (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) — **NO driver/external logins**

---

## 1. Feature Overview

### Purpose
Enable internal operations staff to perform **physical vehicle inspections** using their phone/tablet camera. Point camera at a vehicle's printed QR-code target → see live AR overlay with vehicle data, log inspection findings, update status.

### User Flow
1. **Staff opens** `/ar-inspection` (protected by role guard)
2. **Selects vehicle** from list (only AVAILABLE / ON_TRIP / IN_SHOP vehicles)
3. **Points camera** at the vehicle's printed target sticker (on windshield/door)
4. **AR overlay appears** showing:
   - Registration, model, type
   - Current status (color-coded)
   - Odometer, last service, next service due
   - Assigned driver + safety score
   - Fuel efficiency trend
   - Open maintenance issues
5. **Taps "Log Inspection"** → opens modal to record findings (tire pressure, damage, fuel level, notes)
6. **Submits** → creates `InspectionLog` record, optionally updates vehicle status (e.g., mark IN_SHOP)
7. **Activity logged** in `ActivityLog` for audit trail

---

## 2. Data Model Extensions

### New Prisma Models

```prisma
model VehicleTarget {
  id            String   @id @default(cuid())
  vehicleId     String   @unique
  vehicle       Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  targetImage   String   // base64 PNG or path to /public/ar-targets/{id}.png
  mindFile      String?  // base64 .mind file or path
  generatedAt   DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model VehicleInspection {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  inspectorId String   // User.id who performed inspection
  inspector   User     @relation(fields: [inspectorId], references: [id])
  status      String   // OK | ISSUES_FOUND | REQUIRES_MAINTENANCE
  findings    Json     // structured: { tires: {fl: 32, fr: 32, rl: 35, rr: 35}, damage: [], fuelLevelPct: 75, notes: "..." }
  odometer    Int
  createdAt   DateTime @default(now())
  
  @@index([vehicleId])
  @@index([inspectorId])
  @@index([createdAt])
}
```

### Vehicle Model Additions
```prisma
model Vehicle {
  // ... existing fields ...
  arTarget       VehicleTarget?
  inspections    VehicleInspection[]
  currentOdometer Int @default(0) // rename odometer for clarity
}
```

---

## 3. Target Generation Pipeline

### Server-Side Generation (Node.js)

```typescript
// lib/ar/generate-target.ts
import QRCode from "qrcode";
import { createCanvas } from "canvas";
import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";

export async function generateVehicleTarget(vehicle: Vehicle): Promise<{ png: Buffer; mind: Buffer }> {
  // 1. Build target image: QR code + vehicle info + high-contrast corners
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext("2d");
  
  // White background
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 800, 600);
  
  // QR code (vehicle ID encoded)
  const qrData = `TRANSITOPS:${vehicle.id}:${vehicle.regNo}`;
  const qrImage = await QRCode.toBuffer(qrData, { width: 300, margin: 2 });
  const qrCanvas = await loadImage(qrImage);
  ctx.drawImage(qrCanvas, 50, 50);
  
  // Vehicle info text
  ctx.fillStyle = "#000";
  ctx.font = "bold 28px monospace";
  ctx.fillText(vehicle.regNo, 380, 100);
  ctx.font = "20px monospace";
  ctx.fillText(vehicle.name, 380, 140);
  ctx.fillText(`${vehicle.type} • ${vehicle.region}`, 380, 170);
  ctx.fillText(`Status: ${vehicle.status}`, 380, 200);
  
  // High-contrast corner markers (improves MindAR tracking)
  drawCornerMarkers(ctx);
  
  const pngBuffer = canvas.toBuffer("image/png");
  
  // 2. Save PNG to public/ar-targets/
  const targetDir = path.join(process.cwd(), "public/ar-targets");
  await fs.mkdir(targetDir, { recursive: true });
  const pngPath = path.join(targetDir, `${vehicle.id}.png`);
  await fs.writeFile(pngPath, pngBuffer);
  
  // 3. Compile .mind file using MindAR CLI
  const mindPath = path.join(targetDir, `${vehicle.id}.mind`);
  execSync(`npx mind-ar image-target compile ${pngPath} ${mindPath}`, { stdio: "inherit" });
  
  const mindBuffer = await fs.readFile(mindPath);
  
  return { png: pngBuffer, mind: mindBuffer };
}
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ar/targets/[vehicleId]` | GET | Serve PNG target image |
| `/api/ar/targets/[vehicleId].mind` | GET | Serve compiled .mind file |
| `/api/ar/targets/generate/[vehicleId]` | POST | Trigger target generation (admin only) |
| `/api/ar/manifest` | GET | Returns JSON manifest: `{ vehicleId, regNo, pngUrl, mindUrl }[]` |

---

## 4. Frontend Architecture

### Page Structure

```
app/ar-inspection/
├── page.tsx                    # Server component - fetches vehicles, user, passes to client
├── ARInspectionClient.tsx      # Main client component
├── components/
│   ├── VehicleSelector.tsx     # Bottom sheet with vehicle cards
│   ├── ARViewport.tsx          # Full-screen A-Frame scene
│   ├── InspectionModal.tsx     # Modal for logging findings
│   └── StatusBadge.tsx         # Reusable status pill
├── hooks/
│   ├── useMindAR.ts            # Loads MindAR scripts, manages scene lifecycle
│   └── useVehicleTargets.ts    # Fetches manifest, handles per-vehicle target URLs
└── types.ts                    # Shared TypeScript interfaces
```

### ARViewport Component (Key Logic)

```tsx
// components/ARViewport.tsx
"use client";

export function ARViewport({ vehicles, selectedVehicleId, onInspect }) {
  const manifest = useVehicleTargets(); // [{ vehicleId, regNo, mindUrl }]
  const target = manifest.find(m => m.vehicleId === selectedVehicleId);
  
  return (
    <a-scene
      mindar-image={`imageTargetSrc: ${target?.mindUrl}; autoStart: true; maxTrack: 1;`}
      renderer="colorManagement: true"
      vr-mode-ui="enabled: false"
    >
      <a-camera position="0 0 0" look-controls="enabled: false" />
      
      {target && (
        <a-entity mindar-image-target="targetIndex: 0">
          {/* Info Panel - appears on target */}
          <a-plane
            position="0 0.3 0"
            width="1.8" height="1.4"
            color="#0f172a" opacity="0.92"
            material="side: double"
          />
          
          <a-text
            value={selectedVehicle.regNo}
            position="0 0.55 0.02"
            align="center" color="#fff" width="3" font="mozillavr"
          />
          <a-text
            value={`Status: ${selectedVehicle.status}`}
            position="0 0.25 0.02"
            align="center" color={statusColor(selectedVehicle.status)} width="3"
          />
          <a-text
            value={`Odometer: ${selectedVehicle.odometer.toLocaleString()} km`}
            position="0 -0.05 0.02"
            align="center" color="#94a3b8" width="3"
          />
          <a-text
            value={`Next Service: ${selectedVehicle.serviceDueKm} km`}
            position="0 -0.35 0.02"
            align="center" color="#f59e0b" width="3"
          />
          
          {/* Invisible click plane to trigger inspection modal */}
          <a-plane
            position="0 0 0"
            width="1.8" height="1.4"
            opacity="0"
            event-set__click="_event: click; _target: #inspect-modal; visible: true"
          />
        </a-entity>
      )}
    </a-scene>
  );
}
```

---

## 5. Inspection Modal — Data Capture

### Fields to Capture

| Field | Type | Validation |
|-------|------|------------|
| `tirePressure` | `{fl, fr, rl, rr}` (PSI) | Required, each 20–50 |
| `fuelLevelPct` | number | Required, 0–100 |
| `odometerReading` | number | Required, ≥ current odometer |
| `damageItems` | array of `{location, severity, photo?}` | Optional |
| `notes` | string | Optional |
| `overallStatus` | enum: `OK` \| `ISSUES_FOUND` \| `REQUIRES_MAINTENANCE` | Required |

### Submission Flow
1. User fills modal → clicks "Submit Inspection"
2. POST `/api/ar/inspections` with payload
3. Server:
   - Creates `VehicleInspection` record
   - Updates `Vehicle.currentOdometer` if provided
   - If `REQUIRES_MAINTENANCE` → creates `MaintenanceLog` with `status: OPEN`, sets vehicle status `IN_SHOP`
   - Logs `ActivityLog` entry
4. Returns success → modal closes, vehicle card shows last inspection timestamp

---

## 6. API Routes

### `POST /api/ar/inspections`
```typescript
// Request
{
  vehicleId: string,
  findings: {
    tirePressure: { fl: 32, fr: 32, rl: 35, rr: 35 },
    fuelLevelPct: 78,
    odometerReading: 74250,
    damageItems: [{ location: "rear-bumper", severity: "MINOR", photo: "base64..." }],
    notes: "Front left tire slightly worn"
  },
  overallStatus: "OK"
}

// Response
{ inspectionId: "cmx...", vehicle: { regNo: "GJ01AB4521", status: "AVAILABLE" } }
```

### `GET /api/ar/manifest`
```json
[
  {
    "vehicleId": "cmx...",
    "regNo": "GJ01AB4521",
    "pngUrl": "/ar-targets/cmx....png",
    "mindUrl": "/ar-targets/cmx....mind"
  }
]
```

---

## 7. Role-Based Access

| Role | Can View AR Page | Can Generate Targets | Can Log Inspections | Can Change Vehicle Status |
|------|------------------|---------------------|---------------------|---------------------------|
| FLEET_MANAGER | ✅ | ✅ | ✅ | ✅ |
| DISPATCHER | ✅ | ❌ | ✅ | ✅ (to IN_SHOP) |
| SAFETY_OFFICER | ✅ | ❌ | ✅ | ✅ (to IN_SHOP) |
| FINANCIAL_ANALYST | ✅ (read-only) | ❌ | ❌ | ❌ |

*Enforced in server component (`page.tsx`) and API routes.*

---

## 8. UI Integration

### Sidebar Menu Entry
Add to `components/app/Sidebar.tsx`:
```tsx
{role !== "FINANCIAL_ANALYST" && (
  <SidebarItem
    href="/ar-inspection"
    icon={<CameraIcon />}
    label="AR Inspection"
    badge={vehiclesNeedingInspectionCount}
  />
)}
```

### Dashboard Quick Action
Add "Inspect Vehicle" button on Vehicle detail modal (in `VehicleManager.tsx`) that deep-links to `/ar-inspection?vehicle=<id>`.

---

## 9. Implementation Phases

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| **1. Data Model** | Add Prisma models, run migration, seed target generator | 30 min |
| **2. Target Generator** | `lib/ar/generate-target.ts`, CLI script, API endpoints | 45 min |
| **3. Manifest API** | `GET /api/ar/manifest` returning per-vehicle URLs | 15 min |
| **4. Client Components** | `ARViewport`, `VehicleSelector`, `InspectionModal` | 60 min |
| **5. Page & Hooks** | Server page, `useMindAR`, `useVehicleTargets` | 30 min |
| **6. Inspection API** | `POST /api/ar/inspections` with status transitions | 30 min |
| **7. Polish** | Loading states, error handling, toast notifications, dark mode | 30 min |
| **Total** | | **~4 hours** |

---

## 10. Dependencies to Add

```bash
npm install qrcode canvas @types/qrcode
npm install -D @types/canvas
# MindAR CLI for target compilation (run at build/deploy time)
npm install -D mind-ar
```

---

## 11. Deployment Notes

1. **Static targets**: Run `npm run generate:ar-targets` at build time (script iterates all vehicles, generates PNG + .mind to `public/ar-targets/`)
2. **CDN**: Serve `public/ar-targets/*` via static hosting (Vercel handles automatically)
3. **HTTPS required**: Camera access needs secure context (localhost works, production needs HTTPS)
4. **Mobile testing**: Test on iOS Safari + Chrome Android — MindAR works on both

---

## 12. Demo Script for Judges

1. **Login** as Fleet Manager → click "AR Inspection" in sidebar
2. **Select** vehicle "GJ01AB4521" (Tata Ace Gold)
3. **Point phone** at printed target (show printed card)
4. **Overlay appears** with live data
5. **Tap "Log Inspection"** → fill tire pressures, note "minor scratch rear bumper", submit
5. **Show** inspection appears in vehicle history + activity log
6. **Switch role** to Safety Officer → same flow, can mark "REQUIRES_MAINTENANCE" → vehicle auto-moves to IN_SHOP, removed from dispatch pool

---

## 13. Files to Create / Modify

### New Files
- `prisma/schema.prisma` (add models)
- `lib/ar/generate-target.ts`
- `scripts/generate-ar-targets.ts`
- `app/api/ar/manifest/route.ts`
- `app/api/ar/targets/[vehicleId]/route.ts`
- `app/api/ar/targets/[vehicleId].mind/route.ts`
- `app/api/ar/inspections/route.ts`
- `app/ar-inspection/page.tsx` (replace)
- `components/inspection/ARInspectionClient.tsx` (replace)
- `components/inspection/VehicleSelector.tsx`
- `components/inspection/ARViewport.tsx`
- `components/inspection/InspectionModal.tsx`
- `components/inspection/hooks/useMindAR.ts`
- `components/inspection/hooks/useVehicleTargets.ts`
- `components/inspection/types.ts`

### Modified Files
- `components/app/Sidebar.tsx` (add menu item)
- `components/fleet/VehicleManager.tsx` (add "Inspect" action)

---

**Status:** Ready for implementation. Next step: approve plan → begin Phase 1 (Data Model).