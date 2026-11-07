import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { rateLimit, getClientIp } = await import("@/lib/rate-limit");
  const rl = rateLimit(`tool-weather:${getClientIp(req)}`, 30, 60_000);
  if (!rl.ok) return Response.json({ error: "Too many requests" }, { status: 429 });
  const city = new URL(req.url).searchParams.get("city") || "London";
  if (!/^[a-zA-Z0-9 ,._-]{1,80}$/.test(city)) return Response.json({ error: "invalid city" }, { status: 400 });
  try {
    const r = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { headers: { "User-Agent": "HorizonTool/1.0" } });
    const data: any = await r.json();
    const cur = (data.current_condition || [])[0] || {};
    return Response.json({
      city,
      tempC: cur.temp_C,
      tempF: cur.temp_F,
      condition: cur.weatherDesc?.[0]?.value,
      humidity: cur.humidity,
      windKmph: cur.windspeedKmph,
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "weather failed" }, { status: 502 });
  }
}