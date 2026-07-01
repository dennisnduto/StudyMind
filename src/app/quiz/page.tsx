"use client";

import AppShell from "@/components/AppShell";
import StateMessage from "@/components/StateMessage";
import { demoDocuments, demoQuestions } from "@/lib/demo-data";
import { CheckCircle2, FileQuestion, Loader2, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function QuizPage() {
  return (
    <AppShell>
      <Suspense fallback={<StateMessage title="Loading quiz" description="Preparing your selected material and practice questions." icon={Loader2} iconClassName="animate-spin" />}>
        <QuizContent />
      </Suspense>
    </AppShell>
  );
}

function QuizContent() {
  const searchParams = useSearchParams();
  const [selectedDocId, setSelectedDocId] = useState(searchParams.get("docId") || demoDocuments[0]?.id || "");
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  if (demoQuestions.length === 0) {
    return (
      <StateMessage
        title="No quiz questions ready"
        description="Generate a practice set from uploaded material before starting a quiz session."
        icon={FileQuestion}
      />
    );
  }

  const current = demoQuestions[currentIndex];
  const isFinished = started && answers.length === demoQuestions.length;
  const score = answers.filter((answer, index) => answer === demoQuestions[index].correctAnswer).length;

  const submitAnswer = () => {
    if (!selectedAnswer) return;
    const nextAnswers = [...answers, selectedAnswer];
    setAnswers(nextAnswers);
    setSelectedAnswer("");
    if (nextAnswers.length < demoQuestions.length) {
      setCurrentIndex((value) => value + 1);
    }
  };

  const resetQuiz = () => {
    setStarted(false);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b] sm:p-6">
          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Quiz generator</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Practice from your notes.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Demo questions are interactive now. The backend can replace them with generated questions from the selected document.
              </p>
            </div>
            <select
              value={selectedDocId}
              onChange={(event) => setSelectedDocId(event.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
            >
              {demoDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
            </select>
          </div>
        </section>

        {!started && (
          <section className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#15171b]">
            <Sparkles className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-4 text-2xl font-bold">Generate a focused practice set</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">Three questions will preview answer selection, scoring, and explanations.</p>
            <button onClick={() => setStarted(true)} className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
              Start quiz
            </button>
          </section>
        )}

        {started && !isFinished && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b] sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Question {currentIndex + 1} of {demoQuestions.length}</span>
              <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Score {score}</span>
            </div>
            <h2 className="mt-5 text-xl font-bold leading-8">{current.question}</h2>
            <div className="mt-5 space-y-3">
              {current.options.map((option) => {
                const value = option.charAt(0);
                return (
                  <button
                    key={option}
                    onClick={() => setSelectedAnswer(value)}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 text-left text-sm font-semibold transition ${
                      selectedAnswer === value
                        ? "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <button
              onClick={submitAnswer}
              disabled={!selectedAnswer}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit answer
            </button>
          </section>
        )}

        {isFinished && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#15171b]">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Quiz complete</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">You scored {score} of {demoQuestions.length}.</p>
            </div>
            <div className="mt-6 space-y-3">
              {demoQuestions.map((question, index) => {
                const isCorrect = answers[index] === question.correctAnswer;
                return (
                  <div key={question.question} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                      {isCorrect ? <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-500" /> : <XCircle className="mt-1 h-5 w-5 text-red-500" />}
                      <div>
                        <p className="font-bold">{question.question}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{question.explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={resetQuiz} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold dark:border-slate-800">
              <RotateCcw className="h-4 w-4" />
              Practice again
            </button>
          </section>
        )}
    </div>
  );
}
