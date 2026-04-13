"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2, Search, BrainCircuit, Sparkles, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

const MarkdownComponents = {
  h1: ({node, ...props}: any) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-lg font-bold mt-4 mb-2" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-base font-bold mt-3 mb-1" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-3 last:mb-0" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
  li: ({node, ...props}: any) => <li className="" {...props} />,
  strong: ({node, ...props}: any) => <strong className="font-bold text-white" {...props} />,
  a: ({node, ...props}: any) => <a className="text-blue-400 hover:underline" {...props} />,
  code: ({node, inline, ...props}: any) => 
    inline 
      ? <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs text-blue-200" {...props} />
      : <code className="block bg-black/40 rounded p-3 text-sm my-3 overflow-x-auto text-slate-300" {...props} />
};

const TypewriterText = ({ text, scrollRef }: { text: string; scrollRef: React.RefObject<HTMLDivElement | null> }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 3; // Reveal 3 characters at a time for smooth speed
      setDisplayedText(text.slice(0, i));
      scrollRef.current?.scrollIntoView({ behavior: "auto" }); // Keep scrolled to bottom during typing
      
      if (i > text.length) {
        setDisplayedText(text);
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [text, scrollRef]);

  return <ReactMarkdown components={MarkdownComponents}>{displayedText}</ReactMarkdown>;
};

type ThinkingStep = "idle" | "analyzing" | "searching" | "generating";

export default function AiChatPage() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<ThinkingStep>("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, thinkingStep]);

  const send = async () => {
    if (!value.trim() || loading) return;
    const userMsg: AiMessage = { role: "user", content: value.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setValue("");
    setLoading(true);
    setThinkingStep("analyzing");

    // Simulate ChatGPT-like thinking process phases
    const searchTimeout = setTimeout(() => setThinkingStep("searching"), 800);
    const generateTimeout = setTimeout(() => setThinkingStep("generating"), 2000);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful chat assistant." },
            ...messages,
            userMsg,
          ],
          userId,
        }),
      });

      if (!res.ok) return;
      const data = (await res.json()) as { reply: string };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } finally {
      clearTimeout(searchTimeout);
      clearTimeout(generateTimeout);
      setThinkingStep("idle");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[var(--background)] text-slate-100 font-sans">
      <header className="flex items-center justify-between border-b border-white/5 bg-[var(--navy-deep)]/40 backdrop-blur-xl px-4 py-3 z-10 sticky top-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-bold tracking-wider uppercase text-slate-400 hover:text-white transition-colors"
        >
          Back
        </button>
        <div className="flex flex-col items-center group cursor-pointer">
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <h1 className="text-sm font-black tracking-tighter text-white uppercase">
              Aura Intelligence
            </h1>
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-blue-400/80 uppercase">
            Powered by Groq
          </p>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex flex-1 flex-col overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/5 blur-[150px] pointer-events-none" />

        <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar relative z-10">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-blue-500/20 shadow-2xl shadow-blue-500/10 mb-2">
                <BrainCircuit className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">How can I help you today?</h2>
              <p className="max-w-md text-sm font-medium text-slate-400 leading-relaxed">
                Aura AI is capable of deep analysis, searching, and instant synthesis. Ask me anything.
              </p>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-lg ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm shadow-blue-600/20"
                        : "bg-white/[0.03] border border-white/10 text-slate-200 rounded-bl-sm"
                    }`}
                  >
                    {m.role === "assistant" && i === messages.length - 1 ? (
                      <TypewriterText text={m.content} scrollRef={messagesEndRef} />
                    ) : m.role === "assistant" ? (
                      <ReactMarkdown components={MarkdownComponents}>{m.content}</ReactMarkdown>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Thinking / Loading Animation UI */}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white/[0.02] border border-white/5 px-5 py-4 text-sm shadow-lg w-full sm:w-[350px]">
                    <div className="space-y-4">
                      {/* Step 1: Analyzing */}
                      <div className="flex items-center gap-3">
                        {thinkingStep === "analyzing" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                        <span className={`text-xs font-bold uppercase tracking-widest ${thinkingStep === "analyzing" ? "text-blue-400" : "text-slate-500"}`}>
                          Analyzing Query
                        </span>
                      </div>

                      {/* Step 2: Searching */}
                      {(thinkingStep === "searching" || thinkingStep === "generating") && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          {thinkingStep === "searching" ? (
                             <Search className="h-4 w-4 text-indigo-400 animate-pulse" />
                          ) : (
                             <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                          <span className={`text-xs font-bold uppercase tracking-widest ${thinkingStep === "searching" ? "text-indigo-400" : "text-slate-500"}`}>
                            Fetching Resources
                          </span>
                        </div>
                      )}

                      {/* Step 3: Generating */}
                      {thinkingStep === "generating" && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <BrainCircuit className="h-4 w-4 animate-pulse text-purple-400" />
                          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                            Synthesizing Output
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-white/5 bg-navy-deep/80 backdrop-blur-xl px-4 py-4 z-10 sticky bottom-0">
          <div className="mx-auto flex max-w-3xl items-end gap-3 relative">
            <textarea
              rows={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Aura AI..."
              className="max-h-32 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/[0.05] transition-all custom-scrollbar"
            />
            <button
              type="button"
              disabled={loading || !value.trim()}
              onClick={() => void send()}
              className="inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            </button>
          </div>
          <div className="text-center mt-3">
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
               AI can make mistakes. Verify important info.
             </span>
          </div>
        </div>
      </main>
    </div>
  );
}

