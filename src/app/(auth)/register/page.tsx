"use client";

import { BrainCircuit, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const nextErrors = {
      name: name.trim().length >= 2 ? "" : "Enter your full name.",
      email: emailPattern.test(email.trim()) ? "" : "Enter a valid email address.",
      password: password.length >= 8 ? "" : "Use at least 8 characters.",
    };

    if (nextErrors.name || nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Registration failed.");
          setIsLoading(false);
        } else {
          // Auto sign-in
          const result = await signIn("credentials", { email, password, redirect: false });
          setIsLoading(false);
          if (result?.error) {
            router.push("/login?registered=true");
          } else {
            router.push("/dashboard");
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Network error occurred.");
        setIsLoading(false);
      });
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
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Start a workspace for your notes, quizzes, and progress.</p>
        </div>
        {error && <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">
            Full name
            <input className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-normal dark:border-slate-800 dark:bg-slate-900" type="text" placeholder="Alex Johnson" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(fieldErrors.name)} required />
            {fieldErrors.name && <span className="mt-1 block text-xs font-semibold text-red-600 dark:text-red-300">{fieldErrors.name}</span>}
          </label>
          <label className="block text-sm font-bold">
            Email
            <input className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-normal dark:border-slate-800 dark:bg-slate-900" type="email" placeholder="alex@example.com" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(fieldErrors.email)} required />
            {fieldErrors.email && <span className="mt-1 block text-xs font-semibold text-red-600 dark:text-red-300">{fieldErrors.email}</span>}
          </label>
          <label className="block text-sm font-bold">
            Password
            <input className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-normal dark:border-slate-800 dark:bg-slate-900" type="password" placeholder="Create password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(fieldErrors.password)} minLength={8} required />
            {fieldErrors.password && <span className="mt-1 block text-xs font-semibold text-red-600 dark:text-red-300">{fieldErrors.password}</span>}
          </label>
          <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" type="submit">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account? <Link className="font-bold text-blue-700 dark:text-blue-300" href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
