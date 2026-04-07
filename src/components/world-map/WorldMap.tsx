"use client";

import { useState } from "react";

interface Destination {
  name: string;
  x: number;
  y: number;
}

const destinations: Destination[] = [
  { name: "New York", x: 250, y: 195 },
  { name: "Barcelona", x: 460, y: 185 },
  { name: "Marrakech", x: 445, y: 220 },
  { name: "Paris", x: 470, y: 170 },
  { name: "Amalfi Coast", x: 500, y: 185 },
  { name: "Santorini", x: 525, y: 195 },
  { name: "Dubai", x: 590, y: 225 },
  { name: "Cape Town", x: 520, y: 360 },
  { name: "Bali", x: 720, y: 300 },
  { name: "Tokyo", x: 760, y: 190 },
];

function DestinationDot({ destination }: { destination: Destination }) {
  const [hovered, setHovered] = useState(false);

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer" }}
    >
      {/* Pulse ring */}
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

      {/* Main dot */}
      <circle
        cx={destination.x}
        cy={destination.y}
        r={hovered ? 6 : 4.5}
        fill="#C4522A"
        className="transition-all duration-200"
      />

      {/* Tooltip */}
      {hovered && (
        <g>
          <rect
            x={destination.x - 40}
            y={destination.y - 30}
            width={80}
            height={20}
            rx={4}
            fill="#1A1A1A"
            fillOpacity={0.9}
          />
          <text
            x={destination.x}
            y={destination.y - 16}
            textAnchor="middle"
            fill="#FDF6EC"
            fontSize={10}
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
    <section className="bg-cream-100 py-24 px-6 md:px-12 lg:px-20 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-serif text-display text-charcoal-900 md:text-display-lg">
          Where Will You Go Next?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center font-sans text-body-lg text-charcoal-800/60">
          Discover destinations loved by our travelers worldwide.
        </p>

        <div className="mt-16">
          <svg
            viewBox="0 0 960 480"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            {/* North America */}
            <path d="M120,120 Q140,90 180,85 Q220,80 260,95 Q280,100 290,120 Q300,140 290,160 Q280,180 270,195 Q260,210 240,230 Q220,250 200,260 Q180,265 160,260 Q140,250 130,230 Q110,200 105,170 Q100,145 120,120Z" fill="#9BB59F" fillOpacity={0.25} stroke="#9BB59F" strokeWidth={1} strokeOpacity={0.5} />
            {/* Central America */}
            <path d="M200,260 Q210,265 215,275 Q220,285 225,295 Q222,300 218,298 Q210,290 205,280 Q200,270 200,260Z" fill="#9BB59F" fillOpacity={0.25} stroke="#9BB59F" strokeWidth={1} strokeOpacity={0.5} />
            {/* South America */}
            <path d="M240,295 Q260,285 280,290 Q300,295 310,310 Q315,330 310,355 Q305,375 295,390 Q280,405 265,400 Q250,390 240,370 Q230,350 225,330 Q220,310 240,295Z" fill="#9BB59F" fillOpacity={0.25} stroke="#9BB59F" strokeWidth={1} strokeOpacity={0.5} />
            {/* Europe */}
            <path d="M440,110 Q460,100 480,105 Q500,110 515,120 Q530,130 525,145 Q520,160 510,170 Q500,180 485,185 Q470,188 455,185 Q440,180 435,165 Q430,150 432,135 Q435,120 440,110Z" fill="#9BB59F" fillOpacity={0.25} stroke="#9BB59F" strokeWidth={1} strokeOpacity={0.5} />
            {/* Africa */}
            <path d="M455,210 Q475,200 500,205 Q520,210 535,225 Q545,240 550,260 Q555,285 548,310 Q540,335 530,355 Q520,370 505,375 Q490,378 475,370 Q460,360 452,340 Q445,320 442,295 Q440,270 443,245 Q448,225 455,210Z" fill="#9BB59F" fillOpacity={0.25} stroke="#9BB59F" strokeWidth={1} strokeOpacity={0.5} />
            {/* Asia */}
            <path d="M540,100 Q570,85 610,80 Q650,78 690,85 Q720,90 745,105 Q760,115 770,130 Q778,150 775,170 Q770,190 755,205 Q740,215 720,220 Q700,225 675,222 Q650,220 625,225 Q600,230 580,225 Q560,220 545,205 Q535,190 530,170 Q528,145 540,100Z" fill="#9BB59F" fillOpacity={0.25} stroke="#9BB59F" strokeWidth={1} strokeOpacity={0.5} />
            {/* Southeast Asia */}
            <path d="M680,260 Q700,255 720,260 Q740,265 755,275 Q760,285 750,295 Q740,305 720,308 Q700,310 685,305 Q672,298 670,285 Q668,272 680,260Z" fill="#9BB59F" fillOpacity={0.25} stroke="#9BB59F" strokeWidth={1} strokeOpacity={0.5} />
            {/* Australia */}
            <path d="M730,330 Q760,320 790,325 Q820,330 840,345 Q850,360 845,378 Q838,395 820,400 Q800,405 780,400 Q760,395 745,380 Q732,365 728,350 Q726,340 730,330Z" fill="#9BB59F" fillOpacity={0.25} stroke="#9BB59F" strokeWidth={1} strokeOpacity={0.5} />

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
