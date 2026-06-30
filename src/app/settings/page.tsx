"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { User, Shield, Moon, Bell, BrainCircuit } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState(true);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    // Standard visual class manipulation for HTML root element
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Account Settings</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Manage your AI preferences, dark/light styling modes, and account statistics.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
        {/* User Card */}
        <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 rounded-full">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white">{session?.user?.name || "Student"}</h3>
            <p className="text-sm text-neutral-400">{session?.user?.email}</p>
          </div>
        </div>

        {/* Configuration settings options */}
        <div className="space-y-4 pt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* Appearance Toggle */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white text-sm">Dark Mode</p>
                <p className="text-xs text-neutral-400">Toggle dark mode visual layout</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-neutral-200 dark:bg-indigo-600 transition-colors"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                theme === "dark" ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          {/* AI Settings Info */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white text-sm">AI Recommendation Engine</p>
                <p className="text-xs text-neutral-400">Always optimize study recommendations based on performance</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full">
              Active
            </span>
          </div>

          {/* Smart Alerts */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-pink-500" />
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white text-sm">Study Reminder Alerts</p>
                <p className="text-xs text-neutral-400">Reminders when a target topic study date is coming up</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? "bg-indigo-600" : "bg-neutral-200"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          {/* Security */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white text-sm">Privacy & Security</p>
                <p className="text-xs text-neutral-400">Isolated database row encryption activated</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-full">
              Secured
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
