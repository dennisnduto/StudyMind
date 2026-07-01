import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  detail?: string;
  tone?: string;
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  detail,
  tone = "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      {detail && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>}
    </div>
  );
}
