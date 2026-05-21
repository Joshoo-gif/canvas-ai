"use client";

import { X, MessageSquare, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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

  if (!open) return null;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete chat.");
      
      setConversations(prev => prev.filter(c => c.id !== id));
      
      if (id === activeConversationId) {
        onActiveConversationDeleted();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const bgShell = isDark ? "bg-[#171717] border-[#404040]" : "bg-white border-[#E7E5E4]";
  const textPrimary = isDark ? "text-[#FAFAF9]" : "text-[#101011]";
  const textSecondary = isDark ? "text-[#A8A29E]" : "text-[#606266]";
  const btnClose = isDark ? "bg-[#262626] text-[#FAFAF9] hover:bg-[#404040]" : "bg-[#F4F4F5] text-[#101011] hover:bg-[#E7E5E4]";
  const itemHover = isDark ? "hover:bg-[#262626]" : "hover:bg-[#F4F4F5]";
  const borderClass = isDark ? "border-[#404040]" : "border-[#E7E5E4]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-history-title"
      onClick={onClose}
    >
      <div
        className={`flex w-full max-w-2xl h-[75vh] max-h-[800px] flex-col overflow-hidden rounded-2xl border shadow-2xl ${bgShell}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex shrink-0 items-start justify-between border-b px-4 py-4 sm:px-5 ${borderClass}`}>
          <div className="min-w-0 pr-4">
            <h2
              id="chat-history-title"
              className={`text-sm font-semibold tracking-tight ${textPrimary}`}
            >
              Chat History
            </h2>
            <p className={`mt-1 text-xs leading-relaxed ${textSecondary}`}>
              Select a previous conversation to continue.
            </p>
          </div>

          <IconButton
            label="Close modal"
            colorClass={btnClose}
            sizeClass="h-11 w-11"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ?
            <div className={`py-8 text-center text-sm ${textSecondary}`}>Loading...</div>
          : error ?
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 m-2 text-xs text-red-700">
              {error}
            </div>
          : conversations.length === 0 ?
            <div className={`py-8 text-center text-sm ${textSecondary}`}>No previous chats found.</div>
          : 
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group relative flex w-full items-center justify-between rounded-lg p-3 transition-colors ${itemHover}`}
                >
                  <button
                    className="flex flex-1 items-center gap-3 text-left overflow-hidden pr-4"
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                  >
                    <MessageSquare className={`h-4 w-4 shrink-0 ${textSecondary}`} />
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm font-medium ${textPrimary}`}>
                        {conv.title || "Conversation"}
                      </div>
                      <div className={`text-xs ${textSecondary}`}>
                        {new Date(conv.updated_at).toLocaleString()}
                      </div>
                    </div>
                  </button>
                  <IconButton
                    label="Delete chat"
                    colorClass={`opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}
                    sizeClass="h-8 w-8 shrink-0"
                    onClick={(e) => handleDelete(e, conv.id)}
                  >
                    {deletingId === conv.id ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </IconButton>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}
