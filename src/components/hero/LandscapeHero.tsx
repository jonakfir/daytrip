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
    (params: { destination: string; startDate: string; endDate: string; travelers: number; style: string }) => {
      const sp = new URLSearchParams({
        destination: params.destination,
        startDate: params.startDate,
        endDate: params.endDate,
        travelers: String(params.travelers),
        style: params.style,
      });
      router.push(`/trip/generating?${sp.toString()}`);
    },
    [router]
  );

  return (
    <section id="plan" className="bg-cream-100">
      {/* 3D Canvas band — non-overlapping, sits at the top */}
      <div className="relative h-[35vh] min-h-[200px] overflow-hidden">
        <HeroCanvas landscapeType={landscapeType} />
        {/* Bottom fade so canvas blends into the content area */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream-100 to-transparent pointer-events-none" />
        {/* Top fade for navbar readability */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-cream-100/70 to-transparent pointer-events-none" />
      </div>

      {/* Search form — always visible, rendered BELOW the canvas, pulled up to overlap slightly */}
      <div className="relative -mt-16 pb-16 px-4">
        <DestinationSearch
          onSearch={handleSearch}
          onDestinationChange={handleDestinationChange}
        />
      </div>
    </section>
  );
}
