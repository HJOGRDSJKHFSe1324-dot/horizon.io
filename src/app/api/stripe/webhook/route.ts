import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe not configured", { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig || "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Idempotency guard via payment intent / invoice tracking handled by Payment unique stripePaymentIntentId
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.userId;
        const planSlug = s.metadata?.planSlug;
        const planId = s.metadata?.planId;
        if (!userId || !planId) break;
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) break;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        // store payment
        if (s.payment_intent) {
          const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent.id;
          await prisma.payment.upsert({
            where: { stripePaymentIntentId: pi },
            update: { status: "SUCCEEDED" },
            create: {
              userId, planId, stripePaymentIntentId: pi, amountGbp: (s.amount_total ?? plan.priceGbp),
              status: "SUCCEEDED", description: `Subscription ${plan.name}`,
            },
          });
        }
        // subscription record
        const metaSub = subId ? await stripe.subscriptions.retrieve(subId) : null;
        const ms: any = metaSub;
        await prisma.subscription.upsert({
          where: { userId },
          update: {
            planId, status: "ACTIVE",
            stripeCustomerId: customerId || null,
            stripeSubscriptionId: subId || null,
            currentPeriodStart: ms ? new Date(ms.current_period_start * 1000) : new Date(),
            currentPeriodEnd: ms ? new Date(ms.current_period_end * 1000) : new Date(Date.now() + 30*24*3600*1000),
            cancelAtPeriodEnd: ms?.cancel_at_period_end || false,
          },
          create: {
            userId, planId, status: "ACTIVE",
            stripeCustomerId: customerId || null,
            stripeSubscriptionId: subId || null,
            currentPeriodStart: ms ? new Date(ms.current_period_start * 1000) : new Date(),
            currentPeriodEnd: ms ? new Date(ms.current_period_end * 1000) : new Date(Date.now() + 30*24*3600*1000),
          },
        });
        // grant token allowance
        await prisma.user.update({
          where: { id: userId },
          data: { tokenBalance: plan.tokenAllowance, freeTokensUsed: 0, cooldownUntil: null },
        });
        // initiate BTC conversion workflow (pending/admin)
        if (s.payment_intent) {
          const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent.id;
          const payment = await prisma.payment.findUnique({ where: { stripePaymentIntentId: pi } });
          if (payment) {
            const existingConversion = await prisma.bitcoinConversion.findFirst({ where: { paymentId: payment.id } });
            if (!existingConversion) {
              const address = (await prisma.adminSetting.findUnique({ where: { key: "btc_receiving_address" } }))?.value || process.env.BTC_RECEIVING_ADDRESS;
              await prisma.bitcoinConversion.create({
                data: {
                  paymentId: payment.id,
                  gbpAmount: payment.amountGbp,
                  targetAddress: String(address),
                  status: "MANUAL_REQUIRED", // automated conversion not assumed; admin workflow
                  provider: "manual",
                },
              });
            }
          }
        }
        break;
      }
      case "invoice.paid": {
        const inv: any = event.data.object;
        const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
        if (!subId) break;
        const sub = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: subId } });
        if (!sub) break;
        const plan = await prisma.plan.findUnique({ where: { id: sub.planId } });
        if (!plan) break;
        // renew tokens
        const existingInvoicePayment = await prisma.payment.findFirst({ where: { stripeInvoiceId: inv.id } });
        if (!existingInvoicePayment) {
          await prisma.payment.create({
            data: {
              userId: sub.userId, planId: plan.id, stripeInvoiceId: inv.id,
              amountGbp: inv.amount_paid, status: "SUCCEEDED", description: "Renewal",
            },
          });
        }
        await prisma.user.update({ where: { id: sub.userId }, data: { tokenBalance: plan.tokenAllowance } });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const dbSub = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (!dbSub) break;
        const su: any = sub;
        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            status: sub.status === "active" ? "ACTIVE" : sub.status === "trialing" ? "TRIALING" : sub.status === "canceled" ? "CANCELED" : "PAST_DUE",
            currentPeriodStart: new Date(su.current_period_start * 1000),
            currentPeriodEnd: new Date(su.current_period_end * 1000),
            cancelAtPeriodEnd: su.cancel_at_period_end,
          },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const dbSub = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (!dbSub) break;
        await prisma.subscription.update({ where: { id: dbSub.id }, data: { status: "EXPIRED" } });
        await prisma.user.update({
          where: { id: dbSub.userId },
          data: { tokenBalance: 0, freeTokensUsed: 0, freeAllowance: 200000, cooldownUntil: null },
        });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Webhook handling error", e);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
