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
  });

  if (!target) {
    // Return a default MindAR target for demo
    const res = await fetch(
      "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind"
    );
    if (res.ok) {
      const data = await res.arrayBuffer();
      return new NextResponse(data, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  if (!target.mindData) {
    return NextResponse.json({ error: "No .mind file generated yet" }, { status: 404 });
  }

  return new NextResponse(target.mindData, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  });
}