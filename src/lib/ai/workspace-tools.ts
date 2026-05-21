import { z } from "zod";
import {
  globalWorkspaceSearch,
  listWorkspaceArtifacts,
  locateKeywordInstances,
  readFileSegments,
  type FileSegmentResult,
  type KeywordLocationResult,
  type WorkspaceArtifactSummary,
  type WorkspaceSearchHit,
} from "@/lib/workspace-files/search";

export type WorkspaceToolName =
  | "list_workspace_artifacts"
  | "global_workspace_search"
  | "locate_keyword_instances"
  | "read_file_segments";

export interface WorkspaceToolDescriptor {
  name: WorkspaceToolName;
  target: string;
  artifactId?: string;
  range?: { startLine: number; endLine: number };
}

export interface PreparedWorkspaceToolInvocation {
  descriptor: WorkspaceToolDescriptor;
  run: () => Promise<string>;
}

const listWorkspaceArtifactsSchema = z.object({});

const globalWorkspaceSearchSchema = z.object({
  query: z.string().trim().min(1).max(256),
});

const locateKeywordInstancesSchema = z.object({
  artifactId: z.string().trim().min(1),
  keyword: z.string().trim().min(1).max(256),
});

const readFileSegmentsSchema = z
  .object({
    artifactId: z.string().trim().min(1),
    startLine: z.number().int().positive(),
    endLine: z.number().int().positive(),
  })
  .refine((value) => value.endLine >= value.startLine, {
    message: "endLine must be greater than or equal to startLine.",
  })
  .refine((value) => value.endLine - value.startLine + 1 <= 250, {
    message: "Line ranges must be 250 lines or fewer.",
  });

export const workspaceToolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "list_workspace_artifacts",
      description:
        "Retrieves a clean directory listing of every loaded file artifact in the active workspace. Use this first to orient yourself before inspecting documents.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "global_workspace_search",
      description:
        "Performs a global text search across every loaded file artifact in the active workspace and returns match counts per document.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The exact term or phrase to search for.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "locate_keyword_instances",
      description:
        "Finds every line number and short snippet containing a keyword within one target file artifact.",
      parameters: {
        type: "object",
        properties: {
          artifactId: {
            type: "string",
            description: "The artifact UUID to inspect.",
          },
          keyword: {
            type: "string",
            description: "The exact keyword or phrase to locate.",
          },
        },
        required: ["artifactId", "keyword"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_file_segments",
      description:
        "Reads an exact line range from one target file artifact. Keep ranges under 250 lines per call.",
      parameters: {
        type: "object",
        properties: {
          artifactId: {
            type: "string",
            description: "The artifact UUID to inspect.",
          },
          startLine: {
            type: "number",
            description: "The 1-indexed starting line number.",
          },
          endLine: {
            type: "number",
            description: "The 1-indexed ending line number.",
          },
        },
        required: ["artifactId", "startLine", "endLine"],
        additionalProperties: false,
      },
    },
  },
] as const;

function stringifyJson(value: unknown): string {
  return JSON.stringify(value);
}

function summarizeArtifacts(artifacts: WorkspaceArtifactSummary[]): string {
  return stringifyJson({ artifacts });
}

function summarizeSearchResults(
  query: string,
  matches: WorkspaceSearchHit[],
): string {
  return stringifyJson({ query, matches });
}

function summarizeKeywordLocations(result: KeywordLocationResult): string {
  return stringifyJson(result);
}

function summarizeFileSegments(result: FileSegmentResult): string {
  return stringifyJson(result);
}

function buildWorkspaceDescription(name: string): string {
  return name;
}

export async function prepareWorkspaceToolInvocation(
  workspaceId: string,
  toolName: WorkspaceToolName,
  rawArguments: unknown,
): Promise<PreparedWorkspaceToolInvocation> {
  switch (toolName) {
    case "list_workspace_artifacts": {
      const parsed = listWorkspaceArtifactsSchema.parse(rawArguments);
      void parsed;

      return {
        descriptor: {
          name: toolName,
          target: buildWorkspaceDescription("active workspace"),
        },
        run: async () => summarizeArtifacts(await listWorkspaceArtifacts(workspaceId)),
      };
    }

    case "global_workspace_search": {
      const parsed = globalWorkspaceSearchSchema.parse(rawArguments);
      return {
        descriptor: {
          name: toolName,
          target: parsed.query,
        },
        run: async () => summarizeSearchResults(
          parsed.query,
          await globalWorkspaceSearch(workspaceId, parsed.query),
        ),
      };
    }

    case "locate_keyword_instances": {
      const parsed = locateKeywordInstancesSchema.parse(rawArguments);
      const result = await locateKeywordInstances(
        workspaceId,
        parsed.artifactId,
        parsed.keyword,
      );

      return {
        descriptor: {
          name: toolName,
          target: result.fileName,
          artifactId: result.artifactId,
          range:
            result.instances[0]?.lineNumber != null
              ? {
                  startLine: result.instances[0].lineNumber,
                  endLine: result.instances[0].lineNumber,
                }
              : undefined,
        },
        run: async () => summarizeKeywordLocations(result),
      };
    }

    case "read_file_segments": {
      const parsed = readFileSegmentsSchema.parse(rawArguments);
      const result = await readFileSegments(
        workspaceId,
        parsed.artifactId,
        parsed.startLine,
        parsed.endLine,
      );

      return {
        descriptor: {
          name: toolName,
          target: result.fileName,
          artifactId: result.artifactId,
          range: {
            startLine: result.startLine,
            endLine: result.endLine,
          },
        },
        run: async () => summarizeFileSegments(result),
      };
    }

    default: {
      const exhaustiveCheck: never = toolName;
      throw new Error(`Unsupported tool: ${exhaustiveCheck}`);
    }
  }
}
