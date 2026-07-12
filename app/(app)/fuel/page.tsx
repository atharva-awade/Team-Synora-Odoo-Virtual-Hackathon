import { getSession } from "@/lib/auth";
import { sectionAccess } from "@/lib/constants";
import { FuelManager } from "@/components/fuel/FuelManager";

export const dynamic = "force-dynamic";

export default async function FuelPage() {
  const user = await getSession();
  const canEdit = user ? sectionAccess(user.role, "fuel") === "full" : false;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Fuel &amp; Expenses</h1>
        <p className="mt-1 text-sm text-muted">Track fuel consumption, tolls and the total operational cost.</p>
      </div>
      <FuelManager canEdit={canEdit} />
    </div>
  );
}
