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
      <SampleItineraries />
      <HowItWorks />
      <WorldMap />
      <Footer />
    </main>
  );
}
