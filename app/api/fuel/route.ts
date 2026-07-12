import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const [fuelLogs, expenses, maint] = await Promise.all([
    prisma.fuelLog.findMany({ include: { vehicle: true }, orderBy: { date: "desc" } }),
    prisma.expense.findMany({ include: { vehicle: true }, orderBy: { date: "desc" } }),
    prisma.maintenanceLog.findMany(),
  ]);
  const fuelCost = fuelLogs.reduce((a, f) => a + f.cost, 0);
  const expenseCost = expenses.reduce((a, e) => a + e.amount, 0);
  const maintCost = maint.reduce((a, m) => a + m.cost, 0);
  return NextResponse.json({
    fuelLogs,
    expenses,
    totals: { fuelCost, expenseCost, maintCost, total: fuelCost + expenseCost + maintCost },
  });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.vehicleId || !b.liters) return NextResponse.json({ error: "Vehicle and litres are required" }, { status: 400 });
  const liters = Number(b.liters);
  const fuelLog = await prisma.fuelLog.create({
    data: {
      vehicleId: b.vehicleId,
      liters,
      cost: Number(b.cost) || Math.round(liters * 95),
      odometer: b.odometer ? Number(b.odometer) : undefined,
    },
  });
  return NextResponse.json({ fuelLog }, { status: 201 });
}
