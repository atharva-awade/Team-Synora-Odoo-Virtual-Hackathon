import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { recommend } from "@/lib/services/smart-dispatch";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const result = await recommend({
    source: sp.get("source") || "",
    destination: sp.get("destination") || "",
    cargoWeightKg: Number(sp.get("cargo")) || 0,
  });
  return NextResponse.json(result);
}
