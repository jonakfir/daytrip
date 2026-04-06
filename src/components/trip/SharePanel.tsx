"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Check, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SharePanelProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  destination: string;
  duration: number;
}

export default function SharePanel({
  isOpen,
  onClose,
  shareUrl,
  destination,
  duration,
}: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const shareToTwitter = () => {
    const text = encodeURIComponent(
      `Check out my ${duration}-day trip to ${destination}!`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out my ${duration}-day trip to ${destination}! ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-charcoal-900/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-cream-50 rounded-t-3xl p-6 pb-10 md:max-w-lg md:mx-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-cream-200 text-charcoal-800/60 hover:bg-cream-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="font-serif text-heading-lg text-charcoal-900 mb-6">
              Share this trip
            </h2>

            {/* Preview Card */}
            <div className="bg-gradient-to-br from-charcoal-900 to-terracotta-500 rounded-xl p-5 mb-6 text-white">
              <div className="flex items-center gap-2 mb-2 text-cream-200/70">
                <MapPin className="w-3.5 h-3.5" />
                <span className="font-sans text-caption uppercase tracking-wider">
                  Daytrip Itinerary
                </span>
              </div>
              <h3 className="font-serif text-heading-xl mb-2">{destination}</h3>
              <div className="flex items-center gap-1.5 text-cream-200/80 font-sans text-body-sm">
                <Calendar className="w-3.5 h-3.5" />
                <span>{duration} days</span>
              </div>
            </div>

            {/* Share URL */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex-1 bg-white rounded-lg border border-cream-200 px-3 py-2.5 text-body-sm font-sans text-charcoal-800/60 truncate">
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-sans text-body-sm font-medium transition-colors",
                  copied
                    ? "bg-sage-500 text-white"
                    : "bg-terracotta-500 text-white hover:bg-terracotta-600"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* Social Buttons */}
            <div className="flex gap-3">
              <button
                onClick={shareToTwitter}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-charcoal-900 text-white font-sans text-body-sm font-medium hover:bg-charcoal-800 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on X
              </button>
              <button
                onClick={shareToWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-sans text-body-sm font-medium hover:bg-[#20BD5A] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
