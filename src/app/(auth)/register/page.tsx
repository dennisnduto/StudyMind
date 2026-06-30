"use client";

import { BrainCircuit, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
      setError("Registration UI is ready. The backend owner can connect this form to Auth.js and Prisma.");
    }, 500);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fb] px-4 dark:bg-[#101114]">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#15171b]">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <span className="font-bold">StudyMind AI</span>
        </Link>
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Collect the fields needed for the real auth flow.</p>
        </div>
        {error && <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {[
            { label: "Full name", type: "text", placeholder: "Alex Johnson" },
            { label: "Email", type: "email", placeholder: "alex@example.com" },
            { label: "Password", type: "password", placeholder: "Create password" },
          ].map((field) => (
            <label key={field.label} className="block text-sm font-bold">
              {field.label}
              <input className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-normal dark:border-slate-800 dark:bg-slate-900" type={field.type} placeholder={field.placeholder} required />
            </label>
          ))}
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700" type="submit">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </button>
        </form>
        <button onClick={() => router.push("/dashboard")} className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold dark:border-slate-800" type="button">
          Continue to demo workspace
        </button>
        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account? <Link className="font-bold text-blue-700 dark:text-blue-300" href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
