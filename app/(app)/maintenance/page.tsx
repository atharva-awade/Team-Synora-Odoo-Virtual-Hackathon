import { getSession } from "@/lib/auth";
import { sectionAccess } from "@/lib/constants";
import { MaintenanceManager } from "@/components/maintenance/MaintenanceManager";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const user = await getSession();
  const canEdit = user ? sectionAccess(user.role, "maintenance") === "full" : false;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Maintenance</h1>
        <p className="mt-1 text-sm text-muted">Log service records and manage vehicles in the shop.</p>
      </div>
      <MaintenanceManager canEdit={canEdit} />
    </div>
  );
}
