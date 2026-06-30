"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "parsing" | "summarizing" | "completed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [summaryData, setSummaryData] = useState("");
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus("idle");
      setErrorMessage("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setUploadStatus("parsing");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Parsing step
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.ok ? await res.json() : null;

      if (!res.ok || !data?.success) {
        setUploadStatus("error");
        setErrorMessage(data?.error || "Failed to process the document.");
        setIsLoading(false);
        return;
      }

      setUploadStatus("summarizing");
      
      // Simulate/wait for summarization details
      setSummaryData(data.summary);
      setUploadStatus("completed");
    } catch (err) {
      setUploadStatus("error");
      setErrorMessage("Network error occurred during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Upload Study Material</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Upload PDFs, text files, or images of study material to extract, parse and summarize using AI.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
        {uploadStatus === "completed" ? (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Processing Complete!</h2>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                Your file has been successfully uploaded, parsed, and summarized. You can now use it in chats or practice quizzes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  setFile(null);
                  setUploadStatus("idle");
                }}
                className="px-6 py-3 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Upload Another File
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-6">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-4 block">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {file ? file.name : "Click to upload files"}
                  </p>
                  <p className="text-sm text-neutral-400">
                    PDF, TXT, PNG, JPG, or WEBP up to 10MB
                  </p>
                </div>
              </label>
            </div>

            {uploadStatus === "error" && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-xl">
                {errorMessage}
              </div>
            )}

            {isLoading && (
              <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-2xl flex items-center gap-4">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                <div className="flex-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {uploadStatus === "parsing" ? (
                    <p className="font-medium animate-pulse">Extracting text and details...</p>
                  ) : (
                    <p className="font-medium animate-pulse">Formulating AI summaries and definitions...</p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing File...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Document
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
