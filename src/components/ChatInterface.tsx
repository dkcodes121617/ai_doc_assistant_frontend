"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  Send, FileText, Loader2, AlertCircle, Sparkles,
  ChevronRight, BookOpen, ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SourcesPanel } from "./SourcesPanel";
import { toast } from "sonner";

/* ════════════════════════════════════════
   TYPES
════════════════════════════════════════ */
interface Citation {
  chunk_id: string;
  page_number: number;
  snippet_text: string;
  relevant_excerpt?: string;
  index: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  error?: boolean;
  isThinking?: boolean;
}

interface DocumentSession {
  documentId: string;
  filename: string;
}

/* ════════════════════════════════════════
   MICRO COMPONENTS (memoised)
════════════════════════════════════════ */
const TypingCursor = memo(function TypingCursor() {
  return (
    <motion.span
      className="inline-block w-[2px] h-[1em] bg-blue-400 ml-0.5 rounded-sm align-middle"
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear", times: [0, 0.45, 0.5, 1] }}
    />
  );
});

const ThinkingDots = memo(function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-[5px] h-[5px] rounded-full bg-blue-400"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
});

const ThinkingBubble = memo(function ThinkingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl rounded-bl-sm bg-white border border-slate-100 shadow-sm"
    >
      <div className="w-4 h-4 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-2.5 h-2.5 text-blue-500" />
      </div>
      <span className="text-[11px] font-medium text-slate-400 tracking-wide">Thinking</span>
      <ThinkingDots />
    </motion.div>
  );
});

/* ────────────────────────────────────────
   Markdown-like renderer with citations
──────────────────────────────────────── */
function renderMarkdownWithCitations(
  text: string,
  citations?: Citation[],
  onCitationClick?: (citations: Citation[], index: number) => void
): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, li) => {
    if (!line.trim()) {
      nodes.push(<div key={`br-${li}`} className="h-2" />);
      return;
    }

    const isBullet = /^[*\-]\s/.test(line.trim());
    const raw = isBullet ? line.replace(/^[*\-]\s/, "") : line;

    // Bold (**text**) and Citations ([1])
    const parts = raw.split(/(\*\*[^*]+\*\*|\[\d+\])/g);
    const inlineNodes = parts.map((part, pi) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={pi} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      const match = part.match(/^\[(\d+)\]$/);
      if (match && citations?.length && onCitationClick) {
        const idx = parseInt(match[1]);
        const cit = citations.find((c) => c.index === idx);
        if (cit) {
          return (
            <button
              key={pi}
              onClick={() => onCitationClick(citations, idx)}
              title={`Page ${cit.page_number}`}
              className="inline-flex items-center justify-center w-[17px] h-[17px] mx-[2px] text-[9px] font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 active:scale-90 transition-all align-middle relative -top-[1px] shadow-sm"
            >
              {idx}
            </button>
          );
        }
      }
      return <span key={pi}>{part}</span>;
    });

    if (isBullet) {
      nodes.push(
        <div key={li} className="flex items-start gap-2 py-0.5">
          <span className="mt-[6px] w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
          <p className="text-[13.5px] leading-relaxed text-slate-700">{inlineNodes}</p>
        </div>
      );
    } else {
      nodes.push(
        <p key={li} className="text-[13.5px] leading-relaxed text-slate-700">{inlineNodes}</p>
      );
    }
  });

  return nodes;
}

/* ────────────────────────────────────────
   Message body
──────────────────────────────────────── */
const MessageContent = memo(function MessageContent({
  msg,
  isStreaming,
  isLast,
  onCitationClick,
}: {
  msg: Message;
  isStreaming: boolean;
  isLast: boolean;
  onCitationClick: (citations: Citation[], index: number) => void;
}) {
  if (msg.isThinking) return <ThinkingBubble />;

  if (msg.error) {
    return (
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 font-semibold text-[13px] text-red-600">
          <AlertCircle className="w-3.5 h-3.5" /> Error
        </span>
        <span className="text-[13px] leading-relaxed text-red-500">{msg.content}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {renderMarkdownWithCitations(msg.content, msg.citations, onCitationClick)}
      {isStreaming && isLast && <TypingCursor />}
    </div>
  );
});

/* ════════════════════════════════════════
   SUGGESTED PROMPTS
════════════════════════════════════════ */
const PROMPTS = [
  "Summarise the key points",
  "What are the main conclusions?",
  "List all definitions",
  "What data or statistics are cited?",
] as const;

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export function ChatInterface({ documents }: { documents: DocumentSession[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Set SYNCHRONOUSLY before setMessages — never inside the updater
  const assistantIdxRef = useRef<number>(-1);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const onCitationClick = useCallback((citations: Citation[], index: number) => {
    setActiveCitations(citations);
    setHighlightedIdx(index);
  }, []);

  const closePanel = useCallback(() => {
    setActiveCitations([]);
    setHighlightedIdx(null);
  }, []);

  const sendMessage = useCallback(async (overrideQuery?: string) => {
    const query = (overrideQuery ?? input).trim();
    if (!query || isStreaming || documents.length === 0) return;

    setInput("");
    setIsStreaming(true);

    // ✅ Synchronous — before setMessages
    assistantIdxRef.current = messages.length + 1;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: query },
      { role: "assistant", content: "", isThinking: true },
    ]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_ids: documents.map((d) => d.documentId),
          query,
        }),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      if (!res.body) throw new Error("Empty response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let gotFirst = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";

        for (const ev of events) {
          const dataLine = ev.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          const raw = dataLine.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          try {
            const data = JSON.parse(raw);
            const idx = assistantIdxRef.current;

            if (data.type === "text" && typeof data.content === "string") {
              if (!gotFirst) {
                gotFirst = true;
                setMessages((prev) => {
                  const next = [...prev];
                  if (idx >= 0 && idx < next.length) {
                    next[idx] = { ...next[idx], isThinking: false, content: data.content };
                  }
                  return next;
                });
              } else {
                setMessages((prev) => {
                  const next = [...prev];
                  if (idx >= 0 && idx < next.length) {
                    next[idx] = {
                      ...next[idx],
                      content: next[idx].content + data.content,
                      error: next[idx].error || data.content.startsWith("[Error:"),
                    };
                  }
                  return next;
                });
              }
            } else if (data.type === "citations" && Array.isArray(data.citations)) {
              setMessages((prev) => {
                const next = [...prev];
                if (idx >= 0 && idx < next.length) {
                  next[idx] = { ...next[idx], citations: data.citations };
                }
                return next;
              });
            }
          } catch { /* skip malformed */ }
        }
      }

      if (!gotFirst) {
        setMessages((prev) => {
          const next = [...prev];
          const idx = assistantIdxRef.current;
          if (idx >= 0 && idx < next.length) {
            next[idx] = { ...next[idx], isThinking: false, content: "No response received. Please try again.", error: true };
          }
          return next;
        });
      }
    } catch {
      toast.error("Network error — please check your connection.");
      setMessages((prev) => {
        const next = [...prev];
        const idx = assistantIdxRef.current;
        if (idx >= 0 && idx < next.length) {
          next[idx] = { ...next[idx], isThinking: false, content: "A network error occurred.", error: true };
        }
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, documents, messages.length]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const isEmpty = messages.length === 0;

  return (
    /* Outer wrapper — full height, flex row */
    <div className="flex w-full h-full overflow-hidden gap-3">

      {/* ── CHAT PANEL ── */}
      <div className="flex flex-col flex-1 min-w-0 bg-white border border-slate-200 border-b-0 rounded-t-xl shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back button */}
            <Link
              href="/"
              className="flex-shrink-0 flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-blue-600 transition-colors group"
              title="Back to Home"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="w-px h-4 bg-slate-200 flex-shrink-0" />
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold text-slate-800 leading-none truncate">
                Knowledge Base Chat
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {documents.length} doc{documents.length !== 1 ? "s" : ""} indexed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full flex-shrink-0">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-blue-500"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[11px] font-medium text-blue-700">Ready</span>
          </div>
        </div>

        {/* ── MESSAGES — overflow-y-auto not ScrollArea ── */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-slate-50/30 px-4 py-4">
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">

            {/* Empty state */}
            <AnimatePresence>
              {isEmpty && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center pt-12 pb-6 gap-5 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-800">Ask anything about your documents</p>
                    <p className="text-[12px] text-slate-400 mt-1 max-w-sm leading-relaxed">
                      Every answer includes numbered citations — click them to see the exact source paragraph.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                    {PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => sendMessage(p)}
                        disabled={isStreaming}
                        className="flex items-start gap-2 px-3.5 py-2.5 text-left text-[12px] font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/40 active:scale-[0.98] transition-all shadow-sm disabled:opacity-40"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 mt-px flex-shrink-0" />
                        {p}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`flex items-start gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* AI avatar */}
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] sm:max-w-[78%] rounded-2xl px-4 py-2.5 border ${
                      msg.role === "user"
                        ? "bg-slate-900 text-slate-50 rounded-br-sm border-slate-800/50 shadow-sm"
                        : msg.error
                        ? "bg-red-50 border-red-100 rounded-bl-sm"
                        : msg.isThinking
                        ? "bg-transparent border-transparent p-0 shadow-none"
                        : "bg-white border-slate-100 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-[13.5px] leading-relaxed">{msg.content}</p>
                    ) : (
                      <MessageContent
                        msg={msg}
                        isStreaming={isStreaming}
                        isLast={i === messages.length - 1}
                        onCitationClick={onCitationClick}
                      />
                    )}

                    {/* Sources pill */}
                    {msg.citations && msg.citations.length > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        onClick={() => onCitationClick(msg.citations!, 0)}
                        className="flex items-center gap-1.5 mt-2.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        {msg.citations.length} source{msg.citations.length !== 1 ? "s" : ""}
                      </motion.button>
                    )}
                  </div>

                  {/* User avatar */}
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-600">U</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── INPUT BAR ── */}
        <div className="flex-shrink-0 px-4 pb-4 pt-3 bg-white border-t border-slate-100">
          <div
            className={`relative flex items-end max-w-3xl mx-auto rounded-xl border bg-white transition-all duration-200 ${
              isStreaming
                ? "border-blue-200 ring-4 ring-blue-50"
                : "border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50"
            }`}
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={isStreaming ? "Generating response…" : "Ask a question about your documents…"}
              className="min-h-[52px] max-h-[160px] w-full resize-none pr-12 border-0 focus-visible:ring-0 bg-transparent text-slate-900 placeholder:text-slate-400 rounded-xl py-3.5 px-4 text-[13.5px] leading-relaxed"
              disabled={isStreaming}
            />
            <Button
              size="icon"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 bottom-2 h-8 w-8 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg shadow-sm shadow-blue-500/20 transition-all disabled:opacity-40 disabled:shadow-none disabled:bg-slate-300"
            >
              {isStreaming
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Send className="h-3.5 w-3.5" />
              }
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono border border-slate-200">Enter</kbd>
            {" "}to send ·{" "}
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono border border-slate-200">Shift+Enter</kbd>
            {" "}for newline
          </p>
        </div>
      </div>

      {/* ── SOURCES PANEL ── */}
      <SourcesPanel
        citations={activeCitations}
        highlightedIndex={highlightedIdx}
        onClose={closePanel}
      />
    </div>
  );
}
