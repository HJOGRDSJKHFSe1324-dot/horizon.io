import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { rateLimit, getClientIp } = await import("@/lib/rate-limit");
  const ip = getClientIp(req); const rl = rateLimit(`pwreset:${ip}`, 5, 60_000);
  if (!rl.ok) return Response.json({ error: "Too many requests" }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").toLowerCase().trim();
  if (!email) return Response.json({ error: "Email required" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: { identifier: `reset:${email}`, token, expires: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const url = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    console.log(`[EMAIL] Password reset for ${email}: ${url}`);
  }
  return Response.json({ ok: true, message: "If account exists, reset link sent." });
}