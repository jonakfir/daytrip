'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HeroCanvas, { type LandscapeType } from './HeroCanvas';
import DestinationSearch from '@/components/search/DestinationSearch';

// --- Destination-to-landscape mapping ---

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
      if (query.includes(keyword)) {
        return type;
      }
    }
  }

  return 'default';
}

// --- Component ---

export default function LandscapeHero() {
  const router = useRouter();
  const [landscapeType, setLandscapeType] = useState<LandscapeType>('default');

  const handleDestinationChange = useCallback((destination: string) => {
    const type = mapDestinationToLandscape(destination);
    setLandscapeType(type);
  }, []);

  const handleSearch = useCallback(
    (params: {
      destination: string;
      startDate: string;
      endDate: string;
      travelers: number;
      style: string;
    }) => {
      const searchParams = new URLSearchParams({
        destination: params.destination,
        startDate: params.startDate,
        endDate: params.endDate,
        travelers: String(params.travelers),
        style: params.style,
      });
      router.push(`/trip/generating?${searchParams.toString()}`);
    },
    [router]
  );

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden flex items-center justify-center">
      {/* WebGL background */}
      <HeroCanvas landscapeType={landscapeType} />

      {/* Gradient overlay */}
      <div className="absolute inset-0 gradient-hero pointer-events-none z-[1]" />

      {/* Content */}
      <div className="relative z-10 w-full">
        <DestinationSearch
          onSearch={handleSearch}
          onDestinationChange={handleDestinationChange}
        />
      </div>
    </section>
  );
}
