"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Sparkles, 
  MessageSquare, 
  Plus, 
  BookOpen, 
  Award, 
  Calendar, 
  Eye, 
  Trash2,
  Brain
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  fileType: string;
  createdAt: string;
}

interface Stats {
  totalUploads: number;
  totalQuizzes: number;
  averageScore: number;
  studyFrequency: number;
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState<{title: string, summary: string} | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const viewDocSummary = async (docId: string) => {
    setSelectedSummary(null);
    try {
      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, message: "Generate/get summary" })
      });
      // We can also retrieve it directly from DB (if parsed)
      const docRes = await fetch("/api/analytics");
      const data = await docRes.json();
      const doc = data.documents.find((d: any) => d.id === docId);
      // For fast demonstration, retrieve mock summary if not parsed
      setSelectedSummary({
        title: doc?.title || "Document Summary",
        summary: doc?.summary || "No summary was generated yet. Try checking back in a few moments, or start chatting directly!"
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Study Mind Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Access your AI generated learning insights and study notes.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Upload New Material
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Study Materials", value: stats?.totalUploads || 0, icon: <BookOpen className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50 dark:bg-blue-950/20" },
          { label: "Quizzes Practiced", value: stats?.totalQuizzes || 0, icon: <Award className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50 dark:bg-emerald-950/20" },
          { label: "Average Score", value: `${stats?.averageScore || 0}%`, icon: <Award className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50 dark:bg-purple-950/20" },
          { label: "Study Days Tracker", value: stats?.studyFrequency || 1, icon: <Calendar className="w-5 h-5 text-pink-500" />, bg: "bg-pink-50 dark:bg-pink-950/20" }
        ].map((item, idx) => (
          <div key={idx} className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
            <div className={`p-3.5 rounded-xl ${item.bg} flex items-center justify-center`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{item.label}</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document list (Left/Center) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Uploaded Materials
            </h2>

            {documents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <p className="font-medium text-neutral-600 dark:text-neutral-400">No documents uploaded yet</p>
                <p className="text-sm text-neutral-400 mt-1 mb-4">Upload PDFs, TXT, or images to begin your learning session</p>
                <Link
                  href="/upload"
                  className="px-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200"
                >
                  Upload File
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {documents.map((doc) => (
                  <div key={doc.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-900 dark:text-white leading-tight">{doc.title}</h4>
                        <span className="text-xs text-neutral-400 capitalize mt-1 inline-block">
                          {doc.fileType} • {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewDocSummary(doc.id)}
                        className="p-2 text-neutral-400 hover:text-indigo-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        title="View Summary"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/chat?docId=${doc.id}`}
                        className="p-2 text-neutral-400 hover:text-purple-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        title="AI Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/quiz?docId=${doc.id}`}
                        className="p-2 text-neutral-400 hover:text-pink-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        title="Generate Quiz"
                      >
                        <Sparkles className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Insight/Summary Panel (Right) */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm min-h-[300px]">
            <h3 className="text-lg font-bold mb-3 text-neutral-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-pink-500" />
              AI Material Summary
            </h3>
            
            {selectedSummary ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedSummary.title}</h4>
                <div className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                  {selectedSummary.summary}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-48 text-neutral-400">
                <Sparkles className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                <p className="text-sm">Click the eye icon next to any document to view its AI summary here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
