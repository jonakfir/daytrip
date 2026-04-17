'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HeroCanvas, { type LandscapeType } from './HeroCanvas';
import DestinationSearch from '@/components/search/DestinationSearch';

const LANDSCAPE_KEYWORDS: Record<LandscapeType, string[]> = {
  mountain: [
    'mountain', 'alps', 'banff', 'patagonia', 'everest', 'kilimanjaro',
    'rockies', 'andes', 'himalayas', 'dolomites', 'iceland', 'reykjavik',
    'queenstown', 'swiss', 'nepal', 'machu picchu', 'peru',
  ],
  beach: [
    'beach', 'coast', 'bali', 'maldives', 'amalfi', 'santorini',
    'zanzibar', 'caribbean', 'hawaii', 'fiji', 'tahiti', 'phuket',
    'cancun', 'riviera', 'cinque terre', 'dubrovnik', 'croatia',
    'ocean', 'island', 'sea',
  ],
  city: [
    'city', 'tokyo', 'paris', 'barcelona', 'new york', 'london',
    'lisbon', 'havana', 'singapore', 'hong kong', 'dubai',
    'berlin', 'amsterdam', 'rome', 'bruges', 'hoi an', 'vietnam',
    'cape town', 'mumbai', 'shanghai',
  ],
  temple: [
    'temple', 'kyoto', 'marrakech', 'morocco', 'jaipur', 'india',
    'petra', 'jordan', 'angkor', 'cambodia', 'myanmar', 'pagoda',
    'shrine', 'ancient', 'ruins', 'egypt', 'cairo',
  ],
  default: [],
};

function mapDestinationToLandscape(destination: string): LandscapeType {
  const query = destination.toLowerCase().trim();
  if (!query) return 'default';
  for (const [type, keywords] of Object.entries(LANDSCAPE_KEYWORDS) as [LandscapeType, string[]][]) {
    if (type === 'default') continue;
    for (const keyword of keywords) {
      if (query.includes(keyword)) return type;
    }
  }
  return 'default';
}

export default function LandscapeHero() {
  const router = useRouter();
  const [landscapeType, setLandscapeType] = useState<LandscapeType>('default');

  const handleDestinationChange = useCallback((destination: string) => {
    setLandscapeType(mapDestinationToLandscape(destination));
  }, []);

  const handleSearch = useCallback(
    (params: {
      destination: string;
      startDate: string;
      endDate: string;
      travelers: number;
      style: string;
      styles: string[];
      regions: string[];
      cities: string[];
      originCity: string;
      originAirport?: string;
      destinationAirport?: string;
      budgetPerDay: number | null;
    }) => {
      const sp = new URLSearchParams({
        destination: params.destination,
        startDate: params.startDate,
        endDate: params.endDate,
        travelers: String(params.travelers),
        style: params.style,
      });
      // Arrays are serialized as comma-joined strings — the generating
      // page and /api/generate route both split them back into arrays.
      if (params.styles.length > 0) sp.set("styles", params.styles.join(","));
      if (params.regions.length > 0)
        sp.set("regions", params.regions.join(","));
      if (params.cities.length > 0)
        sp.set("cities", params.cities.join(","));
      if (params.originCity) sp.set("originCity", params.originCity);
      if (params.originAirport) sp.set("originAirport", params.originAirport);
      if (params.destinationAirport)
        sp.set("destinationAirport", params.destinationAirport);
      if (params.budgetPerDay != null)
        sp.set("budgetPerDay", String(params.budgetPerDay));
      router.push(`/trip/generating?${sp.toString()}`);
    },
    [router]
  );

  return (
    <section id="plan" className="relative bg-cream-100" style={{ zIndex: 0 }}>
      {/* 3D Canvas — taller, with smooth gradient fades on all edges */}
      <div className="relative h-[50vh] min-h-[300px] overflow-hidden" style={{ contain: 'paint' }}>
        <HeroCanvas landscapeType={landscapeType} />
        {/* Smooth fade on all edges so the landscape floats naturally */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            linear-gradient(to bottom, rgba(253,246,236,0.6) 0%, transparent 20%, transparent 60%, rgba(253,246,236,1) 100%),
            linear-gradient(to right, rgba(253,246,236,0.5) 0%, transparent 15%, transparent 85%, rgba(253,246,236,0.5) 100%)
          `
        }} />
      </div>

      {/* Search form — overlaps the bottom of the canvas for a layered look */}
      <div className="relative -mt-24 pb-16 px-4">
        <DestinationSearch
          onSearch={handleSearch}
          onDestinationChange={handleDestinationChange}
        />
      </div>
    </section>
  );
}
