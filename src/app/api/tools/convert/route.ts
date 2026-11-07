import { NextRequest } from "next/server";

const FACTORS: Record<string, number> = {
  "m:ft": 3.280839895, "ft:m": 0.3048,
  "km:mi": 0.621371, "mi:km": 1.60934,
  "kg:lb": 2.20462, "lb:kg": 0.453592,
  "c:f": 0, "f:c": 0,
};

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const value = Number(sp.get("value"));
  const from = (sp.get("from") || "").toLowerCase();
  const to = (sp.get("to") || "").toLowerCase();
  if (!Number.isFinite(value)) return Response.json({ error: "value required" }, { status: 400 });
  if (from === "c" && to === "f") return Response.json({ input: value, from, to, result: value * 9 / 5 + 32 });
  if (from === "f" && to === "c") return Response.json({ input: value, from, to, result: (value - 32) * 5 / 9 });
  const factor = FACTORS[`${from}:${to}`];
  if (!factor) return Response.json({ error: "unsupported conversion" }, { status: 400 });
  return Response.json({ input: value, from, to, result: value * factor });
}