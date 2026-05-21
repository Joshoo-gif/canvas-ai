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

export async function GET() {
  const workspaces = await listWorkspaces();
  return NextResponse.json({ workspaces });
}

export async function POST(req: NextRequest) {
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

  const workspace = await createWorkspace(name);
  return NextResponse.json({ workspace }, { status: 201 });
}
