import AdminNav, { AdminSectionHeader, EmptyAdminState } from "@/components/AdminNav";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { formatAdminDate, requireAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { Award, BarChart3, FileQuestion, TrendingDown } from "lucide-react";

type StoredQuestion = {
  type?: string;
};

function getQuestionCount(questions: unknown) {
  return Array.isArray(questions) ? questions.length : 0;
}

function getQuestionMix(questions: unknown) {
  if (!Array.isArray(questions)) {
    return "Unknown";
  }

  const counts = questions.reduce<Record<string, number>>((acc, question) => {
    const type = typeof (question as StoredQuestion).type === "string" ? (question as StoredQuestion).type! : "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");
}

export default async function AdminQuizzesPage() {
  await requireAdminUser();

  const [quizCount, resultCount, quizzes, recentResults] = await Promise.all([
    prisma.quiz.count(),
    prisma.quizResult.count(),
    prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        questions: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        document: {
          select: {
            title: true,
            fileType: true,
          },
        },
        quizResults: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            score: true,
            total: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            quizResults: true,
          },
        },
      },
    }),
    prisma.quizResult.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        quiz: {
          select: {
            title: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const percentages = recentResults.map((result) => result.total > 0 ? (result.score / result.total) * 100 : 0);
  const averageScore = percentages.length
    ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
    : 0;
  const lowScoreCount = percentages.filter((percentage) => percentage < 60).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <AdminSectionHeader
          eyebrow="Admin / Quizzes"
          title="Quiz operations"
          description="Review generated quizzes, question mix, attempt volume, and recent scores to spot weak study outcomes."
        />

        <AdminNav active="/admin/quizzes" />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Generated quizzes" value={quizCount} icon={FileQuestion} />
          <StatCard label="Attempts" value={resultCount} icon={BarChart3} />
          <StatCard label="Recent average" value={`${averageScore}%`} icon={Award} />
          <StatCard label="Recent low scores" value={lowScoreCount} icon={TrendingDown} detail="Below 60%" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <h2 className="font-bold">Generated quizzes</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest 50 generated or regenerated quiz sets.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Quiz</th>
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-5 py-3">Document</th>
                    <th className="px-5 py-3">Questions</th>
                    <th className="px-5 py-3">Mix</th>
                    <th className="px-5 py-3">Attempts</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id}>
                      <td className="px-5 py-4">
                        <p className="line-clamp-1 font-bold">{quiz.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Last scores: {quiz.quizResults.length > 0
                            ? quiz.quizResults.map((result) => `${result.total > 0 ? Math.round((result.score / result.total) * 100) : 0}%`).join(", ")
                            : "No attempts"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p>{quiz.user.name || "Unnamed user"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{quiz.user.email || "No email"}</p>
                      </td>
                      <td className="px-5 py-4">
                        {quiz.document ? (
                          <>
                            <p className="line-clamp-1">{quiz.document.title}</p>
                            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{quiz.document.fileType}</p>
                          </>
                        ) : "No document"}
                      </td>
                      <td className="px-5 py-4">{getQuestionCount(quiz.questions)}</td>
                      <td className="px-5 py-4">{getQuestionMix(quiz.questions)}</td>
                      <td className="px-5 py-4">{quiz._count.quizResults}</td>
                      <td className="px-5 py-4">{formatAdminDate(quiz.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {quizzes.length === 0 && <EmptyAdminState message="No quizzes found." />}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <h2 className="font-bold">Recent attempts</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest submitted results.</p>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentResults.map((result) => {
                const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

                return (
                  <div key={result.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-bold">{result.quiz.title}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {result.quiz.user.name || result.quiz.user.email || "Unknown user"}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">{formatAdminDate(result.createdAt)}</p>
                      </div>
                      <span className={`rounded-md px-2 py-1 text-xs font-bold ${
                        percentage >= 80
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : percentage >= 60
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                      }`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {recentResults.length === 0 && <EmptyAdminState message="No quiz attempts yet." />}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
