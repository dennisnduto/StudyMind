import Link from "next/link";
import StatCard from "@/components/StatCard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getUserEntitlement } from "@/lib/subscription";
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
  Layers,
  BrainCircuit,
  UploadCloud,
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
        take: 4,
      },
      studyStats: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const entitlement = await getUserEntitlement(user.id);
  const isPremium = entitlement?.isPremium || false;

  const stats = user.studyStats || {
    totalUploads: user.documents.length,
    totalQuizzes: 0,
    averageScore: 0,
    studyFrequency: 0,
  };

  const cards = [
    { label: "Study Materials", value: stats.totalUploads, icon: BookOpen, tone: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Quizzes Taken", value: stats.totalQuizzes, icon: Target, tone: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
    { label: "Average Score", value: `${Math.round(stats.averageScore)}%`, icon: Sparkles, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { label: "Study Streak", value: stats.studyFrequency, icon: Clock3, tone: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  ];

  const dbQuizResults = await prisma.quizResult.findMany({
    where: { quiz: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    include: { quiz: true },
    take: 7,
  });

  const quizResults = dbQuizResults
    .map((r) => ({
      id: r.id,
      quizTitle: r.quiz.title,
      percentage: r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
    }))
    .reverse();

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b] shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-5">
          <BrainCircuit className="w-64 h-64 text-blue-600" />
        </div>
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_0.8fr] lg:p-10">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400 tracking-wide uppercase">Command Center</p>
                {isPremium && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Premium
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl leading-tight">
                Master your materials faster with AI.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
                Upload your notes, presentations, and readings. StudyMind will instantly generate summaries, flashcards, and practice quizzes to help you ace your exams.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/upload" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-500/20">
                <Plus className="h-4 w-4" />
                Upload Material
              </Link>
              <Link href="/chat" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#1a1d23] dark:text-slate-200 dark:hover:bg-slate-800">
                <MessageSquareText className="h-4 w-4" />
                Ask a Question
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800/50 dark:bg-[#1a1d23]/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Smart Suggestions</p>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <div className="space-y-3">
              {user.documents.length === 0 ? (
                <div className="flex gap-3 items-start">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">1</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Upload your first PDF, DOCX, or PPTX file to get started.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Review the AI summary for <span className="font-semibold text-slate-900 dark:text-slate-300">{user.documents[0].title}</span></p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600 mt-0.5" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Generate a <Link href={`/quiz?docId=${user.documents[0].id}`} className="text-blue-600 dark:text-blue-400 hover:underline">practice quiz</Link> to test your knowledge.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600 mt-0.5" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Review <Link href={`/flashcards?docId=${user.documents[0].id}`} className="text-blue-600 dark:text-blue-400 hover:underline">flashcards</Link> for spaced repetition.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        
        {/* Recent Documents */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b] shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Workspaces</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pick up where you left off</p>
            </div>
            <Link href="/upload" className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
              Upload New <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
            {user.documents.length > 0 ? (
              user.documents.map((doc) => (
                <div key={doc.id} className="group rounded-xl p-4 transition-colors hover:bg-slate-50 dark:hover:bg-[#1a1d23]">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate pr-4">{doc.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {doc.summary || "Summary generated by AI for quick review."}
                      </p>
                      
                      <div className="mt-4 flex flex-wrap gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Link href={`/chat?docId=${doc.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:text-blue-400">
                          <MessageSquareText className="h-3.5 w-3.5" /> Chat
                        </Link>
                        <Link href={`/quiz?docId=${doc.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-violet-300 hover:text-violet-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400">
                          <Target className="h-3.5 w-3.5" /> Quiz
                        </Link>
                        <Link href={`/flashcards?docId=${doc.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400">
                          <Layers className="h-3.5 w-3.5" /> Flashcards
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                  <UploadCloud className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No materials uploaded</h3>
                <p className="mt-2 text-sm text-slate-500">Upload notes to generate study assets.</p>
              </div>
            )}
          </div>
        </div>

        {/* Analytics / Performance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#15171b] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Performance Trend</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your recent quiz scores</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end">
            {quizResults.length > 0 ? (
              <div className="flex h-56 items-end justify-between gap-2">
                {quizResults.map((result, idx) => (
                  <div key={result.id} className="group relative flex flex-1 flex-col items-center justify-end h-full">
                    <div className="absolute bottom-full mb-2 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white group-hover:block z-10 dark:bg-white dark:text-slate-900 shadow-lg">
                      {result.percentage}% - {result.quizTitle}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-white" />
                    </div>
                    <div className="w-full max-w-[40px] rounded-t-lg bg-slate-100 dark:bg-slate-800 flex items-end overflow-hidden">
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-500 ${
                          result.percentage >= 80 ? 'bg-emerald-500' : 
                          result.percentage >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                        }`} 
                        style={{ height: `${Math.max(5, result.percentage)}%` }} 
                      />
                    </div>
                    <span className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center text-center">
                <Target className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No quiz data available.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Take a quiz to see your trends.</p>
              </div>
            )}
          </div>
          
          <Link href="/analytics" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800">
            View Detailed Analytics
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
