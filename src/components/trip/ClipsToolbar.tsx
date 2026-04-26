"use client";

/**
 * ClipsToolbar — the two entry points for the Social Clips + Trip Map
 * feature, rendered above the day list on /trip/[id].
 *
 *   [ + Add clip ]   [ View map ]
 *
 * Hidden when the SOCIAL_CLIPS_ENABLED flag is off. Listens for the
 * "daytrip:pending-clip" CustomEvent fired by the iOS share extension
 * bridge (see Phase 5) so the dialog auto-opens with the URL prefilled.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapIcon, VideoIcon } from "lucide-react";
import type { Itinerary, TripMedia } from "@/types/itinerary";
import { AddClipDialog } from "@/components/trip/AddClipDialog";

export interface ClipsToolbarProps {
  itinerary: Itinerary;
  onClipAdded?: (media: TripMedia) => void;
}

const flagEnabled =
  process.env.NEXT_PUBLIC_SOCIAL_CLIPS_ENABLED === "true" ||
  process.env.SOCIAL_CLIPS_ENABLED === "true";

export function ClipsToolbar({ itinerary, onClipAdded }: ClipsToolbarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialUrl, setInitialUrl] = useState<string | undefined>();

  // iOS share-extension handoff. The native layer posts a CustomEvent
  // whenever a new share-URL is queued; we pop the dialog with it.
  useEffect(() => {
    function onPending(e: Event) {
      const detail = (e as CustomEvent<{ url?: string }>).detail;
      if (!detail?.url) return;
      setInitialUrl(detail.url);
      setDialogOpen(true);
    }
    window.addEventListener("daytrip:pending-clip", onPending as EventListener);
    // Pick up any pending URL set before this component mounted
    try {
      const pending = localStorage.getItem("daytrip:pending-clip-url");
      if (pending) {
        setInitialUrl(pending);
        setDialogOpen(true);
        localStorage.removeItem("daytrip:pending-clip-url");
      }
    } catch {
      // ignore storage quirks
    }
    return () => window.removeEventListener("daytrip:pending-clip", onPending as EventListener);
  }, []);

  if (!flagEnabled) return null;

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cream-300 bg-white text-charcoal-800 font-sans text-body-sm hover:border-terracotta-500 hover:text-terracotta-600 transition-colors"
        >
          <VideoIcon className="w-4 h-4" />
          Add clip
        </button>
        <Link
          href={`/trip/${itinerary.shareId}/map`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cream-300 bg-white text-charcoal-800 font-sans text-body-sm hover:border-sage-500 hover:text-sage-600 transition-colors"
        >
          <MapIcon className="w-4 h-4" />
          View full map
        </Link>
      </div>

      <AddClipDialog
        itinerary={itinerary}
        open={dialogOpen}
        initialUrl={initialUrl}
        onClose={() => {
          setDialogOpen(false);
          setInitialUrl(undefined);
        }}
        onAdded={(m) => {
          onClipAdded?.(m);
        }}
      />
    </>
  );
}
