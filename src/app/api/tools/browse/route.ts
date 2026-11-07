import { NextRequest } from "next/server";

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function blockedHost(host: string) {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "0.0.0.0") return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get("url") || "";
  let parsed: URL;
  try { parsed = new URL(url); } catch { return Response.json({ error: "invalid url" }, { status: 400 }); }
  if (!/^https?:$/.test(parsed.protocol)) return Response.json({ error: "bad protocol" }, { status: 400 });
  if (blockedHost(parsed.hostname)) return Response.json({ error: "blocked host" }, { status: 400 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": "HorizonTool/1.0" }, redirect: "manual", signal: controller.signal });
    if (r.status >= 300 && r.status < 400) return Response.json({ error: "redirects are not followed" }, { status: 400 });
    const html = (await r.text()).slice(0, 40000);
    const text = stripHtml(html).slice(0, 20000);
    return Response.json({ url, status: r.status, text });
  } catch (e: any) {
    return Response.json({ error: e?.message || "fetch failed" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}