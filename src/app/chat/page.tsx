"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Bot, User, Brain, HelpCircle, Loader2 } from "lucide-react";

interface Document {
  id: string;
  title: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get("docId") || "";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState(initialDocId);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
        
        // If a docId is passed in query, auto-initialize
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

  useEffect(() => {
    // Reset chat if selected document changes
    setMessages([]);
    setChatSessionId(null);
  }, [selectedDocId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedDocId || isLoading) return;

    const userMsg = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: userMsg,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocId,
          chatSessionId,
          message: userMsg
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatSessionId(data.chatSessionId);
        setMessages((prev) => [...prev, data.message]);
      } else {
        const err = await res.json();
        // Add failure notification message
        const systemErr: Message = {
          id: Math.random().toString(),
          role: "assistant",
          content: err.error || "Failed to retrieve response from context.",
          createdAt: new Date().toISOString()
        };
        setMessages((prev) => [...prev, systemErr]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
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
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] max-w-4xl mx-auto space-y-6">
      {/* Header / Doc selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-indigo-500" />
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">AI Document Chat</h1>
            <p className="text-xs text-neutral-400">Ask questions and get answers constrained to your notes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500 font-medium whitespace-nowrap">Study Material:</span>
          {documents.length === 0 ? (
            <span className="text-sm text-red-500">Please upload a document first!</span>
          ) : (
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Messages Thread panel */}
      <div className="flex-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full text-neutral-400 space-y-3">
              <Bot className="w-12 h-12 text-indigo-400 animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-semibold text-neutral-700 dark:text-neutral-300">Ready to chat with your document!</h3>
                <p className="text-sm text-neutral-400 max-w-sm">
                  Ask me anything from the document. I will restrict my responses to what is written in the document content.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                  msg.role === "user" ? "bg-indigo-600" : "bg-neutral-700"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user" 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-none border border-neutral-200/50 dark:border-neutral-700/50"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              required
              disabled={documents.length === 0 || isLoading}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              placeholder={documents.length === 0 ? "Please upload notes to get started..." : "Ask StudyMind anything about the selected document..."}
            />
            <button
              type="submit"
              disabled={documents.length === 0 || isLoading}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-500 text-white rounded-xl transition-colors shadow-sm"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
