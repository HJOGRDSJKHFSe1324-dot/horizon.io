export async function GET() {
  try {
    const r = await fetch("https://zenquotes.io/api/random", { signal: AbortSignal.timeout(5000) });
    const data: any = await r.json();
    const q = Array.isArray(data) ? data[0] : null;
    return Response.json({ quote: q?.q || "", author: q?.a || "" });
  } catch (e: any) {
    return Response.json({ error: e?.message || "quote failed" }, { status: 502 });
  }
}