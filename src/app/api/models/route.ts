import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getActivePlan, getRemainingTokens, canUseModel, effectiveMinPlan, getPromoEnd } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const isAdmin = (session?.user as any)?.role === "ADMIN";
    const models = await prisma.model.findMany({ orderBy: { name: "asc" } });
    const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { priceGbp: "asc" } });
    const plan = userId ? await getActivePlan(userId) : null;
    const remaining = userId ? await getRemainingTokens(userId) : 0;
    const cooldown = userId ? (await prisma.user.findUnique({ where: { id: userId }, select: { cooldownUntil: true, freeTokensUsed: true, freeAllowance: true } })) : null;
    const promoEndsAt = (await getPromoEnd()).toISOString();
    const enriched = await Promise.all(models.map(async (m) => {
      const requiredPlan = await effectiveMinPlan(m);
      const badge = m.slug === "zenith-1.1" ? "FREE MODEL" : m.badge;
      const perm = userId ? await canUseModel(userId, m.slug) : { ok: requiredPlan === "FREE", reason: requiredPlan === "FREE" ? undefined : "Sign in required" };
      const publicModel = {
        id: m.id, name: m.name, slug: m.slug, description: m.description, tier: m.tier,
        enabled: m.enabled, minPlan: requiredPlan, badge, createdAt: m.createdAt, updatedAt: m.updatedAt,
        plans: plans.filter((pl) => ((pl.modelAccess as string[] | null) || []).includes(m.slug) || (requiredPlan === "FREE" && pl.slug === "FREE")).map((pl) => pl.name),
      };
      const full = isAdmin ? { ...m, minPlan: requiredPlan, badge, plans: plans.filter((pl) => ((pl.modelAccess as string[] | null) || []).includes(m.slug) || (requiredPlan === "FREE" && pl.slug === "FREE")).map((pl) => pl.name) } : publicModel;
      return { ...full, canUse: perm.ok, reason: perm.reason, promoEndsAt };
    }));
    const visibleModels = isAdmin ? enriched : enriched.filter((m: any) => m.enabled);
    return Response.json({ models: visibleModels, plan, plans, remainingTokens: remaining, cooldownUntil: cooldown?.cooldownUntil ?? null, freeTokensUsed: cooldown?.freeTokensUsed ?? 0, freeAllowance: cooldown?.freeAllowance ?? 0, promoEndsAt });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Database unavailable", models: [] }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return Response.json({ error: "id required" }, { status: 400 });
  const model = await prisma.model.findUnique({ where: { id: body.id } });
  if (!model) return Response.json({ error: "model not found" }, { status: 404 });
  const allowedPlans = ["FREE", "PLUS", "PRO", "ULTRA"];
  if (body.minPlan && !allowedPlans.includes(body.minPlan)) return Response.json({ error: "invalid minPlan" }, { status: 400 });
  if (body.apiBaseUrl) {
    try { const u = new URL(body.apiBaseUrl); if (!/^https?:$/.test(u.protocol)) throw new Error("bad protocol"); }
    catch { return Response.json({ error: "invalid apiBaseUrl" }, { status: 400 }); }
  }
  const updated = await prisma.model.update({
    where: { id: body.id },
    data: {
      name: body.name ?? model.name,
      description: body.description ?? model.description,
      enabled: typeof body.enabled === "boolean" ? body.enabled : model.enabled,
      badge: body.badge ?? model.badge,
      minPlan: body.minPlan ?? model.minPlan,
      apiBaseUrl: body.apiBaseUrl ?? model.apiBaseUrl,
      apiModelId: body.apiModelId ?? model.apiModelId,
    },
  });
  return Response.json(updated);
}