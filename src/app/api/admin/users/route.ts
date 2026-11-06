import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: any) { return (session?.user as any)?.role === "ADMIN"; }

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return new Response("Forbidden", { status: 403 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const users = await prisma.user.findMany({
    where: q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, name: true, email: true, role: true, createdAt: true, tokenBalance: true,
      freeTokensUsed: true, freeAllowance: true, cooldownUntil: true,
      subscription: { select: { status: true, plan: { select: { slug: true, name: true } }, currentPeriodEnd: true } },
      _count: { select: { conversations: true } },
    },
  });
  return Response.json(users);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) return new Response("Forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  const { userId, action, value } = body;
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return Response.json({ error: "user not found" }, { status: 404 });
  if (action === "disable" || action === "enable") {
    await prisma.user.update({ where: { id: userId }, data: { settings: { ...(user.settings as any || {}), disabled: action === "disable" } as any } });
  } else if (action === "role") {
    if (!["USER", "ADMIN"].includes(value)) return Response.json({ error: "invalid role" }, { status: 400 });
    await prisma.user.update({ where: { id: userId }, data: { role: value } });
  } else if (action === "grantTokens") {
    const amt = Number(value);
    if (!Number.isFinite(amt) || amt < -10000000 || amt > 10000000) return Response.json({ error: "invalid amount" }, { status: 400 });
    await prisma.user.update({ where: { id: userId }, data: { tokenBalance: { increment: amt } } });
  } else if (action === "resetFree") {
    await prisma.user.update({ where: { id: userId }, data: { freeTokensUsed: 0, cooldownUntil: null } });
  } else if (action === "delete") {
    await prisma.user.delete({ where: { id: userId } });
  } else {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }
  return Response.json({ ok: true });
}