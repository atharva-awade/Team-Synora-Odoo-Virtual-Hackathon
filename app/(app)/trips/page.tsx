import { getSession } from "@/lib/auth";
import { sectionAccess } from "@/lib/constants";
import { TripManager } from "@/components/trips/TripManager";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const user = await getSession();
  const canEdit = user ? sectionAccess(user.role, "trips") === "full" : false;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Trip Dispatcher</h1>
        <p className="mt-1 text-sm text-muted">Create trips, assign resources and manage the dispatch lifecycle.</p>
      </div>
      <TripManager canEdit={canEdit} />
    </div>
  );
}
