"use client";

import {
  Folder,
  GripVertical,
  MessageSquare,
  Monitor,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ArtifactViewer, { type Artifact } from "@/components/ArtifactViewer";
import CommandCenter, { type ToolCall } from "@/components/CommandCenter";
import ChatHistoryModal from "@/components/CommandCenter/ChatHistoryModal";
import CreateWorkspaceModal from "@/components/CreateWorkspaceModal";
import Sidebar from "@/components/Sidebar";
import UploadModal from "@/components/UploadModal";
import {
  DEFAULT_WORKSPACE_SETTINGS,
  type WorkspaceSettingUpdater,
  type WorkspaceSettings,
} from "@/components/workspaceSettings";
import { useChat } from "@/lib/chat/useChat";
import {
  listWorkspaceFiles,
  uploadWorkspaceFile,
  deleteWorkspaceFile,
} from "@/lib/workspace-files/client";
import { workspaceFilesToArtifacts, workspaceFileToArtifact } from "@/lib/workspace-files/mappers";
import type { WorkspaceRow, WorkspaceFileRow } from "@/lib/supabase/types";

function toArtifactMap(files: WorkspaceFileRow[]): Artifact[] {
  return workspaceFilesToArtifacts(files);
}

export default function WorkspacePage() {
  const [collapsed, setCollapsed] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null,
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingUploadAfterWorkspaceCreate, setPendingUploadAfterWorkspaceCreate] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFileRow[]>([]);
  const [openArtifacts, setOpenArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
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
  const [mobileActiveTab, setMobileActiveTab] = useState<"workspace" | "chat">(
    "workspace",
  );

  const [chatWidthPct, setChatWidthPct] = useState(38);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      const offsetFromRight = rect.right - ev.clientX;
      const newPct = Math.min(
        65,
        Math.max(22, (offsetFromRight / totalWidth) * 100),
      );
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

  const updateSetting: WorkspaceSettingUpdater = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const { messages, isStreaming, sendMessage, conversationId: hookConversationId } = useChat({
    workspaceId: activeWorkspaceId,
    conversationId: activeConversationId,
    onStatusChange: setAgentStatus,
  });

  const actualConversationId = hookConversationId ?? activeConversationId;

  const handleNewChat = useCallback(() => {
    setActiveConversationId("new");
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

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
          if (
            current &&
            nextWorkspaces.some((workspace) => workspace.id === current)
          ) {
            return current;
          }
          setActiveConversationId(null);
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

  useEffect(() => {
    let cancelled = false;

    if (!activeWorkspaceId) {
      setWorkspaceFiles([]);
      setOpenArtifacts([]);
      setActiveArtifactId(null);
      return;
    }

    void (async () => {
      try {
        const files = await listWorkspaceFiles(activeWorkspaceId);
        if (cancelled) return;

        setWorkspaceFiles(files);
        setOpenArtifacts([]);
        setActiveArtifactId(null);
      } catch (error) {
        if (cancelled) return;

        setWorkspaceFiles([]);
        setOpenArtifacts([]);
        setActiveArtifactId(null);
        setAgentStatus(
          error instanceof Error
            ? `Failed to load workspace files: ${error.message}`
            : "Failed to load workspace files.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId]);

  const handleWorkspaceSelect = useCallback((workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    setActiveConversationId(null);
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
    setActiveConversationId(null);
    setWorkspaceFiles([]);
    setOpenArtifacts([]);
    setActiveArtifactId(null);
    setCreateWorkspaceOpen(false);
    if (pendingUploadAfterWorkspaceCreate) {
      setPendingUploadAfterWorkspaceCreate(false);
      setUploadModalOpen(true);
    }
    setMobileActiveTab("chat");
    setAgentStatus("Workspace ready.");
  }, [pendingUploadAfterWorkspaceCreate]);

  const handleCloseCreateWorkspace = useCallback(() => {
    setCreateWorkspaceOpen(false);
    setPendingUploadAfterWorkspaceCreate(false);
  }, []);

  const handleDeleteWorkspace = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorBody: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(errorBody.error ?? `HTTP ${response.status}: ${response.statusText}`);
      }

      setWorkspaces((current) => {
        const updated = current.filter((workspace) => workspace.id !== id);
        if (activeWorkspaceId === id) {
          setActiveWorkspaceId(updated.length > 0 ? updated[0].id : null);
          setActiveConversationId(null);
        }
        return updated;
      });
      setAgentStatus("Workspace deleted successfully.");
    } catch (error) {
      setAgentStatus(
        error instanceof Error ? `Failed to delete workspace: ${error.message}` : "Failed to delete workspace."
      );
    }
  }, [activeWorkspaceId]);

  const handleToolCallClick = (toolCall: ToolCall) => {
    const artifactFromId = toolCall.artifactId
      ? workspaceFiles.find((file) => file.id === toolCall.artifactId)
      : null;
    const artifact =
      artifactFromId ??
      workspaceFiles.find(
        (file) => file.original_name.toLowerCase() === toolCall.target.toLowerCase(),
      );

    if (!artifact) return;

    handleOpenArtifact(artifact);

    if (toolCall.range) {
      setHighlightedRange(toolCall.range);
    }
    setAgentStatus(
      toolCall.range
        ? `Inspecting lines ${toolCall.range.startLine}-${toolCall.range.endLine}`
        : `Inspecting ${toolCall.name}`,
    );
    setMobileActiveTab("workspace");
  };

  const handleSendMessage = useCallback(
    async (text: string) => {
      await sendMessage(text);
    },
    [sendMessage],
  );

  const handleCloseArtifact = (id: string) => {
    const nextArtifacts = openArtifacts.filter((artifact) => artifact.id !== id);
    setOpenArtifacts(nextArtifacts);

    if (activeArtifactId === id) {
      setActiveArtifactId(nextArtifacts[0]?.id ?? null);
      setHighlightedRange(null);
    }
  };

  /** Open a file from the file explorer (add it to open artifacts if not already) */
  const handleOpenArtifact = useCallback((file: WorkspaceFileRow) => {
    const artifact = workspaceFileToArtifact(file);
    setOpenArtifacts((current) => {
      if (current.some((a) => a.id === artifact.id)) return current;
      return [artifact, ...current];
    });
    setActiveArtifactId(artifact.id);
    setHighlightedRange(null);
    setMobileActiveTab("workspace");
  }, []);

  const openUploadModal = useCallback(() => {
    if (!activeWorkspaceId) {
      setPendingUploadAfterWorkspaceCreate(true);
      setCreateWorkspaceOpen(true);
      setAgentStatus("Create a workspace first, then upload your file.");
      return;
    }
    setUploadModalOpen(true);
  }, [activeWorkspaceId]);

  /** Called by UploadModal — uploads a single file and updates state */
  const handleUpload = useCallback(
    async (file: File) => {
      if (!activeWorkspaceId) throw new Error("No workspace selected.");

      const savedFile = await uploadWorkspaceFile(activeWorkspaceId, file);
      const nextArtifact = workspaceFileToArtifact(savedFile);

      setWorkspaceFiles((current) => [
        savedFile,
        ...current.filter((item) => item.id !== savedFile.id),
      ]);
      setAgentStatus(`Uploaded ${savedFile.original_name}`);
    },
    [activeWorkspaceId],
  );

  const handleDeleteFile = useCallback(
    async (fileId: string) => {
      if (!activeWorkspaceId) return;
      try {
        await deleteWorkspaceFile(activeWorkspaceId, fileId);
        setWorkspaceFiles((current) => current.filter((file) => file.id !== fileId));
        handleCloseArtifact(fileId);
        setAgentStatus("File deleted successfully.");
      } catch (error) {
        setAgentStatus(
          error instanceof Error ? `Failed to delete file: ${error.message}` : "Failed to delete file."
        );
      }
    },
    [activeWorkspaceId, handleCloseArtifact],
  );

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
      <div className="hidden h-full md:flex">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          activeWorkspaceId={activeWorkspaceId}
          setActiveWorkspaceId={handleWorkspaceSelect}
          workspaces={workspaces}
          onCreateWorkspace={() => setCreateWorkspaceOpen(true)}
          settings={settings}
          onSettingChange={updateSetting}
          onDeleteWorkspace={handleDeleteWorkspace}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={`flex h-14 shrink-0 items-center justify-between border-b px-4 md:hidden ${mobileHeaderClass}`}
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

        <div ref={containerRef} className="relative flex min-h-0 flex-1">
          <div
            className={`min-h-0 min-w-0 ${
              mobileActiveTab === "workspace"
                ? "flex flex-1 flex-col"
                : "hidden md:flex md:flex-col"
            }`}
            style={{ width: `${100 - chatWidthPct}%` }}
          >
            <ArtifactViewer
              openArtifacts={openArtifacts}
              workspaceFiles={workspaceFiles}
              fileCount={workspaceFiles.length}
              activeArtifactId={activeArtifactId}
              setActiveArtifactId={setActiveArtifactId}
              closeArtifact={handleCloseArtifact}
              openArtifact={handleOpenArtifact}
              highlightedRange={highlightedRange}
              onUploadFiles={openUploadModal}
              onDeleteFile={handleDeleteFile}
              settings={settings}
            />
          </div>

          <div
            onMouseDown={startResize}
            className={`group relative z-10 hidden w-[5px] shrink-0 cursor-col-resize select-none items-center justify-center transition-colors duration-150 md:flex ${
              isDark
                ? "bg-[#1A1A1A] hover:bg-[#262626]"
                : "bg-[#EDEBE9] hover:bg-[#E0DEDC]"
            }`}
            role="separator"
            aria-label="Resize panels"
            title="Drag to resize"
          >
            <GripVertical
              className={`h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 ${
                isDark ? "text-[#A8A29E]" : "text-[#737373]"
              }`}
            />
          </div>

          <div
            className={`min-h-0 ${
              mobileActiveTab === "chat"
                ? "flex flex-1 flex-col"
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
              onNewChat={handleNewChat}
              onOpenHistory={() => setHistoryModalOpen(true)}
            />
          </div>
        </div>
      </div>

      <CreateWorkspaceModal
        open={createWorkspaceOpen}
        onClose={handleCloseCreateWorkspace}
        onCreate={handleCreateWorkspace}
      />

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUpload}
        isDark={isDark}
      />

      <ChatHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        workspaceId={activeWorkspaceId}
        onSelectConversation={handleSelectConversation}
        isDark={isDark}
        activeConversationId={actualConversationId}
        onActiveConversationDeleted={handleNewChat}
      />
    </div>
  );
}
