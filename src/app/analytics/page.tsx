"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  BookOpen, 
  Award, 
  Calendar, 
  AlertCircle, 
  ChevronRight 
} from "lucide-react";
import Link from "next/link";

interface QuizResult {
  id: string;
  quizTitle: string;
  score: number;
  total: number;
  percentage: number;
  createdAt: string;
}

interface Stats {
  totalUploads: number;
  totalQuizzes: number;
  averageScore: number;
  studyFrequency: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setQuizResults(data.quizResults);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Find weak topics / insights
  const lowScores = quizResults.filter(q => q.percentage < 70);
  const averageAccuracy = stats?.averageScore || 0;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Study Insights & Progress</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Detailed metrics tracking your uploads, quiz scores, accuracy, and study frequency.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Uploaded Material", value: stats?.totalUploads || 0, change: "+12% this week", icon: <BookOpen className="w-5 h-5 text-indigo-500" /> },
          { label: "Practice Quizzes taken", value: stats?.totalQuizzes || 0, change: "+4% this week", icon: <Sparkles className="w-5 h-5 text-purple-500" /> },
          { label: "Average Quiz Score", value: `${averageAccuracy}%`, change: "Overall accuracy", icon: <Award className="w-5 h-5 text-emerald-500" /> },
          { label: "Study Frequency", value: `${stats?.studyFrequency || 1} days`, change: "Streak days active", icon: <Calendar className="w-5 h-5 text-pink-500" /> }
        ].map((item, idx) => (
          <div key={idx} className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">{item.label}</span>
              {item.icon}
            </div>
            <div>
              <p className="text-3xl font-extrabold text-neutral-950 dark:text-white">{item.value}</p>
              <p className="text-xs text-neutral-400 mt-1">{item.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance SVG Line Chart (Left/Center) */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Quiz Performance Trend
            </h3>
            <span className="text-xs text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-full">
              Last 10 Attempts
            </span>
          </div>

          {quizResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-64 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-400">
              <BarChart3 className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
              <p className="text-sm">Practice a quiz to start plotting your performance trend chart.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              {/* Premium custom SVG line chart */}
              <div className="relative w-full h-64">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200">
                  {/* Grid Lines */}
                  {[0, 50, 100, 150].map((yVal, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={yVal}
                      x2="500"
                      y2={yVal}
                      stroke="currentColor"
                      className="text-neutral-100 dark:text-neutral-800"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Draw score line */}
                  <path
                    d={
                      (() => {
                        const points = quizResults
                          .slice()
                          .reverse()
                          .map((q, idx) => {
                            const x = (idx / (Math.max(quizResults.length - 1, 1))) * 500;
                            // mapping percentage 0..100 to y position 170..20
                            const y = 170 - (q.percentage / 100) * 150;
                            return `${x},${y}`;
                          });
                        return `M ${points.join(" L ")}`;
                      })()
                    }
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Draw points */}
                  {quizResults
                    .slice()
                    .reverse()
                    .map((q, idx) => {
                      const x = (idx / (Math.max(quizResults.length - 1, 1))) * 500;
                      const y = 170 - (q.percentage / 100) * 150;
                      return (
                        <g key={q.id} className="group cursor-pointer">
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            fill="#6366f1"
                            stroke="#ffffff"
                            strokeWidth="2.5"
                          />
                        </g>
                      );
                    })}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between text-[10px] text-neutral-400 mt-2 font-medium">
                  <span>First Practice</span>
                  <span>Latest Attempt</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actionable Weak Topics / AI Coach insights (Right) */}
        <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-pink-500" />
            AI Smart Recommendation
          </h3>

          <div className="space-y-4">
            {lowScores.length > 0 ? (
              <>
                <div className="p-4 bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/50 rounded-xl">
                  <p className="text-sm font-semibold text-pink-700 dark:text-pink-400">Improve Accuracy</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    You scored below 70% in {lowScores.length} quizzes. We recommend re-reading the notes and starting a chat study session.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Target Chapters</p>
                  {lowScores.slice(0, 3).map((result) => (
                    <div key={result.id} className="flex justify-between items-center text-sm py-1">
                      <span className="truncate text-neutral-700 dark:text-neutral-300 font-medium">
                        {result.quizTitle}
                      </span>
                      <span className="text-xs text-red-500 font-bold whitespace-nowrap">
                        {result.percentage}% Accuracy
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl space-y-1">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Excellent Accuracy!</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Your average quiz accuracy is {averageAccuracy}%. Keep up the great work! Try uploading more advanced materials to test your limits.
                </p>
              </div>
            )}

            <Link
              href="/quiz"
              className="w-full flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-semibold text-neutral-800 dark:text-neutral-200 transition-colors"
            >
              <span>Practice weak areas</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
