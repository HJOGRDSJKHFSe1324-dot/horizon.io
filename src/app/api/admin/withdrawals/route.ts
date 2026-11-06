import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const list = await prisma.bitcoinWithdrawal.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return Response.json(list);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  const addr = String(body.address || process.env.BTC_RECEIVING_ADDRESS || "").trim();
  if (!addr) return Response.json({ error: "address required" }, { status: 400 });
  const amt = body.btcAmount != null ? String(body.btcAmount) : null;
  const w = await prisma.bitcoinWithdrawal.create({
    data: {
      userId: (session as any)?.user?.id ?? null,
      btcAmount: amt as any,
      address: addr,
      status: "REQUESTED",
      notes: body.notes != null ? String(body.notes) : null,
    },
  });
  return Response.json(w);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return Response.json({ error: "id required" }, { status: 400 });
  const allowed = ["REQUESTED", "APPROVED", "SENT", "CONFIRMED", "FAILED", "CANCELLED"];
  if (body.status && !allowed.includes(body.status)) return Response.json({ error: "invalid status" }, { status: 400 });
  const updated = await prisma.bitcoinWithdrawal.update({
    where: { id: body.id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.txid != null && { txid: String(body.txid) }),
      ...(body.notes != null && { notes: String(body.notes) }),
    },
  });
  return Response.json(updated);
}