import { NextRequest } from "next/server";

function evaluate(expr: string): number {
  let i = 0;
  const s = expr.replace(/\s+/g, "");
  function parseExpression(): number {
    let value = parseTerm();
    while (i < s.length && (s[i] === "+" || s[i] === "-")) {
      const op = s[i++];
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }
  function parseTerm(): number {
    let value = parseFactor();
    while (i < s.length && (s[i] === "*" || s[i] === "/")) {
      const op = s[i++];
      const rhs = parseFactor();
      if (op === "/" && rhs === 0) throw new Error("division by zero");
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }
  function parseFactor(): number {
    if (i >= s.length) throw new Error("unexpected end");
    if (s[i] === "(") {
      i++;
      const value = parseExpression();
      if (i >= s.length || s[i] !== ")") throw new Error("missing parenthesis");
      i++;
      return value;
    }
    if (s[i] === "-" || s[i] === "+") {
      const sign = s[i++] === "-" ? -1 : 1;
      return sign * parseFactor();
    }
    const start = i;
    while (i < s.length && /[0-9.]/.test(s[i])) i++;
    if (i === start) throw new Error("expected number");
    const n = Number(s.slice(start, i));
    if (!Number.isFinite(n)) throw new Error("invalid number");
    return n;
  }
  const result = parseExpression();
  if (i !== s.length) throw new Error("unexpected token");
  if (!Number.isFinite(result)) throw new Error("non-finite result");
  return result;
}

export async function GET(req: NextRequest) {
  const expr = (new URL(req.url).searchParams.get("expr") || "").slice(0, 256);
  if (!expr.trim()) return Response.json({ error: "expr required" }, { status: 400 });
  try {
    const result = evaluate(expr);
    return Response.json({ expr, result });
  } catch {
    return Response.json({ error: "evaluation failed" }, { status: 400 });
  }
}