import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const r = await fetch("http://ip-api.com/json/?fields=status,country,regionName,city,lat,lon,timezone,isp", { signal: AbortSignal.timeout(5000) });
    const data: any = await r.json();
    if (data?.status !== "success") return Response.json({ error: "location unavailable" }, { status: 502 });
    return Response.json({
      ipCountry: data.country,
      region: data.regionName,
      city: data.city,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      note: "Approximate location from IP. Accuracy varies; treat as coarse.",
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "location failed" }, { status: 502 });
  }
}