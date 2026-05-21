"use client";

import type {
  WorkspaceSettingUpdater,
  WorkspaceSettings,
} from "@/components/workspaceSettings";
import { useThemeClasses } from "@/components/ui";
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

export default function SettingsContent({
  settings,
  onSettingChange,
}: SettingsContentProps) {
  const isDark = settings.theme === "dark";
  const tc = useThemeClasses(isDark);

  const sectionLabel = `text-[10px] font-semibold uppercase tracking-widest mb-4 ${tc.textSecondary}`;
  const rowLabel = `text-xs font-medium ${tc.textPrimary}`;
  const rowDesc = `text-[11px] mt-0.5 ${tc.textSecondary}`;

  // Pill button style for theme / density
  const pillBase = "h-8 flex-1 rounded-md border text-xs font-medium capitalize transition-colors";
  const pillActive = isDark
    ? "bg-[#FAFAF9] border-[#FAFAF9] text-[#171717]"
    : "bg-[#0A0A0A] border-[#0A0A0A] text-white";
  const pillInactive = isDark
    ? "bg-transparent border-[#404040] text-[#A8A29E] hover:border-[#737373] hover:text-[#FAFAF9]"
    : "bg-white border-[#E7E5E4] text-[#737373] hover:border-[#D6D3D1] hover:text-[#0A0A0A]";

  const divider = `h-px my-6 ${isDark ? "bg-[#262626]" : "bg-[#F0EFEE]"}`;

  return (
    <div className="px-6 py-6 space-y-0">
      {/* ── Appearance ──────────────────────────────────────────────── */}
      <section>
        <h3 className={sectionLabel}>Appearance</h3>

        <div className="space-y-5">
          {/* Theme */}
          <div>
            <label className={`${rowLabel} block mb-2`}>Theme</label>
            <div className="flex gap-2">
              {(["light", "dark"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onSettingChange("theme", opt)}
                  className={`${pillBase} ${settings.theme === opt ? pillActive : pillInactive}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div>
            <label className={`${rowLabel} block mb-2`}>Density</label>
            <div className="flex gap-2">
              {(["comfortable", "compact"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onSettingChange("density", opt)}
                  className={`${pillBase} ${settings.density === opt ? pillActive : pillInactive}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="font-size-input" className={rowLabel}>
                Editor Font Size
              </label>
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded-md border ${
                  isDark
                    ? "bg-[#262626] border-[#404040] text-[#D6D3D1]"
                    : "bg-[#F5F5F4] border-[#E7E5E4] text-[#404040]"
                }`}
              >
                {settings.fontSize}px
              </span>
            </div>
            {/* Custom-styled range slider */}
            <div className="relative flex items-center h-5">
              <div
                className={`absolute inset-y-0 my-auto h-1 w-full rounded-full ${
                  isDark ? "bg-[#262626]" : "bg-[#E7E5E4]"
                }`}
              />
              {/* Filled track */}
              <div
                className={`absolute inset-y-0 my-auto h-1 rounded-full pointer-events-none ${
                  isDark ? "bg-[#FAFAF9]" : "bg-[#0A0A0A]"
                }`}
                style={{
                  width: `${((settings.fontSize - 11) / (18 - 11)) * 100}%`,
                }}
              />
              <input
                id="font-size-input"
                type="range"
                min="11"
                max="18"
                step="1"
                value={settings.fontSize}
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10);
                  onSettingChange("fontSize", Number.isNaN(next) ? settings.fontSize : next);
                }}
                className="relative w-full appearance-none bg-transparent cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:shadow-sm
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:h-4
                  [&::-moz-range-thumb]:w-4
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:cursor-pointer"
                style={
                  {
                    "--thumb-bg": isDark ? "#FAFAF9" : "#0A0A0A",
                    "--thumb-border": isDark ? "#111111" : "#FFFFFF",
                  } as React.CSSProperties
                }
              />
            </div>
            <div className={`flex justify-between mt-1.5 text-[10px] ${tc.textSecondary}`}>
              <span>11px</span>
              <span>18px</span>
            </div>
          </div>
        </div>
      </section>

      <div className={divider} />

      {/* ── Behavior ────────────────────────────────────────────────── */}
      <section>
        <h3 className={sectionLabel}>Behavior</h3>

        <div className="space-y-1">
          {TOGGLE_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between rounded-lg px-3 py-3 -mx-3 transition-colors ${
                isDark ? "hover:bg-[#262626]" : "hover:bg-[#F5F5F4]"
              }`}
            >
              <div className="min-w-0 flex-1 pr-6">
                <div className={rowLabel}>{item.label}</div>
                <div className={rowDesc}>{item.desc}</div>
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
