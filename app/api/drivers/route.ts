import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const q = sp.get("q");
  const available = sp.get("available"); // eligible for dispatch: AVAILABLE + valid licence

  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  if (q) where.OR = [{ name: { contains: q } }, { licenseNo: { contains: q.toUpperCase() } }];
  if (available === "1") {
    where.status = "AVAILABLE";
    where.licenseExpiry = { gte: new Date() };
  }

  const drivers = await prisma.driver.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json({ drivers });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  if (!b.name || !b.licenseNo || !b.licenseExpiry) {
    return NextResponse.json({ error: "Name, licence number and expiry are required" }, { status: 400 });
  }
  try {
    const driver = await prisma.driver.create({
      data: {
        name: String(b.name).trim(),
        licenseNo: String(b.licenseNo).toUpperCase().trim(),
        category: b.category || "LMV",
        licenseExpiry: new Date(b.licenseExpiry),
        contact: b.contact || "",
        safetyScore: Number(b.safetyScore) || 85,
        status: b.status || "AVAILABLE",
        region: b.region || "Gandhinagar",
      },
    });
    return NextResponse.json({ driver }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "A driver with this licence number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add driver" }, { status: 400 });
  }
}
