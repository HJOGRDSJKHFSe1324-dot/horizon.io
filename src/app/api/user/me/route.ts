// no NextRequest import needed
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getActivePlan, getRemainingTokens } from "@/lib/tokens";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return new Response("Unauthorized", { status: 401 });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id:true, name:true, email:true, image:true, role:true, tokenBalance:true, freeTokensUsed:true, freeAllowance:true, cooldownUntil:true, createdAt:true, subscription: { include: { plan: true } } },
    });
    const plan = await getActivePlan(userId);
    const remaining = await getRemainingTokens(userId);
    return Response.json({ user, plan, remainingTokens: remaining });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Database unavailable" }, { status: 503 });
  }
}

export async function DELETE() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });
  await prisma.user.delete({ where: { id: userId } });
  return Response.json({ ok: true });
}