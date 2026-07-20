import Link from "next/link";
import { CreditCard, FileQuestion, FileText, LayoutDashboard, Users } from "lucide-react";

const adminNavItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Documents", href: "/admin/documents", icon: FileText },
  { label: "Quizzes", href: "/admin/quizzes", icon: FileQuestion },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
];

export default function AdminNav({ active }: { active: string }) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-[#15171b]">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === active;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b] sm:p-6">
      <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
    </section>
  );
}

export function EmptyAdminState({ message }: { message: string }) {
  return (
    <div className="p-5 text-sm text-slate-500 dark:text-slate-400">
      {message}
    </div>
  );
}
