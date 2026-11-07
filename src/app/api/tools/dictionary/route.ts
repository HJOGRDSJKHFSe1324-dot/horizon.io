import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const word = (new URL(req.url).searchParams.get("word") || "").trim();
  if (!word || !/^[a-zA-Z][a-zA-Z '-]{0,40}$/.test(word)) return Response.json({ error: "invalid word" }, { status: 400 });
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return Response.json({ error: "not found" }, { status: 404 });
    const data: any = await r.json();
    const entry = Array.isArray(data) ? data[0] : null;
    const meanings = (entry?.meanings || []).map((m: any) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: (m.definitions || []).slice(0, 3).map((d: any) => d.definition),
    }));
    return Response.json({ word: entry?.word || word, phonetic: entry?.phonetic, meanings });
  } catch (e: any) {
    return Response.json({ error: e?.message || "dictionary failed" }, { status: 502 });
  }
}