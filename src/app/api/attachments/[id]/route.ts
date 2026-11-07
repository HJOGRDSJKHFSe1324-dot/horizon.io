import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const att = await prisma.chatAttachment.findFirst({ where: { id, userId } });
  if (!att) return new Response("Not found", { status: 404 });
  await prisma.chatAttachment.delete({ where: { id } });
  try { await fs.unlink(att.storedPath); } catch {}
  return Response.json({ ok: true });
}