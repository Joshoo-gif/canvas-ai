"use client";

import { X, MessageSquare, Trash2, Search, Clock, History } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import IconButton from "@/components/ui/IconButton";
import type { ConversationRow } from "@/lib/supabase/types";

interface ChatHistoryModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string | null;
  onSelectConversation: (id: string) => void;
  isDark: boolean;
  activeConversationId: string | null;
  onActiveConversationDeleted: () => void;
}

/** Group conversations by relative date label */
function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "This Week";
  if (days < 14) return "Last Week";
  if (days < 30) return "This Month";
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

export default function ChatHistoryModal({
  open,
  onClose,
  workspaceId,
  onSelectConversation,
  isDark,
  activeConversationId,
  onActiveConversationDeleted,
}: ChatHistoryModalProps) {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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

  useEffect(() => {
    if (open && workspaceId) {
      setIsLoading(true);
      setError("");
      setSearch("");

      fetch(`/api/workspaces/${workspaceId}/conversations`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load history.");
          return res.json();
        })
        .then((data: { conversations: ConversationRow[] }) => {
          setConversations(data.conversations || []);
        })
        .catch((err: Error) => {
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, workspaceId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.title || "Conversation").toLowerCase().includes(q)
    );
  }, [conversations, search]);

  /** Group filtered conversations by date label */
  const grouped = useMemo(() => {
    const map = new Map<string, ConversationRow[]>();
    for (const conv of filtered) {
      const label = getDateLabel(conv.updated_at);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(conv);
    }
    return map;
  }, [filtered]);

  if (!open) return null;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete chat.");

      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (id === activeConversationId) {
        onActiveConversationDeleted();
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const bg = isDark
    ? "bg-[#141414] border-white/[0.08]"
    : "bg-white border-black/[0.06]";
  const headerBorder = isDark ? "border-white/[0.07]" : "border-black/[0.06]";
  const textPrimary = isDark ? "text-[#FAFAF9]" : "text-[#0A0A0A]";
  const textSecondary = isDark ? "text-[#7C7C7C]" : "text-[#888]";
  const textTertiary = isDark ? "text-[#555]" : "text-[#bbb]";
  const searchBg = isDark
    ? "bg-white/[0.04] border-white/[0.08] focus-within:border-white/20 focus-within:bg-white/[0.06]"
    : "bg-black/[0.03] border-black/[0.07] focus-within:border-black/20 focus-within:bg-black/[0.05]";
  const searchInput = isDark
    ? "text-[#FAFAF9] placeholder-[#555]"
    : "text-[#0A0A0A] placeholder-[#bbb]";
  const groupLabel = isDark ? "text-[#444]" : "text-[#ccc]";
  const itemBg = isDark
    ? "hover:bg-white/[0.04] active:bg-white/[0.07]"
    : "hover:bg-black/[0.03] active:bg-black/[0.05]";
  const itemActiveBg = isDark
    ? "bg-white/[0.06] ring-1 ring-white/10"
    : "bg-black/[0.04] ring-1 ring-black/10";
  const deleteBtn = isDark
    ? "text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
    : "text-red-400/60 hover:text-red-500 hover:bg-red-50";
  const closeBtnClass = isDark
    ? "bg-white/[0.06] text-[#FAFAF9] hover:bg-white/[0.12]"
    : "bg-black/[0.05] text-[#0A0A0A] hover:bg-black/[0.1]";
  const dividerClass = isDark ? "border-white/[0.05]" : "border-black/[0.05]";
  const emptyIcon = isDark ? "text-white/10" : "text-black/10";
  const skeletonBg = isDark ? "bg-white/[0.06]" : "bg-black/[0.05]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-history-title"
      onClick={onClose}
      style={{
        background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.25)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        className={`flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${bg}`}
        style={{
          height: "min(78vh, 640px)",
          boxShadow: isDark
            ? "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)"
            : "0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)",
          animation: "historySlideIn 0.22s cubic-bezier(0.34,1.28,0.64,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={`flex shrink-0 items-center gap-3 px-4 pt-4 pb-3 ${headerBorder}`}>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: isDark
                ? "linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%)"
                : "linear-gradient(135deg, #f4f4f5 0%, #e7e5e4 100%)",
            }}
          >
            <History className={`h-4 w-4 ${textSecondary}`} />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="chat-history-title"
              className={`text-sm font-semibold tracking-tight ${textPrimary}`}
            >
              Chat History
            </h2>
            <p className={`text-[11px] ${textSecondary}`}>
              {conversations.length > 0
                ? `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`
                : "No conversations yet"}
            </p>
          </div>

          <IconButton
            label="Close modal"
            colorClass={closeBtnClass}
            sizeClass="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </IconButton>
        </div>

        {/* ── Search bar ── */}
        <div className="shrink-0 px-3 pb-2 pt-1">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all duration-200 ${searchBg}`}
          >
            <Search className={`h-3.5 w-3.5 shrink-0 ${textTertiary}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className={`flex-1 bg-transparent text-xs outline-none ${searchInput}`}
              aria-label="Search chat history"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className={`shrink-0 rounded text-xs ${textTertiary} hover:${textSecondary} transition-colors`}
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-2 pb-3" style={{ scrollbarWidth: "thin" }}>
          {isLoading ? (
            /* Skeleton loading state */
            <div className="space-y-3 px-1 pt-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-3 py-3"
                  style={{ opacity: 1 - i * 0.15 }}
                >
                  <div className={`h-8 w-8 shrink-0 animate-pulse rounded-lg ${skeletonBg}`} />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className={`h-2.5 animate-pulse rounded-full ${skeletonBg}`}
                      style={{ width: `${60 + i * 8}%` }}
                    />
                    <div className={`h-2 w-24 animate-pulse rounded-full ${skeletonBg}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              className="mx-1 mt-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3"
            >
              <p className="text-xs font-medium text-red-400">{error}</p>
            </div>
          ) : grouped.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${emptyIcon}`}
                style={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                }}
              >
                <MessageSquare className={`h-7 w-7 ${emptyIcon}`} />
              </div>
              <p className={`text-sm font-medium ${textSecondary}`}>
                {search ? "No results found" : "No conversations yet"}
              </p>
              <p className={`mt-1 text-center text-xs ${textTertiary}`}>
                {search
                  ? `Nothing matched "${search}"`
                  : "Start a conversation to see it here."}
              </p>
            </div>
          ) : (
            <div className="space-y-1 pt-1">
              {Array.from(grouped.entries()).map(([label, convs]) => (
                <div key={label}>
                  {/* Date group header */}
                  <div className={`flex items-center gap-2 px-3 py-2`}>
                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${groupLabel}`}>
                      {label}
                    </span>
                    <div className={`flex-1 border-t ${dividerClass}`} />
                  </div>

                  {/* Conversation items */}
                  <div className="space-y-0.5">
                    {convs.map((conv) => {
                      const isActive = conv.id === activeConversationId;
                      const isHovered = hoveredId === conv.id;

                      return (
                        <div
                          key={conv.id}
                          className={`group relative flex w-full items-center rounded-xl px-2 py-1.5 transition-all duration-150 ${
                            isActive ? itemActiveBg : itemBg
                          }`}
                          onMouseEnter={() => setHoveredId(conv.id)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          {/* Conversation icon */}
                          <div
                            className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150"
                            style={{
                              background: isActive
                                ? isDark
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.08)"
                                : isDark
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(0,0,0,0.04)",
                            }}
                          >
                            <MessageSquare
                              className={`h-3.5 w-3.5 transition-colors duration-150 ${
                                isActive || isHovered ? textPrimary : textSecondary
                              }`}
                            />
                          </div>

                          {/* Title & time */}
                          <button
                            className="flex min-w-0 flex-1 flex-col items-start pr-2 text-left"
                            onClick={() => {
                              onSelectConversation(conv.id);
                              onClose();
                            }}
                          >
                            <span
                              className={`truncate w-full text-[13px] font-medium leading-snug transition-colors duration-150 ${
                                isActive || isHovered ? textPrimary : textPrimary
                              }`}
                            >
                              {conv.title || "Conversation"}
                            </span>
                            <span
                              className={`mt-0.5 flex items-center gap-1 text-[10px] ${textSecondary}`}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(conv.updated_at).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </button>

                          {/* Active indicator dot */}
                          {isActive && (
                            <span
                              className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{
                                background: isDark ? "#FAFAF9" : "#0A0A0A",
                                boxShadow: isDark
                                  ? "0 0 6px rgba(250,250,249,0.4)"
                                  : "0 0 6px rgba(10,10,10,0.3)",
                              }}
                            />
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            aria-label="Delete conversation"
                            className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150 opacity-0 group-hover:opacity-100 ${deleteBtn}`}
                            onClick={(e) => handleDelete(e, conv.id)}
                          >
                            {deletingId === conv.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes historySlideIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
