import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/stats";
import { getCompliance } from "@/lib/services/compliance";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [stats, compliance] = await Promise.all([getDashboardStats(), getCompliance()]);
  return NextResponse.json({ stats, compliance });
}
