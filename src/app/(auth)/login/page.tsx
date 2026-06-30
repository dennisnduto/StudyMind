"use client";

import { BrainCircuit, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("student@studymind.ai");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setIsLoading(false);
    if (result?.error) {
      setError("Backend authentication is not connected yet. Use the demo workspace from the home page.");
      return;
    }
    router.push("/dashboard");
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
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in once the backend auth service is ready.</p>
        </div>
        {error && <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">
            Email
            <input className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-normal dark:border-slate-800 dark:bg-slate-900" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-bold">
            Password
            <input className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-normal dark:border-slate-800 dark:bg-slate-900" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
          </label>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700" type="submit">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          New here? <Link className="font-bold text-blue-700 dark:text-blue-300" href="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
