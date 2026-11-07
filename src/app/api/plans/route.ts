import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { priceGbp: "asc" } });
    return Response.json(plans);
  } catch (e: any) {
    return Response.json({ error: e?.message || "Database unavailable" }, { status: 503 });
  }
}