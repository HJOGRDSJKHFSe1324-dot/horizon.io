import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const name = (new URL(req.url).searchParams.get("name") || "").trim();
  if (!name || !/^[a-zA-Z\s-]{1,60}$/.test(name)) return Response.json({ error: "invalid name" }, { status: 400 });
  try {
    const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=false`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return Response.json({ error: "not found" }, { status: 404 });
    const data: any = await r.json();
    const c = Array.isArray(data) ? data[0] : null;
    return Response.json({
      name: c?.name?.common,
      official: c?.name?.official,
      capital: c?.capital?.[0],
      region: c?.region,
      population: c?.population,
      currencies: Object.keys(c?.currencies || {}),
      languages: Object.values(c?.languages || {}),
      flag: c?.flag,
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "country failed" }, { status: 502 });
  }
}