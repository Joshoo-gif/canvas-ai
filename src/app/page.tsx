"use client";

import {
  Folder,
  MessageSquare,
  Monitor,
  Plus,
  GripVertical,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ArtifactViewer, { type Artifact } from "@/components/ArtifactViewer";
import CommandCenter, { type ToolCall } from "@/components/CommandCenter";
import CreateWorkspaceModal from "@/components/CreateWorkspaceModal";
import Sidebar from "@/components/Sidebar";
import {
  DEFAULT_WORKSPACE_SETTINGS,
  type WorkspaceSettingUpdater,
  type WorkspaceSettings,
} from "@/components/workspaceSettings";
import { useChat } from "@/lib/chat/useChat";
import type { WorkspaceRow } from "@/lib/supabase/types";

const INITIAL_ARTIFACTS: Artifact[] = [
  {
    id: "specs",
    name: "project_specs.md",
    type: "code",
    content: [
      "# Canvas System Architecture Specification",
      "",
      "This document details the system design, dependencies, and execution model for Canvas agent workspace.",
      "",
      "## 1. System Objectives",
      "- Low-latency agent-to-workspace communication.",
      "- Granular control over file access and execution.",
      "- Responsive visual states for terminal output.",
      "",
      "## 2. Dependencies",
      "- Next.js 16 (React 19)",
      "- Tailwind CSS v4",
      "- Lucide React for visual representation",
      "",
      "## 3. Data Flow",
      "- UI State reflects active documents in Panel A.",
      "- Command log shows agent action sequences.",
      "- Direct memory mapping speeds up document loading by 40%.",
      "",
      "## 4. Execution Sandbox",
      "- Secure runtime environment isolated from host OS.",
      "- Pre-installed lint checking via Biome compiler.",
    ],
  },
  {
    id: "research",
    name: "research_paper.pdf",
    type: "document",
    content: [
      "ATTENTION MECHANICS IN MULTI-AGENT CONSENSUS",
      "Abstract: We explore communication loops between generative agents.",
      "",
      "1. Introduction",
      "Multi-agent networks have recently demonstrated high utility in code production.",
      "However, consensus requires synchronized execution vectors.",
      "",
      "2. The Consensus Protocol",
      "We define consensus as a function C(A, E) where:",
      "  A is the agent action state.",
      "  E is the environment context vector.",
      "",
      "3. Mathematical Foundations",
      "Let attention matrices be normalized across the local workspace layers.",
      "This minimizes divergence and aligns task goals.",
      "",
      "4. Experimental Results",
      "Our tests show a 40% speedup in convergence time when deploying direct memory maps.",
      "Furthermore, execution conflicts are mitigated by 65% with locks.",
    ],
  },
  {
    id: "financials",
    name: "financials.csv",
    type: "sheet",
    content: [
      "Quarter,Revenue,Expenses,Profit,Growth",
      "Q1 2026,120000,85000,35000,+4.5%",
      "Q2 2026,145000,92000,53000,+20.8%",
      "Q3 2026,170000,105000,65000,+17.2%",
      "Q4 2026,210000,118000,92000,+23.5%",
      "Total 2026,645000,400000,245000,+16.5%",
    ],
  },
];

export default function WorkspacePage() {
  const [collapsed, setCollapsed] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null,
  );
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);

  // Resizable panel — chat width as % of the content area (22–65%)
  const [chatWidthPct, setChatWidthPct] = useState(38);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      const offsetFromRight = rect.right - ev.clientX;
      const newPct = Math.min(65, Math.max(22, (offsetFromRight / totalWidth) * 100));
      setChatWidthPct(newPct);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const [openArtifacts, setOpenArtifacts] =
    useState<Artifact[]>(INITIAL_ARTIFACTS);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(
    "specs",
  );
  const [highlightedRange, setHighlightedRange] = useState<{
    startLine: number;
    endLine: number;
  } | null>(null);
  const [agentStatus, setAgentStatus] = useState(
    "Create a workspace to start chatting.",
  );
  const [settings, setSettings] = useState<WorkspaceSettings>(() => ({
    ...DEFAULT_WORKSPACE_SETTINGS,
  }));

  // Mobile Tab view: 'workspace' or 'chat'
  const [mobileActiveTab, setMobileActiveTab] = useState<"workspace" | "chat">(
    "workspace",
  );

  const updateSetting: WorkspaceSettingUpdater = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const { messages, isStreaming, sendMessage } = useChat({
    workspaceId: activeWorkspaceId,
    onStatusChange: setAgentStatus,
  });

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/workspaces");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const payload: { workspaces: WorkspaceRow[] } = await response.json();
        if (cancelled) return;

        const nextWorkspaces = payload.workspaces ?? [];
        setWorkspaces(nextWorkspaces);
        setActiveWorkspaceId((current) => {
          if (current && nextWorkspaces.some((workspace) => workspace.id === current)) {
            return current;
          }
          return nextWorkspaces[0]?.id ?? null;
        });
      } catch (error) {
        if (cancelled) return;

        setWorkspaces([]);
        setActiveWorkspaceId(null);
        setAgentStatus(
          error instanceof Error
            ? `Failed to load workspaces: ${error.message}`
            : "Failed to load workspaces.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleWorkspaceSelect = useCallback((workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    setMobileActiveTab("chat");
  }, []);

  const handleCreateWorkspace = useCallback(async (name: string) => {
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorBody: { error?: string } = await response.json().catch(() => ({}));
      throw new Error(errorBody.error ?? `HTTP ${response.status}: ${response.statusText}`);
    }

    const payload: { workspace: WorkspaceRow } = await response.json();
    setWorkspaces((current) => [
      payload.workspace,
      ...current.filter((workspace) => workspace.id !== payload.workspace.id),
    ]);
    setActiveWorkspaceId(payload.workspace.id);
    setCreateWorkspaceOpen(false);
    setMobileActiveTab("chat");
    setAgentStatus("Workspace Ready");
  }, []);

  // Highlight specific range when clicking a tool call log
  const handleToolCallClick = (toolCall: ToolCall) => {
    if (toolCall.range) {
      // Find matching artifact
      const art = openArtifacts.find(
        (a) => a.name.toLowerCase() === toolCall.target.toLowerCase(),
      );
      if (art) {
        setActiveArtifactId(art.id);
        setHighlightedRange(toolCall.range);
        setAgentStatus(
          `Agent Inspecting Lines ${toolCall.range.startLine}-${toolCall.range.endLine}`,
        );

        // On mobile, switch to workspace view to see the highlighted file
        setMobileActiveTab("workspace");
      }
    }
  };

  const handleSendMessage = useCallback(
    async (text: string) => {
      await sendMessage(text);
    },
    [sendMessage],
  );

  const handleCloseArtifact = (id: string) => {
    const nextArtifacts = openArtifacts.filter((a) => a.id !== id);
    setOpenArtifacts(nextArtifacts);
    if (activeArtifactId === id) {
      setActiveArtifactId(
        nextArtifacts.length > 0 ? nextArtifacts[0].id : null,
      );
      setHighlightedRange(null);
    }
  };

  const handleDeployFiles = () => {
    setOpenArtifacts(INITIAL_ARTIFACTS);
    setActiveArtifactId("specs");
    setHighlightedRange(null);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset highlighted range when changing active tab
  useEffect(() => {
    setHighlightedRange(null);
  }, [activeArtifactId]);

  const isDark = settings.theme === "dark";
  const shellClass = isDark
    ? "bg-[#111111] text-[#FAFAF9]"
    : "bg-[#F5F5F4] text-[#0A0A0A]";
  const mobileHeaderClass = isDark
    ? "border-[#404040] bg-[#171717]"
    : "border-[#E7E5E4] bg-white";
  const mobileSwitcherClass = isDark
    ? "border-[#404040] bg-[#262626]"
    : "border-[#E7E5E4] bg-[#F5F5F4]";
  const mobileActiveClass = isDark
    ? "bg-[#FAFAF9] text-[#171717]"
    : "bg-[#0A0A0A] text-white";
  const mobileInactiveClass = isDark ? "text-[#A8A29E]" : "text-[#737373]";
  const mobileLogoClass = isDark
    ? "bg-[#FAFAF9] text-[#171717]"
    : "bg-[#0A0A0A] text-white";

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${shellClass}`}>
      {/* Sidebar - Collapsible navigation on larger screens, hidden or absolute drawer on mobile */}
      <div className="hidden md:flex h-full">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          activeWorkspaceId={activeWorkspaceId}
          setActiveWorkspaceId={handleWorkspaceSelect}
          workspaces={workspaces}
          onCreateWorkspace={() => setCreateWorkspaceOpen(true)}
          settings={settings}
          onSettingChange={updateSetting}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header / Workspace Switcher tabs */}
        <header
          className={`flex md:hidden h-14 items-center justify-between px-4 shrink-0 border-b ${mobileHeaderClass}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${mobileLogoClass}`}
            >
              <Folder className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight">
                Canvas
              </div>
              <div className="truncate text-[11px] text-[#737373]">
                {activeWorkspace?.name ?? "No workspace selected"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center rounded-full border p-0.5 ${mobileSwitcherClass}`}
            >
              <button
                type="button"
                onClick={() => setMobileActiveTab("workspace")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  mobileActiveTab === "workspace"
                    ? mobileActiveClass
                    : mobileInactiveClass
                }`}
              >
                <Monitor className="h-3 w-3" />
                Workspace
              </button>
              <button
                type="button"
                onClick={() => setMobileActiveTab("chat")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  mobileActiveTab === "chat"
                    ? mobileActiveClass
                    : mobileInactiveClass
                }`}
              >
                <MessageSquare className="h-3 w-3" />
                Chat
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCreateWorkspaceOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E7E5E4] bg-white text-[#101011] transition-colors hover:bg-[#F4F4F5]"
              aria-label="Create workspace"
              title="Create workspace"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Workspace Split Panels */}
        <div ref={containerRef} className="flex-1 flex min-h-0 relative">
          {/* Panel A (Artifact Workspace) */}
          <div
            className={`h-full min-h-0 min-w-0 ${
              mobileActiveTab === "workspace"
                ? "flex flex-col flex-1"
                : "hidden md:flex md:flex-col"
            }`}
            style={{ width: `${100 - chatWidthPct}%` }}
          >
            <ArtifactViewer
              openArtifacts={openArtifacts}
              activeArtifactId={activeArtifactId}
              setActiveArtifactId={setActiveArtifactId}
              closeArtifact={handleCloseArtifact}
              highlightedRange={highlightedRange}
              onDeployFiles={handleDeployFiles}
              settings={settings}
            />
          </div>

          {/* Drag-to-resize divider (desktop only) */}
          <div
            onMouseDown={startResize}
            className={`hidden md:flex relative z-10 w-[5px] shrink-0 cursor-col-resize items-center justify-center group select-none ${
              isDark
                ? "bg-[#1A1A1A] hover:bg-[#262626]"
                : "bg-[#EDEBE9] hover:bg-[#E0DEDC]"
            } transition-colors duration-150`}
            role="separator"
            aria-label="Resize panels"
            title="Drag to resize"
          >
            <GripVertical
              className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                isDark ? "text-[#A8A29E]" : "text-[#737373]"
              }`}
            />
          </div>


          {/* Panel B (Agent Command Center) */}
          <div
            className={`h-full min-h-0 ${
              mobileActiveTab === "chat"
                ? "flex flex-col flex-1"
                : "hidden md:flex md:flex-col"
            }`}
            style={{ width: `${chatWidthPct}%` }}
          >
            <CommandCenter
              messages={messages}
              agentStatus={agentStatus}
              onSendMessage={handleSendMessage}
              onToolCallClick={handleToolCallClick}
              settings={settings}
              isStreaming={isStreaming}
            />
          </div>
        </div>
      </div>

      <CreateWorkspaceModal
        open={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
        onCreate={handleCreateWorkspace}
      />
    </div>
  );
}
