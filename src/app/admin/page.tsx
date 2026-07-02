import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isAdminUser } from "@/lib/subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BarChart3, Crown, FileText, ShieldCheck, Users } from "lucide-react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      email: true,
      role: true,
    },
  });

  if (!currentUser || !isAdminUser(currentUser)) {
    redirect("/dashboard");
  }

  const [userCount, premiumCount, documentCount, quizCount, users, recentDocuments] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: "PREMIUM" } }),
    prisma.document.count(),
    prisma.quiz.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
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
      take: 8,
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
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b] sm:p-6">
          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">StudyMind operations.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Monitor users, subscriptions, uploaded materials, and quiz generation from the live database.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Users" value={userCount} icon={Users} />
          <StatCard label="Premium" value={premiumCount} icon={Crown} />
          <StatCard label="Documents" value={documentCount} icon={FileText} />
          <StatCard label="Quizzes" value={quizCount} icon={BarChart3} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
            <div className="flex items-center gap-2 border-b border-slate-200 p-5 dark:border-slate-800">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold">Recent users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Materials</th>
                    <th className="px-5 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-5 py-4">
                        <p className="font-bold">{user.name || "Unnamed user"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </td>
                      <td className="px-5 py-4">{user.role}</td>
                      <td className="px-5 py-4">{user.plan}</td>
                      <td className="px-5 py-4">{user._count.documents} docs, {user._count.quizzes} quizzes</td>
                      <td className="px-5 py-4">{user.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <h2 className="font-bold">Recent materials</h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentDocuments.map((document) => (
                <div key={document.id} className="p-5">
                  <p className="font-bold">{document.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {document.fileType.toUpperCase()} by {document.user.name || document.user.email || "Unknown user"}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">{document.createdAt.toLocaleDateString()}</p>
                </div>
              ))}
              {recentDocuments.length === 0 && (
                <div className="p-5 text-sm text-slate-500 dark:text-slate-400">No uploaded materials yet.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
