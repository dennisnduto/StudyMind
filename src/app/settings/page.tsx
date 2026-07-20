"use client";

import AppShell from "@/components/AppShell";
import { Bell, BrainCircuit, Moon, Shield, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

const preferencesStorageKey = "studymind-preferences";
const defaultPreferences = {
  notifications: true,
  adaptivePlan: true,
};

function readPreferences() {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    const stored = window.localStorage.getItem(preferencesStorageKey);
    if (!stored) {
      return defaultPreferences;
    }

    const parsed = JSON.parse(stored) as Partial<typeof defaultPreferences>;
    return {
      notifications: typeof parsed.notifications === "boolean" ? parsed.notifications : defaultPreferences.notifications,
      adaptivePlan: typeof parsed.adaptivePlan === "boolean" ? parsed.adaptivePlan : defaultPreferences.adaptivePlan,
    };
  } catch {
    return defaultPreferences;
  }
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => {
    window.localStorage.setItem(preferencesStorageKey, JSON.stringify(preferences));
  }, [preferences]);

  const togglePreference = (key: keyof typeof defaultPreferences) => {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b] sm:p-6">
          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Settings</p>
          <h1 className="mt-2 text-3xl font-bold">Tune your study workspace.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Choose lightweight preferences for reminders and study recommendations on this device.
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
          {[
            { icon: BrainCircuit, title: "Adaptive suggestions", detail: "Prioritize next actions from your recent materials and quiz outcomes.", enabled: preferences.adaptivePlan, onClick: () => togglePreference("adaptivePlan") },
            { icon: Bell, title: "Reminder nudges", detail: "Show study reminder prompts inside your workspace.", enabled: preferences.notifications, onClick: () => togglePreference("notifications") },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center justify-between gap-4 border-b border-slate-200 p-5 last:border-b-0 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-bold">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.detail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={item.onClick}
                  className={`flex h-7 w-12 items-center rounded-full p-1 transition ${item.enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}
                  aria-label={item.title}
                >
                  <span className={`h-5 w-5 rounded-full bg-white transition ${item.enabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Shield, title: "Auth", detail: "NextAuth ready" },
            { icon: Moon, title: "Theme", detail: "Use the header toggle" },
            { icon: SlidersHorizontal, title: "Preferences", detail: "Saved locally" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b]">
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                <h2 className="mt-4 font-bold">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.detail}</p>
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
