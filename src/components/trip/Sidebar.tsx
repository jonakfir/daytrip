"use client";

import { useState } from "react";
import {
  Plane,
  Hotel as HotelIcon,
  Map,
  Star,
  Clock,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flight, Hotel, ViatorTour } from "@/types/itinerary";

interface SidebarProps {
  flights: Flight[];
  hotels: Hotel[];
  tours: ViatorTour[];
}

function SidebarSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof Plane;
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
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-charcoal-800/40 transition-transform duration-200 md:hidden",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 md:block",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 md:max-h-[2000px] md:opacity-100"
        )}
      >
        <div className="pb-5 px-1">{children}</div>
      </div>
    </div>
  );
}

function FlightCard({ flight }: { flight: Flight }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm hover:shadow-md transition-shadow mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans text-body-sm font-medium text-charcoal-900">
          {flight.airline}
        </span>
        <div className="text-right">
          <span className="font-serif text-heading-lg text-terracotta-500">
            {flight.price}
          </span>
          <p className="text-[10px] font-sans text-charcoal-800/40">per person</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-caption font-sans text-charcoal-800/60 mb-1">
        <span>{flight.departure}</span>
        <span className="text-charcoal-800/30">→</span>
        <span>{flight.arrival}</span>
      </div>
      <div className="text-caption font-sans text-charcoal-800/40 mb-3">
        {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
      </div>
      <a
        href={flight.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-terracotta-500 text-white font-sans text-body-sm font-semibold hover:bg-terracotta-600 active:bg-terracotta-700 transition-colors shadow-sm"
      >
        Book flight
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm hover:shadow-md transition-shadow mb-3">
      <h4 className="font-serif text-heading text-charcoal-900 mb-1 leading-tight">
        {hotel.name}
      </h4>
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-3.5 h-3.5",
              i < hotel.rating
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
        <span className="text-caption font-sans text-charcoal-800/50">/night</span>
      </div>
      <a
        href={hotel.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-terracotta-500 text-white font-sans text-body-sm font-semibold hover:bg-terracotta-600 active:bg-terracotta-700 transition-colors shadow-sm"
      >
        Book on Booking.com
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

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
                i < tour.rating
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
        </span>
        <a
          href={tour.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-terracotta-500 text-white font-sans text-body-sm font-medium hover:bg-terracotta-600 transition-colors"
        >
          Book tour
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function Sidebar({ flights, hotels, tours }: SidebarProps) {
  return (
    <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)]">
      <div className="bg-cream-50 rounded-2xl border border-cream-200 shadow-md overflow-hidden lg:flex lg:flex-col lg:max-h-[calc(100vh-6rem)]">
        {/* Header band — stays fixed */}
        <div className="bg-terracotta-500 px-5 py-4 shrink-0">
          <h2 className="font-serif text-heading-lg text-white mb-0.5">
            Book & Save
          </h2>
          <p className="font-sans text-body-sm text-white/80">
            Curated recommendations for your trip
          </p>
        </div>

        {/* Scrollable content area — independent scroll */}
        <div className="p-5 lg:overflow-y-auto lg:flex-1 overscroll-contain">

        {flights.length > 0 && (
          <SidebarSection title="Flights" icon={Plane}>
            {flights.map((flight, idx) => (
              <FlightCard key={idx} flight={flight} />
            ))}
          </SidebarSection>
        )}

        {hotels.length > 0 && (
          <SidebarSection title="Hotels" icon={HotelIcon}>
            {hotels.slice(0, 3).map((hotel, idx) => (
              <HotelCard key={idx} hotel={hotel} />
            ))}
          </SidebarSection>
        )}

        {tours.length > 0 && (
          <SidebarSection title="Activities" icon={Map} defaultOpen={false}>
            {tours.map((tour, idx) => (
              <TourCard key={idx} tour={tour} />
            ))}
          </SidebarSection>
        )}
        </div>
      </div>
    </aside>
  );
}
