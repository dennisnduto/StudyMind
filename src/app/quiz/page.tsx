"use client";

import AppShell from "@/components/AppShell";
import StateMessage from "@/components/StateMessage";
import { CheckCircle2, FileQuestion, Loader2, RotateCcw, Sparkles, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type StudyDocument = {
  id: string;
  title: string;
};

type DocumentsResponse = {
  success?: boolean;
  documents?: StudyDocument[];
};

const answerLabels = ["A", "B", "C", "D"] as const;

function getAnswerValue(option: string, index: number) {
  const match = option.trim().match(/^([A-D])[\).:\-\s]/i);
  return match ? match[1].toUpperCase() : answerLabels[index] ?? String(index + 1);
}

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
  const docIdParam = searchParams.get("docId") || "";

  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState(docIdParam);
  const [quizId, setQuizId] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [requiresPremium, setRequiresPremium] = useState(false);

  // Fetch documents list
  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await fetch("/api/documents");
        const data = (await res.json()) as DocumentsResponse;
        if (data.success && data.documents) {
          setDocuments(data.documents);
          if (!docIdParam && data.documents.length > 0) {
            setSelectedDocId(data.documents[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingDocs(false);
      }
    }

    void loadDocuments();
  }, [docIdParam]);

  const handleStartQuiz = async () => {
    if (!selectedDocId) return;
    setIsGenerating(true);
    setGenerationError("");
    setSubmissionError("");
    setRequiresPremium(false);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDocId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuizId(data.quizId);
        setQuizTitle(data.title);
        setQuestions(data.questions);
        setStarted(true);
        setCurrentIndex(0);
        setAnswers([]);
        setSelectedAnswer("");
      } else {
        setRequiresPremium(data.code === "PREMIUM_REQUIRED");
        setGenerationError(data.error || "Failed to generate quiz.");
      }
    } catch (err) {
      console.error(err);
      setGenerationError("Error generating quiz.");
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) return;
    const nextAnswers = [...answers, selectedAnswer];
    setAnswers(nextAnswers);
    setSelectedAnswer("");

    if (nextAnswers.length === questions.length) {
      // Quiz complete! Submit results to backend
      const score = nextAnswers.filter((ans, idx) => ans === questions[idx].correctAnswer).length;
      setIsSubmitting(true);
      setSubmissionError("");
      try {
        const res = await fetch("/api/quiz", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId,
            score,
            total: questions.length,
            answers: { selected: nextAnswers },
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to save quiz score.");
        }
      } catch (err) {
        console.error("Failed to submit score:", err);
        setSubmissionError(err instanceof Error ? err.message : "Failed to save quiz score.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentIndex((value) => value + 1);
    }
  };

  const resetQuiz = () => {
    setStarted(false);
    setQuizId("");
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer("");
    setSubmissionError("");
  };

  if (isLoadingDocs) {
    return (
      <StateMessage
        title="Loading workspace"
        description="Fetching your notes for the quiz..."
        icon={Loader2}
        iconClassName="animate-spin"
      />
    );
  }

  if (documents.length === 0) {
    return (
      <StateMessage
        title="No materials available"
        description="Upload a document before starting a practice quiz."
        icon={FileQuestion}
        action={<Link href="/upload" className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Upload material</Link>}
      />
    );
  }

  const current = questions[currentIndex];
  const isFinished = started && answers.length === questions.length;
  const score = answers.filter((answer, index) => answer === questions[index]?.correctAnswer).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b] sm:p-6">
        <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Quiz generator</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Practice from your notes.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Interactive multiple-choice practice. Questions are generated from your uploaded study materials.
            </p>
          </div>
          <select
            value={selectedDocId}
            onChange={(event) => setSelectedDocId(event.target.value)}
            disabled={started}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900 disabled:opacity-60"
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.title}</option>
            ))}
          </select>
        </div>
      </section>

      {!started && (
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#15171b]">
          {generationError && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="font-bold text-amber-900 dark:text-amber-200">{requiresPremium ? "Premium required" : "Quiz generation failed"}</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{generationError}</p>
              {requiresPremium && (
                <Link href="/premium" className="mt-3 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                  View Premium
                </Link>
              )}
            </div>
          )}
          {isGenerating ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
              <h2 className="mt-4 text-2xl font-bold">Analyzing document contents</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">Extracting facts, key terms, and configuring practice questions...</p>
            </>
          ) : (
            <>
              <Sparkles className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-2xl font-bold">Generate a focused practice set</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">We will generate practice questions to review definitions, concepts, and relationships.</p>
              <button onClick={handleStartQuiz} className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                Start quiz
              </button>
            </>
          )}
        </section>
      )}

      {started && !isFinished && current && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#15171b] sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Question {currentIndex + 1} of {questions.length}</span>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Score {score}</span>
          </div>
          <h2 className="mt-5 text-xl font-bold leading-8">{current.question}</h2>
          <div className="mt-5 space-y-3">
            {current.options.map((option, index) => {
              const value = getAnswerValue(option, index);
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
            <p className="mt-2 text-slate-500 dark:text-slate-400">{quizTitle || "Practice set"}: you scored {score} of {questions.length}.</p>
          </div>
          {submissionError && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              {submissionError}
            </div>
          )}
          <div className="mt-6 space-y-3">
            {questions.map((question, index) => {
              const isCorrect = answers[index] === question.correctAnswer;
              return (
                <div key={question.question} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    {isCorrect ? <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-500" /> : <XCircle className="mt-1 h-5 w-5 text-red-500" />}
                    <div>
                      <p className="font-bold">{question.question}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your answer: {answers[index]} | Correct answer: {question.correctAnswer}</p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={resetQuiz} disabled={isSubmitting} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold dark:border-slate-800 disabled:opacity-50">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Practice again
          </button>
        </section>
      )}
    </div>
  );
}
