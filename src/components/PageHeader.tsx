import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export default function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
