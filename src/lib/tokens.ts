import { prisma } from "@/lib/prisma";
import { PlanSlug } from "@prisma/client";

const PLAN_RANK: Record<string, number> = { FREE: 0, PLUS: 1, PRO: 2, ULTRA: 3 };

export function planRank(slug: string) {
  return PLAN_RANK[slug] ?? 0;
}

export async function getActivePlan(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: { include: { plan: true } } },
  });
  if (!user) return null;
  // Admins implicitly get the highest tier with maximum usage.
  if (user.role === "ADMIN") {
    const ultra = await prisma.plan.findUnique({ where: { slug: PlanSlug.ULTRA } });
    if (ultra) return ultra;
  }
  const sub = user.subscription;
  const now = new Date();
  if (sub && (sub.status === "ACTIVE" || sub.status === "TRIALING" || (sub.status === "CANCELED" && sub.currentPeriodEnd && sub.currentPeriodEnd > now))) {
    return sub.plan;
  }
  const freePlan = await prisma.plan.findUnique({ where: { slug: PlanSlug.FREE } });
  return freePlan;
}

export async function getRemainingTokens(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return 0;
  if (user.role === "ADMIN" && user.tokenBalance < 5000000) {
    await prisma.user.update({ where: { id: userId }, data: { tokenBalance: 5000000 } });
    user.tokenBalance = 5000000;
  }
  const plan = await getActivePlan(userId);
  const isFree = !plan || plan.slug === PlanSlug.FREE;
  if (isFree) {
    const now = new Date();
    if (user.freeTokensUsed >= user.freeAllowance && user.cooldownUntil && user.cooldownUntil > now) {
      return 0;
    }
    if (user.cooldownUntil && user.cooldownUntil <= now) {
      // reset
      await prisma.user.update({
        where: { id: userId },
        data: { freeTokensUsed: 0, freeAllowance: user.freeAllowance || 200000, cooldownUntil: null, freeResetAt: now },
      });
      return user.freeAllowance || 200000;
    }
    return Math.max(0, (user.freeAllowance || 200000) - user.freeTokensUsed);
  }
  return Math.max(0, user.tokenBalance);
}

export async function canUseModel(userId: string, modelSlug: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, reason: "User not found" };
  const model = await prisma.model.findUnique({ where: { slug: modelSlug } });
  if (!model || !model.enabled) return { ok: false, reason: "Model unavailable" };
  const plan = await getActivePlan(userId);
  const pSlug = plan?.slug || PlanSlug.FREE;
  if (planRank(pSlug as string) < planRank(model.minPlan as string)) {
    return { ok: false, reason: `Requires ${model.minPlan} plan` };
  }
  // model access list check
  const access = (plan?.modelAccess as string[] | null) || [];
  if (access.length && !access.includes(model.slug)) {
    return { ok: false, reason: `Not included in your plan` };
  }
  // free cooldown for free model? applies plan free
  if (model.tier === "FREE" && pSlug === "FREE") {
    const remaining = await getRemainingTokens(userId);
    if (remaining <= 0) return { ok: false, reason: "Free allowance exhausted. Cooldown active." };
  }
  return { ok: true };
}

export async function consumeTokens(params: {
  userId: string;
  modelDbId: string | null;
  conversationId: string | null;
  messageId: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}) {
  const plan = await getActivePlan(params.userId);
  const isFree = !plan || plan.slug === PlanSlug.FREE;
  // only treat as free consumption if free plan
  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) throw new Error("User not found");
  if (user.role === "ADMIN" && user.tokenBalance < 5000000) {
    await prisma.user.update({ where: { id: params.userId }, data: { tokenBalance: 5000000 } });
    user.tokenBalance = 5000000;
  }

  if (isFree) {
    const newUsed = user.freeTokensUsed + params.totalTokens;
    const allowance = user.freeAllowance || 200000;
    let cooldownUntil: Date | null = user.cooldownUntil;
    if (newUsed >= allowance) {
      cooldownUntil = new Date(Date.now() + 5 * 60 * 60 * 1000);
    }
    const updated = await prisma.user.update({
      where: { id: params.userId },
      data: { freeTokensUsed: newUsed, cooldownUntil },
    });
    const balanceAfter = Math.max(0, allowance - updated.freeTokensUsed);
    await prisma.tokenTransaction.create({
      data: {
        userId: params.userId,
        conversationId: params.conversationId,
        messageId: params.messageId,
        modelId: params.modelDbId,
        type: "usage",
        amount: -params.totalTokens,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        balanceAfter,
      },
    });
    return { balanceAfter, cooldownUntil };
  } else {
    const newBalance = Math.max(0, user.tokenBalance - params.totalTokens);
    const updated = await prisma.user.update({
      where: { id: params.userId },
      data: { tokenBalance: newBalance },
    });
    await prisma.tokenTransaction.create({
      data: {
        userId: params.userId,
        conversationId: params.conversationId,
        messageId: params.messageId,
        modelId: params.modelDbId,
        type: "usage",
        amount: -params.totalTokens,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        balanceAfter: updated.tokenBalance,
      },
    });
    return { balanceAfter: updated.tokenBalance, cooldownUntil: null };
  }
}

export function userPlanSlug(user: any) {
  return "FREE";
}

export const FREE_COOLDOWN_HOURS = 5;