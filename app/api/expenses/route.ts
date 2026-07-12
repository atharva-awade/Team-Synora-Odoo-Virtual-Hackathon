import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.amount) return NextResponse.json({ error: "Amount is required" }, { status: 400 });
  const expense = await prisma.expense.create({
    data: {
      vehicleId: b.vehicleId || null,
      type: b.type || "OTHER",
      amount: Number(b.amount) || 0,
      note: b.note || "",
    },
  });
  return NextResponse.json({ expense }, { status: 201 });
}
