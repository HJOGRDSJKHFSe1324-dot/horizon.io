import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = String(body?.token || "");
  const email = String(body?.email || "").toLowerCase().trim();
  if (!token || !email) return Response.json({ error: "Missing token/email" }, { status: 400 });

  const rec = await prisma.verificationToken.findFirst({ where: { identifier: email, token } });
  if (!rec || rec.expires < new Date()) return Response.json({ error: "Invalid or expired token" }, { status: 400 });

  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  await prisma.verificationToken.deleteMany({ where: { identifier: email, token } });
  return Response.json({ ok: true });
}