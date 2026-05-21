import { NextResponse } from "next/server";
import { findWorkspaceById } from "@/lib/workspace/repository";
import {
  createWorkspaceFile,
  listWorkspaceFiles,
} from "@/lib/workspace-files/repository";
import { parseWorkspaceUpload } from "@/lib/workspace-files/ingest";

export const runtime = "nodejs";

interface WorkspaceFilesRouteContext {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(_: Request, context: WorkspaceFilesRouteContext) {
  const { workspaceId } = await context.params;
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const files = await listWorkspaceFiles(workspaceId);
  return NextResponse.json({ files });
}

export async function POST(req: Request, context: WorkspaceFilesRouteContext) {
  const { workspaceId } = await context.params;
  const workspace = await findWorkspaceById(workspaceId);

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  try {
    const parsed = await parseWorkspaceUpload(file);
    const savedFile = await createWorkspaceFile({
      workspace_id: workspaceId,
      original_name: parsed.originalName,
      mime_type: parsed.mimeType,
      extension: parsed.extension,
      byte_size: parsed.byteSize,
      extracted_text: parsed.extractedText,
      extracted_lines: parsed.extractedLines,
      line_count: parsed.lineCount,
      processing_status: "ready",
      error_message: null,
    });

    return NextResponse.json({ file: savedFile }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process upload.",
      },
      { status: 400 },
    );
  }
}
