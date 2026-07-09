import AppShell from "@/components/AppShell";
import { authOptions } from "@/lib/auth";
import { FREE_AI_ACTION_LIMIT, FREE_TRIAL_DAYS, getUserEntitlement } from "@/lib/subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckCircle2, CreditCard, LockKeyhole, Sparkles } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import PremiumCheckoutButtons from "@/components/PremiumCheckoutButtons";

export default async function PremiumPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      plan: true,
      premiumUntil: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const entitlement = await getUserEntitlement(user.id);
  if (!entitlement) {
    redirect("/login");
  }

  const usagePercent = entitlement.isPremium
    ? 100
    : Math.min(100, Math.round((entitlement.usedActions / FREE_AI_ACTION_LIMIT) * 100));

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="grid gap-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b] sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Premium subscription</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Keep StudyMind working after your free access ends.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Free accounts include {FREE_TRIAL_DAYS} days and {FREE_AI_ACTION_LIMIT} AI actions for uploads, quiz generation, and chat prompts. Premium keeps those tools available without the free quota.
            </p>
            {!entitlement.isPremium ? (
              <PremiumCheckoutButtons />
            ) : null}
            <div className="mt-3">
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">
                Back to workspace
              </Link>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-5 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Current access</p>
                <p className="mt-1 text-2xl font-bold">{entitlement.isPremium ? "Premium" : "Free"}</p>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-lg ${entitlement.canUseAi ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                {entitlement.canUseAi ? <Sparkles className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
              </span>
            </div>
            <div className="mt-5 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${usagePercent}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {entitlement.isPremium
                ? "Premium AI access is active."
                : `${entitlement.remainingActions} free AI actions remaining. Trial ends ${entitlement.trialEndsAt.toLocaleDateString()}.`}
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            "Unlimited document summaries",
            "Unlimited grounded AI chat",
            "Unlimited quiz generation",
            "Progress analytics from real study history",
            "Priority access to new learning tools",
            "Admin-ready account controls",
          ].map((feature) => (
            <div key={feature} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#15171b]">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{feature}</p>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
