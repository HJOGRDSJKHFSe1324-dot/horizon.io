import { prisma } from "@/lib/prisma";

export async function GET() {
  const results = await prisma.benchmarkResult.findMany({
    where: { published: true },
    include: { model: true, test: true },
    orderBy: { createdAt: "desc" },
  });
  const safeResults = results.map((r: any) => {
    const { rawOutput, ...rest } = r;
    return rest;
  });
  const tests = await prisma.benchmarkTest.findMany({ select: { id: true, name: true, category: true } });
  const models = await prisma.model.findMany({ where: { enabled: true }, select: { id: true, name: true, slug: true } });
  return Response.json({ results: safeResults, tests, models });
}