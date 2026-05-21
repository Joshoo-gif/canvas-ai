declare module "@cedrugs/pdf-parse" {
  import type { Buffer } from "node:buffer";

  export interface PdfParseResult {
    text: string;
    numpages?: number;
    numrender?: number;
    info?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    version?: string;
  }

  export default function pdfParse(
    data: Buffer | Uint8Array | ArrayBuffer,
  ): Promise<PdfParseResult>;
}
