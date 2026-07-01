import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { AlertTriangle, Award, BarChart3, BookOpen, CalendarDays, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      documents: true,
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

  const dbQuizResults = await prisma.quizResult.findMany({
    where: {
      quiz: {
        userId: user.id,
      },
    },
    orderBy: {
      createdAt: "asc", // Chart reads chronological order (oldest to newest)
    },
    include: {
      quiz: true,
    },
    take: 10,
  });

  const quizResults = dbQuizResults.map((r) => ({
    id: r.id,
    quizTitle: r.quiz.title,
    score: r.score,
    total: r.total,
    percentage: Math.round((r.score / r.total) * 100),
    createdAt: r.createdAt.toISOString(),
  }));

  const weakResults = quizResults.filter((result) => result.percentage < 70);
  
  const metrics = [
    { label: "Uploaded materials", value: stats.totalUploads, icon: BookOpen },
    { label: "Quizzes completed", value: stats.totalQuizzes, icon: BarChart3 },
    { label: "Average score", value: `${Math.round(stats.averageScore)}%`, icon: Award },
    { label: "Active days", value: stats.studyFrequency, icon: CalendarDays },
  ];

  // Safeguard points for SVG chart based on results count
  let points = "";
  if (quizResults.length > 1) {
    points = quizResults
      .map((result, index) => `${(index / (quizResults.length - 1)) * 600},${230 - result.percentage * 1.9}`)
      .join(" ");
  } else if (quizResults.length === 1) {
    points = `0,${230 - quizResults[0].percentage * 1.9} 600,${230 - quizResults[0].percentage * 1.9}`;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Study analytics"
          title="Progress you can act on."
          description="Track learning activity, quiz accuracy, and recommended next actions powered by your study history."
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.7fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b]">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Quiz performance</h2>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-6 h-72">
              {quizResults.length > 0 ? (
                <svg viewBox="0 0 600 260" className="h-full w-full overflow-visible">
                  {[40, 100, 160, 220].map((y) => (
                    <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                  ))}
                  {points && (
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />
                  )}
                  {quizResults.map((result, index) => {
                    const cx = quizResults.length > 1 ? (index / (quizResults.length - 1)) * 600 : 300;
                    return (
                      <circle key={result.id} cx={cx} cy={230 - result.percentage * 1.9} r="7" fill="#10b981" />
                    );
                  })}
                </svg>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                  Take some quizzes to view your progress trend chart.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold">Recommendation</h2>
            </div>
            {quizResults.length === 0 ? (
              <div className="mt-5 rounded-lg bg-blue-50 p-4 dark:bg-blue-500/10">
                <p className="font-bold text-blue-950 dark:text-blue-200">Start practicing</p>
                <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-300">
                  You haven&apos;t taken any quizzes yet. Upload a document to automatically generate study questions.
                </p>
              </div>
            ) : weakResults.length > 0 ? (
              <div className="mt-5 rounded-lg bg-amber-50 p-4 dark:bg-amber-500/10">
                <p className="font-bold text-amber-900 dark:text-amber-200">Review low scoring topics</p>
                <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300">
                  Your lowest score is {Math.min(...weakResults.map(r => r.percentage))}%. Review the summary of &quot;{weakResults[0].quizTitle}&quot;, start a chat session to clarify doubts, then try again.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-500/10">
                <p className="font-bold text-emerald-900 dark:text-emerald-200">Strong progress</p>
                <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-300">Keep expanding your study set with new materials and quizzes.</p>
              </div>
            )}
            <Link href="/quiz" className="mt-5 inline-flex w-full justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
              Practice quizzes
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
