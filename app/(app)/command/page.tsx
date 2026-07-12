import { FleetGlobe } from "@/components/command/FleetGlobe";

export const dynamic = "force-dynamic";

export default function CommandPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Live Command Globe</h1>
        <p className="mt-1 text-sm text-muted">Real-time network view of active trips and depots across the fleet.</p>
      </div>
      <div className="card overflow-hidden p-0" style={{ height: "72vh", minHeight: 460 }}>
        <FleetGlobe />
      </div>
    </div>
  );
}
