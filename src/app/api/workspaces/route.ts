import { NextResponse, type NextRequest } from "next/server";
import { createWorkspace, listWorkspaces } from "@/lib/workspace/repository";

export const runtime = "nodejs";

function parseWorkspaceName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (!name) return null;
  if (name.length > 80) return null;
  return name;
}

import { getSessionUserId } from "@/lib/auth/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await listWorkspaces(userId);
  return NextResponse.json({ workspaces });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = parseWorkspaceName(
    typeof body === "object" && body !== null ? (body as { name?: unknown }).name : null,
  );

  if (!name) {
    return NextResponse.json(
      { error: "Workspace name is required." },
      { status: 400 },
    );
  }

  const workspace = await createWorkspace(name, userId);
  return NextResponse.json({ workspace }, { status: 201 });
}
