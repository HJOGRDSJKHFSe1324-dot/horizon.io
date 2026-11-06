import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { streamChat } from "@/lib/ai-client";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const tests = await prisma.benchmarkTest.findMany({ orderBy: { createdAt: "asc" } });
  const results = await prisma.benchmarkResult.findMany({ orderBy: { createdAt: "desc" }, include: { model: true, test: true }, take: 200 });
  return Response.json({ tests, results });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  const modelIds: string[] = Array.isArray(body?.modelIds) ? body.modelIds.filter((x:any)=>typeof x === "string") : [];
  const testIds: string[] = Array.isArray(body?.testIds) ? body.testIds.filter((x:any)=>typeof x === "string") : [];
  if (!modelIds.length || !testIds.length) return Response.json({ error: "modelIds and testIds required" }, { status: 400 });

  const runnerId = (session as any)?.user?.id ?? "admin";
  const created: any[] = [];
  for (const modelId of modelIds) {
    const model = await prisma.model.findUnique({ where: { id: modelId } });
    if (!model || !model.enabled) continue;
    for (const testId of testIds) {
      const test = await prisma.benchmarkTest.findUnique({ where: { id: testId } });
      if (!test) continue;

      let resRow = await prisma.benchmarkResult.create({
        data: { testId, modelId, runnerUserId: runnerId, status: "RUNNING", manuallyEntered: false },
      });

      try {
        const t0 = Date.now();
        const gen: any = streamChat({
          modelDbId: model.id,
          messages: [{ role: "user", content: test.prompt }],
          maxTokens: 512,
        });
        let result: any = null;
        while (true) {
          const { value, done } = await gen.next();
          if (done) { result = value; break; }
        }
        const latencyMs = Date.now() - t0;
        const outputTokens = result.outputTokens ?? 0;
        const tps = latencyMs > 0 ? (outputTokens / (latencyMs / 1000)) : 0;
        // auto correctness if expected provided
        let categoryScore: number | null = null;
        if (test.expected) {
          const out = String(result.content || "").toLowerCase();
          const exp = String(test.expected).toLowerCase();
          categoryScore = out.includes(exp) ? 100 : 0;
        }
        const data: any = {
          status: "COMPLETED",
          rawOutput: result.content,
          latencyMs,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          tokensPerSecond: tps,
          manuallyEntered: false,
        };
        if (test.category === "reasoning") data.reasoningScore = categoryScore;
        if (test.category === "coding") data.codingScore = categoryScore;
        if (test.category === "math") data.mathScore = categoryScore;
        if (test.category === "knowledge") data.knowledgeScore = categoryScore;
        if (categoryScore !== null) data.overallScore = categoryScore;

        resRow = await prisma.benchmarkResult.update({ where: { id: resRow.id }, data });
        created.push(resRow);
      } catch (e: any) {
        resRow = await prisma.benchmarkResult.update({
          where: { id: resRow.id },
          data: { status: "FAILED", rawOutput: String(e?.message || e) },
        });
        created.push(resRow);
      }
    }
  }
  return Response.json({ results: created });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return Response.json({ error: "id required" }, { status: 400 });
  const data: any = {};
  if (typeof body.published === "boolean") data.published = body.published;
  if (body.reasoningScore != null) data.reasoningScore = body.reasoningScore;
  if (body.codingScore != null) data.codingScore = body.codingScore;
  if (body.mathScore != null) data.mathScore = body.mathScore;
  if (body.knowledgeScore != null) data.knowledgeScore = body.knowledgeScore;
  if (body.overallScore != null) data.overallScore = body.overallScore;
  if (typeof body.manuallyEntered === "boolean") data.manuallyEntered = body.manuallyEntered;
  const updated = await prisma.benchmarkResult.update({
    where: { id: body.id },
    data,
  });
  return Response.json(updated);
}