"use client";

/**
 * TripMap — renders every activity + hotel + social clip with coords as
 * a pin on a MapLibre GL map. Pins are colored per day; clicking a pin
 * opens a popover with the activity details (and the embed, if it's a clip).
 *
 * Why MapLibre (not Mapbox)? MIT-licensed, works with MapTiler's free tier,
 * and ships its own TS types. Client-side only — imports `maplibre-gl`
 * dynamically because it touches `window` on load.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Itinerary, TripMedia, Activity, Hotel } from "@/types/itinerary";
import { colorForDay } from "@/lib/map/day-colors";
import { SocialEmbed } from "@/components/media/SocialEmbed";

// Minimal structural types so we don't have to import maplibre-gl's full
// types at the top level (keeps SSR + build-time footprint small).
type Map = {
  addControl: (c: unknown, pos?: string) => void;
  on: (evt: string, handler: (e?: unknown) => void) => void;
  remove: () => void;
  fitBounds: (bounds: [[number, number], [number, number]], opts?: unknown) => void;
  getContainer: () => HTMLElement;
};

interface Pin {
  id: string;
  kind: "activity" | "hotel" | "clip";
  dayNumber: number | null;
  slot?: "morning" | "afternoon" | "evening";
  name: string;
  lat: number;
  lng: number;
  color: string;
  activity?: Activity;
  hotel?: Hotel;
  media?: TripMedia;
}

function collectPins(itinerary: Itinerary, media: TripMedia[]): Pin[] {
  const pins: Pin[] = [];

  for (const day of itinerary.days) {
    for (const slot of ["morning", "afternoon", "evening"] as const) {
      for (const a of day[slot]) {
        if (!a.coords || a.coords.confidence === "unresolved") continue;
        pins.push({
          id: `a:${day.dayNumber}:${slot}:${a.name}`,
          kind: "activity",
          dayNumber: day.dayNumber,
          slot,
          name: a.name,
          lat: a.coords.lat,
          lng: a.coords.lng,
          color: colorForDay(day.dayNumber),
          activity: a,
        });
      }
    }
  }

  for (let i = 0; i < itinerary.hotels.length; i++) {
    const h = itinerary.hotels[i];
    // Hotels don't carry coords in the existing schema — they'll be
    // backfilled by the same geocode pipeline in a later pass. Skip for now.
    if (!("coords" in h) || !(h as Hotel & { coords?: { lat: number; lng: number } }).coords) continue;
  }

  for (const m of media) {
    if (!m.coords || m.coords.confidence === "unresolved") continue;
    pins.push({
      id: `m:${m.id}`,
      kind: "clip",
      dayNumber: m.dayNumber,
      slot: m.slot ?? undefined,
      name: m.placeName ?? m.title ?? "Clip",
      lat: m.coords.lat,
      lng: m.coords.lng,
      color: m.dayNumber ? colorForDay(m.dayNumber) : "#6b7280",
      media: m,
    });
  }

  return pins;
}

export interface TripMapProps {
  itinerary: Itinerary;
  media: TripMedia[];
  /** When set, only pins on this day show. `null` = all days. */
  focusDay?: number | null;
  className?: string;
}

export function TripMap({ itinerary, media, focusDay, className }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Array<{ remove: () => void }>>([]);
  const [selected, setSelected] = useState<Pin | null>(null);
  const [activeDay, setActiveDay] = useState<number | null>(focusDay ?? null);

  const allPins = useMemo(() => collectPins(itinerary, media), [itinerary, media]);
  const visiblePins = useMemo(
    () => (activeDay == null ? allPins : allPins.filter((p) => p.dayNumber === activeDay)),
    [allPins, activeDay]
  );

  // Initialize map once.
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    (async () => {
      const [{ default: maplibregl }] = await Promise.all([import("maplibre-gl"), import("maplibre-gl/dist/maplibre-gl.css")]);
      if (cancelled || !containerRef.current) return;
      const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
      if (!key) {
        console.error("[TripMap] NEXT_PUBLIC_MAPTILER_KEY missing");
        return;
      }
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`,
        center: [0, 20],
        zoom: 2,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map as unknown as Map;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Redraw markers whenever visible pins change.
  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const { default: maplibregl } = await import("maplibre-gl");
      if (cancelled || !mapRef.current) return;
      // Clear previous markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (visiblePins.length === 0) return;

      for (const pin of visiblePins) {
        const el = document.createElement("button");
        el.setAttribute("aria-label", pin.name);
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: ${pin.color}; border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3); cursor: pointer;
          display: grid; place-items: center;
          color: white; font-weight: 700; font-size: 12px;
          font-family: system-ui, sans-serif;
        `;
        el.textContent = pin.kind === "clip" ? "▶" : String(pin.dayNumber ?? "?");
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          setSelected(pin);
        });
        const marker = new maplibregl.Marker({ element: el }).setLngLat([pin.lng, pin.lat]).addTo(
          mapRef.current as unknown as Parameters<typeof marker.addTo>[0]
        );
        markersRef.current.push(marker);
      }

      // Fit bounds
      if (visiblePins.length === 1) {
        (mapRef.current as unknown as { flyTo: (o: { center: [number, number]; zoom: number }) => void }).flyTo({
          center: [visiblePins[0].lng, visiblePins[0].lat],
          zoom: 13,
        });
      } else {
        const bounds = new maplibregl.LngLatBounds();
        for (const p of visiblePins) bounds.extend([p.lng, p.lat]);
        mapRef.current.fitBounds(
          [
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()],
          ],
          { padding: 60, maxZoom: 14, duration: 600 }
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visiblePins]);

  const days = itinerary.days.map((d) => d.dayNumber);
  const unresolvedCount = [...itinerary.days.flatMap((d) => [...d.morning, ...d.afternoon, ...d.evening])].filter(
    (a) => !a.coords || a.coords.confidence === "unresolved"
  ).length;

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* Day filter chips */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          background: "rgba(255,255,255,0.92)",
          padding: 8,
          borderRadius: 12,
          maxWidth: "calc(100% - 72px)",
        }}
      >
        <ChipButton active={activeDay == null} onClick={() => setActiveDay(null)}>
          All
        </ChipButton>
        {days.map((d) => (
          <ChipButton
            key={d}
            active={activeDay === d}
            color={colorForDay(d)}
            onClick={() => setActiveDay(activeDay === d ? null : d)}
          >
            Day {d}
          </ChipButton>
        ))}
      </div>

      {unresolvedCount > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            right: 12,
            background: "rgba(255,255,255,0.92)",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          {unresolvedCount} stop{unresolvedCount === 1 ? "" : "s"} couldn&apos;t be placed on the map.
        </div>
      )}

      {selected && (
        <PinSheet pin={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function ChipButton({
  children,
  onClick,
  active,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${active ? color ?? "#111827" : "#e5e7eb"}`,
        background: active ? color ?? "#111827" : "white",
        color: active ? "white" : "#111827",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function PinSheet({ pin, onClose }: { pin: Pin; onClose: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 12,
        width: 360,
        maxWidth: "calc(100% - 24px)",
        maxHeight: "calc(100% - 24px)",
        overflowY: "auto",
        background: "white",
        borderRadius: 12,
        boxShadow: "0 6px 30px rgba(0,0,0,0.2)",
        padding: 16,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "transparent",
          border: 0,
          fontSize: 20,
          cursor: "pointer",
          color: "#6b7280",
        }}
      >
        ×
      </button>
      <div style={{ fontSize: 12, fontWeight: 600, color: pin.color, marginBottom: 4 }}>
        {pin.dayNumber != null ? `Day ${pin.dayNumber}` : "Unassigned"}
        {pin.slot ? ` · ${pin.slot}` : ""}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, paddingRight: 24 }}>{pin.name}</div>
      {pin.activity && (
        <>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
            {pin.activity.time} · {pin.activity.duration}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{pin.activity.description}</p>
        </>
      )}
      {pin.media && (
        <div style={{ marginTop: 10 }}>
          <SocialEmbed media={pin.media} eager />
        </div>
      )}
    </div>
  );
}
