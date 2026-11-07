const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const scores = {
    "zenith-1.1": 8.9,
    "halo-1.5": 21.4,
    "halo-2.5": 41.1,
    "nova-5.2": 50.0,
  };
  let test = await p.benchmarkTest.findFirst({ where: { name: "MMLU-Pro sample" } });
  if (!test) test = await p.benchmarkTest.create({ data: { name: "MMLU-Pro sample", category: "knowledge", description: "Offline 56-question stratified sample of MMLU-Pro (14 categories x 4). No tools. No search." } });

  for (const [slug, score] of Object.entries(scores)) {
    const model = await p.model.findUnique({ where: { slug } });
    if (!model) continue;
    await p.benchmarkResult.create({
      data: {
        testId: test.id,
        modelId: model.id,
        status: "COMPLETED",
        knowledgeScore: score,
        overallScore: score,
        manuallyEntered: true,
        published: true,
        rawOutput: `MMLU-Pro offline sample: ${score}% over 14 categories x 4 questions.`,
      },
    });
  }
  console.log("inserted MMLU-Pro sample results");

  // Also add Nova-5.2 to the operational custom benchmark tests via the Rust gateway.
  const nova = await p.model.findUnique({ where: { slug: "nova-5.2" } });
  const tests = await p.benchmarkTest.findMany();
  console.log("Nova DB id:", nova?.id);
}
main().finally(() => p.$disconnect());
