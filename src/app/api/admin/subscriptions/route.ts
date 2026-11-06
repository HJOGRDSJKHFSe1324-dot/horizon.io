import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const list = await prisma.subscription.findMany({ orderBy: { createdAt: "desc" }, include: { user: true, plan: true } });
  return Response.json(list);
}