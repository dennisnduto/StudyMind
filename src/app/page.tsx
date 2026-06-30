"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BrainCircuit, FileText, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 text-center">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-neutral-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl space-y-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>The Ultimate AI Study Companion</span>
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Master Your Studies with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">StudyMind</span>
        </h1>
        
        <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed">
          Upload your notes, PDFs, or images and let our AI generate summaries, interactive quizzes, and explain complex concepts in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="group flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 py-4 rounded-full font-medium transition-transform hover:scale-105 active:scale-95"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-full font-medium text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-left"
      >
        {[
          {
            icon: <FileText className="w-6 h-6 text-indigo-500" />,
            title: "Instant Summaries",
            desc: "Upload any document and get instant, structured summaries of key points and formulas."
          },
          {
            icon: <BrainCircuit className="w-6 h-6 text-purple-500" />,
            title: "Context-Aware Chat",
            desc: "Ask questions and get answers strictly based on the material in your uploaded notes."
          },
          {
            icon: <Sparkles className="w-6 h-6 text-pink-500" />,
            title: "Auto Quiz Generator",
            desc: "Test your knowledge with automatically generated multiple-choice quizzes and explanations."
          }
        ].map((feature, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">{feature.title}</h3>
            <p className="text-neutral-600 dark:text-neutral-400">{feature.desc}</p>
          </div>
        ))}
      </motion.div>
    </main>
  );
}
