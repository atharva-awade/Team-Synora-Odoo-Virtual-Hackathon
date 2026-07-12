import { getSession } from "@/lib/auth";
import { sectionAccess } from "@/lib/constants";
import { DriverManager } from "@/components/drivers/DriverManager";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const user = await getSession();
  const canEdit = user ? sectionAccess(user.role, "drivers") === "full" : false;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Drivers &amp; Safety</h1>
        <p className="mt-1 text-sm text-muted">Driver profiles, licence validity and safety scores.</p>
      </div>
      <DriverManager canEdit={canEdit} />
    </div>
  );
}
