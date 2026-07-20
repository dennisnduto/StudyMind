import AdminNav, { AdminSectionHeader, EmptyAdminState } from "@/components/AdminNav";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { formatAdminDate, getPlanLabel, requireAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { getTrialEndsAt } from "@/lib/subscription";
import { Crown, ShieldCheck, UserCheck, Users } from "lucide-react";

export default async function AdminUsersPage() {
  await requireAdminUser();

  const now = new Date();
  const [totalUsers, adminCount, premiumCount, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({
      where: {
        plan: "PREMIUM",
        OR: [{ premiumUntil: null }, { premiumUntil: { gt: now } }],
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        premiumUntil: true,
        createdAt: true,
        studyStats: {
          select: {
            averageScore: true,
            lastStudiedAt: true,
          },
        },
        _count: {
          select: {
            documents: true,
            quizzes: true,
            chatSessions: true,
            flashcardDecks: true,
          },
        },
      },
    }),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <AdminSectionHeader
          eyebrow="Admin / Users"
          title="User management"
          description="Review account roles, subscription status, trial windows, and learning activity across the platform."
        />

        <AdminNav active="/admin/users" />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total users" value={totalUsers} icon={Users} />
          <StatCard label="Admins" value={adminCount} icon={ShieldCheck} />
          <StatCard label="Premium users" value={premiumCount} icon={Crown} />
          <StatCard label="Recent list" value={users.length} icon={UserCheck} detail="Showing latest 50" />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-bold">Accounts</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest users first, with enough context to spot inactive or misconfigured accounts.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Trial ends</th>
                  <th className="px-5 py-3">Study assets</th>
                  <th className="px-5 py-3">Average</th>
                  <th className="px-5 py-3">Last studied</th>
                  <th className="px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {users.map((user) => {
                  const trialEndsAt = getTrialEndsAt(user.createdAt);
                  const planLabel = getPlanLabel(user);

                  return (
                    <tr key={user.id}>
                      <td className="px-5 py-4">
                        <p className="font-bold">{user.name || "Unnamed user"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email || "No email"}</p>
                      </td>
                      <td className="px-5 py-4">{user.role}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-md px-2 py-1 text-xs font-bold ${
                          planLabel === "Premium"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : planLabel === "Expired premium"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {planLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">{formatAdminDate(trialEndsAt)}</td>
                      <td className="px-5 py-4">
                        {user._count.documents} docs, {user._count.quizzes} quizzes, {user._count.flashcardDecks} decks
                      </td>
                      <td className="px-5 py-4">{Math.round(user.studyStats?.averageScore || 0)}%</td>
                      <td className="px-5 py-4">{formatAdminDate(user.studyStats?.lastStudiedAt)}</td>
                      <td className="px-5 py-4">{formatAdminDate(user.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <EmptyAdminState message="No users found." />}
        </section>
      </div>
    </AppShell>
  );
}
