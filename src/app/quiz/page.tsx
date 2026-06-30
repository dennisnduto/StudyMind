"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Brain, Award, CheckCircle2, XCircle, ArrowRight, HelpCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Document {
  id: string;
  title: string;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: string; // "A" | "B" | "C" | "D"
  explanation: string;
}

export default function QuizPage() {
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get("docId") || "";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState(initialDocId);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizId, setQuizId] = useState<string | null>(null);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
        if (initialDocId) {
          setSelectedDocId(initialDocId);
        } else if (data.documents.length > 0) {
          setSelectedDocId(data.documents[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [initialDocId]);

  const handleGenerateQuiz = async () => {
    if (!selectedDocId) return;
    setIsLoading(true);
    setQuestions([]);
    setIsFinished(false);
    setCurrentIdx(0);
    setUserAnswers([]);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDocId })
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        setQuizId(data.quizId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerOption = (optionChar: string) => {
    if (isAnswered) return;
    setSelectedAnswer(optionChar);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || isAnswered) return;
    
    setIsAnswered(true);
    const correctAns = questions[currentIdx].correctAnswer;
    const isCorrect = selectedAnswer === correctAns;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setUserAnswers((prev) => [...prev, selectedAnswer]);
  };

  const handleNextQuestion = async () => {
    setSelectedAnswer(null);
    setIsAnswered(false);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Quiz finished, submit results
      setIsFinished(true);
      if (quizId) {
        try {
          await fetch("/api/quiz", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quizId,
              score: score + (selectedAnswer === questions[currentIdx].correctAnswer ? 1 : 0),
              total: questions.length,
              answers: [...userAnswers, selectedAnswer]
            })
          });
        } catch (e) {
          console.error("Failed to submit quiz score", e);
        }
      }
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Selector screen */}
      {questions.length === 0 && !isLoading && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">AI Practice Quizzes</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Select one of your uploaded materials to generate an interactive multiple choice practice quiz.
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm text-center space-y-6">
            <Sparkles className="w-16 h-16 text-indigo-500 mx-auto animate-pulse" />
            
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Select Material</h2>
              <p className="text-sm text-neutral-400">
                Choose a document. The AI will formulate 5 custom questions based on its exact contents.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              {documents.length === 0 ? (
                <div className="text-red-500 text-sm">Please upload a document to get started!</div>
              ) : (
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={documents.length === 0}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Generate Practice Quiz
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 shadow-sm text-center space-y-6">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Formulating Quiz Questions...</h2>
            <p className="text-sm text-neutral-400">Our AI is reading your notes and constructing multiple choice challenges.</p>
          </div>
        </div>
      )}

      {/* Quiz challenge view */}
      {questions.length > 0 && !isFinished && (
        <div className="space-y-6">
          {/* Progress header */}
          <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-sm font-semibold text-neutral-500">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              Score: {score}
            </span>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-neutral-950 dark:text-white leading-relaxed">
              {questions[currentIdx].question}
            </h3>

            {/* Multiple choice options */}
            <div className="space-y-3">
              {questions[currentIdx].options.map((option) => {
                const optChar = option.trim().charAt(0); // A, B, C, D
                const isSelected = selectedAnswer === optChar;
                const isCorrectAnswer = questions[currentIdx].correctAnswer === optChar;

                let optStyle = "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40";
                
                if (isSelected && !isAnswered) {
                  optStyle = "border-indigo-500 bg-indigo-50/20";
                } else if (isAnswered) {
                  if (isCorrectAnswer) {
                    optStyle = "border-emerald-500 bg-emerald-50/10 text-emerald-700 dark:text-emerald-400";
                  } else if (isSelected) {
                    optStyle = "border-red-500 bg-red-50/10 text-red-700 dark:text-red-400";
                  } else {
                    optStyle = "opacity-50 border-neutral-200 dark:border-neutral-800";
                  }
                }

                return (
                  <button
                    key={option}
                    disabled={isAnswered}
                    onClick={() => handleAnswerOption(optChar)}
                    className={`w-full text-left p-4 rounded-xl border font-medium transition-all flex items-center justify-between gap-4 ${optStyle}`}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {isAnswered && isSelected && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation box */}
            {isAnswered && (
              <div className="p-5 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border border-neutral-200 dark:border-neutral-800/50 space-y-2">
                <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  Explanation
                </h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {questions[currentIdx].explanation}
                </p>
              </div>
            )}

            {/* Submit / Next navigation */}
            <div className="flex justify-end pt-4">
              {!isAnswered ? (
                <button
                  disabled={!selectedAnswer}
                  onClick={handleSubmitAnswer}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                >
                  {currentIdx + 1 < questions.length ? "Next Question" : "Complete Quiz"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion view */}
      {isFinished && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm text-center space-y-6">
          <Award className="w-16 h-16 text-indigo-500 mx-auto animate-bounce" />
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Quiz Finished!</h2>
            <p className="text-neutral-500 dark:text-neutral-400">Excellent effort on your learning session.</p>
          </div>

          <div className="p-6 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-800/50 max-w-sm mx-auto flex items-center justify-around">
            <div>
              <p className="text-sm text-neutral-400 font-semibold">Total Correct</p>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {score} / {questions.length}
              </p>
            </div>
            <div className="w-px h-12 bg-neutral-200 dark:bg-neutral-800"></div>
            <div>
              <p className="text-sm text-neutral-400 font-semibold">Accuracy</p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {Math.round((score / questions.length) * 100)}%
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => {
                setQuestions([]);
                setIsFinished(false);
              }}
              className="px-6 py-3 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Practice Another Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
