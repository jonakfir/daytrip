"use client";

import { useState } from "react";

interface Destination {
  name: string;
  x: number;
  y: number;
}

const destinations: Destination[] = [
  { name: "New York", x: 251, y: 175 },
  { name: "Barcelona", x: 462, y: 163 },
  { name: "Marrakech", x: 448, y: 195 },
  { name: "Paris", x: 470, y: 148 },
  { name: "Amalfi Coast", x: 500, y: 162 },
  { name: "Santorini", x: 530, y: 170 },
  { name: "Dubai", x: 600, y: 200 },
  { name: "Cape Town", x: 520, y: 340 },
  { name: "Bali", x: 730, y: 275 },
  { name: "Tokyo", x: 775, y: 165 },
];

function DestinationDot({ destination }: { destination: Destination }) {
  const [hovered, setHovered] = useState(false);

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer" }}
    >
      <circle
        cx={destination.x}
        cy={destination.y}
        r={8}
        fill="none"
        stroke="#C4522A"
        strokeWidth={1.5}
        opacity={0.3}
      >
        <animate attributeName="r" values="4;12;4" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle
        cx={destination.x}
        cy={destination.y}
        r={hovered ? 6 : 4.5}
        fill="#C4522A"
        className="transition-all duration-200"
      />
      {hovered && (
        <g>
          <rect
            x={destination.x - 45}
            y={destination.y - 32}
            width={90}
            height={22}
            rx={4}
            fill="#1A1A1A"
            fillOpacity={0.9}
          />
          <text
            x={destination.x}
            y={destination.y - 17}
            textAnchor="middle"
            fill="#FDF6EC"
            fontSize={11}
            fontFamily="var(--font-karla), system-ui, sans-serif"
          >
            {destination.name}
          </text>
        </g>
      )}
    </g>
  );
}

export default function WorldMap() {
  return (
    <section className="bg-white py-24 px-6 md:px-12 lg:px-20 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-serif text-display text-charcoal-900 md:text-display-lg">
          Where Will You Go Next?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center font-sans text-body-lg text-charcoal-800/60">
          Discover destinations loved by our travelers worldwide.
        </p>

        <div className="mt-16">
          <svg
            viewBox="0 0 900 450"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            {/* Real simplified world map paths */}
            {/* North America */}
            <path d="M148,72 L168,58 L185,52 L210,48 L230,55 L255,60 L272,58 L285,65 L278,78 L270,85 L265,95 L258,108 L262,118 L275,125 L282,135 L278,148 L270,158 L258,168 L248,178 L238,188 L225,195 L218,202 L205,208 L195,205 L182,198 L170,192 L158,195 L148,202 L140,198 L135,188 L128,175 L122,162 L118,148 L115,135 L118,118 L122,105 L128,92 L138,82 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* Greenland */}
            <path d="M280,28 L310,22 L335,25 L348,35 L345,48 L332,55 L315,58 L298,52 L288,42 Z" fill="#9BB59F" fillOpacity={0.2} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.4} />
            {/* Central America */}
            <path d="M195,205 L200,212 L208,218 L215,225 L218,232 L215,238 L210,235 L205,228 L198,218 L192,210 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* South America */}
            <path d="M228,242 L245,235 L262,238 L275,245 L285,255 L292,268 L298,282 L302,298 L298,315 L292,330 L282,342 L272,352 L260,358 L250,362 L242,355 L235,342 L228,325 L222,308 L218,292 L215,275 L218,258 L222,248 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* Europe */}
            <path d="M435,78 L448,72 L462,68 L478,72 L492,78 L505,85 L512,95 L508,108 L498,118 L488,125 L478,132 L468,135 L458,138 L448,142 L438,138 L432,128 L428,118 L425,105 L428,92 L432,85 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* UK/Ireland */}
            <path d="M425,82 L432,75 L438,78 L435,85 L428,88 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* Scandinavia */}
            <path d="M468,42 L478,35 L488,38 L495,48 L498,62 L492,72 L482,68 L475,58 L470,50 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* Africa */}
            <path d="M448,178 L462,168 L478,165 L498,168 L515,175 L528,188 L538,205 L545,225 L548,248 L545,272 L540,295 L532,315 L522,332 L510,342 L498,348 L485,345 L472,338 L462,325 L455,308 L448,288 L445,268 L442,248 L440,228 L442,208 L445,192 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* Middle East */}
            <path d="M548,148 L568,142 L585,148 L598,158 L605,172 L608,185 L602,195 L592,198 L578,192 L565,185 L555,175 L548,162 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* Russia/Central Asia */}
            <path d="M512,85 L535,72 L562,62 L592,55 L625,52 L658,55 L688,62 L715,72 L738,82 L752,92 L758,105 L752,118 L738,125 L718,128 L695,125 L672,122 L648,125 L625,128 L602,132 L578,135 L555,138 L535,135 L518,125 L512,108 Z" fill="#9BB59F" fillOpacity={0.2} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.4} />
            {/* India */}
            <path d="M618,168 L635,162 L652,168 L662,182 L668,198 L665,218 L658,235 L648,248 L635,255 L625,248 L618,235 L612,218 L608,202 L610,185 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* Southeast Asia */}
            <path d="M672,185 L688,178 L705,182 L718,192 L728,205 L732,218 L728,228 L718,232 L705,228 L692,222 L682,212 L675,198 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* China/East Asia */}
            <path d="M688,105 L712,98 L738,102 L758,112 L772,125 L778,142 L775,158 L765,172 L752,178 L738,175 L722,168 L708,162 L698,152 L688,142 L682,128 L685,115 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* Japan */}
            <path d="M782,138 L790,132 L795,142 L792,155 L785,162 L780,155 L778,145 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* Indonesia */}
            <path d="M698,262 L715,258 L732,262 L748,268 L758,275 L752,285 L738,288 L722,285 L708,278 L698,272 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* Australia */}
            <path d="M745,312 L768,302 L792,305 L815,312 L832,325 L838,342 L832,358 L818,368 L802,372 L785,368 L768,362 L755,352 L745,338 L742,325 Z" fill="#9BB59F" fillOpacity={0.3} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.5} />
            {/* New Zealand */}
            <path d="M842,365 L848,358 L852,368 L848,378 L842,375 Z" fill="#9BB59F" fillOpacity={0.2} stroke="#9BB59F" strokeWidth={0.8} strokeOpacity={0.4} />

            {/* Destination dots */}
            {destinations.map((dest) => (
              <DestinationDot key={dest.name} destination={dest} />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
