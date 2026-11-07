import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { streamChat } from "@/lib/ai-client";
import { canUseModel, getRemainingTokens, consumeTokens } from "@/lib/tokens";
import { getBan, isCurrentlyBanned, recordBan } from "@/lib/bans";
import { detectJailbreak, detectUnsafeOutput, safetySystemPrompt } from "@/lib/safety";
import { getClientIp } from "@/lib/rate-limit";
import { promises as fs } from "fs";
import path from "path";
import AdmZip from "adm-zip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const ip = getClientIp(req);
  const existingBan = await getBan(ip);
  if (isCurrentlyBanned(existingBan)) {
    return new Response(JSON.stringify({ error: "Your IP has been temporarily banned due to policy violations." }), { status: 403 });
  }
  const { rateLimit } = await import("@/lib/rate-limit");
  const rl = rateLimit(`chat:${userId}`, 60, 60_000);
  if (!rl.ok) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }
  const { conversationId, modelSlug, message, regenerateAssistantId, effort: rawEffort, thinkHarder, webSearch: forceWebSearch, attachmentIds, latitude, longitude } = body || {};
  const isRegenerate = !!regenerateAssistantId;
  if (!isRegenerate && (!message || typeof message !== "string")) {
    return new Response(JSON.stringify({ error: "Message required" }), { status: 400 });
  }
  const safeMessage = isRegenerate ? "" : String(message);
  let effort = ["low", "medium", "high", "xhigh", "max"].includes(rawEffort) ? rawEffort : "medium";
  if (thinkHarder && (effort === "low" || effort === "medium")) effort = "high";
  if (!isRegenerate && safeMessage.length > 12000) {
    return new Response(JSON.stringify({ error: "Message too long" }), { status: 413 });
  }
  if (!isRegenerate) {
    const jailbreakReason = detectJailbreak(safeMessage)?.reason || null;
    if (jailbreakReason) {
      const entry = await recordBan(ip, (session?.user as any)?.email || null, jailbreakReason);
      return new Response(JSON.stringify({ error: `Request blocked. IP banned until ${entry.expiresAt}.` }), { status: 403 });
    }
  }

  const model = await prisma.model.findFirst({
    where: { OR: [{ slug: String(modelSlug) }, { id: String(modelSlug) }] },
  });
  if (!model || !model.enabled) {
    return new Response(JSON.stringify({ error: "Model unavailable" }), { status: 400 });
  }

  const perm = await canUseModel(userId, model.slug);
  if (!perm.ok) return new Response(JSON.stringify({ error: perm.reason }), { status: 403 });

  const estimatedInputTokens = Math.ceil((safeMessage || "").length / 3);
  const remaining = await getRemainingTokens(userId);
  if (!isRegenerate && estimatedInputTokens > remaining) {
    return new Response(JSON.stringify({ error: "Message exceeds remaining token balance" }), { status: 402 });
  }
  if (remaining <= 0) {
    return new Response(JSON.stringify({ error: "Insufficient tokens or cooldown active" }), { status: 402 });
  }
  const effortCaps: Record<string, number> = { low: 1024, medium: 2048, high: 4096, xhigh: 8192, max: 16384 };
  const cap = effortCaps[effort] || 2048;
  const maxTokens = Math.max(1, Math.min(remaining, cap));

  let conv = conversationId
    ? await prisma.conversation.findFirst({ where: { id: String(conversationId), userId } })
    : null;
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { userId, modelId: model.id, title: safeMessage.slice(0, 60) || "New conversation" },
    });
  }

  if (isRegenerate) {
    await prisma.message.deleteMany({ where: { id: String(regenerateAssistantId), conversationId: conv.id, role: "assistant" } });
  } else {
    await prisma.message.create({
      data: { conversationId: conv.id, userId, role: "user", content: safeMessage, modelId: model.id },
    });
  }

  const history = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "asc" },
  });
  const extra: Array<{ role: "system"; content: string }> = [];
  extra.push({ role: "system", content: safetySystemPrompt() });
  extra.push({ role: "system", content: "Memory policy: Use the full conversation history provided in this request. Do not forget prior details unless the conversation has been compacted. If compacted, use the provided summary as authoritative memory." });
  const now = new Date();
  extra.push({ role: "system", content: `Current server time: ${now.toISOString()} (UTC). User-visible effort: ${effort}.` });
  const lat = Number(latitude), lon = Number(longitude);
  if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, { headers: { "User-Agent": "HorizonTool/1.0" }, signal: controller.signal });
      clearTimeout(t);
      const data: any = await r.json();
      if (data?.display_name) extra.push({ role: "system", content: `Approximate user location: ${data.display_name}.` });
    } catch {
      // ignore location lookup failures
    }
  }
  // attachments
  if (!isRegenerate && Array.isArray(attachmentIds) && attachmentIds.length) {
    const ids = attachmentIds.filter((x: any) => typeof x === "string").slice(0, 10);
    const atts = await prisma.chatAttachment.findMany({ where: { id: { in: ids }, conversationId: conv.id, userId } });
    for (const att of atts) {
      try {
        const buf = await fs.readFile(att.storedPath);
        let text = "";
        if (att.fileName.toLowerCase().endsWith(".zip")) {
          try {
            const zip = new AdmZip(att.storedPath);
            const entries = zip.getEntries().slice(0, 50);
            const parts = entries.map((e: any) => {
              const n = e.entryName;
              if (e.isDirectory) return `${n}/ (directory)`;
              let data = "";
              try { if (e.getData().length < 100000) data = e.getData().toString("utf8").slice(0, 5000); } catch {}
              return data ? `${n}:\n${data}` : n;
            });
            text = `ZIP contents (${entries.length} files):\n` + parts.join("\n\n").slice(0, 20000);
          } catch {
            text = `(unable to read zip contents)`;
          }
        } else if (buf.length < 500000) {
          text = buf.toString("utf8").slice(0, 20000);
        } else {
          text = `(binary or too large: ${buf.length} bytes)`;
        }
        extra.push({ role: "system", content: `Attached file "${att.fileName}" (${att.sizeBytes} bytes):\n${text}` });
      } catch {
        // ignore unreadable file
      }
    }
  }
  // forced web search
  if (!isRegenerate && forceWebSearch && safeMessage) {
    try {
      const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(safeMessage)}&format=json&no_html=1`, { headers: { "User-Agent": "HorizonTool/1.0" } });
      const data: any = await r.json();
      const related = (data.RelatedTopics || []).flatMap((t: any) => t.Topics ? t.Topics : [t]).filter((t: any) => t.Text && t.FirstURL).slice(0, 8);
      const searchContext = `Web search results for "${safeMessage}":\n` +
        (data.Abstract ? `Abstract: ${data.Abstract}\nSource: ${data.AbstractURL}\n` : "") +
        (data.Answer ? `Answer: ${data.Answer}\n` : "") +
        related.map((t: any) => `- ${t.Text} (${t.FirstURL})`).join("\n");
      extra.push({ role: "system", content: searchContext });
      extra.push({ role: "system", content: "Use the web search results above. Include citations where relevant." });
    } catch {
      // ignore
    }
  }
  // effort system hint
  if (effort === "high" || effort === "xhigh" || effort === "max") {
    extra.push({ role: "system", content: "Think deeply and carefully before answering. Show reasoning only if useful." });
  }
  const chatMessages = [...extra, ...history.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content }))] as any;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const gen: any = streamChat({ modelDbId: model.id, messages: chatMessages as any, maxTokens, signal: req.signal });
        let result: any = null;
        while (true) {
          const { value, done } = await gen.next();
          if (done) { result = value; break; }
          // Buffer output; safety is checked before anything is sent to the client.
        }
        if (!result) throw new Error("No response from model");
        if (!result.content || !result.content.trim()) throw new Error("Model returned an empty response.");
        if (detectUnsafeOutput(result.content || "")) {
          await recordBan(ip, (session?.user as any)?.email || null, "unsafe model output");
          throw new Error("Response blocked due to safety policy.");
        }
        const assistantMsg = await prisma.message.create({
          data: {
            conversationId: conv!.id,
            role: "assistant",
            content: result.content,
            modelId: model.id,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            totalTokens: result.totalTokens,
            effort,
          },
        });
        const effortMultiplier: Record<string, number> = { low: 0.5, medium: 1, high: 2, xhigh: 3, max: 6 };
        const mult = effortMultiplier[effort] || 1;
        const consumed = await consumeTokens({
          userId,
          modelDbId: model.id,
          conversationId: conv!.id,
          messageId: assistantMsg.id,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          totalTokens: Math.ceil(result.totalTokens * mult),
        });
        await prisma.conversation.update({ where: { id: conv!.id }, data: { updatedAt: new Date(), modelId: model.id } });
        send({ type: "delta", content: result.content });
        send({ type: "done", message: assistantMsg, tokens: consumed, conversationId: conv!.id });
      } catch (e: any) {
        send({ type: "error", message: e?.message || "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}