import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type StateMessageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
  iconClassName?: string;
};

export default function StateMessage({
  title,
  description,
  icon: Icon,
  action,
  iconClassName = "",
}: StateMessageProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-[#15171b]">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        <Icon className={`h-6 w-6 ${iconClassName}`} />
      </span>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
