import fs from "node:fs";

const BASE = "http://127.0.0.1:8080";
const MODELS = ["Zenith-1.1:latest","Halo-1:latest","Halo2.5:latest","Nova5.2:latest","Nova5.4-Ultra:latest"];

const questions = [
  { id: 1, category: "Math", prompt: "Question: (17 * 19) mod 7 equals what?\nA) 0\nB) 1\nC) 2\nD) 3\nE) 4", correct: "B" },
  { id: 2, category: "Logic", prompt: "Question: Which statement is logically valid?\nA) All roses are flowers; some flowers fade quickly; therefore some roses fade quickly\nB) If it rains the ground is wet; the ground is wet; therefore it rained\nC) All A are B; C is B; therefore C is A\nD) No rose is a cactus; a tulip is not a cactus; therefore a tulip is a rose", correct: "A" },
  { id: 3, category: "Probability", prompt: "Question: Three fair coins are flipped. What is the probability of exactly two heads?\nA) 1/8\nB) 1/4\nC) 3/8\nD) 1/2\nE) 5/8", correct: "C" },
  { id: 4, category: "Computer Science", prompt: "Question: Which complexity is typical for binary search on a sorted array of n elements?\nA) O(n)\nB) O(n log n)\nC) O(n^2)\nD) O(log n)\nE) O(1)", correct: "D" },
  { id: 5, category: "Physics", prompt: "Question: The kinetic energy of a moving object with mass m and speed v is given by:\nA) one-half times m times v squared\nB) m times v\nC) m squared times v squared\nD) one-half times m squared times v", correct: "A" },
  { id: 6, category: "Geography", prompt: "Question: Which ocean is the largest by surface area?\nA) Atlantic\nB) Indian\nC) Arctic\nD) Pacific\nE) Southern", correct: "D" },
  { id: 7, category: "Programming", prompt: "Question: In Python, what does [x*x for x in [1,2,3] if x > 1] evaluate to?\nA) [1, 4, 9]\nB) [4, 9]\nC) [1, 4]\nD) [9]\nE) []", correct: "B" },
  { id: 8, category: "Chemistry", prompt: "Question: Which unit directly measures amount of substance in moles?\nA) Grams\nB) Molarity\nC) Avogadro's constant\nD) Concentration", correct: "C" },
  { id: 9, category: "Economics", prompt: "Question: When supply and demand curves intersect, price and quantity are said to form a market:\nA) externality\nB) monopoly\nC) equilibrium\nD) subsidy\nE) recession", correct: "C" },
  { id: 10, category: "Engineering", prompt: "Question: Which unit measures electrical resistance?\nA) Volt\nB) Ampere\nC) Ohm\nD) Watt\nE) Farad", correct: "C" },
  { id: 11, category: "Philosophy", prompt: "Question: The principle 'the greatest happiness for the greatest number' is associated with:\nA) Deontology\nB) Utilitarianism\nC) Existentialism\nD) Rationalism\nE) Stoicism", correct: "B" },
  { id: 12, category: "Law", prompt: "Question: In civil actions, the plaintiff generally proves claims by a:\nA) Beyond a reasonable doubt\nB) Preponderance of the evidence\nC) Clear and convincing mandate only\nD) Prima facie impossibility standard", correct: "B" },
  { id: 13, category: "Medicine", prompt: "Question: Which medication is first-line in an acute anaphylactic emergency?\nA) Acetaminophen\nB) Epinephrine\nC) Metformin\nD) Loratadine only", correct: "B" },
  { id: 14, category: "Biology", prompt: "Question: Retroviruses are notable because they reverse which ordinary flow?\nA) DNA to RNA to protein\nB) RNA to DNA to protein\nC) protein to RNA to DNA\nD) DNA to protein directly", correct: "B" },
  { id: 15, category: "History", prompt: "Question: The immediate trigger often cited for World War I is:\nA) Assassination of Archduke Franz Ferdinand\nB) Fall of the Berlin Wall\nC) Treaty of Westphalia\nD) French Revolution", correct: "A" },
  { id: 16, category: "Math", prompt: "Question: What is the derivative of x^3 + 2x^2 - 5x + 7?\nA) 3x^2 + 4x - 5\nB) x^2 + 4x - 5\nC) 3x^2 + 2x - 5\nD) x^3 + 4x - 5", correct: "A" },
  { id: 17, category: "Statistics", prompt: "Question: For values 2, 4, 7, 10, 100, the median is:\nA) 4\nB) 7\nC) 10\nD) 24.6\nE) 100", correct: "B" },
  { id: 18, category: "Computer Science", prompt: "Question: A recursive Fibonacci function without memoization has time complexity approximately:\nA) O(n)\nB) O(n log n)\nC) O(2^n)\nD) O(n^2)", correct: "C" },
  { id: 19, category: "Chemistry", prompt: "Question: What is the atomic number of carbon?\nA) 4\nB) 5\nC) 6\nD) 7\nE) 8", correct: "C" },
  { id: 20, category: "Psychology", prompt: "Question: In Maslow's hierarchy, which need sits at the base?\nA) Self-actualization\nB) Esteem\nC) Belonging\nD) Physiological", correct: "D" },
  { id: 21, category: "Health", prompt: "Question: Which approximate BMI category begins at 30?\nA) Underweight\nB) Normal\nC) Overweight\nD) Obesity\nE) Morbid only", correct: "D" },
  { id: 22, category: "Law", prompt: "Question: Miranda warnings concern which constitutional protection?\nA) First Amendment\nB) Fourth Amendment only\nC) Fifth and Sixth Amendment protections\nD) Eighth Amendment", correct: "C" },
  { id: 23, category: "Math", prompt: "Question: The roots of x^2 - 5x + 6 = 0 are 2 and 3. Their sum is:\nA) 2\nB) 3\nC) 5\nD) 6\nE) 1", correct: "C" },
  { id: 24, category: "Programming", prompt: "Question: What does this Python code print?\nx = [1, 2, 3]\ny = x\ny.append(4)\nprint(x)\nA) [1, 2, 3]\nB) [1, 2, 3, 4]\nC) [4]\nD) Error", correct: "B" },
  { id: 25, category: "Physics", prompt: "Question: A car travels 60 km in 1.5 hours. Its average speed is:\nA) 20 km/h\nB) 30 km/h\nC) 40 km/h\nD) 60 km/h", correct: "C" },
  { id: 26, category: "Chemistry", prompt: "Question: Increasing temperature of an exothermic equilibrium usually shifts equilibrium:\nA) Toward products\nB) Toward reactants\nC) No change\nD) Stops the reaction", correct: "B" },
  { id: 27, category: "Medicine", prompt: "Question: A normal adult resting heart rate is approximately:\nA) 20-30 bpm\nB) 40-50 bpm\nC) 60-100 bpm\nD) 120-150 bpm", correct: "C" },
  { id: 28, category: "Philosophy", prompt: "Question: Deontological ethics stresses duties and rules rather than consequences; who is most associated?\nA) Bentham\nB) Mill\nC) Kant\nD) Aristotle", correct: "C" },
  { id: 29, category: "Economics", prompt: "Question: GDP measured as C + I + G + NX accounts for consumption, investment, government spending, and:\nA) net taxes\nB) net exports\nC) net imports only\nD) gross savings", correct: "B" },
  { id: 30, category: "Psychology", prompt: "Question: Piaget's term for understanding that quantity remains same despite appearance changes is:\nA) Assimilation\nB) Object permanence\nC) Conservation\nD) Accommodation", correct: "C" },
  { id: 31, category: "Computer Science", prompt: "Question: Best-case time complexity of merge sort is:\nA) O(n)\nB) O(n log n)\nC) O(n^2)\nD) O(log n)\nE) O(1)", correct: "B" },
  { id: 32, category: "Law", prompt: "Question: Miranda protections mainly safeguard against self-incrimination by requiring:\nA) notice of right to remain silent and counsel during custody\nB) demand force only\nC) consent searches always\nD) waiver of jury trial", correct: "A" },
  { id: 33, category: "Math", prompt: "Question: Bayes theorem relates conditional probabilities P(A|B) in terms of P(B|A), P(A), and P(B). Which is the denominator?\nA) P(A)\nB) P(B|A)\nC) P(B)\nD) P(A and B)", correct: "C" },
  { id: 34, category: "Philosophy", prompt: "Question: The sentence 'I think, therefore I am' is attributed to:\nA) Aristotle\nB) Kant\nC) Descartes\nD) Locke\nE) Hume", correct: "C" },
  { id: 35, category: "Programming", prompt: "Question: In JavaScript, [] == ![] evaluates to:\nA) true\nB) false\nC) undefined\nD) TypeError", correct: "A" },
  { id: 36, category: "Chemistry", prompt: "Question: As temperature rises for an exothermic reversible reaction at equilibrium, equilibrium generally shifts:\nA) toward products\nB) toward reactants\nC) no shift\nD) irreversibly", correct: "B" },
  { id: 37, category: "Health", prompt: "Question: To compute BMI in kg/m^2 using pounds and inches, formula factor is approximately:\nA) 703 / (inches^2) times pounds\nB) pounds / inches\nC) inches / pounds^2\nD) 100 / pounds", correct: "A" },
  { id: 38, category: "Physics", prompt: "Question: Inertia is best described as resistance to changes in:\nA) acceleration itself\nB) force\nC) state of motion\nD) mass unit", correct: "C" },
  { id: 39, category: "Accounting", prompt: "Question: Net income equals revenue minus:\nA) assets\nB) expenses\nC) liabilities\nD) equity", correct: "B" },
  { id: 40, category: "History", prompt: "Question: The Renaissance's classical revival is most strongly associated with origin in:\nA) France\nB) England\nC) Italy\nD) Spain", correct: "C" },
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
          { role: "system", content: "You are answering a challenging benchmark. Reply with exactly one uppercase letter: A, B, C, D, or E. No explanation." },
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
      rows.push({ questionId: q.id, category: q.category, expected: q.correct, answer: result.answer, raw: result.raw, correct: result.correct, latencyMs: result.latencyMs });
      console.log(model, "Q"+q.id, result.answer, "expected", q.correct, result.correct ? "OK" : "WRONG", result.latencyMs + "ms");
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
  const out = { name: "HORIZON hard reasoning sample v2", sampleSize: questions.length, models: summary, ranAt: new Date().toISOString() };
  fs.writeFileSync("scripts/hard-benchmark-results.json", JSON.stringify(out, null, 2));
  console.log("WROTE scripts/hard-benchmark-results.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
