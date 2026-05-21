declare module "mammoth" {
  import type { Buffer } from "node:buffer";

  export interface RawTextMessage {
    type: "warning" | "error";
    message: string;
    error?: Error;
  }

  export interface RawTextResult {
    value: string;
    messages: RawTextMessage[];
  }

  export interface RawTextInput {
    buffer?: Buffer;
    path?: string;
  }

  export function extractRawText(
    input: RawTextInput,
  ): Promise<RawTextResult>;
}
