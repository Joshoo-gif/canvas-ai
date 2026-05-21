/**
 * Derives a map of semantic class strings from the current dark-mode flag.
 * Consuming components import this hook and destructure what they need,
 * keeping inline ternary logic out of JSX.
 */
export function useThemeClasses(isDark: boolean) {
  return {
    // Surfaces
    shell: isDark ? "bg-[#111111] text-[#FAFAF9]" : "bg-white text-[#0A0A0A]",
    shellMuted: isDark ? "bg-[#111111]" : "bg-[#F5F5F4]",
    surface: isDark ? "bg-[#171717]" : "bg-white",
    surfaceRaised: isDark ? "bg-[#262626]" : "bg-white",
    surfaceTint: isDark ? "bg-[#171717]" : "bg-[#FAFAF9]",

    // Borders
    border: isDark ? "border-[#404040]" : "border-[#E7E5E4]",
    divider: isDark ? "bg-[#404040]" : "bg-[#E7E5E4]",

    // Text
    textPrimary: isDark ? "text-[#FAFAF9]" : "text-[#0A0A0A]",
    textSecondary: isDark ? "text-[#A8A29E]" : "text-[#737373]",
    textSubdued: isDark ? "text-[#D6D3D1]" : "text-[#404040]",

    // Interactive states
    itemActive: isDark
      ? "bg-[#262626] text-[#FAFAF9] font-medium"
      : "bg-[#F5F5F4] text-[#0A0A0A] font-medium",
    itemInactive: isDark
      ? "text-[#A8A29E] hover:bg-[#262626] hover:text-[#FAFAF9]"
      : "text-[#737373] hover:bg-[#FAFAF9] hover:text-[#0A0A0A]",

    // Buttons (primary / ghost)
    btnPrimary: isDark
      ? "bg-[#FAFAF9] text-[#171717] hover:bg-[#E7E5E4]"
      : "bg-[#0A0A0A] text-white hover:bg-[#404040]",
    btnGhost: isDark
      ? "text-[#A8A29E] hover:bg-[#262626] hover:text-[#FAFAF9]"
      : "text-[#737373] hover:bg-[#F5F5F4] hover:text-[#0A0A0A]",

    // Segment control
    segmentActive: isDark
      ? "border-[#FAFAF9] bg-[#FAFAF9] text-[#171717]"
      : "border-[#0A0A0A] bg-[#0A0A0A] text-white",
    segmentInactive: isDark
      ? "border-[#404040] bg-[#262626] text-[#A8A29E] hover:border-[#737373]"
      : "border-[#E7E5E4] bg-white text-[#737373] hover:border-[#D6D3D1]",

    // Input
    inputShell: isDark
      ? "bg-[#171717] border-[#404040]"
      : "bg-[#F5F5F4] border-[#E7E5E4]",
    inputFocus: isDark
      ? "focus-within:border-[#FAFAF9] focus-within:bg-[#111111]"
      : "focus-within:border-[#0A0A0A] focus-within:bg-white",
    textarea: isDark
      ? "text-[#FAFAF9] placeholder:text-[#737373]"
      : "text-[#0A0A0A] placeholder:text-[#A8A29E]",

    // Toggle switch
    switchKnob: isDark ? "bg-[#171717]" : "bg-white",
    switchTrack: (on: boolean) =>
      on
        ? isDark
          ? "bg-[#FAFAF9]"
          : "bg-[#0A0A0A]"
        : isDark
          ? "bg-[#404040]"
          : "bg-[#D6D3D1]",

    // Highlighted rows (amber accent)
    rowHighlight: isDark
      ? "bg-[#2A2111] border-l-2 border-[#D97706]"
      : "bg-amber-50 border-l-2 border-amber-400",
    rowHover: isDark ? "hover:bg-[#262626]" : "hover:bg-[#F5F5F4]",
    lineNumHighlight: isDark ? "text-[#F59E0B] font-bold" : "text-amber-600 font-bold",
    lineNumDefault: isDark
      ? "text-[#A8A29E] group-hover:text-[#D6D3D1]"
      : "text-[#A8A29E] group-hover:text-[#737373]",
    contentHighlight: isDark
      ? "text-[#FAFAF9] font-medium"
      : "text-[#0A0A0A] font-medium",
    contentDefault: isDark ? "text-[#D6D3D1]" : "text-[#404040]",

    // Range badge
    rangeBadge: isDark
      ? "border-[#D97706] bg-[#2A2111] text-[#F59E0B]"
      : "border-amber-200 bg-amber-50 text-amber-700",

    // Tabs
    tabActive: isDark
      ? "bg-[#262626] border-[#404040] text-[#FAFAF9] shadow-[0_1px_3px_rgba(0,0,0,0.24)]"
      : "bg-white border-[#E7E5E4] text-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
    tabInactive: isDark
      ? "bg-transparent border-transparent text-[#A8A29E] hover:bg-[#262626] hover:text-[#FAFAF9]"
      : "bg-transparent border-transparent text-[#737373] hover:bg-white/60 hover:text-[#0A0A0A]",
    tabList: isDark ? "border-[#404040] bg-[#171717]" : "border-[#E7E5E4] bg-[#F5F5F4]",

    // Message bubbles
    userBubble: isDark ? "bg-[#FAFAF9] text-[#171717]" : "bg-[#0A0A0A] text-white",
    agentBubble: isDark
      ? "border-[#404040] bg-[#171717] text-[#FAFAF9]"
      : "border-[#E7E5E4] bg-white text-[#0A0A0A]",
    thoughtCard: isDark
      ? "border-[#404040] bg-[#171717]/80 text-[#A8A29E]"
      : "border-[#E7E5E4] bg-white/70 text-[#737373]",
    toolCard: isDark
      ? "bg-[#171717] border-[#404040] text-[#A8A29E]"
      : "bg-white border-[#E7E5E4] text-[#737373]",
    toolCardHover: isDark
      ? "cursor-pointer hover:border-[#FAFAF9] hover:bg-[#262626]"
      : "cursor-pointer hover:border-[#0A0A0A] hover:bg-white",

    // Header
    header: isDark ? "border-[#404040] bg-[#171717]" : "border-[#E7E5E4] bg-white",

    // Empty state card
    emptyCard: isDark
      ? "border-[#404040] bg-[#262626] shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
      : "border-[#E7E5E4] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
  } as const;
}

export type ThemeClasses = ReturnType<typeof useThemeClasses>;
