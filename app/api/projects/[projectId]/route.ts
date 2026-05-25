import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

interface UpdateProjectBody {
  name?: unknown;
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;

  let body: UpdateProjectBody = {};
  try {
    body = (await request.json()) as UpdateProjectBody;
  } catch {
    body = {};
  }

  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  if (rawName.length === 0) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name: rawName },
  });

  return NextResponse.json({ project: updated });
}

export async function DELETE(_request: Request, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({ where: { id: projectId } });

  return NextResponse.json({ success: true });
}
