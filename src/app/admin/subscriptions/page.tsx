import AdminNav, { AdminSectionHeader, EmptyAdminState } from "@/components/AdminNav";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { formatAdminDate, getPlanLabel, requireAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { FREE_AI_ACTION_LIMIT, FREE_TRIAL_DAYS, getTrialEndsAt } from "@/lib/subscription";
import { AlertTriangle, Clock3, Crown, CreditCard, TimerReset } from "lucide-react";

function getTrialStatus(createdAt: Date) {
  const trialEndsAt = getTrialEndsAt(createdAt);
  const now = new Date();

  if (trialEndsAt <= now) {
    return { label: "Trial ended", trialEndsAt };
  }

  const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return { label: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`, trialEndsAt };
}

export default async function AdminSubscriptionsPage() {
  await requireAdminUser();

  const now = new Date();
  const trialStartCutoff = new Date(now);
  trialStartCutoff.setDate(trialStartCutoff.getDate() - FREE_TRIAL_DAYS);
  const expiringSoon = new Date(now);
  expiringSoon.setDate(expiringSoon.getDate() + 14);

  const [premiumCount, activeTrialCount, expiredPremiumCount, expiringPremiumCount, users] = await Promise.all([
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
    prisma.user.count({
      where: {
        plan: "PREMIUM",
        premiumUntil: { lte: now },
      },
    }),
    prisma.user.count({
      where: {
        plan: "PREMIUM",
        premiumUntil: {
          gt: now,
          lte: expiringSoon,
        },
      },
    }),
    prisma.user.findMany({
      orderBy: [
        { plan: "desc" },
        { premiumUntil: "asc" },
        { createdAt: "desc" },
      ],
      take: 80,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        premiumUntil: true,
        createdAt: true,
        _count: {
          select: {
            documents: true,
            quizzes: true,
            chatSessions: true,
          },
        },
      },
    }),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <AdminSectionHeader
          eyebrow="Admin / Subscriptions"
          title="Subscription health"
          description={`Review premium access, trial windows, and starter usage context. Current free policy: ${FREE_TRIAL_DAYS} trial days, then ${FREE_AI_ACTION_LIMIT} starter AI actions.`}
        />

        <AdminNav active="/admin/subscriptions" />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active premium" value={premiumCount} icon={Crown} />
          <StatCard label="Active trials" value={activeTrialCount} icon={Clock3} />
          <StatCard label="Expired premium" value={expiredPremiumCount} icon={AlertTriangle} />
          <StatCard label="Expiring soon" value={expiringPremiumCount} icon={TimerReset} detail="Next 14 days" />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
          <div className="flex items-center gap-2 border-b border-slate-200 p-5 dark:border-slate-800">
            <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            <div>
              <h2 className="font-bold">Access states</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest 80 users by plan and renewal status.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Access</th>
                  <th className="px-5 py-3">Premium until</th>
                  <th className="px-5 py-3">Trial status</th>
                  <th className="px-5 py-3">Study activity</th>
                  <th className="px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {users.map((user) => {
                  const planLabel = getPlanLabel(user);
                  const trialStatus = getTrialStatus(user.createdAt);

                  return (
                    <tr key={user.id}>
                      <td className="px-5 py-4">
                        <p className="font-bold">{user.name || "Unnamed user"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email || "No email"}</p>
                      </td>
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
                      <td className="px-5 py-4">{user.plan === "PREMIUM" ? formatAdminDate(user.premiumUntil) : "Not premium"}</td>
                      <td className="px-5 py-4">
                        <p>{trialStatus.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Ends {formatAdminDate(trialStatus.trialEndsAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        {user._count.documents} docs, {user._count.quizzes} quizzes, {user._count.chatSessions} chats
                      </td>
                      <td className="px-5 py-4">{formatAdminDate(user.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <EmptyAdminState message="No subscription records found." />}
        </section>
      </div>
    </AppShell>
  );
}
