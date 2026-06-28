import Parallax from "@/features/landing/components/parallax";

export default function BodySection() {
  return (
    <section className="rose-followup" aria-label="EDMM navigation">
      <div className="rose-parallax-band" aria-hidden="true">
        <Parallax baseVelocity={-2}>Electronic</Parallax>
        <Parallax baseVelocity={2}>Dance Music</Parallax>
      </div>
    </section>
  );
}
