"use client";

import AppShell from "@/components/AppShell";
import StateMessage from "@/components/StateMessage";
import { CheckCircle2, FileQuestion, Loader2, Play, Sparkles, UploadCloud, Clock, Target, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type QuizQuestion = {
  type: "mcq" | "tf" | "short";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type QuizData = {
  quizId: string;
  title: string;
  questions: QuizQuestion[];
};

export default function QuizPage() {
  return (
    <AppShell>
      <Suspense fallback={<StateMessage title="Loading quiz" description="Preparing your personalized study quiz." icon={Loader2} iconClassName="animate-spin" />}>
        <QuizContent />
      </Suspense>
    </AppShell>
  );
}

function QuizContent() {
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get("docId") || "";

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configuration State
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [hasStarted, setHasStarted] = useState(false);

  // Active Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [shortAnswerText, setShortAnswerText] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!docIdParam) {
      setIsLoading(false);
    }
  }, [docIdParam]);

  const generateQuiz = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docIdParam, difficulty, count: questionCount }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuizData(data);
        setHasStarted(true);
      } else if (data.code === "PREMIUM_REQUIRED") {
        alert(data.error); // Handled similarly to before
      } else {
        alert("Failed to generate quiz.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: option }));
  };

  const handleNext = () => {
    if (quizData?.questions[currentQuestionIndex].type === "short") {
      setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: shortAnswerText }));
      setShortAnswerText("");
    }

    if (currentQuestionIndex < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!quizData) return;

    let finalScore = 0;
    const finalAnswers = { ...answers };
    
    // Quick auto-grade
    quizData.questions.forEach((q, idx) => {
      if (q.type === "mcq" || q.type === "tf") {
        if (finalAnswers[idx] === q.correctAnswer) finalScore++;
      } else {
        // Very basic short answer match (ideally we'd use AI to grade this)
        if (finalAnswers[idx]?.toLowerCase().includes(q.correctAnswer.toLowerCase().split(' ')[0])) {
          finalScore++;
        }
      }
    });

    setScore(finalScore);
    setIsFinished(true);

    try {
      await fetch("/api/quiz", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quizData.quizId,
          answers: finalAnswers,
          score: finalScore,
          total: quizData.questions.length,
        }),
      });
    } catch (err) {
      console.error("Failed to save results", err);
    }
  };

  if (isLoading && !hasStarted && docIdParam) {
    return <StateMessage title="Preparing Quiz" description="Extracting context and generating questions..." icon={Loader2} iconClassName="animate-spin text-blue-600" />;
  }

  if (!docIdParam) {
    return (
      <StateMessage
        title="No document selected"
        description="Please upload or select a document to generate a quiz."
        icon={UploadCloud}
        action={<Link href="/upload" className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Upload material</Link>}
      />
    );
  }

  if (!hasStarted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-[#1a1d23]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6">
            <Target className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configure your Quiz</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Custom practice tests generated instantly from your notes.</p>
          
          <div className="mt-8 space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-900 dark:text-white">Difficulty</label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {["Easy", "Medium", "Hard"].map(level => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`rounded-xl border p-3 text-sm font-bold transition-all ${
                      difficulty === level 
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300" 
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-[#15171b] dark:text-slate-400"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-900 dark:text-white">Number of Questions</label>
              <input 
                type="range" 
                min="3" max="20" 
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full mt-4"
              />
              <div className="text-center mt-2 font-bold text-blue-600">{questionCount} Questions</div>
            </div>

            <button
              onClick={generateQuiz}
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              {isLoading ? "Generating with AI..." : "Start Practice Session"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished && quizData) {
    const percentage = Math.round((score / quizData.questions.length) * 100);
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-[#1a1d23] text-center"
        >
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 mb-6 ring-8 ring-emerald-50 dark:ring-emerald-900/10">
            <Sparkles className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Quiz Completed!</h2>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">You scored {score} out of {quizData.questions.length}</p>
          
          <div className="mt-8 mb-10 h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${percentage}%` }} />
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition">
              Back to Dashboard
            </Link>
            <button onClick={() => { setHasStarted(false); setIsFinished(false); setAnswers({}); setScore(0); setCurrentQuestionIndex(0); }} className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 transition">
              Take Another Quiz
            </button>
          </div>
        </motion.div>

        <div className="mt-8 space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Detailed Review</h3>
          {quizData.questions.map((q, idx) => {
            const isCorrect = answers[idx] === q.correctAnswer || (q.type === 'short' && (answers[idx] || '').toLowerCase().includes(q.correctAnswer.toLowerCase().split(' ')[0]));
            return (
              <div key={idx} className={`rounded-xl border p-6 ${isCorrect ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-900/10' : 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10'}`}>
                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {isCorrect ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertTriangle className="h-5 w-5 text-red-500" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{q.question}</h4>
                    <div className="mt-3 space-y-2 text-sm">
                      <p><span className="font-bold text-slate-500">Your Answer:</span> {answers[idx] || "No answer provided"}</p>
                      {!isCorrect && <p><span className="font-bold text-slate-500">Correct Answer:</span> <span className="font-medium text-emerald-600 dark:text-emerald-400">{q.correctAnswer}</span></p>}
                    </div>
                    <div className="mt-4 rounded-lg bg-white/60 p-4 dark:bg-black/20 text-sm">
                      <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Explanation</span>
                      <span className="text-slate-700 dark:text-slate-300">{q.explanation}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!quizData) return null;

  const currentQ = quizData.questions[currentQuestionIndex];
  const progress = Math.round((currentQuestionIndex / quizData.questions.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{quizData.title}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Question {currentQuestionIndex + 1} of {quizData.questions.length}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Clock className="h-4 w-4 text-blue-500" />
          <span>Timer Active</span>
        </div>
      </div>

      <div className="mb-10 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-[#1a1d23]"
        >
          <span className="mb-4 inline-block rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {currentQ.type === "mcq" ? "Multiple Choice" : currentQ.type === "tf" ? "True / False" : "Short Answer"}
          </span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">{currentQ.question}</h3>

          <div className="mt-8 space-y-3">
            {currentQ.type === "short" ? (
              <textarea
                value={shortAnswerText}
                onChange={(e) => setShortAnswerText(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full min-h-[120px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-[#15171b] dark:text-white"
              />
            ) : (
              currentQ.options?.map((option, idx) => {
                const isSelected = answers[currentQuestionIndex] === option;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-900/20 dark:ring-blue-500"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#1a1d23] dark:hover:bg-[#20242b]"
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 dark:border-slate-600"}`}>
                      {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-base ${isSelected ? "font-bold text-blue-900 dark:text-blue-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                      {option}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          disabled={currentQ.type !== "short" && !answers[currentQuestionIndex]}
          className="rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {currentQuestionIndex === quizData.questions.length - 1 ? "Submit Quiz" : "Next Question"}
        </button>
      </div>
    </div>
  );
}
