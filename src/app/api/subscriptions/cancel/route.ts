import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return Response.json({ ok: true });
  if (process.env.STRIPE_SECRET_KEY && sub.stripeSubscriptionId) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
  }
  await prisma.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: true, status: "ACTIVE" } });
  return Response.json({ ok: true });
}