import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { model: true, messages: { take: 1, orderBy: { createdAt: "desc" } } },
  });
  return Response.json(conversations);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const body = await req.json().catch(() => ({}));
  const model = body?.modelSlug ? await prisma.model.findFirst({ where: { slug: body.modelSlug } }) : null;
  const conv = await prisma.conversation.create({
    data: { userId, modelId: model?.id || null, title: body?.title || "New conversation" },
  });
  return Response.json(conv);
}