import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { loadBans, setBanStatus } from "@/lib/bans";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  return Response.json(await loadBans());
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  const ip = String(body?.ip || "").trim();
  if (!ip) return Response.json({ error: "ip required" }, { status: 400 });
  const banned = typeof body?.banned === "boolean" ? body.banned : true;
  const duration = Number.isFinite(Number(body?.durationHours)) ? Number(body.durationHours) : undefined;
  const updated = await setBanStatus(ip, banned, duration);
  if (!updated) return Response.json({ error: "ip not found" }, { status: 404 });
  return Response.json(updated);
}