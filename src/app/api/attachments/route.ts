import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "storage", "uploads");
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set(["text/", "application/pdf", "application/zip", "application/x-zip-compressed", "image/", "application/json", "application/csv", "text/csv"]);

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "invalid form" }, { status: 400 });
  const file = form.get("file") as File | null;
  const conversationId = String(form.get("conversationId") || "");
  if (!file || !conversationId) return Response.json({ error: "file and conversationId required" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "file too large (25MB max)" }, { status: 413 });
  if (file.type && !Array.from(ALLOWED).some((p) => file.type.startsWith(p))) {
    return Response.json({ error: "unsupported file type" }, { status: 415 });
  }

  const conv = await prisma.conversation.findFirst({ where: { id: conversationId, userId } });
  if (!conv) return Response.json({ error: "conversation not found" }, { status: 404 });

  // quota 5GB
  const agg = await prisma.chatAttachment.aggregate({ where: { conversationId }, _sum: { sizeBytes: true } });
  if ((agg._sum.sizeBytes || 0) + file.size > 5 * 1024 * 1024 * 1024) {
    return Response.json({ error: "storage quota (5GB) exceeded" }, { status: 413 });
  }

  const id = crypto.randomUUID();
  const dir = path.join(ROOT, conversationId);
  await fs.mkdir(dir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedPath = path.join(dir, `${id}_${safeName}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storedPath, buffer);

  const att = await prisma.chatAttachment.create({
    data: {
      id,
      conversationId,
      userId,
      fileName: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
      storedPath,
    },
  });
  return Response.json(att);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const conversationId = new URL(req.url).searchParams.get("conversationId") || "";
  const list = await prisma.chatAttachment.findMany({ where: { userId, conversationId }, orderBy: { createdAt: "desc" } });
  return Response.json(list);
}