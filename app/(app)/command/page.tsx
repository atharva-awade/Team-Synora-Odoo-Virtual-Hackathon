import { LiveMapPanel } from "@/components/command/LiveMapPanel";

export const dynamic = "force-dynamic";

export default function CommandPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Live Vehicle Map</h1>
        <p className="mt-1 text-sm text-muted">Real-time position of every dispatched vehicle along its route. Click a vehicle or route for details.</p>
      </div>
      <LiveMapPanel />
    </div>
  );
}
