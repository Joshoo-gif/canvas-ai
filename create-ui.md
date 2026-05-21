# Phase 1 Blueprint: Frontend Workspace Shell (Next.js + Tailwind CSS)

## Objective
Build a clean, professional, non-educational web workspace named Canvas using Next.js, Tailwind CSS, and Lucide React icons. Avoid using emojis for the UI. The interface must resemble an advanced development workspace with a sidebar, an active document viewer, and a conversational control panel.

## Technical Architecture
*   Framework: Next.js (App Router or Pages Router preferred by user framework)
*   Styling: Tailwind CSS (Clean, minimalist layout, neutral grays, slate, or dark mode palette)
*   Icons: `lucide-react` (Strictly no emojis)
*   State Management: React Context or local useState hooks to track active files, workspace items, and messaging history.

## UI Layout Specifications

### 1. Root Layout & Navigation Sidebar (Left, 60px - 240px)
*   A sleek sidebar navigation tracking current workspaces.
*   Use standard engineering icons: FolderIcon, LayoutDashboardIcon, SettingsIcon, CompassIcon.
*   Collapsible structure with an active state highlighter.

### 2. Main Workspace Split View (Center & Right)
Divide the screen into a classic split-view panel layout:

#### Panel A: The Artifact Viewer / File Workspace (Left Split, 60% Width)
This mimics the agent's virtual environment workspace.
*   **Top Bar:** Tabs tracking open artifacts (e.g., `research_paper.pdf`, `project_specs.md`, `financials.csv`). Use FileTextIcon or SheetIcon beside tab names. Close button (X) on active tabs.
*   **Main Container:** A simulated virtual environment viewer. Render content cleanly in a paper or editor layout.
*   **Range Highlighting UI:** The UI must support highlighting or styling specific line numbers or text ranges. When the agent reads specific lines, these lines should highlight visually to indicate active retrieval.
*   **Empty State:** When no file is open, show a clean, centered state with a FilePlusIcon and text: "Deploy or drop files into the workspace to begin analysis."

#### Panel B: The Agent Command Center (Right Split, 40% Width)
*   **Header:** Shows the name **Canvas** alongside a status indicator badge ("Agent Idle", "Agent Inspecting Lines 45-80", "Compiling Insights").
*   **Chat Output Thread:** A scrolling view displaying messages.
    *   *User Messages:* Styled distinctly, aligned to the right or clean margin.
    *   *Agent Messages:* Left-aligned. Instead of plain text summaries, it displays structured thought processes.
    *   *Tool Execution Logs:* Inline UI boxes tracking when the agent invokes tools. For example: a micro-card showing `[Tool Call] reading workspace/specs.md: lines 20-50...` with a loading spinner or green checkmark when complete.
*   **Input Box:** A sticky container at the bottom with a textarea for user prompts, a paperclip attachment icon (UploadIcon), and a SendIcon button.

## Mock Interaction State Setup
Initialize the application with the following mock states so the UI looks complete before backend integration:
*   Three uploaded artifacts visible in the sidebar/tabs list.
*   A mock message stream detailing a query and the agent successfully running a read tool on a document.
*   Ensure absolute responsiveness, utilizing overflow-y handling for both panels independently so the viewport never breaks.