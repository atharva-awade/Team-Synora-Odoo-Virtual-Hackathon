import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signSession, setSessionCookie, type SessionUser } from "@/lib/auth";
import type { Role } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !(await verifyPassword(String(password), user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const session: SessionUser = { id: user.id, email: user.email, name: user.name, role: user.role as Role };
  const token = await signSession(session);
  await setSessionCookie(token);
  return NextResponse.json({ user: session });
}
