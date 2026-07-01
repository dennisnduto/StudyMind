"use client";

import AppShell from "@/components/AppShell";
import StateMessage from "@/components/StateMessage";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Sparkles, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const allowedTypes = [".pdf", ".docx", ".txt"];
const maxFileSize = 25 * 1024 * 1024;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;
    setStatus("processing");
    window.setTimeout(() => setStatus("done"), 900);
  };

  const handleFileChange = (selectedFile: File | null) => {
    setFeedback("");
    setStatus("idle");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const fileName = selectedFile.name.toLowerCase();
    const hasAllowedType = allowedTypes.some((type) => fileName.endsWith(type));

    if (!hasAllowedType) {
      setFile(null);
      setStatus("error");
      setFeedback("Choose a PDF, DOCX, or TXT file.");
      return;
    }

    if (selectedFile.size > maxFileSize) {
      setFile(null);
      setStatus("error");
      setFeedback("Choose a file smaller than 25MB.");
      return;
    }

    setFile(selectedFile);
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b] sm:p-6">
          <div>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Document upload</p>
            <h1 className="mt-2 text-3xl font-bold">Turn study material into learning assets.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Frontend flow supports PDF, DOCX, and TXT. The backend can connect this form to parsing, storage, summarization, and retrieval indexing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label
              htmlFor="material"
              className="flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-400 dark:hover:bg-blue-500/10"
            >
              <UploadCloud className="h-12 w-12 text-blue-600 dark:text-blue-300" />
              <span className="mt-4 text-lg font-bold">{file ? file.name : "Choose a study file"}</span>
              <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">PDF, DOCX, or TXT up to 25MB</span>
              <input
                id="material"
                type="file"
                accept=".pdf,.docx,.txt"
                className="sr-only"
                onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
              />
            </label>

            {status === "error" && (
              <StateMessage title="File cannot be processed" description={feedback} icon={AlertTriangle} />
            )}

            {file && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-bold">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{Math.max(1, Math.round(file.size / 1024))} KB ready to process</p>
                  </div>
                </div>
                {status === "done" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || status === "processing"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {status === "processing" ? "Extracting and summarizing..." : "Analyze document"}
            </button>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b]">
            <h2 className="font-bold">Expected output</h2>
            <div className="mt-4 space-y-3">
              {["Clean extracted text", "Concise study summary", "Quiz-ready concepts", "Chat retrieval context"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {!file && status === "idle" && (
            <StateMessage title="No file selected" description="Choose a study file to preview the document processing flow." icon={FileText} />
          )}

          {status === "done" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <h2 className="font-bold text-emerald-800 dark:text-emerald-200">Frontend preview complete</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                The backend can now return a real document id, summary, and extracted text using this same interaction.
              </p>
              <div className="mt-4 flex gap-2">
                <Link href="/dashboard" className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white">Dashboard</Link>
                <Link href="/chat" className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-bold text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-200">Chat</Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
