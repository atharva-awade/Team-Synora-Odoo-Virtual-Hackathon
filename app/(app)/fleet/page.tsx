import { getSession } from "@/lib/auth";
import { sectionAccess } from "@/lib/constants";
import { VehicleManager } from "@/components/fleet/VehicleManager";
import { FleetPanel } from "@/components/fleet/FleetPanel";

export const dynamic = "force-dynamic";

export default async function FleetPage() {
  const user = await getSession();
  const canEdit = user ? sectionAccess(user.role, "fleet") === "full" : false;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Vehicle Registry</h1>
        <p className="mt-1 text-sm text-muted">Master list of fleet vehicles and their lifecycle status.</p>
      </div>
      <FleetPanel />
      <VehicleManager canEdit={canEdit} />
    </div>
  );
}
