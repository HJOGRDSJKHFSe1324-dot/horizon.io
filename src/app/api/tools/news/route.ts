export async function GET() {
  try {
    const topRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", { signal: AbortSignal.timeout(5000) });
    const ids: number[] = await topRes.json();
    const selected = ids.slice(0, 8);
    const items = await Promise.all(selected.map(async (id) => {
      try {
        const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(5000) });
        const d: any = await r.json();
        return { id: d.id, title: d.title, url: d.url, score: d.score, comments: d.descendants };
      } catch { return null; }
    }));
    return Response.json({ source: "Hacker News", stories: items.filter(Boolean) });
  } catch (e: any) {
    return Response.json({ error: e?.message || "news failed" }, { status: 502 });
  }
}