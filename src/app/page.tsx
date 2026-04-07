import Navbar from "@/components/navigation/Navbar";
import LandscapeHero from "@/components/hero/LandscapeHero";
import SampleItineraries from "@/components/samples/SampleItineraries";
import HowItWorks from "@/components/how-it-works/HowItWorks";
import WorldMap from "@/components/world-map/WorldMap";
import Footer from "@/components/footer/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-cream-100">
      <Navbar />
      <LandscapeHero />
      {/* Force a new stacking context so WebGL canvas doesn't paint over these sections */}
      <div className="relative" style={{ zIndex: 1, isolation: 'isolate' }}>
        <SampleItineraries />
        <HowItWorks />
        <WorldMap />
        <Footer />
      </div>
    </main>
  );
}
