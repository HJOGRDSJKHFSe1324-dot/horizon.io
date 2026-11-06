import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const { rateLimit, getClientIp } = await import("@/lib/rate-limit");
  const ip = getClientIp(req); const rl = rateLimit(`checkout:${ip}`, 10, 60_000);
  if (!rl.ok) return Response.json({ error: "Too many requests" }, { status: 429 });
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) return Response.json({ error: "Stripe not configured" }, { status: 503 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.json().catch(() => ({}));
  const planSlug = String(body?.planSlug || "");
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug as any } });
  if (!plan || plan.slug === "FREE" as any) return Response.json({ error: "Invalid plan" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email!,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: { name: plan.name, description: plan.description || undefined },
          unit_amount: plan.priceGbp,
          recurring: { interval: plan.billingInterval === "month" ? "month" : "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?checkout=cancelled`,
    metadata: { userId, planSlug, planId: plan.id },
    subscription_data: { metadata: { userId, planSlug, planId: plan.id } },
  });

  return Response.json({ url: checkout.url });
}