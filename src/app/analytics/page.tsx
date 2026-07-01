import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { demoQuizResults, demoStats } from "@/lib/demo-data";
import { AlertTriangle, Award, BarChart3, BookOpen, CalendarDays, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const weakResults = demoQuizResults.filter((result) => result.percentage < 70);
  const metrics = [
    { label: "Uploaded materials", value: demoStats.totalUploads, icon: BookOpen },
    { label: "Quizzes completed", value: demoStats.totalQuizzes, icon: BarChart3 },
    { label: "Average score", value: `${demoStats.averageScore}%`, icon: Award },
    { label: "Active days", value: demoStats.studyFrequency, icon: CalendarDays },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Study analytics"
          title="Progress you can act on."
          description="Track learning activity, quiz accuracy, and recommended next actions. These cards are ready to bind to real analytics endpoints."
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
              <svg viewBox="0 0 600 260" className="h-full w-full overflow-visible">
                {[40, 100, 160, 220].map((y) => (
                  <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                ))}
                <polyline
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={demoQuizResults
                    .map((result, index) => `${(index / (demoQuizResults.length - 1)) * 600},${230 - result.percentage * 1.9}`)
                    .join(" ")}
                />
                {demoQuizResults.map((result, index) => (
                  <circle key={result.id} cx={(index / (demoQuizResults.length - 1)) * 600} cy={230 - result.percentage * 1.9} r="7" fill="#10b981" />
                ))}
              </svg>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold">Recommendation</h2>
            </div>
            {weakResults.length > 0 ? (
              <div className="mt-5 rounded-lg bg-amber-50 p-4 dark:bg-amber-500/10">
                <p className="font-bold text-amber-900 dark:text-amber-200">Review integration methods</p>
                <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300">
                  Your lowest demo score is 60%. Start a chat session, ask for worked examples, then regenerate a quiz.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-500/10">
                <p className="font-bold text-emerald-900 dark:text-emerald-200">Strong progress</p>
                <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-300">Keep expanding your study set with harder materials.</p>
              </div>
            )}
            <Link href="/quiz" className="mt-5 inline-flex w-full justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
              Practice recommended topic
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
