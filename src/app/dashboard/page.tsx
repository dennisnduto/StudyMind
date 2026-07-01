import Link from "next/link";
import StateMessage from "@/components/StateMessage";
import StatCard from "@/components/StatCard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      studyStats: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const stats = user.studyStats || {
    totalUploads: user.documents.length,
    totalQuizzes: 0,
    averageScore: 0,
    studyFrequency: 0,
  };

  const cards = [
    { label: "Materials", value: stats.totalUploads, icon: BookOpen, tone: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
    { label: "Quizzes", value: stats.totalQuizzes, icon: Sparkles, tone: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
    { label: "Avg score", value: `${Math.round(stats.averageScore)}%`, icon: Target, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
    { label: "Study days", value: stats.studyFrequency, icon: Clock3, tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  ];

  const dbQuizResults = await prisma.quizResult.findMany({
    where: {
      quiz: {
        userId: user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      quiz: true,
    },
    take: 5,
  });

  const quizResults = dbQuizResults
    .map((r) => ({
      id: r.id,
      quizTitle: r.quiz.title,
      score: r.score,
      total: r.total,
      percentage: Math.round((r.score / r.total) * 100),
    }))
    .reverse(); // Chronological for trending chart

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.4fr_0.8fr] lg:p-8">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Today&apos;s study command center</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">Keep every note, chat, quiz, and insight in one focused workspace.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Welcome back! Upload notes, generate quizzes, chat with your documents, and track your performance trends in real-time.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/upload" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Upload material
              </Link>
              <Link href="/chat" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">
                <MessageSquareText className="h-4 w-4" />
                Ask your notes
              </Link>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Study planner</p>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-5 space-y-4">
              {["Review cell signaling summary", "Generate economics quiz", "Chat through integration mistakes"].map((task, index) => (
                <div key={task} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.75fr]">
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
            <div>
              <h2 className="font-bold">Recent study materials</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Documents you uploaded for analysis.</p>
            </div>
            <Link href="/upload" className="text-sm font-bold text-blue-700 dark:text-blue-300">Add new</Link>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {user.documents.length > 0 ? (
              user.documents.map((doc) => (
                <div key={doc.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="flex gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-950 dark:text-white">{doc.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">{doc.summary}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/chat?docId=${doc.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">Chat</Link>
                    <Link href={`/quiz?docId=${doc.id}`} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">Quiz</Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5">
                <StateMessage
                  title="No study materials yet"
                  description="Upload your first document to unlock summaries, chat context, quizzes, and progress tracking."
                  icon={FileText}
                  action={<Link href="/upload" className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Upload material</Link>}
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b]">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Performance trend</h2>
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          {quizResults.length > 0 ? (
            <div className="mt-6 flex h-48 items-end gap-3">
              {quizResults.map((result) => (
                <div key={result.id} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-36 w-full items-end rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
                    <div className="w-full rounded-md bg-emerald-500" style={{ height: `${result.percentage}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{result.percentage}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex h-48 items-center justify-center text-center text-sm text-slate-400">
              No quiz data available yet.
            </div>
          )}
          <Link href="/analytics" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300">
            View analytics
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
