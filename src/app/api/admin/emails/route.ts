import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  const subject = String(body?.subject || "").trim();
  const html = String(body?.html || body?.text || "").trim();
  if (!subject || !html) return Response.json({ error: "subject and body required" }, { status: 400 });

  let recipients: string[] = [];
  if (body?.to === "all") {
    const users = await prisma.user.findMany({ select: { email: true } });
    recipients = users.map((u) => u.email).filter(Boolean) as string[];
  } else if (Array.isArray(body?.to)) {
    recipients = (body.to as string[]).map(String);
  } else if (typeof body?.to === "string") {
    recipients = [body.to];
  }
  if (!recipients.length) return Response.json({ error: "no recipients" }, { status: 400 });

  let sent = 0;
  const errors: string[] = [];
  for (const recipient of recipients) {
    try {
      await sendEmail({ to: recipient, subject, html });
      sent++;
    } catch (e: any) {
      errors.push(`${recipient}: ${e?.message || "failed"}`);
    }
  }
  return Response.json({ sent, failed: errors.length, total: recipients.length, errors });
}