"use client";

/**
 * AddClipDialog — paste a TikTok/Instagram URL, see a preview, pick a
 * place candidate (or drop a pin manually later), and attach it to a
 * specific day/slot on the trip.
 *
 * Flow:
 *   1. User pastes URL → POST /api/media/preview
 *   2. Dialog shows embed preview + list of geocoded place candidates
 *   3. User picks day + slot + (optional) place
 *   4. POST /api/media/attach → on success, onAdded(media) fires
 *
 * We don't render the TikTok/IG embed script here to keep the dialog
 * fast — the user already knows what the clip is. SocialEmbed renders
 * the real embed inside the day section after save.
 */

import { useEffect, useRef, useState } from "react";
import type { Itinerary, TripMedia, ActivityCoords, TripSlot } from "@/types/itinerary";

interface PreviewResponse {
  preview: {
    platform: "tiktok" | "instagram";
    sourceUrl: string;
    providerVideoId: string;
    embedHtml: string;
    thumbnailUrl?: string;
    authorName?: string;
    authorUrl?: string;
    title?: string;
  };
  placeCandidates: Array<{
    name: string;
    type: string;
    city?: string;
    geocode: {
      placeId?: string;
      displayName: string;
      latitude: number;
      longitude: number;
      confidence: ActivityCoords["confidence"];
    } | null;
  }>;
}

export interface AddClipDialogProps {
  itinerary: Itinerary;
  open: boolean;
  /** Preselect the day the user clicked "+ Add clip" on, if any. */
  initialDay?: number;
  /** Preselect the slot (morning / afternoon / evening), if known. */
  initialSlot?: TripSlot;
  /** Preset URL when opened from the iOS share extension deep link. */
  initialUrl?: string;
  onClose: () => void;
  onAdded: (media: TripMedia) => void;
}

export function AddClipDialog({
  itinerary,
  open,
  initialDay,
  initialSlot,
  initialUrl,
  onClose,
  onAdded,
}: AddClipDialogProps) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<number>(0);
  const [dayNumber, setDayNumber] = useState<number | "">(initialDay ?? itinerary.days[0]?.dayNumber ?? 1);
  const [slot, setSlot] = useState<TripSlot>(initialSlot ?? "morning");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      if (initialUrl && !preview) void handlePreview(initialUrl);
    } else {
      // Reset on close
      setUrl("");
      setPreview(null);
      setError(null);
      setSelectedCandidateIdx(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handlePreview(rawUrl: string) {
    setError(null);
    setFetchingPreview(true);
    setPreview(null);
    try {
      const r = await fetch("/api/media/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rawUrl, itineraryId: itinerary.id || itinerary.shareId }),
      });
      const json = await r.json();
      if (!r.ok) {
        setError(json.message ?? json.error ?? `Preview failed (${r.status})`);
        return;
      }
      setPreview(json as PreviewResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setFetchingPreview(false);
    }
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const candidate = preview.placeCandidates[selectedCandidateIdx];
      const r = await fetch("/api/media/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryId: itinerary.id || itinerary.shareId,
          url: preview.preview.sourceUrl,
          dayNumber: dayNumber === "" ? null : dayNumber,
          slot,
          placeName: candidate?.name,
          coords: candidate?.geocode
            ? {
                lat: candidate.geocode.latitude,
                lng: candidate.geocode.longitude,
                placeId: candidate.geocode.placeId,
                confidence: candidate.geocode.confidence,
              }
            : undefined,
        }),
      });
      const json = await r.json();
      if (!r.ok) {
        setError(json.message ?? json.error ?? `Save failed (${r.status})`);
        return;
      }
      onAdded(json.media as TripMedia);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100,
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 16,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Add clip to trip</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: 0, background: "transparent", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 14px" }}>
          Paste a TikTok or Instagram Reel link. We&apos;ll drop it on the map for your trip.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@user/video/..."
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              fontSize: 14,
            }}
          />
          <button
            onClick={() => handlePreview(url)}
            disabled={!url.trim() || fetchingPreview}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: 0,
              background: "#111827",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              cursor: fetchingPreview ? "wait" : "pointer",
            }}
          >
            {fetchingPreview ? "Loading…" : "Preview"}
          </button>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#991b1b", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {preview && (
          <>
            <div style={{ display: "flex", gap: 10, padding: 10, background: "#f9fafb", borderRadius: 10, marginBottom: 12 }}>
              {preview.preview.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.preview.thumbnailUrl} alt="" style={{ width: 80, height: 100, objectFit: "cover", borderRadius: 6 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {preview.preview.platform}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{preview.preview.title ?? "Untitled"}</div>
                {preview.preview.authorName && <div style={{ fontSize: 13, color: "#6b7280" }}>@{preview.preview.authorName}</div>}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Where on the map?</div>
              {preview.placeCandidates.length === 0 && (
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  We couldn&apos;t detect a specific place from the caption. It&apos;ll attach without a pin — you can drop
                  one from the map view after saving.
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {preview.placeCandidates.map((c, i) => (
                  <label
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      padding: 10,
                      border: `1px solid ${selectedCandidateIdx === i ? "#111827" : "#e5e7eb"}`,
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="candidate"
                      checked={selectedCandidateIdx === i}
                      onChange={() => setSelectedCandidateIdx(i)}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {c.geocode ? c.geocode.displayName : "Couldn't geocode — will attach without a pin"}
                        {c.geocode && ` · confidence: ${c.geocode.confidence}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <select
                value={dayNumber}
                onChange={(e) => setDayNumber(e.target.value === "" ? "" : Number(e.target.value))}
                style={{ flex: 1, padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 10 }}
              >
                <option value="">Unassigned</option>
                {itinerary.days.map((d) => (
                  <option key={d.dayNumber} value={d.dayNumber}>Day {d.dayNumber} · {d.title}</option>
                ))}
              </select>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value as TripSlot)}
                style={{ padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 10 }}
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={onClose}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: 0,
                  background: "#111827",
                  color: "white",
                  fontWeight: 700,
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Add to trip"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
