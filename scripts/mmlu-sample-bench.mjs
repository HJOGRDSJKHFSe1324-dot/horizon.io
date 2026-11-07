import fs from "node:fs";

const BASE = "http://127.0.0.1:8080";
const MODELS = ["Zenith-1.1:latest","Halo-1:latest","Halo2.5:latest","Nova5.2:latest","Nova5.4-Ultra:latest"];

const questions = [
  { id: 1, category: "Math", prompt: "Question: If x = 2 and y = 3, what is x^2 + y^2?\nA) 4\nB) 13\nC) 25\nD) 36\nE) 6", correct: "B" },
  { id: 2, category: "Physics", prompt: "Question: Newton's second law relates force to mass and acceleration with which formula?\nA) mass / acceleration\nB) mass * acceleration\nC) acceleration / mass\nD) mass * velocity", correct: "B" },
  { id: 3, category: "Law", prompt: "Question: Which of these is a civil wrong often enforced with damages rather than criminal punishment?\nA) Murder\nB) Robbery\nC) Negligence\nD) Treason", correct: "C" },
  { id: 4, category: "Psychology", prompt: "Question: The stage theory of cognitive development proposed by Piaget includes which stage first?\nA) Formal operations\nB) Concrete operations\nC) Preoperational\nD) Sensorimotor", correct: "D" },
  { id: 5, category: "History", prompt: "Question: The Renaissance is most closely associated with its origins in which country?\nA) France\nB) Italy\nC) Germany\nD) England", correct: "B" },
  { id: 6, category: "Computer Science", prompt: "Question: In the average and best case, quicksort runs in which time complexity?\nA) O(n)\nB) O(n log n)\nC) O(n^2)\nD) O(log n)", correct: "B" },
  { id: 7, category: "Biology", prompt: "Question: The flow of genetic information follows which order?\nA) RNA -> DNA -> Protein\nB) DNA -> Protein -> RNA\nC) Protein -> DNA -> RNA\nD) DNA -> RNA -> Protein", correct: "D" },
  { id: 8, category: "Chemistry", prompt: "Question: A solution with a pH of 7.0 is best described as?\nA) Strongly acidic\nB) Weakly acidic\nC) Neutral\nD) Strongly basic", correct: "C" },
  { id: 9, category: "Economics", prompt: "Question: In a competitive market, price and quantity settle where supply equals demand, called?\nA) Externality\nB) Equilibrium\nC) Oligopoly\nD) Inflation", correct: "B" },
  { id: 10, category: "Engineering", prompt: "Question: Electrical resistance is measured in which unit?\nA) Volts\nB) Amperes\nC) Ohms\nD) Watts", correct: "C" },
  { id: 11, category: "Philosophy", prompt: "Question: The phrase 'I think, therefore I am' is associated with which philosopher?\nA) Aristotle\nB) Kant\nC) Descartes\nD) Locke", correct: "C" },
  { id: 12, category: "Medicine", prompt: "Question: A normal adult resting heart rate is approximately?\nA) 20 to 30 bpm\nB) 40 to 50 bpm\nC) 60 to 100 bpm\nD) 120 to 150 bpm", correct: "C" }
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
          { role: "system", content: "You are answering MMLU-Pro style multiple-choice questions. Reply with exactly one uppercase letter: A, B, C, D, or E. No explanation." },
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
    return {
      answer,
      raw: content,
      latencyMs: Math.round(latency),
      completionTokens,
      correct: answer === question.correct
    };
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
      rows.push({ questionId: q.id, category: q.category, correct: q.correct, answer: result.answer, raw: result.raw, correctFlag: result.correct, latencyMs: result.latencyMs });
      console.log(model, q.id, result.answer, result.correctFlag ? "OK" : "WRONG", result.latencyMs + "ms");
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
  const out = { sampleSize: questions.length, questions: questions.map(q => ({ id: q.id, category: q.category, correct: q.correct })), models: summary, ranAt: new Date().toISOString() };
  fs.writeFileSync("scripts/mmlu-sample-results.json", JSON.stringify(out, null, 2));
  console.log("WROTE scripts/mmlu-sample-results.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
