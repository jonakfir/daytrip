'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Users, ChevronDown, Minus, Plus, MapPin, X, PlusCircle } from 'lucide-react';
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
  // Multi-city state
  const [destinations, setDestinations] = useState<string[]>(['']);
  const [activeIndex, setActiveIndex] = useState(0);

  // Other state
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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const styleDropdownRef = useRef<HTMLDivElement>(null);

  const currentDestination = destinations[activeIndex] || '';

  // --- Typewriter effect ---
  useEffect(() => {
    if (destinations[0]) return; // Don't animate if user is typing in first input

    const currentDest = PLACEHOLDER_DESTINATIONS[placeholderIndex];
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      if (charIndex < currentDest.length) {
        timeout = setTimeout(() => {
          setPlaceholderText(currentDest.slice(0, charIndex + 1));
          setCharIndex((c) => c + 1);
        }, 60 + Math.random() * 40);
      } else {
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
        timeout = setTimeout(() => {
          setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_DESTINATIONS.length);
          setIsTyping(true);
        }, 300);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isTyping, placeholderIndex, destinations]);

  // --- Filter suggestions ---
  useEffect(() => {
    if (currentDestination.trim().length === 0) {
      setFilteredDestinations([]);
      setShowSuggestions(false);
      return;
    }
    const query = currentDestination.toLowerCase();
    const alreadySelected = new Set(destinations.map(d => d.toLowerCase()).filter(Boolean));
    const matches = DESTINATIONS.filter((d) =>
      d.toLowerCase().includes(query) && !alreadySelected.has(d.toLowerCase())
    );
    setFilteredDestinations(matches);
    setShowSuggestions(matches.length > 0);
  }, [currentDestination, destinations]);

  // --- Close dropdowns on outside click ---
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRefs.current.some(ref => ref?.contains(e.target as Node))
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
    (value: string, index: number) => {
      const newDests = [...destinations];
      newDests[index] = value;
      setDestinations(newDests);
      setActiveIndex(index);
      // Notify parent with the combined destination string
      const combined = newDests.filter(Boolean).join(' → ');
      onDestinationChange?.(value || combined);
    },
    [destinations, onDestinationChange]
  );

  const handleSelectDestination = useCallback(
    (dest: string) => {
      const newDests = [...destinations];
      newDests[activeIndex] = dest;
      setDestinations(newDests);
      setShowSuggestions(false);
      const combined = newDests.filter(Boolean).join(' → ');
      onDestinationChange?.(dest || combined);
      inputRefs.current[activeIndex]?.blur();
    },
    [activeIndex, destinations, onDestinationChange]
  );

  const addCity = useCallback(() => {
    if (destinations.length >= 5) return;
    const newDests = [...destinations, ''];
    setDestinations(newDests);
    setActiveIndex(newDests.length - 1);
    // Focus the new input after render
    setTimeout(() => {
      inputRefs.current[newDests.length - 1]?.focus();
    }, 50);
  }, [destinations]);

  const removeCity = useCallback((index: number) => {
    if (destinations.length <= 1) return;
    const newDests = destinations.filter((_, i) => i !== index);
    setDestinations(newDests);
    setActiveIndex(Math.min(activeIndex, newDests.length - 1));
    const combined = newDests.filter(Boolean).join(' → ');
    onDestinationChange?.(combined);
  }, [destinations, activeIndex, onDestinationChange]);

  const handleSubmit = useCallback(() => {
    const filled = destinations.filter(d => d.trim());
    if (filled.length === 0) return;
    const combinedDestination = filled.join(' → ');
    onSearch?.({
      destination: combinedDestination,
      startDate,
      endDate,
      travelers,
      style,
    });
  }, [destinations, startDate, endDate, travelers, style, onSearch]);

  const isMultiCity = destinations.length > 1;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Heading */}
      <h1 className="font-serif text-display-lg md:text-display-xl text-charcoal-900 text-center mb-3">
        Your journey begins
      </h1>
      <p className="text-body-lg text-charcoal-800/60 text-center mb-10">
        Plan your perfect trip in seconds — powered by AI
      </p>

      {/* Search card */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-elevated p-6 md:p-8 space-y-5">

        {/* Destination inputs */}
        <div className="space-y-3">
          {destinations.map((dest, index) => (
            <div key={index} className="relative">
              <div className="relative flex items-center gap-2">
                {/* City number badge for multi-city */}
                {isMultiCity && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-terracotta-500/10 flex items-center justify-center">
                    <span className="text-caption font-sans font-semibold text-terracotta-500">{index + 1}</span>
                  </div>
                )}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-800/30" />
                  <input
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    value={dest}
                    onChange={(e) => handleDestinationChange(e.target.value, index)}
                    onFocus={() => {
                      setActiveIndex(index);
                      if (filteredDestinations.length > 0 && dest.trim()) setShowSuggestions(true);
                    }}
                    placeholder={index === 0 && !dest ? `${placeholderText}|` : index === 0 ? '' : 'Add next destination...'}
                    className="w-full bg-cream-50 rounded-2xl pl-12 pr-4 py-4 text-heading font-serif
                      text-charcoal-900 placeholder:text-charcoal-800/30 placeholder:font-serif
                      focus:outline-none focus:ring-2 focus:ring-terracotta-500/40 focus:bg-white
                      transition-all duration-300"
                    aria-label={`Destination ${index + 1}`}
                  />
                </div>
                {/* Remove city button */}
                {isMultiCity && (
                  <button
                    type="button"
                    onClick={() => removeCity(index)}
                    className="shrink-0 w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-charcoal-800/30 hover:text-red-400 transition-colors"
                    aria-label={`Remove destination ${index + 1}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Connector line between cities */}
              {isMultiCity && index < destinations.length - 1 && (
                <div className="flex items-center ml-3.5 my-0.5">
                  <div className="w-px h-3 bg-terracotta-500/20 ml-[0.35rem]" />
                </div>
              )}

              {/* Suggestions dropdown — only show for active input */}
              <AnimatePresence>
                {showSuggestions && activeIndex === index && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute z-50 top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-elevated
                      border border-cream-200 overflow-hidden max-h-72 overflow-y-auto"
                    style={isMultiCity ? { marginLeft: '2.25rem', marginRight: '2.25rem' } : undefined}
                  >
                    {filteredDestinations.map((d, idx) => (
                      <motion.button
                        key={d}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => handleSelectDestination(d)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-cream-50
                          transition-colors duration-150 group"
                      >
                        <MapPin className="w-4 h-4 text-terracotta-500 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        <span className="text-body text-charcoal-900">{d}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Add city button */}
          {destinations.length < 5 && (
            <button
              type="button"
              onClick={addCity}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-caption font-sans font-medium
                text-terracotta-500/70 hover:text-terracotta-500 hover:bg-terracotta-500/5 transition-colors duration-200 ml-1"
            >
              <PlusCircle className="w-4 h-4" />
              Add another city (multi-city trip)
            </button>
          )}
        </div>

        {/* Popular destinations quick picks */}
        {!destinations[0] && destinations.length === 1 && (
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

        {/* Multi-city route preview */}
        {isMultiCity && destinations.filter(Boolean).length >= 2 && (
          <div className="flex items-center gap-2 flex-wrap px-1">
            <span className="text-caption text-charcoal-800/40 font-sans">Route:</span>
            {destinations.filter(Boolean).map((d, i, arr) => (
              <span key={i} className="text-caption font-sans font-medium text-terracotta-600">
                {d.split(',')[0]}{i < arr.length - 1 && <span className="text-charcoal-800/30 mx-1">→</span>}
              </span>
            ))}
          </div>
        )}

        {/* Trip details */}
        <div className="space-y-3">
          {/* Dates row — full width */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-sans text-charcoal-800/50 mb-1.5 ml-1">Start date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-cream-50 rounded-xl pl-10 pr-4 py-3 text-body text-charcoal-900
                    focus:outline-none focus:ring-2 focus:ring-terracotta-500/40 focus:bg-white
                    transition-all duration-300"
                  aria-label="Start date"
                />
              </div>
            </div>
            <div>
              <label className="block text-caption font-sans text-charcoal-800/50 mb-1.5 ml-1">End date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-cream-50 rounded-xl pl-10 pr-4 py-3 text-body text-charcoal-900
                    focus:outline-none focus:ring-2 focus:ring-terracotta-500/40 focus:bg-white
                    transition-all duration-300"
                  aria-label="End date"
                />
              </div>
            </div>
          </div>

          {/* Travelers + Style row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Travelers counter — bigger buttons */}
            <div className="flex items-center justify-between bg-cream-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-charcoal-800/30" />
                <span className="text-body text-charcoal-800/60">Travelers</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                  className="w-8 h-8 rounded-full bg-cream-200 hover:bg-terracotta-500 hover:text-white
                    flex items-center justify-center transition-colors duration-200 active:scale-95"
                  aria-label="Decrease travelers"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-body font-semibold text-charcoal-900 w-5 text-center">
                  {travelers}
                </span>
                <button
                  type="button"
                  onClick={() => setTravelers((t) => Math.min(12, t + 1))}
                  className="w-8 h-8 rounded-full bg-cream-200 hover:bg-terracotta-500 hover:text-white
                    flex items-center justify-center transition-colors duration-200 active:scale-95"
                  aria-label="Increase travelers"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Travel style dropdown */}
            <div className="relative" ref={styleDropdownRef}>
              <button
                type="button"
                onClick={() => setIsStyleOpen(!isStyleOpen)}
                className="w-full h-full flex items-center justify-between bg-cream-50 rounded-xl px-4 py-3
                  text-body text-charcoal-900 focus:outline-none focus:ring-2
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
        </div>

        {/* CTA Button */}
        <ShimmerButton onClick={handleSubmit} className="w-full">
          {isMultiCity ? 'Plan my multi-city trip' : 'Plan my trip'}
        </ShimmerButton>
      </div>
    </div>
  );
}
