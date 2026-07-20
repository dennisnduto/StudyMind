"use client";

import AppShell from "@/components/AppShell";
import StateMessage from "@/components/StateMessage";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Bot, FileText, HelpCircle, Loader2, Plus, Send, Sparkles, Trash2, UploadCloud, User } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type StudyDocument = {
  id: string;
  title: string;
  fileType: string;
};

type ApiMessage = {
  id?: string;
  role?: string;
  content?: string;
};

const SUGGESTED_PROMPTS = [
  "Summarize the key takeaways.",
  "Explain this topic simply.",
  "What are the most important formulas?",
  "What topics should I focus on?",
  "Create a quick revision checklist."
];

export default function ChatPage() {
  return (
    <AppShell>
      <Suspense fallback={<StateMessage title="Loading workspace" description="Preparing documents..." icon={Loader2} iconClassName="animate-spin" />}>
        <ChatContent />
      </Suspense>
    </AppShell>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get("docId") || "";

  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState(docIdParam);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch documents list on mount
  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await fetch("/api/documents");
        const data = await res.json();
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
    loadDocuments();
  }, [docIdParam]);

  // Load chat history when selected document changes
  useEffect(() => {
    if (!selectedDocId) return;
    async function loadHistory() {
      try {
        const res = await fetch(`/api/chat?docId=${selectedDocId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages.map((m: ApiMessage) => ({
            id: m.id || crypto.randomUUID(),
            role: m.role === "user" ? "user" : "assistant",
            content: m.content || "",
          })));
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadHistory();
  }, [selectedDocId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !selectedDocId || isStreaming) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      abortControllerRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocId,
          userMessage: text,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        if (err.code === "PREMIUM_REQUIRED") {
          setMessages(prev => prev.map(m => m.id === assistantId
            ? { ...m, content: `Premium required: ${err.error} [Upgrade to Premium](/premium)` }
            : m
          ));
          return;
        }
        throw new Error(err.error || "Request failed");
      }

      const contentType = res.headers.get("content-type") || "";

      if (res.body && (contentType.includes("text/") || contentType.includes("stream"))) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        const isEventStream = contentType.includes("text/event-stream");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          if (isEventStream) {
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  if (typeof parsed === "string") {
                    accumulated += parsed;
                  } else if (parsed?.type === "text-delta" && parsed?.textDelta) {
                    accumulated += parsed.textDelta;
                  }
                } catch {
                  if (data && !data.startsWith("{")) accumulated += data;
                }
              }
            }
          } else {
            accumulated += chunk;
          }

          const current = accumulated;
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: current } : m));
        }
      } else {
        // JSON fallback
        const data = await res.json();
        const content = data.text || data.message?.content || "No response.";
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content } : m));
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error(err);
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: "Failed to get a response. Please try again." }
        : m
      ));
    } finally {
      setIsStreaming(false);
    }
  }, [selectedDocId, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = async () => {
    if (!selectedDocId || isStreaming) return;

    const previousMessages = messages;
    setMessages([]);
    try {
      const res = await fetch(`/api/chat?docId=${selectedDocId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setMessages(previousMessages);
      }
    } catch (err) {
      console.error(err);
      setMessages(previousMessages);
    }
  };

  if (isLoadingDocs) {
    return <StateMessage title="Loading workspace" description="Fetching your notes..." icon={Loader2} iconClassName="animate-spin" />;
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

  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  return (
    <div className="flex h-[calc(100vh-6rem)] min-h-[600px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#15171b]">

      {/* Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-[#121418] lg:flex">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Workspace</h2>
            <p className="mt-0.5 text-xs text-slate-500">Your study materials</p>
          </div>
          <Link href="/upload" className="rounded-lg bg-slate-200/50 p-2 text-slate-700 transition-colors hover:bg-blue-100 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-900/30">
            <Plus className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          {documents.map(doc => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all ${
                selectedDocId === doc.id
                  ? "bg-white shadow-sm ring-1 ring-slate-200 dark:bg-[#1a1d23] dark:ring-slate-700"
                  : "hover:bg-white/60 dark:hover:bg-[#1a1d23]/60"
              }`}
            >
              <FileText className={`mt-0.5 h-4 w-4 shrink-0 ${selectedDocId === doc.id ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
              <div className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{doc.title}</span>
                <span className="mt-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{doc.fileType}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="relative flex flex-1 flex-col">
        {/* Header */}
        <header className="z-10 flex items-center gap-3 border-b border-slate-200 bg-white/80 p-4 backdrop-blur-md dark:border-slate-800 dark:bg-[#15171b]/80">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{selectedDoc.title}</h2>
            <p className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Sparkles className="h-3 w-3" /> Grounded AI Chat
            </p>
          </div>
          <button
            type="button"
            onClick={clearChat}
            disabled={messages.length === 0 || isStreaming}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-8 text-center">
              <div className="rounded-full bg-blue-50 p-6 ring-8 ring-blue-50/50 dark:bg-blue-900/20 dark:ring-blue-900/10">
                <Bot className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">How can I help you study today?</h3>
                <p className="mx-auto mt-2 max-w-md text-slate-500 dark:text-slate-400">
                  Ask me anything about &ldquo;{selectedDoc.title}&rdquo;.
                </p>
              </div>
              <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    type="button"
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm font-medium text-slate-700 transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-[#1a1d23] dark:text-slate-300 dark:hover:border-blue-500/50"
                  >
                    <HelpCircle className="h-4 w-4 shrink-0 text-blue-500" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 pb-4">
              {messages.map(message => {
                const isUser = message.role === "user";
                return (
                  <div key={message.id} className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isUser
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "border border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-400"
                    }`}>
                      {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    </div>
                    <div className={`flex flex-col ${isUser ? "max-w-[85%] items-end" : "max-w-[92%] items-start sm:max-w-[88%]"}`}>
                      <span className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {isUser ? "You" : "StudyMind AI"}
                      </span>
                      <div className={`rounded-2xl px-5 py-4 text-[15px] leading-relaxed shadow-sm ${
                        isUser
                          ? "rounded-tr-sm bg-blue-600 text-white"
                          : "rounded-tl-sm border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-[#1a1d23] dark:text-slate-200"
                      }`}>
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : message.content === "" && isStreaming ? (
                          <div className="flex space-x-1.5 py-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: "0ms" }} />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: "150ms" }} />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: "300ms" }} />
                          </div>
                        ) : (
                          <MarkdownRenderer content={message.content} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#15171b] sm:p-6">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-slate-700 dark:bg-[#1a1d23]">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isStreaming}
              rows={1}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) sendMessage(input);
                }
              }}
              className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
              placeholder="Message StudyMind AI..."
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="mb-0.5 mr-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:opacity-40"
            >
              {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
          <p className="mt-3 text-center text-[11px] text-slate-400 dark:text-slate-500">
            AI can make mistakes. Verify important information with your notes.
          </p>
        </div>
      </section>
    </div>
  );
}
