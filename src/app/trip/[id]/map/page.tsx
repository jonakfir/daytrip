"use client";

/**
 * /trip/[id]/map — full-screen trip map view.
 *
 * Client Component so it can own the fetch+backfill+render flow without
 * blocking on server-side geocoding (backfill can take a few seconds for
 * a long trip). Renders a skeleton while loading.
 *
 * Respects share visibility: anonymous users can see public trips; owners
 * see their own trips. 404 otherwise.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Itinerary, TripMedia } from "@/types/itinerary";
import { TripMap } from "@/components/map/TripMap";

interface LoadState {
  itinerary: Itinerary | null;
  media: TripMedia[];
  loading: boolean;
  error: string | null;
  backfilling: boolean;
}

export default function TripMapPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [state, setState] = useState<LoadState>({
    itinerary: null,
    media: [],
    loading: true,
    error: null,
    backfilling: false,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [itinRes, mediaRes] = await Promise.all([
          fetch(`/api/share/${id}`),
          fetch(`/api/trips/${id}/media`),
        ]);
        if (!itinRes.ok) {
          setState((s) => ({ ...s, loading: false, error: itinRes.status === 404 ? "Trip not found" : "Failed to load trip" }));
          return;
        }
        const itinJson = (await itinRes.json()) as { itinerary: Itinerary };
        const mediaJson = mediaRes.ok ? ((await mediaRes.json()) as { media: TripMedia[] }) : { media: [] };
        if (cancelled) return;

        // If no activities have coords, trigger backfill in the background.
        const needsBackfill = itinJson.itinerary.days.some((d) =>
          [...d.morning, ...d.afternoon, ...d.evening].some((a) => !a.coords)
        );
        setState({ itinerary: itinJson.itinerary, media: mediaJson.media, loading: false, error: null, backfilling: needsBackfill });

        if (needsBackfill) {
          try {
            const bf = await fetch(`/api/trips/${id}/backfill-coords`, { method: "POST" });
            if (bf.ok) {
              const { itinerary } = (await bf.json()) as { itinerary: Itinerary };
              if (!cancelled) setState((s) => ({ ...s, itinerary, backfilling: false }));
            } else {
              // Not the owner — render what we have.
              if (!cancelled) setState((s) => ({ ...s, backfilling: false }));
            }
          } catch {
            if (!cancelled) setState((s) => ({ ...s, backfilling: false }));
          }
        }
      } catch (err) {
        if (!cancelled) setState({ itinerary: null, media: [], loading: false, error: String(err), backfilling: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh", color: "#6b7280" }}>
        Loading trip map…
      </div>
    );
  }
  if (state.error || !state.itinerary) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh", padding: 24, textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Can&apos;t load this trip</h1>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>{state.error ?? "Unknown error"}</p>
          <button onClick={() => router.back()} style={{ padding: "8px 14px", border: "1px solid #e5e7eb", borderRadius: 8, background: "white" }}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#f3f4f6" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "linear-gradient(180deg, rgba(0,0,0,0.25), transparent)",
          color: "white",
          pointerEvents: "none",
        }}
      >
        <Link
          href={`/trip/${id}`}
          style={{
            pointerEvents: "auto",
            background: "rgba(255,255,255,0.95)",
            color: "#111827",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          ← Back to trip
        </Link>
        {state.backfilling && (
          <div
            style={{
              background: "rgba(0,0,0,0.6)",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
            }}
          >
            Placing stops on the map…
          </div>
        )}
      </div>
      <TripMap itinerary={state.itinerary} media={state.media} />
    </div>
  );
}
