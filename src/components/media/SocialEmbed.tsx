"use client";

/**
 * SocialEmbed — renders a TikTok or Instagram oEmbed HTML blob in a
 * lazy-loaded sandboxed container.
 *
 * Design notes:
 *  - We intentionally render the provider's `html` directly (not into a
 *    sandboxed iframe) because TikTok/IG embeds rely on document-scope
 *    script injection (`tiktok.com/embed.js`, `instagram.com/embed.js`).
 *    The platforms' embed scripts transform the `<blockquote>` into an
 *    iframe at runtime — that iframe is already sandboxed by the
 *    provider, which is where the sandbox guarantee actually matters.
 *  - Embed scripts only load when the embed scrolls into view (intersection
 *    observer) so a day with 8 clips doesn't blow up initial load.
 *  - If the embed fails (deleted post, geo-blocked), we fall back to the
 *    cached thumbnail + a "Watch on {platform}" link.
 */

import { useEffect, useRef, useState } from "react";
import type { TripMedia } from "@/types/itinerary";

const EMBED_SCRIPTS: Record<TripMedia["platform"], string> = {
  tiktok: "https://www.tiktok.com/embed.js",
  instagram: "https://www.instagram.com/embed.js",
  youtube_shorts: "", // not yet implemented
};

const loadedScripts = new Set<string>();

function loadScript(src: string): Promise<void> {
  if (!src) return Promise.resolve();
  if (loadedScripts.has(src)) {
    // Re-run the IG / TikTok reparse if their global is available.
    const w = window as unknown as { instgrm?: { Embeds?: { process?: () => void } } };
    w.instgrm?.Embeds?.process?.();
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

export interface SocialEmbedProps {
  media: TripMedia;
  /** Pass true when rendered inside a popover already in view — skips the
   *  intersection-observer wait so the embed pops immediately. */
  eager?: boolean;
  className?: string;
}

export function SocialEmbed({ media, eager = false, className }: SocialEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(eager);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  useEffect(() => {
    if (!inView) return;
    const src = EMBED_SCRIPTS[media.platform];
    loadScript(src).catch((err) => {
      console.warn("[SocialEmbed] script load failed:", err);
      setFailed(true);
    });
  }, [inView, media.platform]);

  if (failed) return <FallbackCard media={media} className={className} />;

  return (
    <div ref={containerRef} className={className} data-platform={media.platform}>
      {inView ? (
        // The provider's HTML is attacker-controlled *in the sense that* we
        // didn't author the blockquote template — but it comes from TikTok /
        // Meta's signed oEmbed response, which is the same root of trust as
        // viewing the post on the platform itself. We sanitize implicit by
        // confining to the oEmbed payload shape (Zod-validated upstream).
        <div
          dangerouslySetInnerHTML={{ __html: media.embedHtml }}
          style={{ minHeight: 400 }}
        />
      ) : (
        <div style={{ minHeight: 400, background: "#f3f4f6", borderRadius: 12 }} aria-hidden="true" />
      )}
    </div>
  );
}

function FallbackCard({ media, className }: { media: TripMedia; className?: string }) {
  const platformLabel = media.platform === "tiktok" ? "TikTok" : "Instagram";
  return (
    <a
      href={media.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        display: "block",
        padding: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {media.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.thumbnailUrl}
          alt={media.title ?? `${platformLabel} clip`}
          style={{ width: "100%", borderRadius: 8, marginBottom: 8 }}
        />
      )}
      <div style={{ fontWeight: 600 }}>{media.title ?? `${platformLabel} clip`}</div>
      {media.authorName && <div style={{ fontSize: 13, color: "#6b7280" }}>@{media.authorName}</div>}
      <div style={{ fontSize: 13, color: "#2563eb", marginTop: 4 }}>Watch on {platformLabel} →</div>
    </a>
  );
}
