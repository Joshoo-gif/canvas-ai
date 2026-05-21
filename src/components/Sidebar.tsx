"use client";

import { Folder, Settings } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { useThemeClasses } from "@/components/ui";
import IconButton from "@/components/ui/IconButton";
import SettingsModal from "@/components/SettingsModal";
import type {
  WorkspaceSettingUpdater,
  WorkspaceSettings,
} from "@/components/workspaceSettings";

export interface WorkspaceItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  workspaces: WorkspaceItem[];
  settings: WorkspaceSettings;
  onSettingChange: WorkspaceSettingUpdater;
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
  settings,
  onSettingChange,
}: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

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
          className={`flex h-14 shrink-0 items-center justify-start gap-2.5 overflow-hidden border-b px-3 ${tc.border}`}
        >
          <IconButton
            label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
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

          {workspaces.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeWorkspaceId;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveWorkspaceId(item.id)}
                className={`flex h-10 w-full items-center rounded-lg text-left transition-all duration-150 ${
                  isActive ? tc.itemActive : tc.itemInactive
                } ${collapsed ? "justify-center" : "gap-2.5 px-2.5"}`}
                title={item.name}
                aria-label={item.name}
              >
                <Icon
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
          })}
        </div>

        {/* Footer — Settings trigger */}
        <div className={`border-t p-2 ${tc.border}`}>
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
