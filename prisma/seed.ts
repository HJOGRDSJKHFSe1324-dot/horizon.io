import { PrismaClient, PlanSlug, ModelTier } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Plans
  const plans = [
    { slug: PlanSlug.FREE, name: "Free", priceGbp: 0, tokenAllowance: 200000, priority: 0, description: "Get started with Zenith-1.1 and Halo 1.5", modelAccess: ["zenith-1.1", "halo-1.5"], features: ["200K tokens", "Zenith-1.1", "Halo 1.5", "5-hour cooldown after exhausting allowance"] },
    { slug: PlanSlug.PLUS, name: "Horizon Plus", priceGbp: 200, tokenAllowance: 500000, priority: 1, description: "More tokens for everyday use", modelAccess: ["zenith-1.1"], features: ["500K tokens/billing cycle", "Zenith-1.1", "Standard priority"] },
    { slug: PlanSlug.PRO, name: "Horizon Pro", priceGbp: 1000, tokenAllowance: 1000000, priority: 2, description: "Advanced models through Pro", modelAccess: ["zenith-1.1", "halo-1.5", "halo-2.5"], features: ["1M tokens/billing cycle", "Zenith-1.1, Halo 1.5, Halo 2.5", "Standard priority"] },
    { slug: PlanSlug.ULTRA, name: "Horizon Ultra", priceGbp: 2000, tokenAllowance: 5000000, priority: 3, description: "Maximum power", modelAccess: ["zenith-1.1", "halo-1.5", "halo-2.5", "nova-5.2"], features: ["5M tokens/billing cycle", "All models", "Highest priority"] },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({
      where: { slug: p.slug },
      update: { name: p.name, priceGbp: p.priceGbp, tokenAllowance: p.tokenAllowance, priority: p.priority, description: p.description, features: p.features as any, modelAccess: p.modelAccess as any },
      create: { slug: p.slug, name: p.name, priceGbp: p.priceGbp, tokenAllowance: p.tokenAllowance, priority: p.priority, description: p.description, features: p.features as any, modelAccess: p.modelAccess as any },
    });
  }

  // Models
  const baseUrl = process.env.AI_SERVER_BASE_URL || null;
  const models = [
    { name: "Zenith-1.1", slug: "zenith-1.1", description: "Horizon's free flagship model. Fast, capable, and accessible to everyone.", tier: ModelTier.FREE, minPlan: PlanSlug.FREE, badge: "FREE MODEL", apiModelId: "Zenith-1.1:latest" },
    { name: "Halo 1.5", slug: "halo-1.5", description: "Advanced reasoning and coding model, now free.", tier: ModelTier.FREE, minPlan: PlanSlug.FREE, badge: "FREE MODEL", apiModelId: "Halo-1:latest" },
    { name: "Halo 2.5", slug: "halo-2.5", description: "Flagship Horizon model with top-tier performance.", tier: ModelTier.PAID, minPlan: PlanSlug.PRO, badge: "FLAGSHIP MODEL", apiModelId: "Halo2.5:latest" },
    { name: "Nova 5.2", slug: "nova-5.2", description: "An independent ultra-tier knowledge-first model, reserved for Ultra subscribers.", tier: ModelTier.PAID, minPlan: PlanSlug.ULTRA, badge: "ULTRA EXCLUSIVE", apiModelId: "Nova5.2:latest" },
  ];
  for (const m of models) {
    await prisma.model.upsert({
      where: { slug: m.slug },
      update: { name: m.name, description: m.description, tier: m.tier, minPlan: m.minPlan, badge: m.badge, apiBaseUrl: baseUrl, apiModelId: m.apiModelId },
      create: { name: m.name, slug: m.slug, description: m.description, tier: m.tier, minPlan: m.minPlan, badge: m.badge, apiBaseUrl: baseUrl, apiModelId: m.apiModelId },
    });
  }

  // Admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@horizon.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "HorizonAdmin!2026";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" as any, passwordHash, tokenBalance: 5000000, freeAllowance: 0 },
    create: { email: adminEmail, name: "Administrator", role: "ADMIN" as any, passwordHash, emailVerified: new Date(), tokenBalance: 5000000, freeAllowance: 0 },
  });
  const ultraPlan = await prisma.plan.findUnique({ where: { slug: PlanSlug.ULTRA } });
  if (ultraPlan) {
    await prisma.subscription.upsert({
      where: { userId: admin.id },
      update: { planId: ultraPlan.id, status: "ACTIVE" as any },
      create: { userId: admin.id, planId: ultraPlan.id, status: "ACTIVE" as any, currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 365*24*3600*1000) },
    });
  }

  // Benchmark tests (real framework entries; no fabricated results)
  const tests = [
    { name: "Reasoning: logic puzzle", category: "reasoning", prompt: "A farmer has 17 sheep. All but 9 die. How many are left?" },
    { name: "Coding: fizzbuzz", category: "coding", prompt: "Write a Python function fizzbuzz(n) returning list for 1..n." },
    { name: "Math: derivative", category: "math", prompt: "What is derivative of x^3 + 2x^2 - 5x + 7?" },
    { name: "Knowledge: capital", category: "knowledge", prompt: "What is the capital of Japan?" },
  ];
  for (const t of tests) {
    const existing = await prisma.benchmarkTest.findFirst({ where: { name: t.name } });
    if (!existing) await prisma.benchmarkTest.create({ data: t });
  }

  // Admin settings
  const btcAddr = process.env.BTC_RECEIVING_ADDRESS || "bc1pzxzdqw8yjfhxehxghhpjs66q09es6jmp940tjk4yyyhrfrcuzx8qnknvlz";
  await prisma.adminSetting.upsert({
    where: { key: "btc_receiving_address" },
    update: { value: btcAddr },
    create: { key: "btc_receiving_address", value: btcAddr },
  });

  console.log("Seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());