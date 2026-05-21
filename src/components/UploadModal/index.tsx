"use client";

import { CheckCircle2, FileUp, X, FileText, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useThemeClasses } from "@/components/ui";
import { WORKSPACE_FILE_ACCEPT } from "@/lib/workspace-files/client";

export type UploadState = "idle" | "uploading" | "done" | "error";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isDark: boolean;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getExtension(filename: string) {
  return filename.split(".").pop()?.toUpperCase() ?? "FILE";
}

function getMimeLabel(type: string) {
  const map: Record<string, string> = {
    "application/pdf": "PDF Document",
    "text/plain": "Plain Text",
    "text/markdown": "Markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
    "text/csv": "CSV Spreadsheet",
  };
  return map[type] ?? type ?? "Document";
}

export default function UploadModal({
  open,
  onClose,
  onUpload,
  isDark,
}: UploadModalProps) {
  const tc = useThemeClasses(isDark);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open) {
      setUploadState("idle");
      setUploadedFile(null);
      setErrorMessage(null);
      setProgress(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && uploadState !== "uploading") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, uploadState, onClose]);

  // Fake incremental progress while real upload runs
  useEffect(() => {
    if (uploadState !== "uploading") return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) { clearInterval(interval); return p; }
        return p + Math.random() * 12;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [uploadState]);

  const processFile = async (file: File) => {
    setUploadedFile(file);
    setUploadState("uploading");
    setErrorMessage(null);
    try {
      await onUpload(file);
      setProgress(100);
      setUploadState("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
      setUploadState("error");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  if (!open) return null;

  const overlayBg = isDark ? "bg-black/75" : "bg-black/50";
  const modalBg = isDark ? "bg-[#181818]" : "bg-white";
  const modalBorder = isDark ? "border-[#2e2e2e]" : "border-[#e5e5e5]";

  const dropzoneBg = isDark
    ? isDragOver
      ? "bg-[#1E2A1E] border-[#4ade80]"
      : "bg-[#111111] border-[#333] hover:border-[#555]"
    : isDragOver
    ? "bg-[#f0fdf4] border-[#22c55e]"
    : "bg-[#fafafa] border-[#e5e5e5] hover:border-[#a3a3a3]";

  const fileCardBg = isDark
    ? "bg-[#111] border-[#2e2e2e]"
    : "bg-[#f5f5f5] border-[#e5e5e5]";

  const extBadgeBg = isDark
    ? "bg-[#262626] text-[#a3a3a3]"
    : "bg-white text-[#737373] shadow-sm border border-[#e5e5e5]";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md ${overlayBg}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && uploadState !== "uploading") onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Upload file"
    >
      <div
        className={`relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border shadow-2xl ${modalBg} ${modalBorder}`}
        style={{ animation: "modalIn 0.35s cubic-bezier(0.16,1,0.3,1) both", minHeight: "520px" }}
      >
        {/* ── Close button (absolute top-right) ── */}
        {uploadState !== "uploading" && (
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-150 ${isDark ? "border-[#333] bg-[#222] text-[#888] hover:text-[#FAFAF9] hover:bg-[#333]" : "border-[#e5e5e5] bg-white text-[#999] hover:text-[#111] hover:bg-[#f5f5f5]"}`}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* ── IDLE: Drop zone ── */}
        {uploadState === "idle" && (
          <div className="flex flex-1 flex-col" style={{ animation: "fadeSlideUp 0.3s ease-out both" }}>
            {/* Header */}
            <div className="px-10 pt-10 pb-8">
              <h2 className={`text-2xl font-bold tracking-tight ${tc.textPrimary}`}>
                Upload a file
              </h2>
              <p className={`mt-2 text-sm ${tc.textSecondary}`}>
                Add a document to your workspace. It will be extracted into numbered lines for AI reading and analysis.
              </p>
            </div>

            {/* Drop zone */}
            <div className="px-10 pb-10 flex-1 flex flex-col">
              <input
                ref={fileInputRef}
                type="file"
                accept={WORKSPACE_FILE_ACCEPT}
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                className={`group relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed px-10 transition-all duration-200 ${dropzoneBg} ${isDragOver ? "scale-[1.01]" : ""}`}
                style={{ minHeight: "280px" }}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              >
                {/* Icon */}
                <div className={`flex h-20 w-20 items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 ${isDark ? "bg-[#262626]" : "bg-white border border-[#e5e5e5] shadow-md"}`}>
                  <FileUp className={`h-9 w-9 ${isDragOver ? (isDark ? "text-[#4ade80]" : "text-[#22c55e]") : tc.textSecondary}`} />
                </div>

                <div className="text-center">
                  <p className={`text-lg font-semibold ${tc.textPrimary}`}>
                    {isDragOver ? "Release to upload" : "Drop your file here"}
                  </p>
                  <p className={`mt-1.5 text-sm ${tc.textSecondary}`}>
                    or{" "}
                    <span className={`font-medium underline underline-offset-2 ${isDark ? "text-[#FAFAF9]" : "text-[#0A0A0A]"}`}>
                      click to browse
                    </span>
                  </p>
                </div>

                {/* Format chips */}
                <div className="flex items-center gap-2">
                  {["TXT", "MD", "PDF", "DOCX"].map((fmt) => (
                    <span
                      key={fmt}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${extBadgeBg}`}
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── UPLOADING ── */}
        {uploadState === "uploading" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-10 py-14" style={{ animation: "fadeSlideUp 0.3s ease-out both" }}>
            {/* Spinner */}
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg className="absolute inset-0 h-24 w-24" viewBox="0 0 50 50" style={{ animation: "spin 2s linear infinite" }}>
                {/* Track */}
                <circle cx="25" cy="25" r="21" fill="none" strokeWidth="3.5" className={isDark ? "stroke-[#2e2e2e]" : "stroke-[#e5e5e5]"} />
                {/* Arc */}
                <circle
                  cx="25" cy="25" r="21" fill="none" strokeWidth="3.5" strokeLinecap="round"
                  className={isDark ? "stroke-[#FAFAF9]" : "stroke-[#0A0A0A]"}
                  style={{ animation: "spinnerDash 1.5s ease-in-out infinite" }}
                />
              </svg>
              <FileText className={`h-8 w-8 ${tc.textSecondary}`} />
            </div>

            <div className="w-full text-center">
              <h3 className={`text-2xl font-bold ${tc.textPrimary}`}>Uploading...</h3>
              <p className={`mt-2 text-sm ${tc.textSecondary}`}>Processing your document, hang tight</p>
            </div>

            {/* File card */}
            {uploadedFile && (
              <div className={`w-full rounded-2xl border p-5 ${fileCardBg}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xs font-bold tracking-widest ${extBadgeBg}`}>
                    {getExtension(uploadedFile.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-base font-semibold ${tc.textPrimary}`}>{uploadedFile.name}</p>
                    <p className={`mt-1 text-xs ${tc.textSecondary}`}>{formatBytes(uploadedFile.size)} · {getMimeLabel(uploadedFile.type)}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className={`mt-4 h-1.5 w-full overflow-hidden rounded-full ${isDark ? "bg-[#2e2e2e]" : "bg-[#e5e5e5]"}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${isDark ? "bg-[#FAFAF9]" : "bg-[#0A0A0A]"}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className={`mt-2 text-right text-[11px] font-medium ${tc.textSecondary}`}>
                  {Math.min(Math.round(progress), 100)}%
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── DONE ── */}
        {uploadState === "done" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-10 py-14" style={{ animation: "fadeSlideUp 0.3s ease-out both" }}>
            {/* Success icon */}
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full ${isDark ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"}`}
              style={{ animation: "popIn 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <div className="text-center">
              <h3 className={`text-2xl font-bold ${tc.textPrimary}`}>Upload complete!</h3>
              <p className={`mt-2 text-sm ${tc.textSecondary}`}>Your file is ready in the workspace file explorer</p>
            </div>

            {/* File card */}
            {uploadedFile && (
              <div className={`w-full rounded-2xl border p-5 ${fileCardBg}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xs font-bold tracking-widest ${isDark ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>
                    {getExtension(uploadedFile.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-base font-semibold ${tc.textPrimary}`}>{uploadedFile.name}</p>
                    <p className={`mt-1 text-xs ${tc.textSecondary}`}>{formatBytes(uploadedFile.size)} · {getMimeLabel(uploadedFile.type)}</p>
                  </div>
                </div>
                {/* Full progress */}
                <div className={`mt-4 h-1.5 w-full overflow-hidden rounded-full ${isDark ? "bg-[#2e2e2e]" : "bg-[#e5e5e5]"}`}>
                  <div className={`h-full w-full rounded-full ${isDark ? "bg-emerald-400" : "bg-emerald-500"}`} />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`h-12 w-full rounded-xl text-sm font-semibold transition-all duration-200 ${tc.btnPrimary}`}
            >
              Done
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {uploadState === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-10 py-14" style={{ animation: "fadeSlideUp 0.3s ease-out both" }}>
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full ${isDark ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30" : "bg-red-50 text-red-600 ring-1 ring-red-200"}`}
              style={{ animation: "shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both" }}
            >
              <AlertCircle className="h-12 w-12" />
            </div>

            <div className="text-center">
              <h3 className={`text-2xl font-bold ${tc.textPrimary}`}>Upload failed</h3>
              <p className={`mt-2 text-sm ${tc.textSecondary}`}>
                {errorMessage ?? "Something went wrong. Please try again."}
              </p>
            </div>

            {/* File card */}
            {uploadedFile && (
              <div className={`w-full rounded-2xl border p-5 ${fileCardBg}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xs font-bold tracking-widest ${extBadgeBg}`}>
                    {getExtension(uploadedFile.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-base font-semibold ${tc.textPrimary}`}>{uploadedFile.name}</p>
                    <p className={`mt-1 text-xs ${tc.textSecondary}`}>{formatBytes(uploadedFile.size)} · {getMimeLabel(uploadedFile.type)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`h-12 flex-1 rounded-xl border text-sm font-semibold transition-all duration-200 ${tc.btnGhost} ${isDark ? "border-[#333]" : "border-[#e5e5e5]"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setUploadState("idle")}
                className={`h-12 flex-1 rounded-xl text-sm font-semibold transition-all duration-200 ${tc.btnPrimary}`}
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.93) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0%   { transform: scale(0.4); opacity: 0; }
          65%  { transform: scale(1.12); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(4px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
          40%, 60% { transform: translate3d(6px, 0, 0); }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        @keyframes spinnerDash {
          0%   { stroke-dasharray: 1, 130; stroke-dashoffset: 0; }
          50%  { stroke-dasharray: 100, 130; stroke-dashoffset: -35; }
          100% { stroke-dasharray: 100, 130; stroke-dashoffset: -125; }
        }
      `}</style>
    </div>
  );
}
