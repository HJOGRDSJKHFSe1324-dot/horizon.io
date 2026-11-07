import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = String(body?.title || "Chart").slice(0, 80);
  const labels: string[] = Array.isArray(body?.labels) ? body.labels.map(String).slice(0, 20) : [];
  const values: number[] = Array.isArray(body?.values) ? body.values.map(Number).slice(0, 20) : [];
  const n = Math.min(labels.length, values.length);
  if (n === 0) return Response.json({ error: "labels/values required" }, { status: 400 });
  const width = 640, height = 320, pad = 40;
  const max = Math.max(...values.slice(0, n), 1);
  const barW = (width - 2 * pad) / n - 8;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="100%" height="100%" fill="#05070d"/><text x="${width/2}" y="24" text-anchor="middle" fill="#e6eaf2" font-size="18">${escapeXml(title)}</text>`;
  for (let i = 0; i < n; i++) {
    const v = values[i];
    const h = (v / max) * (height - 2 * pad);
    const x = pad + i * ((width - 2 * pad) / n) + 4;
    const y = height - pad - h;
    svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="url(#g)" rx="4"/>`;
    svg += `<text x="${x + barW / 2}" y="${height - 12}" text-anchor="middle" fill="#94a3b8" font-size="11">${escapeXml(labels[i].slice(0, 12))}</text>`;
    svg += `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" fill="#e6eaf2" font-size="10">${v}</text>`;
  }
  svg += `<defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs>`;
  svg += `</svg>`;
  return Response.json({ type: "svg", svg });
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}