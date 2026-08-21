import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { ClientNotification } from "@/lib/notifications";
import { gateRequest } from "@/lib/rate-limit";

interface MarkReadBody {
  id?: unknown;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`notifications:${userId}`, "list");
  if (denied) return denied;

  const rows = await prisma.projectNotification.findMany({
    where: { userId },
    orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      projectId: true,
      projectName: true,
      type: true,
      createdAt: true,
      readAt: true,
    },
  });

  const notifications: ClientNotification[] = rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    projectName: row.projectName,
    type: row.type as ClientNotification["type"],
    createdAt: row.createdAt.toISOString(),
    read: row.readAt !== null,
  }));

  return NextResponse.json({ notifications });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = gateRequest(`notifications:${userId}`, "mutate");
  if (denied) return denied;

  let body: MarkReadBody;
  try {
    body = (await request.json()) as MarkReadBody;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  if (typeof body.id === "string") {
    await prisma.projectNotification.updateMany({
      where: { id: body.id, userId },
      data: { readAt: new Date() },
    });
  } else {
    await prisma.projectNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}