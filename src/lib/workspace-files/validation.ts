export const SUPPORTED_WORKSPACE_FILE_EXTENSIONS = [
  "txt",
  "md",
  "pdf",
  "docx",
] as const;

export type WorkspaceFileExtension =
  (typeof SUPPORTED_WORKSPACE_FILE_EXTENSIONS)[number];

const EXTENSION_BY_MIME: Readonly<Record<string, WorkspaceFileExtension>> = {
  "text/plain": "txt",
  "text/markdown": "md",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

const MIME_BY_EXTENSION: Readonly<Record<WorkspaceFileExtension, string[]>> = {
  txt: ["text/plain"],
  md: ["text/markdown", "text/plain"],
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export const MAX_WORKSPACE_FILE_BYTES = 20 * 1024 * 1024;

export const WORKSPACE_FILE_ACCEPT = [
  ".txt",
  ".md",
  ".pdf",
  ".docx",
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
].join(",");

export function normalizeWorkspaceFileExtension(
  fileName: string,
): WorkspaceFileExtension | null {
  const match = fileName.trim().toLowerCase().match(/\.([^.\\/]+)$/);
  const ext = match?.[1];
  if (!ext) return null;
  return SUPPORTED_WORKSPACE_FILE_EXTENSIONS.includes(ext as WorkspaceFileExtension)
    ? (ext as WorkspaceFileExtension)
    : null;
}

export function inferWorkspaceFileExtension(
  fileName: string,
  mimeType: string,
): WorkspaceFileExtension | null {
  const extension = normalizeWorkspaceFileExtension(fileName);
  if (extension) return extension;
  return EXTENSION_BY_MIME[mimeType] ?? null;
}

export function isSupportedWorkspaceFileMimeType(mimeType: string): boolean {
  return Object.prototype.hasOwnProperty.call(EXTENSION_BY_MIME, mimeType);
}

export function isSupportedWorkspaceFileExtension(
  extension: string,
): extension is WorkspaceFileExtension {
  return SUPPORTED_WORKSPACE_FILE_EXTENSIONS.includes(
    extension as WorkspaceFileExtension,
  );
}

export function isSupportedWorkspaceFileLike(input: {
  name: string;
  type: string;
  size: number;
}): boolean {
  if (input.size <= 0 || input.size > MAX_WORKSPACE_FILE_BYTES) {
    return false;
  }

  const extension = inferWorkspaceFileExtension(input.name, input.type);
  if (!extension) return false;

  return MIME_BY_EXTENSION[extension].includes(input.type) || input.type === "";
}

export function supportedWorkspaceFileLabel(): string {
  return SUPPORTED_WORKSPACE_FILE_EXTENSIONS.join(", ");
}
