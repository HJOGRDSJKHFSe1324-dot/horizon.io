import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { streamChat } from "@/lib/ai-client";
import { canUseModel, getRemainingTokens, consumeTokens } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const { rateLimit } = await import("@/lib/rate-limit");
  const rl = rateLimit(`chat:${userId}`, 60, 60_000);
  if (!rl.ok) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }
  const { conversationId, modelSlug, message, regenerateAssistantId } = body || {};
  const isRegenerate = !!regenerateAssistantId;
  if (!isRegenerate && (!message || typeof message !== "string")) {
    return new Response(JSON.stringify({ error: "Message required" }), { status: 400 });
  }
  const safeMessage = isRegenerate ? "" : String(message);
  if (!isRegenerate && safeMessage.length > 12000) {
    return new Response(JSON.stringify({ error: "Message too long" }), { status: 413 });
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
  const maxTokens = Math.max(1, Math.min(remaining, 4096));

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
  const chatMessages = history.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })).filter((m)=>m.role !== "system" || true);

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
          if (value?.delta) send({ type: "delta", content: value.delta });
        }
        if (!result) throw new Error("No response from model");
        const assistantMsg = await prisma.message.create({
          data: {
            conversationId: conv!.id,
            role: "assistant",
            content: result.content,
            modelId: model.id,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            totalTokens: result.totalTokens,
          },
        });
        const consumed = await consumeTokens({
          userId,
          modelDbId: model.id,
          conversationId: conv!.id,
          messageId: assistantMsg.id,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          totalTokens: result.totalTokens,
        });
        await prisma.conversation.update({ where: { id: conv!.id }, data: { updatedAt: new Date(), modelId: model.id } });
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