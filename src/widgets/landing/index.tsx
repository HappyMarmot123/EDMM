import RoseSpaceBackground from "@/features/landing/components/roseSpaceBackground";
import Hero from "@/features/landing/ui/landingHero";
import BodySection from "@/features/landing/ui/landingBodySection";

export default function Landing() {
  return (
    <main className="rose-landing">
      <RoseSpaceBackground />
      <Hero />
      <BodySection />
    </main>
  );
}
