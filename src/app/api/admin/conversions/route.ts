import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const list = await prisma.bitcoinConversion.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { payment: true } });
  return Response.json(list);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return Response.json({ error: "id required" }, { status: 400 });
  const allowed = ["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "MANUAL_REQUIRED"];
  if (body.status && !allowed.includes(body.status)) return Response.json({ error: "invalid status" }, { status: 400 });
  const updated = await prisma.bitcoinConversion.update({
    where: { id: body.id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.txid != null && { txid: String(body.txid) }),
      ...(body.btcAmount != null && { btcAmount: body.btcAmount }),
      ...(body.exchangeRate != null && { exchangeRate: body.exchangeRate }),
      ...(body.netBtcSent != null && { netBtcSent: body.netBtcSent }),
      ...(body.status === "SUCCEEDED" && { confirmedAt: new Date() }),
    },
  });
  return Response.json(updated);
}