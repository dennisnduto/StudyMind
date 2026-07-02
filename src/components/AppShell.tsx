"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  BarChart3,
  Bell,
  BrainCircuit,
  CreditCard,
  FileQuestion,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UploadCloud,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upload", href: "/upload", icon: UploadCloud },
  { name: "Chat", href: "/chat", icon: MessageSquareText },
  { name: "Quiz", href: "/quiz", icon: FileQuestion },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Premium", href: "/premium", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const sessionUser = session?.user as { name?: string | null; email?: string | null; plan?: string | null; role?: string | null } | undefined;
  const navItems = sessionUser?.role === "ADMIN" ? [...navigation, { name: "Admin", href: "/admin", icon: ShieldCheck }] : navigation;
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const storedTheme = window.localStorage.getItem("studymind-theme");
    return storedTheme ? storedTheme === "dark" : prefersDark;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    window.localStorage.setItem("studymind-theme", nextIsDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", nextIsDark);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950 dark:bg-[#101114] dark:text-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-[#15171b] lg:flex lg:flex-col">
        <Link href="/dashboard" className="flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563eb] text-white">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-bold">StudyMind AI</span>
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Study workspace</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Current plan</p>
          <p className="mt-1 text-sm font-bold">{sessionUser?.plan === "PREMIUM" ? "Premium" : "Free access"}</p>
          <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div className={`h-2 rounded-full ${sessionUser?.plan === "PREMIUM" ? "w-full bg-[#10b981]" : "w-[45%] bg-blue-600"}`} />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{sessionUser?.plan === "PREMIUM" ? "Unlimited AI tools active" : "Upgrade when the free quota ends"}</p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-[#15171b]/90 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563eb] text-white">
                <BrainCircuit className="h-5 w-5" />
              </span>
              <span className="font-bold">StudyMind AI</span>
            </Link>
            <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900 lg:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Search notes, quizzes, summaries...</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="hidden items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {(sessionUser?.name || "S").slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{sessionUser?.name || "Student"}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{sessionUser?.email || "student@studymind.ai"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                aria-label="Sign out"
                className="hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-300 sm:flex"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b] lg:hidden" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-semibold ${
                isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
