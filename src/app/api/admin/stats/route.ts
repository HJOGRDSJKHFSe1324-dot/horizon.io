import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  const [users, paidUsers, subs, payments, conversions] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscription: { status: "ACTIVE" } } }),
    prisma.subscription.findMany({ include: { plan: true } }),
    prisma.payment.findMany(),
    prisma.bitcoinConversion.findMany(),
  ]);

  const totalRevenuePence = payments.filter(p => p.status === "SUCCEEDED").reduce((a, p) => a + p.amountGbp, 0);
  const totalBtcSent = conversions.filter(c => c.status === "SUCCEEDED").reduce((a, c) => a + Number(c.netBtcSent || c.btcAmount || 0), 0);

  const modelUsage = await prisma.tokenTransaction.groupBy({
    by: ["modelId"],
    _sum: { inputTokens: true, outputTokens: true, amount: true },
  });

  return Response.json({
    users, paidUsers, freeUsers: users - paidUsers,
    subscriptions: subs.length,
    totalRevenuePence,
    totalRevenueGbp: (totalRevenuePence / 100).toFixed(2),
    paymentsCount: payments.length,
    conversionsCount: conversions.length,
    totalBtcSent,
    modelUsage,
    plans: await prisma.plan.findMany(),
  });
}