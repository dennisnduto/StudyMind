"use client";

import AppShell from "@/components/AppShell";
import StateMessage from "@/components/StateMessage";
import { Loader2, RefreshCw, UploadCloud, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Flashcard = {
  id: string;
  question: string;
  answer: string;
  isDifficult: boolean;
};

type Deck = {
  id: string;
  title: string;
  flashcards: Flashcard[];
};

export default function FlashcardsPage() {
  return (
    <AppShell>
      <Suspense fallback={<StateMessage title="Loading flashcards" description="Preparing your study deck." icon={Loader2} iconClassName="animate-spin" />}>
        <FlashcardsContent />
      </Suspense>
    </AppShell>
  );
}

function FlashcardsContent() {
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get("docId") || "";

  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);

  useEffect(() => {
    if (!docIdParam) {
      setIsLoading(false);
      return;
    }

    async function loadDeck() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId: docIdParam })
        });
        const data = await res.json();
        if (data.success) {
          setDeck({
            id: data.deckId,
            title: data.title,
            flashcards: data.flashcards
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDeck();
  }, [docIdParam]);

  if (isLoading) {
    return <StateMessage title="Generating Flashcards" description="Extracting key concepts from your document..." icon={Loader2} iconClassName="animate-spin" />;
  }

  if (!docIdParam || !deck || deck.flashcards.length === 0) {
    return (
      <StateMessage
        title="No flashcards available"
        description="Select a document from your dashboard to generate flashcards."
        icon={UploadCloud}
        action={<Link href="/dashboard" className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Go to Dashboard</Link>}
      />
    );
  }

  const currentCard = deck.flashcards[currentIndex];
  const progress = Math.round(((currentIndex + 1) / deck.flashcards.length) * 100);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < deck.flashcards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 150);
  };

  const handleMarkKnown = () => {
    setKnownCount(prev => prev + 1);
    nextCard();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{deck.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Card {currentIndex + 1} of {deck.flashcards.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              // Shuffle array
              const shuffled = [...deck.flashcards].sort(() => Math.random() - 0.5);
              setDeck({ ...deck, flashcards: shuffled });
              setCurrentIndex(0);
              setIsFlipped(false);
              setKnownCount(0);
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Shuffle
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-2xl h-[400px] [perspective:1000px]">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <motion.div
              className="relative w-full h-full cursor-pointer [transform-style:preserve-3d]"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front */}
              <div className="absolute inset-0 [backface-visibility:hidden] rounded-3xl bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center p-10 text-center">
                <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-widest text-slate-400">Question</span>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-snug">
                  {currentCard.question}
                </h2>
                <span className="absolute bottom-6 text-sm text-slate-400 dark:text-slate-500">Tap to flip</span>
              </div>

              {/* Back */}
              <div className="absolute inset-0 [backface-visibility:hidden] rounded-3xl bg-blue-600 dark:bg-blue-700 text-white shadow-xl flex flex-col items-center justify-center p-10 text-center [transform:rotateY(180deg)]">
                <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-widest text-blue-200">Answer</span>
                <p className="text-xl font-medium leading-relaxed">
                  {currentCard.answer}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-12 flex justify-center gap-6">
        <button
          onClick={nextCard}
          disabled={currentIndex >= deck.flashcards.length - 1}
          className="group flex h-16 w-16 items-center justify-center rounded-full bg-white border border-slate-200 text-red-500 shadow-md transition hover:bg-red-50 hover:border-red-200 disabled:opacity-50 dark:bg-[#1a1d23] dark:border-slate-800 dark:hover:bg-red-900/20"
        >
          <X className="h-6 w-6 transition-transform group-hover:scale-110" />
        </button>
        <button
          onClick={handleMarkKnown}
          disabled={currentIndex >= deck.flashcards.length - 1}
          className="group flex h-16 w-16 items-center justify-center rounded-full bg-white border border-slate-200 text-emerald-500 shadow-md transition hover:bg-emerald-50 hover:border-emerald-200 disabled:opacity-50 dark:bg-[#1a1d23] dark:border-slate-800 dark:hover:bg-emerald-900/20"
        >
          <Check className="h-6 w-6 transition-transform group-hover:scale-110" />
        </button>
      </div>

      {currentIndex === deck.flashcards.length - 1 && (
        <div className="mt-10 rounded-2xl bg-slate-50 p-6 text-center dark:bg-slate-900">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Deck Complete!</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            You knew {knownCount} out of {deck.flashcards.length} cards.
          </p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
            Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
