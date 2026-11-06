import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAIServerHealth } from "@/lib/ai-client";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const latest = await prisma.serverHealth.findFirst({ orderBy: { createdAt: "desc" } });
  return Response.json(latest);
}

export async function POST() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const h = await checkAIServerHealth();
  const row = await prisma.serverHealth.create({
    data: {
      status: h.ok ? "online" : "offline",
      latencyMs: h.latencyMs,
      modelsOnline: h.details ?? {},
    },
  });
  return Response.json({ ...row, error: h.error });
}