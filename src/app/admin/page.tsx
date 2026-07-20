import AdminNav, { AdminSectionHeader, EmptyAdminState } from "@/components/AdminNav";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { formatAdminDate, requireAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { FREE_AI_ACTION_LIMIT, FREE_TRIAL_DAYS } from "@/lib/subscription";
import { BarChart3, Clock3, Crown, FileQuestion, FileText, MessageSquareText, Users } from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  await requireAdminUser();

  const now = new Date();
  const trialStartCutoff = new Date(now);
  trialStartCutoff.setDate(trialStartCutoff.getDate() - FREE_TRIAL_DAYS);

  const [
    userCount,
    premiumCount,
    activeTrialCount,
    documentCount,
    quizCount,
    messageCount,
    recentUsers,
    recentDocuments,
    recentQuizResults,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        plan: "PREMIUM",
        OR: [{ premiumUntil: null }, { premiumUntil: { gt: now } }],
      },
    }),
    prisma.user.count({
      where: {
        plan: "FREE",
        createdAt: { gt: trialStartCutoff },
      },
    }),
    prisma.document.count(),
    prisma.quiz.count(),
    prisma.message.count({ where: { role: "user" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            documents: true,
            quizzes: true,
          },
        },
      },
    }),
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        fileType: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.quizResult.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
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

  const cards = [
    { label: "Users", value: userCount, icon: Users },
    { label: "Premium", value: premiumCount, icon: Crown },
    { label: "Active trials", value: activeTrialCount, icon: Clock3 },
    { label: "Documents", value: documentCount, icon: FileText },
    { label: "Quizzes", value: quizCount, icon: FileQuestion },
    { label: "Chat prompts", value: messageCount, icon: MessageSquareText },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <AdminSectionHeader
          eyebrow="Admin"
          title="Operations overview"
          description={`Monitor growth, study activity, and subscription health. Free users get ${FREE_TRIAL_DAYS} trial days, then ${FREE_AI_ACTION_LIMIT} starter AI actions.`}
        />

        <AdminNav active="/admin" />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 className="font-bold">Recent users</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Newest accounts and their activity counts.</p>
              </div>
              <Link href="/admin/users" className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-300">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Activity</th>
                    <th className="px-5 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-5 py-4">
                        <p className="font-bold">{user.name || "Unnamed user"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email || "No email"}</p>
                      </td>
                      <td className="px-5 py-4">{user.role}</td>
                      <td className="px-5 py-4">{user.plan}</td>
                      <td className="px-5 py-4">{user._count.documents} docs, {user._count.quizzes} quizzes</td>
                      <td className="px-5 py-4">{formatAdminDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
                <div>
                  <h2 className="font-bold">Recent materials</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest uploads by owner.</p>
                </div>
                <Link href="/admin/documents" className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-300">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {recentDocuments.map((document) => (
                  <div key={document.id} className="p-5">
                    <p className="line-clamp-1 font-bold">{document.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {document.fileType.toUpperCase()} by {document.user.name || document.user.email || "Unknown user"}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{formatAdminDate(document.createdAt)}</p>
                  </div>
                ))}
                {recentDocuments.length === 0 && <EmptyAdminState message="No uploaded materials yet." />}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
                <div>
                  <h2 className="font-bold">Recent quiz results</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Newest scored practice sessions.</p>
                </div>
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {recentQuizResults.map((result) => (
                  <div key={result.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-bold">{result.quiz.title}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {result.quiz.user.name || result.quiz.user.email || "Unknown user"}
                        </p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800">
                        {result.total > 0 ? Math.round((result.score / result.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
                {recentQuizResults.length === 0 && <EmptyAdminState message="No quiz results yet." />}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
