import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = String(body?.title || "HORIZON").slice(0, 60);
  const subtitle = String(body?.subtitle || "Intelligence Beyond Limits.").slice(0, 120);
  const color = String(body?.color || "#22d3ee");
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return Response.json({ error: "bad color" }, { status: 400 });
  const width = 1200, height = 320;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#05070d"/><stop offset="100%" stop-color="#0a1020"/></linearGradient></defs>`;
  svg += `<rect width="100%" height="100%" fill="url(#bg)"/>`;
  svg += `<circle cx="200" cy="160" r="120" fill="${color}" opacity="0.18"/>`;
  svg += `<circle cx="1000" cy="140" r="160" fill="${color}" opacity="0.12"/>`;
  svg += `<text x="60" y="150" fill="#e6eaf2" font-size="72" font-weight="700" font-family="system-ui">${escape(title)}</text>`;
  svg += `<text x="60" y="205" fill="#94a3b8" font-size="28" font-family="system-ui">${escape(subtitle)}</text>`;
  svg += `</svg>`;
  return Response.json({ type: "svg", svg });
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}