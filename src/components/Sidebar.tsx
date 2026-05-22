"use client";

import { Folder, Plus, Settings, Trash2, LogOut } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { CreateWorkspaceButton, IconButton, useThemeClasses } from "@/components/ui";
import SettingsModal from "@/components/SettingsModal";
import type {
  WorkspaceSettingUpdater,
  WorkspaceSettings,
} from "@/components/workspaceSettings";
import type { WorkspaceRow } from "@/lib/supabase/types";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
  workspaces: WorkspaceRow[];
  onCreateWorkspace: () => void;
  settings: WorkspaceSettings;
  onSettingChange: WorkspaceSettingUpdater;
  onDeleteWorkspace?: (id: string) => void;
}

/**
 * Collapsible workspace navigation sidebar.
 * Includes a folder-icon header toggle, workspace list, and settings trigger.
 */
export default function Sidebar({
  collapsed,
  setCollapsed,
  activeWorkspaceId,
  setActiveWorkspaceId,
  workspaces,
  onCreateWorkspace,
  settings,
  onSettingChange,
  onDeleteWorkspace,
}: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const router = (typeof window !== "undefined") ? require("next/navigation").useRouter() : null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router?.push("/login");
  };

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    workspaceId: string;
  } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const isDark = settings.theme === "dark";
  const tc = useThemeClasses(isDark);

  return (
    <>
      <aside
        className={`relative flex shrink-0 select-none flex-col overflow-x-hidden border-r transition-[width] duration-300 ease-in-out ${tc.surface} ${tc.border} ${
          collapsed ? "w-[60px]" : "w-[220px]"
        }`}
        aria-label="Workspace Navigation"
      >
        {/* Header */}
        <div
          className={`flex h-14 shrink-0 items-center justify-between gap-2 overflow-hidden border-b px-3 ${tc.border}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <IconButton
              label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              colorClass={tc.btnPrimary}
              onClick={() => setCollapsed(!collapsed)}
            >
              <Folder className="h-4 w-4" />
            </IconButton>

            <span
              className={`whitespace-nowrap text-[15px] font-semibold tracking-tight transition-all duration-200 ${tc.textPrimary} ${
                collapsed
                  ? "max-w-0 -translate-x-1 opacity-0"
                  : "max-w-[120px] translate-x-0 opacity-100"
              }`}
              aria-hidden={collapsed}
            >
              Canvas
            </span>
          </div>

          {!collapsed && (
            <CreateWorkspaceButton
              colorClass={`${tc.border} ${tc.btnGhost}`}
              onClick={onCreateWorkspace}
            />
          )}
        </div>

        {/* Workspace list */}
        <div className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-3">
          {!collapsed && (
            <div className="px-2 pb-2 pt-1">
              <span
                className={`text-[10px] font-semibold uppercase tracking-widest ${tc.textSecondary}`}
              >
                Workspaces
              </span>
            </div>
          )}

          {workspaces.length === 0 ? (
            <div className={`mx-2 rounded-2xl border p-3 ${tc.emptyCard} ${tc.border}`}>
              {!collapsed && (
                <div className="space-y-2">
                  <div className={`text-xs font-medium ${tc.textPrimary}`}>
                    No workspaces yet
                  </div>
                  <p className={`text-[11px] leading-relaxed ${tc.textSecondary}`}>
                    Create your first workspace to start a conversation and save
                    chats here.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={onCreateWorkspace}
                className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-medium transition-colors ${
                  isDark
                    ? "bg-[#FAFAF9] text-[#171717] hover:bg-[#E7E5E4]"
                    : "bg-[#0A0A0A] text-white hover:bg-[#404040]"
                }`}
              >
                <Plus className="h-4 w-4" />
                {!collapsed && "Create workspace"}
              </button>
            </div>
          ) : (
            workspaces.map((item) => {
              const isActive = item.id === activeWorkspaceId;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveWorkspaceId(item.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      workspaceId: item.id,
                    });
                  }}
                  className={`flex h-10 w-full items-center rounded-lg text-left transition-all duration-150 ${
                    isActive ? tc.itemActive : tc.itemInactive
                  } ${collapsed ? "justify-center" : "gap-2.5 px-2.5"}`}
                  title={item.name}
                  aria-label={item.name}
                >
                  <Folder
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? tc.textPrimary : tc.textSecondary
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate text-xs">{item.name}</span>
                  )}
                  {!collapsed && isActive && (
                    <span
                      className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${
                        isDark ? "bg-[#FAFAF9]" : "bg-[#0A0A0A]"
                      }`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {contextMenu && onDeleteWorkspace && (
          <div
            className={`fixed z-50 min-w-[160px] rounded-md border shadow-lg ${
              isDark
                ? "border-[#404040] bg-[#1E1E1E] text-[#D6D3D1]"
                : "border-[#E7E5E4] bg-white text-[#404040]"
            } p-1`}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                isDark
                  ? "hover:bg-[#EF4444]/10 hover:text-[#F87171]"
                  : "hover:bg-[#FEF2F2] hover:text-[#DC2626]"
              } text-red-500`}
              onClick={() => {
                onDeleteWorkspace(contextMenu.workspaceId);
                setContextMenu(null);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete Workspace
            </button>
          </div>
        )}

        {/* Footer — Settings & Logout */}
        <div className={`border-t p-2 space-y-1 ${tc.border}`}>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={`flex h-10 w-full items-center justify-start gap-2.5 overflow-hidden rounded-lg px-2.5 transition-all ${tc.btnGhost}`}
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span
              className={`whitespace-nowrap text-xs transition-all duration-200 ${
                collapsed
                  ? "max-w-0 -translate-x-1 opacity-0"
                  : "max-w-[80px] translate-x-0 opacity-100"
              }`}
              aria-hidden={collapsed}
            >
              Settings
            </span>
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            className={`flex h-10 w-full items-center justify-start gap-2.5 overflow-hidden rounded-lg px-2.5 transition-all ${tc.btnGhost} hover:text-red-500`}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-500/70" />
            <span
              className={`whitespace-nowrap text-xs text-red-500 transition-all duration-200 ${
                collapsed
                  ? "max-w-0 -translate-x-1 opacity-0"
                  : "max-w-[80px] translate-x-0 opacity-100"
              }`}
              aria-hidden={collapsed}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      <SettingsModal
        open={settingsOpen}
        onClose={closeSettings}
        settings={settings}
        onSettingChange={onSettingChange}
      />
    </>
  );
}
