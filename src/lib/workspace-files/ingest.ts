import { Buffer } from "node:buffer";
import pdfParse from "@cedrugs/pdf-parse";
import mammoth from "mammoth";
import { parseCsvRows, serializeCsvRows } from "./csv";
import {
  inferWorkspaceFileExtension,
  MAX_WORKSPACE_FILE_BYTES,
  isSupportedWorkspaceFileLike,
  type WorkspaceFileExtension,
} from "./validation";

export interface ParsedWorkspaceFile {
  originalName: string;
  mimeType: string;
  extension: WorkspaceFileExtension;
  byteSize: number;
  extractedText: string;
  extractedLines: string[];
  lineCount: number;
}

function normalizeTextInput(text: string): string {
  return text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function replaceLoneSurrogates(value: string): string {
  let output = "";

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        output += value[index] + value[index + 1];
        index += 1;
      } else {
        output += "\uFFFD";
      }
      continue;
    }

    if (code >= 0xdc00 && code <= 0xdfff) {
      output += "\uFFFD";
      continue;
    }

    output += value[index];
  }

  return output;
}

function sanitizeWorkspaceText(value: string): string {
  const normalized = normalizeTextInput(value).replace(/\u0000/g, "");
  if (typeof normalized.toWellFormed === "function") {
    return normalized.toWellFormed();
  }
  return replaceLoneSurrogates(normalized);
}

function textToLines(text: string): string[] {
  const normalized = sanitizeWorkspaceText(text);
  if (normalized.length === 0) return [];

  const lines = normalized.split("\n");
  let start = 0;
  let end = lines.length - 1;

  while (start <= end && lines[start].trim().length === 0) {
    start += 1;
  }

  while (end >= start && lines[end].trim().length === 0) {
    end -= 1;
  }

  return lines.slice(start, end + 1);
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return sanitizeWorkspaceText(result.text ?? "");
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return sanitizeWorkspaceText(result.value ?? "");
}

function extractPlainText(buffer: Buffer): string {
  return sanitizeWorkspaceText(buffer.toString("utf8"));
}

function extractCsvText(buffer: Buffer): string {
  const rows = parseCsvRows(buffer.toString("utf8"));
  return serializeCsvRows(rows).join("\n");
}

export async function parseWorkspaceUpload(file: {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}): Promise<ParsedWorkspaceFile> {
  if (!isSupportedWorkspaceFileLike(file)) {
    throw new Error(
      "Unsupported file type. Please upload a txt, md, csv, pdf, or docx file under 20 MB.",
    );
  }

  if (file.size > MAX_WORKSPACE_FILE_BYTES) {
    throw new Error("File is too large. Maximum file size is 20 MB.");
  }

  const extension = inferWorkspaceFileExtension(file.name, file.type);
  if (!extension) {
    throw new Error("Could not determine the file type.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let extractedText: string;
  switch (extension) {
    case "csv":
      extractedText = extractCsvText(buffer);
      break;
    case "docx":
      extractedText = await extractDocxText(buffer);
      break;
    case "pdf":
      extractedText = await extractPdfText(buffer);
      break;
    case "md":
    case "txt":
    default:
      extractedText = extractPlainText(buffer);
      break;
  }

  const extractedLines = textToLines(extractedText);
  const cleanedExtractedText = extractedLines.join("\n");

  return {
    originalName: sanitizeWorkspaceText(file.name),
    mimeType: sanitizeWorkspaceText(file.type || "application/octet-stream"),
    extension,
    byteSize: file.size,
    extractedText: cleanedExtractedText,
    extractedLines,
    lineCount: extractedLines.length,
  };
}
