"use client";

/**
 * DeepLinkBridge — catches incoming `daytrip://add-clip?url=...` deep
 * links and fires a `daytrip:pending-clip` CustomEvent that the
 * ClipsToolbar picks up.
 *
 * Three entry paths (all safe to run together):
 *   1. Capacitor App plugin `appUrlOpen` event (iOS share extension handoff).
 *   2. Initial page load with `?pending_clip_url=...` in the URL (web fallback).
 *   3. Pending URL stashed in localStorage from a previous session (cold-start
 *      race where the event fired before this component mounted).
 *
 * The component renders nothing. Mount it once inside the root layout
 * below `<AuthProvider>` so it's present on every page.
 */

import { useEffect } from "react";

interface CapacitorAppPlugin {
  addListener: (
    event: "appUrlOpen",
    handler: (data: { url: string }) => void
  ) => { remove?: () => void };
}

function capacitorApp(): CapacitorAppPlugin | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { App?: CapacitorAppPlugin } };
  };
  if (!w.Capacitor?.isNativePlatform?.()) return null;
  return w.Capacitor.Plugins?.App ?? null;
}

function dispatchPending(url: string) {
  try {
    window.dispatchEvent(new CustomEvent("daytrip:pending-clip", { detail: { url } }));
    localStorage.setItem("daytrip:pending-clip-url", url);
  } catch {
    // ignore storage/event failures — worst case the user pastes manually
  }
}

function parseDeepLink(deepLink: string): string | null {
  try {
    const u = new URL(deepLink);
    // daytrip://add-clip?url=<encoded>
    if (u.protocol === "daytrip:" && (u.host === "add-clip" || u.pathname.includes("add-clip"))) {
      const inner = u.searchParams.get("url");
      if (inner) return decodeURIComponent(inner);
    }
  } catch {
    // not a URL we recognize
  }
  return null;
}

export default function DeepLinkBridge() {
  useEffect(() => {
    // 1. Capacitor appUrlOpen
    const app = capacitorApp();
    const sub = app?.addListener("appUrlOpen", (data) => {
      const inner = parseDeepLink(data.url);
      if (inner) dispatchPending(inner);
    });

    // 2. URL query on initial load
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get("pending_clip_url");
      if (fromQuery) {
        dispatchPending(fromQuery);
        // Clean the URL so reloads don't re-trigger.
        params.delete("pending_clip_url");
        const cleaned = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
        window.history.replaceState({}, "", cleaned);
      }
    } catch {
      // ignore
    }

    return () => {
      try {
        sub?.remove?.();
      } catch {
        // ignore
      }
    };
  }, []);

  return null;
}
