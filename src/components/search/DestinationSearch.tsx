'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Users, ChevronDown, Minus, Plus, MapPin } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/ShimmerButton';

// --- Types ---

interface SearchParams {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  style: string;
}

interface DestinationSearchProps {
  onSearch?: (params: SearchParams) => void;
  onDestinationChange?: (destination: string) => void;
}

// --- Data ---

const PLACEHOLDER_DESTINATIONS = [
  'Tokyo, Japan',
  'Amalfi Coast, Italy',
  'Marrakech, Morocco',
  'Bali, Indonesia',
  'Paris, France',
  'Santorini, Greece',
];

const DESTINATIONS = [
  'Tokyo, Japan',
  'Amalfi Coast, Italy',
  'Marrakech, Morocco',
  'Bali, Indonesia',
  'Paris, France',
  'Santorini, Greece',
  'Kyoto, Japan',
  'Barcelona, Spain',
  'Cape Town, South Africa',
  'Dubrovnik, Croatia',
  'Machu Picchu, Peru',
  'Reykjavik, Iceland',
  'Lisbon, Portugal',
  'Havana, Cuba',
  'Queenstown, New Zealand',
  'Petra, Jordan',
  'Jaipur, India',
  'Banff, Canada',
  'Cinque Terre, Italy',
  'Maldives',
  'Patagonia, Argentina',
  'Hoi An, Vietnam',
  'Bruges, Belgium',
  'Zanzibar, Tanzania',
];

const TRAVEL_STYLES = ['Adventure', 'Cultural', 'Relaxation', 'Foodie', 'Luxury'];

// --- Component ---

export default function DestinationSearch({
  onSearch,
  onDestinationChange,
}: DestinationSearchProps) {
  // Search state
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [style, setStyle] = useState('Cultural');
  const [isStyleOpen, setIsStyleOpen] = useState(false);

  // Typewriter state
  const [placeholderText, setPlaceholderText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  // Dropdown state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredDestinations, setFilteredDestinations] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const styleDropdownRef = useRef<HTMLDivElement>(null);

  // --- Typewriter effect ---
  useEffect(() => {
    if (destination) return; // Don't animate if user is typing

    const currentDest = PLACEHOLDER_DESTINATIONS[placeholderIndex];
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      if (charIndex < currentDest.length) {
        timeout = setTimeout(() => {
          setPlaceholderText(currentDest.slice(0, charIndex + 1));
          setCharIndex((c) => c + 1);
        }, 60 + Math.random() * 40);
      } else {
        // Pause at full text
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    } else {
      if (charIndex > 0) {
        timeout = setTimeout(() => {
          setPlaceholderText(currentDest.slice(0, charIndex - 1));
          setCharIndex((c) => c - 1);
        }, 30);
      } else {
        // Move to next destination
        timeout = setTimeout(() => {
          setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_DESTINATIONS.length);
          setIsTyping(true);
        }, 300);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isTyping, placeholderIndex, destination]);

  // --- Filter suggestions ---
  useEffect(() => {
    if (destination.trim().length === 0) {
      setFilteredDestinations([]);
      setShowSuggestions(false);
      return;
    }
    const query = destination.toLowerCase();
    const matches = DESTINATIONS.filter((d) =>
      d.toLowerCase().includes(query)
    );
    setFilteredDestinations(matches);
    setShowSuggestions(matches.length > 0);
  }, [destination]);

  // --- Close dropdowns on outside click ---
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        styleDropdownRef.current &&
        !styleDropdownRef.current.contains(e.target as Node)
      ) {
        setIsStyleOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Handlers ---
  const handleDestinationChange = useCallback(
    (value: string) => {
      setDestination(value);
      onDestinationChange?.(value);
    },
    [onDestinationChange]
  );

  const handleSelectDestination = useCallback(
    (dest: string) => {
      setDestination(dest);
      setShowSuggestions(false);
      onDestinationChange?.(dest);
      inputRef.current?.blur();
    },
    [onDestinationChange]
  );

  const handleSubmit = useCallback(() => {
    if (!destination.trim()) return;
    onSearch?.({
      destination: destination.trim(),
      startDate,
      endDate,
      travelers,
      style,
    });
  }, [destination, startDate, endDate, travelers, style, onSearch]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto px-4"
    >
      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="font-serif text-display-lg md:text-display-xl text-charcoal-900 text-center mb-3"
      >
        Your journey begins
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-body-lg text-charcoal-800/60 text-center mb-10"
      >
        Plan your perfect trip in seconds — powered by AI
      </motion.p>

      {/* Search card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-elevated p-6 md:p-8 space-y-5"
      >
        {/* Main search input */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-800/30" />
            <input
              ref={inputRef}
              type="text"
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              onFocus={() => {
                if (filteredDestinations.length > 0) setShowSuggestions(true);
              }}
              placeholder={destination ? '' : `${placeholderText}|`}
              className="w-full bg-cream-50 rounded-2xl pl-12 pr-4 py-4 text-heading font-serif
                text-charcoal-900 placeholder:text-charcoal-800/30 placeholder:font-serif
                focus:outline-none focus:ring-2 focus:ring-terracotta-500/40 focus:bg-white
                transition-all duration-300"
              aria-label="Search destination"
            />
          </div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute z-50 top-full mt-2 w-full bg-white rounded-2xl shadow-elevated
                  border border-cream-200 overflow-hidden max-h-72 overflow-y-auto"
              >
                {filteredDestinations.map((dest, idx) => (
                  <motion.button
                    key={dest}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => handleSelectDestination(dest)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-cream-50
                      transition-colors duration-150 group"
                  >
                    <MapPin className="w-4 h-4 text-terracotta-500 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    <span className="text-body text-charcoal-900">{dest}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Popular destinations quick picks */}
        {!destination && (
          <div className="flex flex-wrap gap-2 -mt-1">
            <span className="text-caption text-charcoal-800/40 font-sans mr-1 self-center">Popular:</span>
            {['Tokyo', 'Paris', 'Bali', 'Amalfi Coast', 'Marrakech'].map((dest) => (
              <button
                key={dest}
                type="button"
                onClick={() => handleSelectDestination(`${dest}${dest === 'Bali' ? ', Indonesia' : dest === 'Tokyo' ? ', Japan' : dest === 'Paris' ? ', France' : dest === 'Amalfi Coast' ? ', Italy' : ', Morocco'}`)}
                className="px-3 py-1 rounded-full bg-cream-200/80 text-caption font-sans text-charcoal-800/70 hover:bg-terracotta-500 hover:text-white transition-colors duration-200"
              >
                {dest}
              </button>
            ))}
          </div>
        )}

        {/* Trip details row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Start date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-cream-50 rounded-xl pl-10 pr-3 py-3 text-body-sm text-charcoal-900
                focus:outline-none focus:ring-2 focus:ring-terracotta-500/40 focus:bg-white
                transition-all duration-300"
              aria-label="Start date"
            />
          </div>

          {/* End date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30 pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-cream-50 rounded-xl pl-10 pr-3 py-3 text-body-sm text-charcoal-900
                focus:outline-none focus:ring-2 focus:ring-terracotta-500/40 focus:bg-white
                transition-all duration-300"
              aria-label="End date"
            />
          </div>

          {/* Travelers counter */}
          <div className="flex items-center justify-between bg-cream-50 rounded-xl px-3 py-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-charcoal-800/30" />
              <span className="text-body-sm text-charcoal-800/60">Travelers</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                className="w-6 h-6 rounded-full bg-cream-200 hover:bg-terracotta-500 hover:text-white
                  flex items-center justify-center transition-colors duration-200"
                aria-label="Decrease travelers"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-body-sm font-medium text-charcoal-900 w-4 text-center">
                {travelers}
              </span>
              <button
                type="button"
                onClick={() => setTravelers((t) => Math.min(12, t + 1))}
                className="w-6 h-6 rounded-full bg-cream-200 hover:bg-terracotta-500 hover:text-white
                  flex items-center justify-center transition-colors duration-200"
                aria-label="Increase travelers"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Travel style dropdown */}
          <div className="relative" ref={styleDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStyleOpen(!isStyleOpen)}
              className="w-full flex items-center justify-between bg-cream-50 rounded-xl px-3 py-3
                text-body-sm text-charcoal-900 focus:outline-none focus:ring-2
                focus:ring-terracotta-500/40 transition-all duration-300"
              aria-label="Travel style"
            >
              <span>{style}</span>
              <ChevronDown
                className={`w-4 h-4 text-charcoal-800/30 transition-transform duration-200
                  ${isStyleOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence>
              {isStyleOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl shadow-elevated
                    border border-cream-200 overflow-hidden"
                >
                  {TRAVEL_STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setStyle(s);
                        setIsStyleOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-body-sm transition-colors duration-150
                        ${s === style
                          ? 'bg-terracotta-500/10 text-terracotta-600 font-medium'
                          : 'text-charcoal-900 hover:bg-cream-50'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CTA Button */}
        <ShimmerButton onClick={handleSubmit} className="w-full">
          Plan my trip
        </ShimmerButton>
      </motion.div>
    </motion.div>
  );
}
