import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects });
}

interface CreateProjectBody {
  id?: unknown;
  name?: unknown;
  description?: unknown;
}

const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,63}$/;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateProjectBody = {};
  try {
    body = (await request.json()) as CreateProjectBody;
  } catch {
    body = {};
  }

  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  const name = rawName.length > 0 ? rawName : "Untitled Project";
  const description =
    typeof body.description === "string" ? body.description : undefined;

  const rawId = typeof body.id === "string" ? body.id.trim() : "";
  if (rawId.length > 0 && !PROJECT_ID_PATTERN.test(rawId)) {
    return NextResponse.json(
      { error: "Invalid project id" },
      { status: 400 },
    );
  }

  const project = await prisma.project.create({
    data: {
      ...(rawId.length > 0 ? { id: rawId } : {}),
      ownerId: userId,
      name,
      description,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
