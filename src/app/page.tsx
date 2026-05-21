"use client";

import {
  Compass,
  Folder,
  LayoutDashboard,
  MessageSquare,
  Monitor,
} from "lucide-react";
import { useEffect, useState } from "react";
import ArtifactViewer, { type Artifact } from "@/components/ArtifactViewer";
import CommandCenter, {
  type Message,
  type ToolCall,
} from "@/components/CommandCenter";
import Sidebar, { type WorkspaceItem } from "@/components/Sidebar";
import {
  DEFAULT_WORKSPACE_SETTINGS,
  type WorkspaceSettingUpdater,
  type WorkspaceSettings,
} from "@/components/workspaceSettings";
// Note: ArtifactViewer, CommandCenter, and SettingsModal are now folder modules
// with sub-components; imports above remain stable via index.tsx barrel files.

const WORKSPACES: WorkspaceItem[] = [
  { id: "dev", name: "Development Workspace", icon: Folder },
  { id: "research", name: "Consensus Research", icon: Compass },
  { id: "analytics", name: "Dashboard Analytics", icon: LayoutDashboard },
];

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

const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg-1",
    sender: "agent",
    text: "Welcome to Canvas. I have successfully initialized and indexed your workspace files.",
    timestamp: "12:10 PM",
    thoughts: [
      "Checking active directory structure...",
      "Found 3 artifacts: project_specs.md, research_paper.pdf, financials.csv.",
      "Ready to accept commands.",
    ],
  },
  {
    id: "msg-2",
    sender: "user",
    text: "Could you inspect the latest project specifications and let me know the dependencies?",
    timestamp: "12:11 PM",
  },
  {
    id: "msg-3",
    sender: "agent",
    text: "Analyzing project requirements. I will read the specifications file.",
    timestamp: "12:11 PM",
    thoughts: [
      "Locating file project_specs.md in workspace",
      "Executing read tool to examine section 2 (dependencies)",
    ],
    toolCall: {
      name: "view_file",
      target: "project_specs.md",
      range: { startLine: 10, endLine: 18 },
      status: "completed",
    },
  },
  {
    id: "msg-4",
    sender: "agent",
    text: "Based on lines 10-18 in project_specs.md, the dependencies are:\n\n- Next.js 16 (React 19)\n- Tailwind CSS v4\n- Lucide React for UI Icons",
    timestamp: "12:11 PM",
  },
];

export default function WorkspacePage() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("dev");
  const [openArtifacts, setOpenArtifacts] =
    useState<Artifact[]>(INITIAL_ARTIFACTS);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(
    "specs",
  );
  const [highlightedRange, setHighlightedRange] = useState<{
    startLine: number;
    endLine: number;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [agentStatus, setAgentStatus] = useState("Agent Idle");
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

  const handleSendMessage = (text: string) => {
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setAgentStatus("Compiling Insights...");

    // Simulate Agent response after a short delay
    setTimeout(() => {
      const lower = text.toLowerCase();
      let responseText =
        "I have reviewed your query and verified the current workspace state.";
      let thoughts = ["Analyzing prompt", "Evaluating files in directory"];
      let toolCall: ToolCall | undefined;

      if (
        lower.includes("financial") ||
        lower.includes("csv") ||
        lower.includes("revenue")
      ) {
        responseText =
          "I've checked the ledger inside financials.csv. The cumulative revenue for 2026 is $645,000, yielding a net profit of $245,000, with Q4 showing the strongest quarterly growth (+23.5%).";
        thoughts = [
          "Parsing financials.csv",
          "Summing quarterly rows",
          "Selecting cells in row 6 (Totals)",
        ];
        toolCall = {
          name: "view_file",
          target: "financials.csv",
          range: { startLine: 1, endLine: 6 },
          status: "completed",
        };
      } else if (
        lower.includes("paper") ||
        lower.includes("consensus") ||
        lower.includes("research")
      ) {
        responseText =
          "According to Section 4 of the consensus paper (research_paper.pdf), deploying direct memory maps leads to a 40% speedup in convergence time, and environment locks mitigate execution conflicts by 65%.";
        thoughts = [
          "Searching for keyword consensus in paper",
          "Reading Section 4 (Experimental Results)",
        ];
        toolCall = {
          name: "view_file",
          target: "research_paper.pdf",
          range: { startLine: 17, endLine: 19 },
          status: "completed",
        };
      } else if (
        lower.includes("spec") ||
        lower.includes("canvas") ||
        lower.includes("sandbox")
      ) {
        responseText =
          "The project specs indicate that Canvas executes tools inside a secure sandbox runtime isolated from the host OS, complete with pre-installed Biome checks (lines 20-22).";
        thoughts = [
          "Inspecting project_specs.md",
          "Looking at Section 4 (Execution Sandbox)",
        ];
        toolCall = {
          name: "view_file",
          target: "project_specs.md",
          range: { startLine: 20, endLine: 22 },
          status: "completed",
        };
      }

      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        thoughts,
        toolCall,
      };

      setMessages((prev) => [...prev, agentMsg]);

      if (toolCall?.range) {
        handleToolCallClick(toolCall);
      } else {
        setAgentStatus("Agent Idle");
      }
    }, 1200);
  };

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
          setActiveWorkspaceId={setActiveWorkspaceId}
          workspaces={WORKSPACES}
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
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${mobileLogoClass}`}
            >
              <Folder className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Canvas</span>
          </div>
          <div
            className={`flex items-center rounded-full border p-0.5 ${mobileSwitcherClass}`}
          >
            <button
              type="button"
              onClick={() => setMobileActiveTab("workspace")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                mobileActiveTab === "chat"
                  ? mobileActiveClass
                  : mobileInactiveClass
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              Chat
            </button>
          </div>
        </header>

        {/* Workspace Split Panels */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Panel A (Artifact Workspace) */}
          <div
            className={`h-full min-h-0 min-w-0 transition-all ${
              mobileActiveTab === "workspace"
                ? "flex flex-col flex-1"
                : "hidden md:flex md:flex-col md:w-[60%]"
            }`}
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

          {/* Panel B (Agent Command Center) */}
          <div
            className={`h-full min-h-0 transition-all ${
              mobileActiveTab === "chat"
                ? "flex flex-col flex-1"
                : "hidden md:flex md:flex-col md:w-[40%]"
            }`}
          >
            <CommandCenter
              messages={messages}
              agentStatus={agentStatus}
              onSendMessage={handleSendMessage}
              onToolCallClick={handleToolCallClick}
              settings={settings}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
