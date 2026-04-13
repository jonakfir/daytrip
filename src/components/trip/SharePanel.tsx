"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Link2, Check, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { nativeShare } from "@/lib/capacitor";

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

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      const shown = await nativeShare({
        title: `${destination} — ${duration} day trip`,
        text: `Check out my ${duration}-day trip to ${destination}!`,
        url: shareUrl,
      });
      if (shown && !cancelled) onClose();
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, shareUrl, destination, duration, onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-charcoal-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-cream-50 rounded-t-3xl p-6 pb-10 md:max-w-lg md:mx-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-2xl shadow-elevated">
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
            WhatsApp
          </button>
        </div>
      </div>
    </>
  );
}
