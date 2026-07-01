"use client";

import AppShell from "@/components/AppShell";
import StateMessage from "@/components/StateMessage";
import { Bot, FileText, Loader2, Send, UploadCloud, User } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  return (
    <AppShell>
      <Suspense fallback={<StateMessage title="Loading chat" description="Preparing document context and conversation state." icon={Loader2} iconClassName="animate-spin" />}>
        <ChatContent />
      </Suspense>
    </AppShell>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get("docId") || "";

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState(docIdParam);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch documents list on mount
  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.documents) {
          setDocuments(data.documents);
          if (!selectedDocId && data.documents.length > 0) {
            setSelectedDocId(data.documents[0].id);
          }
        }
        setIsLoadingDocs(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoadingDocs(false);
      });
  }, []);

  // Fetch message history when selected document changes
  useEffect(() => {
    if (!selectedDocId) return;

    setIsLoadingMessages(true);
    fetch(`/api/chat?docId=${selectedDocId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          } else {
            setMessages([
              {
                role: "assistant",
                content: "Choose a material and ask a study question. I will answer based on the notes you uploaded.",
              },
            ]);
          }
        }
        setIsLoadingMessages(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoadingMessages(false);
      });
  }, [selectedDocId]);

  const selectedDoc = useMemo(() => {
    return documents.find((doc) => doc.id === selectedDocId) || documents[0];
  }, [documents, selectedDocId]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput || !selectedDocId || isSending) return;

    setIsSending(true);
    setInput("");

    // Add user message to UI immediately
    const userMsg: Message = { role: "user", content: cleanInput };
    setMessages((current) => [...current, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDocId, content: cleanInput }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.message) {
        setMessages((current) => [...current, data.message]);
      } else {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: data.error || "Failed to generate reply. Please try again." },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Error sending message. Check connection." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoadingDocs) {
    return (
      <StateMessage
        title="Loading workspace"
        description="Fetching your notes and document context..."
        icon={Loader2}
        iconClassName="animate-spin"
      />
    );
  }

  if (documents.length === 0) {
    return (
      <StateMessage
        title="No materials available"
        description="Upload a document before starting a grounded study chat."
        icon={UploadCloud}
        action={<Link href="/upload" className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Upload material</Link>}
      />
    );
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] min-h-[650px] gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">AI document chat</p>
          <h1 className="mt-2 text-2xl font-bold">Ask your notes</h1>
        </div>
        <div className="space-y-2 p-3">
          {documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setSelectedDocId(doc.id)}
              className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition ${
                selectedDocId === doc.id
                  ? "bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200"
                  : "hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="block text-sm font-bold">{doc.title}</span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{doc.fileType.toUpperCase()} material</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="font-bold">{selectedDoc?.title || "Select a document"}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Grounded answer preview using your document context.</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {isLoadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : messages.length > 0 ? (
            messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div key={`${message.role}-${index}`} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      <Bot className="h-4 w-4" />
                    </span>
                  )}
                  <div
                    className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
                      isUser ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    {message.content}
                  </div>
                  {isUser && (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <User className="h-4 w-4" />
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <StateMessage title="No messages yet" description="Choose a material and send a question to begin the session." icon={Bot} />
          )}
        </div>

        <form onSubmit={sendMessage} className="flex gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isSending || isLoadingMessages}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-60"
            placeholder={isSending ? "AI is typing..." : "Ask for a summary, explanation, formula, or practice prompt..."}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending || isLoadingMessages}
            aria-label="Send message"
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </section>
    </div>
  );
}
