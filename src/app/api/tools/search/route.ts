import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { rateLimit, getClientIp } = await import("@/lib/rate-limit");
  const rl = rateLimit(`tool-search:${getClientIp(req)}`, 30, 60_000);
  if (!rl.ok) return Response.json({ error: "Too many requests" }, { status: 429 });
  const q = new URL(req.url).searchParams.get("q") || "";
  if (!q.trim()) return Response.json({ error: "q required" }, { status: 400 });
  try {
    const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`, { headers: { "User-Agent": "HorizonTool/1.0" } });
    const data: any = await r.json();
    const related = (data.RelatedTopics || [])
      .flatMap((t: any) => t.Topics ? t.Topics : [t])
      .filter((t: any) => t.Text && t.FirstURL)
      .slice(0, 12)
      .map((t: any) => ({ title: t.Text, url: t.FirstURL }));
    return Response.json({
      query: q,
      abstract: data.Abstract || "",
      abstractSource: data.AbstractSource || "",
      abstractUrl: data.AbstractURL || "",
      answer: data.Answer || "",
      related,
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "search failed" }, { status: 502 });
  }
}