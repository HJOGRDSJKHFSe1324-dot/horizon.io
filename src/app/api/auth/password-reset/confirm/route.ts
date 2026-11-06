import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").toLowerCase().trim();
  const token = String(body?.token || "");
  const password = String(body?.password || "");
  if (!email || !token || !password) return Response.json({ error: "Missing fields" }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password too short" }, { status: 400 });
  const rec = await prisma.verificationToken.findFirst({ where: { identifier: `reset:${email}`, token } });
  if (!rec || rec.expires < new Date()) return Response.json({ error: "Invalid or expired token" }, { status: 400 });
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { email }, data: { passwordHash: hash } });
  await prisma.verificationToken.deleteMany({ where: { identifier: `reset:${email}`, token } });
  return Response.json({ ok: true });
}