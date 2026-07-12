import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;

  const target = await prisma.vehicleArTarget.findUnique({
    where: { vehicleId },
    select: { mindData: true, vehicle: { select: { status: true } } },
  });

  if (!target || !target.mindData) {
    // Fallback to MindAR sample mind file
    return NextResponse.redirect(
      "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind"
    );
  }

  if (target.vehicle.status === "RETIRED") {
    return NextResponse.json({ error: "Vehicle retired" }, { status: 404 });
  }

  return new NextResponse(target.mindData, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}