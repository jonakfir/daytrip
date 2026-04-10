"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Sparkles, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Itinerary } from "@/types/itinerary";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface ChatPanelProps {
  itinerary: Itinerary;
  onItineraryUpdate: (next: Itinerary) => void;
}

const SUGGESTIONS = [
  "Make day 2 more relaxing",
  "Add more foodie spots",
  "Swap the dinner for vegetarian",
  "Less walking, more cafes",
];

export default function ChatPanel({ itinerary, onItineraryUpdate }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey! I can tweak your itinerary. Tell me what you'd like to change.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll on new messages
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // Hard timeout: abort the fetch after 150s so the spinner can't hang
    // forever if Claude CLI stalls upstream.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150_000);

    try {
      const res = await fetch("/api/refine-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary, message: trimmed }),
        signal: controller.signal,
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: "Refinement is available for admin / subscribed users.",
            },
          ]);
          return;
        }
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      // Apply the updated itinerary if returned AND it actually changed
      if (data?.itinerary && !data?.unchanged) {
        onItineraryUpdate(data.itinerary as Itinerary);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: data?.reply ?? "Done.",
        },
      ]);
    } catch (e) {
      const isAbort = e instanceof DOMException && e.name === "AbortError";
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: isAbort
            ? "That took too long — Claude might be under load. Try again in a moment."
            : `Sorry — ${e instanceof Error ? e.message : "something went wrong"}.`,
        },
      ]);
    } finally {
      clearTimeout(timeoutId);
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 220, damping: 20 }}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3",
          "rounded-full bg-terracotta-500 text-white shadow-elevated",
          "hover:bg-terracotta-600 hover:scale-105 active:scale-95",
          "transition-all duration-200 font-sans font-medium text-body-sm"
        )}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
      >
        {isOpen ? (
          <>
            <X className="w-4 h-4" /> Close
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" /> Refine with AI
          </>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed bottom-24 right-6 z-40 flex flex-col",
              "w-[min(420px,calc(100vw-3rem))] h-[min(600px,calc(100vh-8rem))]",
              "rounded-3xl bg-white shadow-elevated border border-cream-200",
              "overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-cream-200 bg-gradient-to-r from-terracotta-500/10 to-sage-300/10">
              <div className="p-2 rounded-full bg-terracotta-500 text-white">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-heading text-charcoal-900 leading-tight">
                  Trip Assistant
                </h3>
                <p className="font-sans text-caption text-charcoal-800/50">
                  Powered by Claude
                </p>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-body-sm",
                      msg.role === "user"
                        ? "bg-terracotta-500 text-white rounded-br-sm"
                        : "bg-cream-100 text-charcoal-900 rounded-bl-sm"
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-cream-100 rounded-2xl rounded-bl-sm px-4 py-3 inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-terracotta-500 animate-spin" />
                    <span className="font-sans text-caption text-charcoal-800/60">
                      Rewriting your trip…
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestion chips */}
            {messages.length <= 1 && (
              <div className="px-5 pb-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={sending}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-caption font-sans",
                      "border border-cream-300 text-charcoal-800/70",
                      "hover:border-terracotta-500 hover:text-terracotta-500 hover:bg-terracotta-500/5",
                      "disabled:opacity-50 transition-colors"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 px-4 py-3 border-t border-cream-200 bg-cream-50"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to change something..."
                disabled={sending}
                className={cn(
                  "flex-1 bg-white rounded-full px-4 py-2.5 font-sans text-body-sm",
                  "border border-cream-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500/40",
                  "disabled:opacity-50"
                )}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className={cn(
                  "p-2.5 rounded-full bg-terracotta-500 text-white",
                  "hover:bg-terracotta-600 disabled:opacity-40 disabled:cursor-not-allowed",
                  "transition-colors"
                )}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
