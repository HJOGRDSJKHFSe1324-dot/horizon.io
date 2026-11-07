import fs from "node:fs";
const BASE = "http://127.0.0.1:8080";
const MODELS = ["Zenith-1.1:latest","Halo-1:latest","Halo2.5:latest","Nova5.2:latest","Nova5.4-Ultra:latest"];
const questions = [
  { id: 1, category: "Math", prompt: "Question: What is ((7 + 3) * (4 - 1) - 5) / 3?\nA) 7\nB) 8\nC) 9\nD) 10\nE) 11", correct: "C" },
  { id: 2, category: "Programming", prompt: "Question: In Python, what is the value of bool([]) == False?\nA) True\nB) False\nC) None\nD) Error", correct: "A" },
  { id: 3, category: "Logic", prompt: "Question: A knight always tells the truth; a knave always lies. A says: 'B is a knave.' B says: 'A and I are of different kinds.' What is A?\nA) Knight\nB) Knave\nC) Cannot determine\nD) Both lie", correct: "B" },
  { id: 4, category: "Probability", prompt: "Question: Given P(A)=0.4, P(B)=0.5, and P(A and B)=0.2, what is P(B|A)?\nA) 0.2\nB) 0.4\nC) 0.5\nD) 1.0", correct: "C" },
  { id: 5, category: "Computer Science", prompt: "Question: 0b1010 in decimal is:\nA) 8\nB) 10\nC) 12\nD) 14", correct: "B" },
  { id: 6, category: "Physics", prompt: "Question: A 10 kg mass accelerates at 2 m/s^2. Force in newtons is:\nA) 5\nB) 10\nC) 20\nD) 40", correct: "C" },
  { id: 7, category: "Chemistry", prompt: "Question: For reaction H2 + I2 <-> 2HI; if pressure is increased, equilibrium shifts?\nA) Toward products\nB) Toward reactants\nC) No shift\nD) Completes irreversibly", correct: "C" },
  { id: 8, category: "Law", prompt: "Question: In a criminal case, the standard of proof is:\nA) Preponderance of evidence\nB) Clear and convincing evidence\nC) Beyond a reasonable doubt\nD) Probable cause only", correct: "C" },
  { id: 9, category: "Medicine", prompt: "Question: Initial treatment for severe anaphylaxis is intramuscular:\nA) Diphenhydramine\nB) Epinephrine\nC) Albuterol\nD) Cortisone only", correct: "B" },
  { id: 10, category: "Programming", prompt: "Question: What is the output? let a = [1,2,3]; console.log(a.includes(2));\nA) true\nB) false\nC) undefined\nD) Error", correct: "A" },
  { id: 11, category: "Philosophy", prompt: "Question: 'Treat humanity always as an end, never merely as a means' is associated with:\nA) Bentham\nB) Mill\nC) Kant\nD) Aristotle", correct: "C" },
  { id: 12, category: "Math", prompt: "Question: If P(A|B)=0.8 and P(B)=0.3, then P(A and B)=?\nA) 0.24\nB) 0.8\nC) 0.3\nD) 1.1", correct: "A" }
];

async function ask(model, question) {
  const started = performance.now();
  try {
    const res = await fetch(`${BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0,
        messages: [
          { role: "system", content: "Reply with exactly one uppercase letter A-E. No explanation." },
          { role: "user", content: question.prompt }
        ]
      })
    });
    const latency = performance.now() - started;
    const json = await res.json();
    const content = String(json?.choices?.[0]?.message?.content ?? "").trim().toUpperCase();
    const match = content.match(/[A-E]/);
    const answer = match ? match[0] : "";
    const completionTokens = json?.usage?.completion_tokens ?? 0;
    return { answer, raw: content, latencyMs: Math.round(latency), completionTokens, correct: answer === question.correct };
  } catch (error) {
    return { answer: "", raw: String(error), latencyMs: Math.round(performance.now() - started), completionTokens: 0, correct: false };
  }
}

async function main() {
  const summary = {};
  for (const model of MODELS) {
    const rows = [];
    let correct = 0;
    let latency = 0;
    let tokens = 0;
    for (const q of questions) {
      const result = await ask(model, q);
      if (result.correct) correct++;
      latency += result.latencyMs;
      tokens += result.completionTokens;
      rows.push({ questionId: q.id, category: q.category, expected: q.correct, answer: result.answer, raw: result.raw, correct: result.correct, latencyMs: result.latencyMs });
      console.log(model, "Q" + q.id, result.answer, "expected", q.correct, result.correct ? "OK" : "WRONG", result.latencyMs + "ms");
    }
    summary[model] = {
      total: questions.length,
      correct,
      accuracy: Number(((correct / questions.length) * 100).toFixed(1)),
      averageLatencyMs: Math.round(latency / questions.length),
      averageTokensPerSecond: tokens ? Number((tokens / (latency / 1000)).toFixed(1)) : null,
      rows
    };
  }
  const out = { name: "HORIZON harder benchmark v3", sampleSize: questions.length, models: summary, ranAt: new Date().toISOString() };
  fs.writeFileSync("scripts/hard-benchmark-results.json", JSON.stringify(out, null, 2));
  console.log("WROTE scripts/hard-benchmark-results.json");
}

main().catch((error) => { console.error(error); process.exit(1); });
