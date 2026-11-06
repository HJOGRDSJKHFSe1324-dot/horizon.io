import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const settings = await prisma.adminSetting.findMany();
  return Response.json(settings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  const key = String(body?.key || "").trim();
  if (!key || key.length > 128) return Response.json({ error: "invalid key" }, { status: 400 });
  const s = await prisma.adminSetting.upsert({
    where: { key },
    update: { value: body.value ?? null },
    create: { key, value: body.value ?? null },
  });
  return Response.json(s);
}