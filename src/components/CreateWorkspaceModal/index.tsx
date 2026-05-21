"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import IconButton from "@/components/ui/IconButton";

type FormSubmitEvent = FormEvent<HTMLFormElement>;

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export default function CreateWorkspaceModal({
  open,
  onClose,
  onCreate,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const canSubmit = name.trim().length > 0 && !isSubmitting;

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
    if (open) {
      setName("");
      setIsSubmitting(false);
      setErrorMessage("");
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await onCreate(name.trim());
      setName("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create workspace.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-workspace-title"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#E7E5E4] px-4 py-4 sm:px-5">
          <div className="min-w-0 pr-4">
            <h2
              id="create-workspace-title"
              className="text-sm font-semibold tracking-tight text-[#101011]"
            >
              Create workspace
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#606266]">
              Name your workspace so chats and conversations stay grouped together.
            </p>
          </div>

          <IconButton
            label="Close create workspace modal"
            colorClass="bg-[#F4F4F5] text-[#101011] hover:bg-[#E7E5E4]"
            sizeClass="h-11 w-11"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-5">
          <div>
            <label
              htmlFor="workspace-name"
              className="mb-2 block text-xs font-medium text-[#101011]"
            >
              Workspace name
            </label>
            <input
              id="workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Product launch"
              maxLength={80}
              autoFocus
              className="h-12 w-full rounded-xl border border-[#E7E5E4] bg-white px-4 text-sm text-[#101011] placeholder:text-[#9A9CA2] outline-none"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl border border-[#E7E5E4] bg-white px-4 text-sm font-medium text-[#101011] transition-colors hover:bg-[#F4F4F5] sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#101011] px-4 text-sm font-medium text-white transition-colors hover:bg-[#202124] disabled:cursor-not-allowed disabled:bg-[#B5B7BB] sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create workspace
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
