import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, FileQuestion, FileText, MessageSquareText, UploadCloud } from "lucide-react";
import InfoBanner from "@/components/InfoBanner";

const modules = [
  { title: "Upload materials", detail: "PDF, DOCX, and TXT intake flow.", icon: UploadCloud },
  { title: "AI summaries", detail: "Structured revision notes from documents.", icon: FileText },
  { title: "Document chat", detail: "Ask questions against uploaded content.", icon: MessageSquareText },
  { title: "Quiz generation", detail: "Practice questions with explanations.", icon: FileQuestion },
  { title: "Analytics", detail: "Progress, scores, and recommendations.", icon: BarChart3 },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950 dark:bg-[#101114] dark:text-white">
      <section className="mx-auto grid min-h-screen max-w-7xl content-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <Link href="/" className="mb-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BrainCircuit className="h-6 w-6" />
            </span>
            <span className="text-xl font-bold">StudyMind AI</span>
          </Link>
          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">AI-powered study assistant</p>
          <h1 className="mt-3 max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">StudyMind AI turns notes into summaries, chats, quizzes, and progress insights.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
            Your all-in-one platform to upload study materials, understand them faster, practice actively, and track your progress to ace your exams.
          </p>
          <div className="mt-6">
            <InfoBanner title="Study streak starter" description="Upload one document today and let StudyMind turn it into a summary, chat context, and quiz practice in minutes." />
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
              Sign in
            </Link>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#15171b]">
            <div className="rounded-lg bg-slate-950 p-5 text-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Today&apos;s focus</p>
                  <h2 className="mt-1 text-2xl font-bold">Exam sprint</h2>
                </div>
                <BrainCircuit className="h-8 w-8 text-blue-300" />
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {["12 notes", "18 quizzes", "84% avg"].map((item) => (
                  <div key={item} className="rounded-lg bg-white/10 p-3 text-center text-sm font-bold">{item}</div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <div key={module.title} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    <h3 className="mt-3 font-bold">{module.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{module.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
