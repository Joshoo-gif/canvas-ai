# Canvas

Canvas is a workspace-oriented AI assistant for reading uploaded documents, inspecting structured artifacts, and carrying out real-time conversations inside a project workspace.

It is designed as an **agent workspace**, not a generic chat app:

- the left side of the UI is for files and artifacts,
- the right side is the command center for the AI assistant,
- uploads are extracted into normalized text lines,
- chat responses stream live,
- tool calls are surfaced in the UI so you can see when the agent is reading files or jumping to line ranges.

## What Canvas is for

Canvas helps users:

- create and manage isolated workspaces,
- upload documents into a workspace,
- inspect file contents in a structured viewer,
- chat with an AI agent about the current workspace,
- jump from AI tool usage directly to the referenced file and line range,
- keep a history of conversations per workspace.

The app is especially useful when you want an assistant to reason about project files, uploaded documents, or other workspace artifacts while keeping the interaction organized and auditable.

## Core capabilities

### Workspace management
- Create, list, and delete workspaces.
- Keep conversations scoped to a workspace.
- Maintain workspace state such as selected files, open artifacts, and UI preferences.

### File ingestion and artifact viewing
- Upload files into a workspace.
- Supported file types include:
  - `.txt`
  - `.md`
  - `.csv`
  - `.pdf`
  - `.docx`
- Uploaded files are parsed server-side into normalized text and line arrays.
- CSV files are normalized into a spreadsheet-like artifact view.
- Documents can be opened as tabs inside the artifact viewer.
- The viewer supports line highlighting and automatic scrolling to a referenced range.
- Workspace files can be opened, closed, selected, and deleted.

### AI chat and agent interaction
- Chat with an AI assistant inside the active workspace.
- Responses stream over Server-Sent Events so the UI updates incrementally.
- Conversations are persisted in Supabase.
- The assistant can invoke workspace tools to inspect the loaded files before answering.
- Tool calls and results are exposed in the UI as first-class events.
- Chat history is available per workspace.

### Workspace-level UX controls
- Split-pane layout with draggable resizing on desktop.
- Mobile-friendly workspace/chat tab switcher.
- Workspace settings for:
  - light or dark theme,
  - comfortable or compact density,
  - auto-scroll behavior,
  - line numbers,
  - font size.

## Running with Docker

Build and run the app on port `3075` with an always-restarting container:

```bash
docker compose up --build -d
```

The service listens on `http://localhost:3075`.

`docker compose` loads the root `.env` file into the container at runtime, so the app receives the same Supabase, OpenAI, and Canvas variables used in local development.

## Product structure

Canvas is organized around two major surfaces:

### 1. Artifact workspace
The artifact workspace is the left panel of the main screen. It contains:

- the file explorer,
- open artifact tabs,
- the text/spreadsheet viewer,
- upload entry points,
- file deletion actions,
- highlighted line-range navigation.

### 2. Command center
The command center is the right panel of the main screen. It contains:

- the agent status header,
- the message timeline,
- tool-call cards,
- the composer for sending new messages,
- access to chat history,
- a new-chat action.

## AI agent architecture

Canvas uses a multi-layer agent design.

### Prompt layer
The assistant prompt is stored in `src/prompts/assistant-persona.md` and loaded into the system prompt at runtime. This keeps the assistant’s identity and behavior rules separate from the rest of the application code.

The final system prompt is assembled in `src/lib/chat/system-prompt.ts` and includes workspace behavior rules such as:

- start by listing workspace artifacts when a workspace is available,
- use global search to orient yourself,
- use keyword location to find exact matches,
- use line-range reads for narrow inspection,
- never guess file contents when tools can inspect them directly.

### Tooling layer
Workspace tool definitions live in `src/lib/ai/workspace-tools.ts`.

The current tool set is intentionally read-oriented:

- `list_workspace_artifacts`
- `global_workspace_search`
- `locate_keyword_instances`
- `read_file_segments`

These tools allow the model to orient itself, search across the workspace, and inspect line ranges precisely before responding.

### Execution layer
The model streaming loop lives in `src/lib/chat/openai.ts`.

That layer:

1. builds the message list with system prompt, history, and the current user message,
2. requests a streamed completion from OpenAI,
3. captures token usage and finish reason,
4. collects tool-call deltas when the model requests workspace tools,
5. prepares and runs each tool invocation,
6. emits structured UI events for deltas, tool calls, and results,
7. returns the final assistant message payload and UI message metadata.

### API layer
The chat route (`src/app/api/chat/route.ts`) wraps the agent runtime in an SSE endpoint.

It is responsible for:

- validating the request body,
- checking the session,
- resolving the workspace,
- creating or reusing a conversation,
- storing the user message,
- streaming agent events to the client,
- persisting the assistant response after streaming completes.

### UI layer
The client UI renders the streamed conversation and the workspace viewer side by side.

Tool calls are not hidden inside the model response. Instead, they become visible cards/events that can be clicked to jump into the corresponding artifact and line range.

## System design

Canvas follows a layered architecture with a clear separation of concerns.

```mermaid
flowchart LR
  U[User] --> UI[Next.js App Router UI]
  UI --> WS[Workspace Shell]
  UI --> CC[Command Center]
  UI --> AV[Artifact Viewer]
  UI --> API[API Routes]
  API --> AUTH[Custom Auth + Sessions]
  API --> DB[(Supabase)]
  API --> OAI[OpenAI Streaming]
  OAI --> TOOLS[Workspace Tools]
  TOOLS --> DB
  TOOLS --> WF[Workspace File Search / Read]
  WF --> DB
```

### Frontend shell
The main page is `src/app/page.tsx`. It composes the application shell and coordinates:

- active workspace selection,
- open conversations,
- file loading,
- file upload,
- tool-click navigation,
- panel resizing,
- mobile tab switching,
- workspace settings.

The page itself remains an orchestration layer. The heavy UI work is split into focused feature components.

### Feature modules
The UI is broken into feature modules rather than one monolithic page:

- `ArtifactViewer` handles file browsing and document rendering,
- `CommandCenter` handles chat interaction and message streaming,
- `UploadModal` handles file intake and progress,
- `CreateWorkspaceModal` handles workspace creation,
- `ChatHistoryModal` handles conversation history,
- `SettingsModal` handles workspace preferences,
- `Sidebar` handles workspace navigation and controls.

### Data flow
Typical flow for a workspace session:

1. User logs in.
2. The app loads the user’s workspaces.
3. The user selects or creates a workspace.
4. Uploaded files are parsed and stored in Supabase.
5. The artifact viewer turns file rows into openable artifacts.
6. The user sends a prompt.
7. The chat route validates the request, loads history, and starts a streamed OpenAI response.
8. If the model calls a workspace tool, the tool reads from the current workspace data.
9. The UI renders streamed text and tool activity in real time.
10. Conversation messages are persisted for later history access.

## Authentication and session model

Canvas uses a custom authentication flow rather than a third-party auth provider.

### Sign up / sign in
- `src/app/api/auth/register/route.ts` creates users with hashed passwords.
- `src/app/api/auth/login/route.ts` verifies credentials and creates a session.
- `src/app/api/auth/logout/route.ts` clears the session.
- `src/app/api/auth/me/route.ts` returns the current authenticated user.

### Session storage
Sessions are stored in Supabase and tracked with an opaque HTTP-only cookie:

- cookie name: `canvas_session`
- token is hashed before being stored
- sessions expire after 30 days
- session validation happens server-side

This keeps the browser-facing token opaque while still allowing server-side session lookup.

## Data model

The schema is defined in the `sqls/` directory and mirrored by `src/lib/supabase/types.ts`.

### Tables

#### `users`
Stores registered users for the custom auth system.

#### `sessions`
Stores active login sessions as hashed opaque tokens.

#### `workspaces`
Stores workspace records for each user.

#### `conversations`
Stores one chat thread per workspace or conversation context.

#### `messages`
Stores user and assistant messages plus observability metadata:

- finish reason
- prompt token count
- completion token count

#### `workspace_files`
Stores uploaded workspace files and normalized content.

#### `workspace_file_lines`
Stores line-level content for parsed files.

#### `artifact_snapshots`
Stores rendered snapshot metadata for open artifacts.

## Environment variables

The app expects runtime credentials for its backend services.

At minimum, configure the values required by the auth, Supabase, and OpenAI integrations before starting the container.

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```
