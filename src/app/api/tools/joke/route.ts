export async function GET() {
  try {
    const r = await fetch("https://v2.jokeapi.dev/joke/Programming,Dark?safe-mode", { signal: AbortSignal.timeout(5000) });
    const data: any = await r.json();
    if (data?.error) return Response.json({ error: data.message || "joke unavailable" }, { status: 502 });
    const joke = data.type === "single" ? data.joke : `${data.setup} ... ${data.delivery}`;
    return Response.json({ joke, category: data.category });
  } catch (e: any) {
    return Response.json({ error: e?.message || "joke failed" }, { status: 502 });
  }
}