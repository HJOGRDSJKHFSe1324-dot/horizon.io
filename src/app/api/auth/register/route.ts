import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { rateLimit, getClientIp } = await import("@/lib/rate-limit");
  const ip = getClientIp(req);
  const rl = rateLimit(`register:${ip}`, 5, 60_000);
  if (!rl.ok) return Response.json({ error: "Too many requests" }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").toLowerCase().trim();
  const password = String(body?.password || "");
  if (!email || !password) return Response.json({ error: "Email and password required" }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return Response.json({ error: "Email already registered" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const freePlan = await prisma.plan.findUnique({ where: { slug: "FREE" } });
  await prisma.user.create({
    data: {
      name: name || null,
      email,
      passwordHash,
      freeAllowance: 200000,
      tokenBalance: 0,
    },
  });

  // verification token
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  // send email if SMTP configured, else log
  await sendEmail(email, "Verify your HORIZON account", `Click to verify: ${verifyUrl}`).catch(() => {});

  return Response.json({ ok: true, message: "Registered. Check your email to verify." });
}

async function sendEmail(to: string, subject: string, text: string) {
  console.log(`[EMAIL] To: ${to} Subject: ${subject}\n${text}`);
  console.log("[EMAIL] Nodemailer removed; configure an external email provider if production email is required.");
}