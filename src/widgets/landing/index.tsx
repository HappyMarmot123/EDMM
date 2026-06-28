import RoseSpaceBackground from "@/features/landing/components/roseSpaceBackground";
import Hero from "@/features/landing/ui/landingHero";
import BodySection from "@/features/landing/ui/landingBodySection";
import Footer from "@/features/landing/ui/landingFooter";

export default function Landing() {
  return (
    <main className="rose-landing my-gradient">
      <RoseSpaceBackground />
      <Hero />
      <BodySection />
      <Footer />
    </main>
  );
}
