"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useThemeClasses } from "@/components/ui";
import IconButton from "@/components/ui/IconButton";
import type {
  WorkspaceSettingUpdater,
  WorkspaceSettings,
} from "@/components/workspaceSettings";
import SettingsContent from "./SettingsContent";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: WorkspaceSettings;
  onSettingChange: WorkspaceSettingUpdater;
}

/**
 * Settings overlay modal.
 * Traps scroll, handles Escape key, and renders SettingsContent inside a
 * centred dialog with a header and "Done" footer.
 */
export default function SettingsModal({
  open,
  onClose,
  settings,
  onSettingChange,
}: SettingsModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isDark = settings.theme === "dark";
  const tc = useThemeClasses(isDark);

  const overlayClass = isDark ? "bg-black/45" : "bg-black/20";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] ${overlayClass}`}
      aria-modal="true"
      role="dialog"
      aria-labelledby="settings-modal-title"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${tc.surface} ${tc.border} ${tc.textPrimary}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex shrink-0 items-start justify-between border-b px-4 py-4 sm:px-6 ${tc.border}`}
        >
          <div>
            <h2
              id="settings-modal-title"
              className={`text-sm font-semibold tracking-tight ${tc.textPrimary}`}
            >
              Settings
            </h2>
            <p className={`mt-0.5 text-xs ${tc.textSecondary}`}>
              Customize your workspace
            </p>
          </div>

          <IconButton
            label="Close Settings"
            colorClass={tc.btnGhost}
            sizeClass="h-9 w-9"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SettingsContent settings={settings} onSettingChange={onSettingChange} />
        </div>

        {/* Footer */}
        <div className={`shrink-0 border-t px-4 py-4 sm:px-6 ${tc.border}`}>
          <button
            type="button"
            onClick={onClose}
            className={`h-11 w-full rounded-xl text-xs font-semibold transition-colors ${tc.btnPrimary}`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
