"use client";

import AppShell from "@/components/AppShell";
import StateMessage from "@/components/StateMessage";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Sparkles, UploadCloud, X, LockKeyhole } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const allowedTypes = [".pdf", ".docx", ".txt", ".md", ".pptx"];
const premiumTypes = [".docx", ".txt", ".md", ".pptx"];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [docId, setDocId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!file) return;
    setStatus("processing");
    setFeedback("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("done");
        setDocId(data.documentId);
      } else if (data.code === "PREMIUM_REQUIRED") {
        setStatus("idle");
        setShowPremiumModal(true);
      } else {
        setStatus("error");
        setFeedback(data.error || "Parsing or summary generation failed.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setFeedback("Network error uploading document.");
    }
  };

  const processFileSelection = (selectedFile: File | null) => {
    setFeedback("");
    setStatus("idle");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const fileName = selectedFile.name.toLowerCase();
    const hasAllowedType = allowedTypes.some((type) => fileName.endsWith(type));
    const isPremiumType = premiumTypes.some((type) => fileName.endsWith(type));

    if (!hasAllowedType) {
      setFile(null);
      setStatus("error");
      setFeedback("Choose a PDF, DOCX, TXT, MD, or PPTX file.");
      return;
    }

    setFile(selectedFile);
    // Note: API still enforces limits, but we let them select it first.
    // If it's a premium type and they hit submit, the API will return PREMIUM_REQUIRED.
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFileSelection(droppedFile);
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b] sm:p-6">
          <div>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300 tracking-wide uppercase">Workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Turn study material into learning assets.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Upload PDF, DOCX, PPTX, MD, and TXT notes to extract text, generate structured summaries, and prepare AI chat context.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <motion.div 
              initial={false}
              animate={{ 
                scale: isDragging ? 1.02 : 1, 
                borderColor: isDragging ? "#3b82f6" : "var(--border-color)",
                backgroundColor: isDragging ? "var(--bg-active)" : "var(--bg-idle)"
              }}
              className="relative"
              style={{
                '--border-color': 'rgba(148, 163, 184, 0.4)',
                '--bg-active': 'rgba(59, 130, 246, 0.05)',
                '--bg-idle': 'rgba(248, 250, 252, 0.5)'
              } as CSSProperties}
            >
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                htmlFor="material"
                className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-blue-500 hover:bg-blue-50/50 dark:hover:border-blue-400 dark:hover:bg-blue-900/10"
              >
                <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
                  <UploadCloud className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="mt-5 text-xl font-bold text-slate-700 dark:text-slate-200">
                  {isDragging ? "Drop file here" : "Click or drag file to upload"}
                </span>
                <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  PDF, DOCX, PPTX, MD, or TXT up to 25MB
                </span>
                <input
                  id="material"
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.pptx"
                  className="sr-only"
                  ref={fileInputRef}
                  onChange={(event) => processFileSelection(event.target.files?.[0] || null)}
                />
              </label>
            </motion.div>

            {status === "error" && (
              <StateMessage title="File cannot be processed" description={feedback} icon={AlertTriangle} />
            )}

            <AnimatePresence>
              {file && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#1a1d23]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{file.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {Math.max(1, Math.round(file.size / 1024))} KB
                      </p>
                    </div>
                  </div>
                  {status === "idle" && (
                    <button type="button" onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  )}
                  {status === "done" && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
                  {status === "processing" && <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!file || status === "processing" || status === "done"}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "processing" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
              )}
              {status === "processing" ? "Processing with AI..." : "Analyze document"}
            </button>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#15171b]">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Expected output</h2>
            <div className="mt-5 space-y-4">
              {["Clean text extraction", "Structured Notion-like study summary", "Intelligent Quiz context", "Smart Chat retrieval"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {!file && status === "idle" && (
            <StateMessage title="No file selected" description="Choose a study file to begin document processing." icon={FileText} />
          )}

          {status === "done" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10"
            >
              <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">Document analyzed</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                Your document is saved with extracted text and a highly-structured premium summary.
              </p>
              <div className="mt-5 flex gap-3">
                <Link href="/dashboard" className="flex-1 text-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800">
                  Dashboard
                </Link>
                <Link href={docId ? `/chat?docId=${docId}` : "/chat"} className="flex-1 text-center rounded-lg border border-emerald-300 px-4 py-2.5 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:bg-emerald-900/20">
                  Chat Now
                </Link>
              </div>
            </motion.div>
          )}
        </aside>
      </div>

      {/* Premium Upsell Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowPremiumModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#1a1d23]"
            >
              <div className="absolute right-4 top-4">
                <button onClick={() => setShowPremiumModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <LockKeyhole className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">This file type is available on StudyMind Premium.</h2>
                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Upgrade to unlock DOCX, TXT, PowerPoint, Markdown, unlimited file sizes, unlimited AI conversations, and advanced learning tools.
                </p>
                
                <div className="mt-8 flex flex-col gap-3">
                  <Link href="/premium" className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white transition hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Upgrade to Premium
                  </Link>
                  <button onClick={() => setShowPremiumModal(false)} className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                    Continue with PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
