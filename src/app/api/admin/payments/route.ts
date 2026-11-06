import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const payments = await prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: true, plan: true } });
  return Response.json(payments);
}