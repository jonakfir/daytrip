"use client";

import { useMemo, useState } from "react";
import {
  Plane,
  Hotel as HotelIcon,
  Map,
  Star,
  Clock,
  ChevronDown,
  ExternalLink,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flight, Hotel, ViatorTour } from "@/types/itinerary";

interface SidebarProps {
  flights: Flight[];
  hotels: Hotel[];
  /** Per-city tiered hotels. When present the UI groups by city with
   *  4 tier cards each. Falls back to the flat `hotels` list when
   *  absent (single-city or legacy trips). */
  hotelsByCity?: Record<string, Hotel[]>;
  tours: ViatorTour[];
}

// ─── Collapsible section ──────────────────────────────────────────────

function SidebarSection({
  title,
  icon: Icon,
  rightSlot,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof Plane;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-cream-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 px-1 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-terracotta-500" />
          <span className="font-serif text-heading text-charcoal-900">
            {title}
          </span>
          {rightSlot}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-charcoal-800/40 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen
            ? "max-h-[5000px] opacity-100"
            : "max-h-0 opacity-0"
        )}
      >
        <div className="pb-5 px-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Flight card (honest pricing) ─────────────────────────────────────

function FlightCard({
  flight,
  isBestPrice,
}: {
  flight: Flight;
  isBestPrice?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow mb-3",
        isBestPrice
          ? "border-sage-400/60 ring-1 ring-sage-400/30"
          : "border-cream-200"
      )}
    >
      {isBestPrice && (
        <div className="inline-flex items-center bg-sage-500 text-white text-[9px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm mb-2">
          Best price
        </div>
      )}
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-sans text-body-sm font-medium text-charcoal-900 truncate">
            {flight.airline}
          </div>
          <div className="text-caption font-sans text-charcoal-800/50 mt-0.5">
            {flight.originAirport ?? "—"} → {flight.destinationAirport ?? "—"}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-serif text-heading text-charcoal-900 leading-none">
            {flight.price}
          </div>
          <div className="text-[10px] font-sans text-charcoal-800/50 mt-0.5">
            / person
          </div>
          <div className="text-[9px] font-sans text-charcoal-800/40 uppercase tracking-wide mt-0.5">
            est.
          </div>
        </div>
      </div>
      <div className="text-caption font-sans text-charcoal-800/40 mb-3">
        {flight.stops === 0
          ? "Direct"
          : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
      </div>
      <a
        href={flight.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-terracotta-500 text-white font-sans text-body-sm font-semibold hover:bg-terracotta-600 active:bg-terracotta-700 transition-colors shadow-sm"
      >
        See live price on Skyscanner
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

// ─── Hotel card ───────────────────────────────────────────────────────

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  hostel: {
    label: "Hostel",
    cls: "bg-sage-500/10 text-sage-700 border-sage-500/30",
  },
  budget: {
    label: "Budget",
    cls: "bg-cream-200 text-charcoal-800 border-cream-300",
  },
  mid: {
    label: "Mid-range",
    cls: "bg-terracotta-500/10 text-terracotta-600 border-terracotta-500/30",
  },
  upscale: {
    label: "Upscale",
    cls: "bg-amber-400/15 text-amber-700 border-amber-400/40",
  },
};

function HotelCard({ hotel }: { hotel: Hotel }) {
  const tierBadge = hotel.tier ? TIER_BADGE[hotel.tier] : null;
  return (
    <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm hover:shadow-md transition-shadow mb-3">
      {tierBadge && (
        <div
          className={cn(
            "inline-flex items-center text-[9px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-2",
            tierBadge.cls
          )}
        >
          {tierBadge.label}
        </div>
      )}
      <h4 className="font-serif text-heading text-charcoal-900 mb-1 leading-tight">
        {hotel.name}
      </h4>
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-3.5 h-3.5",
              i < Math.round(hotel.rating)
                ? "text-amber-400 fill-amber-400"
                : "text-cream-200"
            )}
          />
        ))}
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="font-serif text-heading-lg text-terracotta-500">
          {hotel.pricePerNight}
        </span>
        <span className="text-caption font-sans text-charcoal-800/50">
          /night
        </span>
        <span className="ml-1 text-[9px] font-sans text-charcoal-800/40 uppercase tracking-wide">
          est.
        </span>
      </div>
      <a
        href={hotel.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-terracotta-500 text-white font-sans text-body-sm font-semibold hover:bg-terracotta-600 active:bg-terracotta-700 transition-colors shadow-sm"
      >
        See live price
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

// ─── Tour card ────────────────────────────────────────────────────────

function TourCard({ tour }: { tour: ViatorTour }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-card mb-3">
      <h4 className="font-serif text-heading text-charcoal-900 mb-1.5 leading-tight">
        {tour.name}
      </h4>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1 text-caption font-sans text-charcoal-800/60">
          <Clock className="w-3.5 h-3.5" />
          {tour.duration}
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-3 h-3",
                i < Math.round(tour.rating)
                  ? "text-amber-400 fill-amber-400"
                  : "text-cream-200"
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-serif text-heading text-terracotta-500">
          {tour.price}
          <span className="ml-1 text-[9px] font-sans text-charcoal-800/40 uppercase tracking-wide">
            est.
          </span>
        </span>
        <a
          href={tour.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-terracotta-500 text-white font-sans text-body-sm font-medium hover:bg-terracotta-600 transition-colors"
        >
          See live price
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

// ─── Filter helpers ───────────────────────────────────────────────────

/** Parse "$145" → 145. Returns null if unparseable. */
function parsePrice(priceStr: string): number | null {
  const match = priceStr.match(/\$?\s*([\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ""));
}

type FlightFilterState = {
  stops: "any" | "nonstop" | "1stop" | "2stop";
  airlines: Set<string>;
  maxPrice: number | null;
};

type HotelFilterState = {
  minStars: number;
  maxPrice: number | null;
};

type TourFilterState = {
  minRating: number;
  maxPrice: number | null;
};

// ─── Main Sidebar ─────────────────────────────────────────────────────

export default function Sidebar({
  flights,
  hotels,
  hotelsByCity,
  tours,
}: SidebarProps) {
  // Flight filters
  const [flightFilters, setFlightFilters] = useState<FlightFilterState>({
    stops: "any",
    airlines: new Set(),
    maxPrice: null,
  });
  const [showFlightFilters, setShowFlightFilters] = useState(false);

  // Hotel filters
  const [hotelFilters, setHotelFilters] = useState<HotelFilterState>({
    minStars: 0,
    maxPrice: null,
  });
  const [showHotelFilters, setShowHotelFilters] = useState(false);

  // Tour filters
  const [tourFilters, setTourFilters] = useState<TourFilterState>({
    minRating: 0,
    maxPrice: null,
  });
  const [showTourFilters, setShowTourFilters] = useState(false);

  // Derive airline list + price ranges from the data
  const allAirlines = useMemo(
    () => Array.from(new Set(flights.map((f) => f.airline).filter(Boolean))),
    [flights]
  );
  const flightPriceMax = useMemo(() => {
    const prices = flights
      .map((f) => parsePrice(f.price ?? ""))
      .filter((p): p is number => p !== null);
    return prices.length ? Math.max(...prices) : 2000;
  }, [flights]);
  const hotelPriceMax = useMemo(() => {
    const prices = hotels
      .map((h) => parsePrice(h.pricePerNight ?? ""))
      .filter((p): p is number => p !== null);
    return prices.length ? Math.max(...prices) : 500;
  }, [hotels]);
  const tourPriceMax = useMemo(() => {
    const prices = tours
      .map((t) => parsePrice(t.price ?? ""))
      .filter((p): p is number => p !== null);
    return prices.length ? Math.max(...prices) : 300;
  }, [tours]);

  // Apply filters AND sort cheapest first so the "Best price" badge always
  // lands on the lowest-priced option in the visible list.
  const filteredFlights = useMemo(() => {
    return flights
      .filter((f) => {
        if (flightFilters.stops === "nonstop" && f.stops > 0) return false;
        if (flightFilters.stops === "1stop" && f.stops > 1) return false;
        if (flightFilters.stops === "2stop" && f.stops > 2) return false;
        if (
          flightFilters.airlines.size > 0 &&
          !flightFilters.airlines.has(f.airline)
        )
          return false;
        if (flightFilters.maxPrice !== null) {
          const p = parsePrice(f.price ?? "");
          if (p !== null && p > flightFilters.maxPrice) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const pa = parsePrice(a.price ?? "") ?? Infinity;
        const pb = parsePrice(b.price ?? "") ?? Infinity;
        return pa - pb;
      });
  }, [flights, flightFilters]);

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      if (h.rating < hotelFilters.minStars) return false;
      if (hotelFilters.maxPrice !== null) {
        const p = parsePrice(h.pricePerNight ?? "");
        if (p !== null && p > hotelFilters.maxPrice) return false;
      }
      return true;
    });
  }, [hotels, hotelFilters]);

  const filteredTours = useMemo(() => {
    return tours.filter((t) => {
      if (t.rating < tourFilters.minRating) return false;
      if (tourFilters.maxPrice !== null) {
        const p = parsePrice(t.price ?? "");
        if (p !== null && p > tourFilters.maxPrice) return false;
      }
      return true;
    });
  }, [tours, tourFilters]);

  return (
    <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)]">
      <div className="bg-cream-50 rounded-2xl border border-cream-200 shadow-md overflow-hidden lg:flex lg:flex-col lg:max-h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="bg-terracotta-500 px-5 py-4 shrink-0">
          <h2 className="font-serif text-heading-lg text-white mb-0.5">
            Book & Save
          </h2>
          <p className="font-sans text-body-sm text-white/80">
            Live prices from Skyscanner. Estimates shown are rough guides.
          </p>
        </div>

        {/* Scrollable content */}
        <div className="p-5 lg:overflow-y-auto lg:flex-1 overscroll-contain">
          {/* ─── Flights ─── */}
          {flights.length > 0 && (
            <SidebarSection
              title="Flights"
              icon={Plane}
              rightSlot={
                <FilterToggle
                  open={showFlightFilters}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFlightFilters((v) => !v);
                  }}
                  hasActive={
                    flightFilters.stops !== "any" ||
                    flightFilters.airlines.size > 0 ||
                    flightFilters.maxPrice !== null
                  }
                />
              }
            >
              {showFlightFilters && (
                <FilterPanel
                  onClear={() =>
                    setFlightFilters({
                      stops: "any",
                      airlines: new Set(),
                      maxPrice: null,
                    })
                  }
                >
                  <FilterRow label="Stops">
                    <div className="flex gap-1.5 flex-wrap">
                      {(["any", "nonstop", "1stop", "2stop"] as const).map(
                        (opt) => (
                          <Chip
                            key={opt}
                            active={flightFilters.stops === opt}
                            onClick={() =>
                              setFlightFilters((s) => ({ ...s, stops: opt }))
                            }
                          >
                            {opt === "any"
                              ? "Any"
                              : opt === "nonstop"
                                ? "Nonstop"
                                : opt === "1stop"
                                  ? "Up to 1 stop"
                                  : "Up to 2 stops"}
                          </Chip>
                        )
                      )}
                    </div>
                  </FilterRow>

                  {allAirlines.length > 1 && (
                    <FilterRow label="Airlines">
                      <div className="flex gap-1.5 flex-wrap">
                        {allAirlines.map((a) => (
                          <Chip
                            key={a}
                            active={flightFilters.airlines.has(a)}
                            onClick={() =>
                              setFlightFilters((s) => {
                                const next = new Set(s.airlines);
                                if (next.has(a)) next.delete(a);
                                else next.add(a);
                                return { ...s, airlines: next };
                              })
                            }
                          >
                            {a}
                          </Chip>
                        ))}
                      </div>
                    </FilterRow>
                  )}

                  <FilterRow
                    label={`Max price${
                      flightFilters.maxPrice
                        ? `: $${flightFilters.maxPrice}`
                        : ""
                    }`}
                  >
                    <input
                      type="range"
                      min={0}
                      max={flightPriceMax}
                      step={50}
                      value={flightFilters.maxPrice ?? flightPriceMax}
                      onChange={(e) =>
                        setFlightFilters((s) => ({
                          ...s,
                          maxPrice:
                            parseInt(e.target.value) === flightPriceMax
                              ? null
                              : parseInt(e.target.value),
                        }))
                      }
                      className="w-full accent-terracotta-500"
                    />
                  </FilterRow>
                </FilterPanel>
              )}

              {filteredFlights.length === 0 ? (
                <EmptyHint>No flights match your filters.</EmptyHint>
              ) : (
                filteredFlights.map((flight, idx) => (
                  <FlightCard
                    key={idx}
                    flight={flight}
                    isBestPrice={idx === 0 && filteredFlights.length > 1}
                  />
                ))
              )}
            </SidebarSection>
          )}

          {/* ─── Hotels ─── */}
          {(hotels.length > 0 ||
            (hotelsByCity && Object.keys(hotelsByCity).length > 0)) && (
            <SidebarSection
              title="Hotels"
              icon={HotelIcon}
              rightSlot={
                <FilterToggle
                  open={showHotelFilters}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHotelFilters((v) => !v);
                  }}
                  hasActive={
                    hotelFilters.minStars > 0 || hotelFilters.maxPrice !== null
                  }
                />
              }
            >
              {showHotelFilters && (
                <FilterPanel
                  onClear={() =>
                    setHotelFilters({ minStars: 0, maxPrice: null })
                  }
                >
                  <FilterRow label="Min star rating">
                    <div className="flex gap-1.5">
                      {[0, 3, 4, 5].map((n) => (
                        <Chip
                          key={n}
                          active={hotelFilters.minStars === n}
                          onClick={() =>
                            setHotelFilters((s) => ({ ...s, minStars: n }))
                          }
                        >
                          {n === 0 ? "Any" : `${n}+★`}
                        </Chip>
                      ))}
                    </div>
                  </FilterRow>
                  <FilterRow
                    label={`Max per night${
                      hotelFilters.maxPrice ? `: $${hotelFilters.maxPrice}` : ""
                    }`}
                  >
                    <input
                      type="range"
                      min={0}
                      max={hotelPriceMax}
                      step={25}
                      value={hotelFilters.maxPrice ?? hotelPriceMax}
                      onChange={(e) =>
                        setHotelFilters((s) => ({
                          ...s,
                          maxPrice:
                            parseInt(e.target.value) === hotelPriceMax
                              ? null
                              : parseInt(e.target.value),
                        }))
                      }
                      className="w-full accent-terracotta-500"
                    />
                  </FilterRow>
                </FilterPanel>
              )}

              {(() => {
                // When we have a per-city grouping (multi-city trip) the
                // flat `filteredHotels` can be empty even though there's
                // plenty to show — trust hotelsByCity in that case.
                const byCityKeys = hotelsByCity
                  ? Object.keys(hotelsByCity)
                  : [];
                const totalByCity = hotelsByCity
                  ? Object.values(hotelsByCity).reduce(
                      (n, list) => n + list.length,
                      0
                    )
                  : 0;
                const tierOrder = ["hostel", "budget", "mid", "upscale"];
                const passesFilter = (h: Hotel) => {
                  const price = parseInt(
                    h.pricePerNight.replace(/[^0-9]/g, ""),
                    10
                  );
                  if (
                    hotelFilters.maxPrice !== null &&
                    !isNaN(price) &&
                    price > hotelFilters.maxPrice
                  )
                    return false;
                  if (h.rating < hotelFilters.minStars) return false;
                  return true;
                };

                if (totalByCity === 0 && filteredHotels.length === 0) {
                  return (
                    <EmptyHint>No hotels match your filters.</EmptyHint>
                  );
                }

                // Multi-city → group cards under per-city headings.
                if (byCityKeys.length > 1) {
                  return (
                    <div className="space-y-5">
                      {byCityKeys.map((city) => {
                        const list = hotelsByCity![city];
                        const sorted = [...list].sort((a, b) => {
                          const ai = a.tier ? tierOrder.indexOf(a.tier) : 99;
                          const bi = b.tier ? tierOrder.indexOf(b.tier) : 99;
                          return ai - bi;
                        });
                        const visible = sorted.filter(passesFilter);
                        if (visible.length === 0) return null;
                        return (
                          <div key={city}>
                            <h4 className="font-serif text-heading text-charcoal-900 mb-2">
                              {city}
                            </h4>
                            {visible.map((hotel, idx) => (
                              <HotelCard key={`${city}-${idx}`} hotel={hotel} />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Single-city: prefer the 4-tier list from hotelsByCity,
                // otherwise fall back to the legacy flat top-4.
                const singleCityList =
                  hotelsByCity && Object.values(hotelsByCity)[0]
                    ? Object.values(hotelsByCity)[0].slice().sort((a, b) => {
                        const ai = a.tier ? tierOrder.indexOf(a.tier) : 99;
                        const bi = b.tier ? tierOrder.indexOf(b.tier) : 99;
                        return ai - bi;
                      })
                    : filteredHotels.slice(0, 4);
                return singleCityList.map((hotel, idx) => (
                  <HotelCard key={idx} hotel={hotel} />
                ));
              })()}
            </SidebarSection>
          )}

          {/* ─── Tours ─── */}
          {tours.length > 0 && (
            <SidebarSection
              title="Activities"
              icon={Map}
              defaultOpen={false}
              rightSlot={
                <FilterToggle
                  open={showTourFilters}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTourFilters((v) => !v);
                  }}
                  hasActive={
                    tourFilters.minRating > 0 || tourFilters.maxPrice !== null
                  }
                />
              }
            >
              {showTourFilters && (
                <FilterPanel
                  onClear={() =>
                    setTourFilters({ minRating: 0, maxPrice: null })
                  }
                >
                  <FilterRow label="Min rating">
                    <div className="flex gap-1.5">
                      {[0, 4, 4.5].map((n) => (
                        <Chip
                          key={n}
                          active={tourFilters.minRating === n}
                          onClick={() =>
                            setTourFilters((s) => ({ ...s, minRating: n }))
                          }
                        >
                          {n === 0 ? "Any" : `${n}+★`}
                        </Chip>
                      ))}
                    </div>
                  </FilterRow>
                  <FilterRow
                    label={`Max price${
                      tourFilters.maxPrice ? `: $${tourFilters.maxPrice}` : ""
                    }`}
                  >
                    <input
                      type="range"
                      min={0}
                      max={tourPriceMax}
                      step={10}
                      value={tourFilters.maxPrice ?? tourPriceMax}
                      onChange={(e) =>
                        setTourFilters((s) => ({
                          ...s,
                          maxPrice:
                            parseInt(e.target.value) === tourPriceMax
                              ? null
                              : parseInt(e.target.value),
                        }))
                      }
                      className="w-full accent-terracotta-500"
                    />
                  </FilterRow>
                </FilterPanel>
              )}

              {filteredTours.length === 0 ? (
                <EmptyHint>No activities match your filters.</EmptyHint>
              ) : (
                filteredTours.map((tour, idx) => (
                  <TourCard key={idx} tour={tour} />
                ))
              )}
            </SidebarSection>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Filter UI primitives ─────────────────────────────────────────────

function FilterToggle({
  open,
  onClick,
  hasActive,
}: {
  open: boolean;
  onClick: (e: React.MouseEvent) => void;
  hasActive: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full text-caption font-sans cursor-pointer transition-colors",
        hasActive
          ? "bg-terracotta-500/10 text-terracotta-600"
          : "text-charcoal-800/50 hover:bg-cream-100",
        open && "bg-cream-100"
      )}
    >
      <SlidersHorizontal className="w-3 h-3" />
      {hasActive ? "Filtered" : "Filter"}
    </div>
  );
}

function FilterPanel({
  children,
  onClear,
}: {
  children: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <div className="mb-3 rounded-xl border border-cream-200 bg-cream-50/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans text-caption font-medium text-charcoal-800/70 uppercase tracking-wide">
          Filters
        </span>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-caption font-sans text-charcoal-800/50 hover:text-terracotta-500"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-sans text-[11px] text-charcoal-800/60 mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-caption font-sans border transition-colors",
        active
          ? "bg-terracotta-500 text-white border-terracotta-500"
          : "bg-white border-cream-300 text-charcoal-800/70 hover:border-terracotta-500 hover:text-terracotta-500"
      )}
    >
      {children}
    </button>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-6 text-center text-caption font-sans text-charcoal-800/40 italic">
      {children}
    </div>
  );
}
