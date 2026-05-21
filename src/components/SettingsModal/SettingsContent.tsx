"use client";

import type {
  WorkspaceSettingUpdater,
  WorkspaceSettings,
} from "@/components/workspaceSettings";
import { useThemeClasses } from "@/components/ui";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Switch from "@/components/ui/Switch";

interface SettingsContentProps {
  settings: WorkspaceSettings;
  onSettingChange: WorkspaceSettingUpdater;
}

const TOGGLE_ITEMS = [
  {
    id: "auto-scroll",
    label: "Auto-scroll to new messages",
    desc: "Automatically scroll when new messages arrive",
    key: "autoScroll" as const,
  },
  {
    id: "line-numbers",
    label: "Show line numbers",
    desc: "Display line numbers in the artifact viewer",
    key: "lineNumbers" as const,
  },
] as const;

/**
 * The scrollable body of the settings panel.
 * Extracted so it can be embedded in both a modal and an inline panel
 * without duplicating layout logic.
 */
export default function SettingsContent({
  settings,
  onSettingChange,
}: SettingsContentProps) {
  const isDark = settings.theme === "dark";
  const tc = useThemeClasses(isDark);
  const compact = settings.density === "compact";

  return (
    <div
      className={
        compact
          ? "space-y-6 px-4 py-4 sm:px-5 sm:py-5"
          : "space-y-8 px-4 py-4 sm:px-6 sm:py-6"
      }
    >
      {/* ── Appearance ───────────────────────────────────────────────── */}
      <section>
        <h3
          className={`mb-3 text-[10px] font-semibold uppercase tracking-widest ${tc.textSecondary}`}
        >
          Appearance
        </h3>

        <div className="space-y-4">
          {/* Theme */}
          <div>
            <label className={`mb-2 block text-xs font-medium ${tc.textPrimary}`}>
              Theme
            </label>
            <SegmentedControl
              options={["light", "dark"] as const}
              value={settings.theme}
              onChange={(v) => onSettingChange("theme", v)}
              activeClass={tc.segmentActive}
              inactiveClass={tc.segmentInactive}
            />
          </div>

          {/* Density */}
          <div>
            <label className={`mb-2 block text-xs font-medium ${tc.textPrimary}`}>
              Density
            </label>
            <SegmentedControl
              options={["comfortable", "compact"] as const}
              value={settings.density}
              onChange={(v) => onSettingChange("density", v)}
              activeClass={tc.segmentActive}
              inactiveClass={tc.segmentInactive}
            />
          </div>

          {/* Font size */}
          <div>
            <label
              htmlFor="font-size-input"
              className={`mb-2 block text-xs font-medium ${tc.textPrimary}`}
            >
              Editor Font Size
            </label>
            <div className="flex items-center gap-3">
              <input
                id="font-size-input"
                type="range"
                min="11"
                max="18"
                value={settings.fontSize}
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10);
                  onSettingChange(
                    "fontSize",
                    Number.isNaN(next) ? settings.fontSize : next,
                  );
                }}
                className={`h-1.5 flex-1 appearance-none rounded-full accent-[#0A0A0A] ${tc.border}`}
              />
              <span className={`w-8 text-right font-mono text-xs ${tc.textPrimary}`}>
                {settings.fontSize}px
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className={`h-px ${tc.divider}`} />

      {/* ── Behavior ─────────────────────────────────────────────────── */}
      <section>
        <h3
          className={`mb-3 text-[10px] font-semibold uppercase tracking-widest ${tc.textSecondary}`}
        >
          Behavior
        </h3>

        <div className="space-y-3">
          {TOGGLE_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2">
              <div className="min-w-0 flex-1 pr-4">
                <div className={`text-xs font-medium ${tc.textPrimary}`}>
                  {item.label}
                </div>
                <div className={`mt-0.5 text-[11px] ${tc.textSecondary}`}>
                  {item.desc}
                </div>
              </div>

              <Switch
                id={item.id}
                checked={settings[item.key]}
                onChange={(next) => onSettingChange(item.key, next)}
                trackClass={tc.switchTrack(settings[item.key])}
                knobClass={tc.switchKnob}
                label={item.label}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
