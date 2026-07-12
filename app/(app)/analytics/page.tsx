import { getAnalytics } from "@/lib/services/analytics";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalytics();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Reports &amp; Analytics</h1>
        <p className="mt-1 text-sm text-muted">Operational insight across utilization, cost, efficiency and ROI.</p>
      </div>
      <AnalyticsView data={data} />
    </div>
  );
}
