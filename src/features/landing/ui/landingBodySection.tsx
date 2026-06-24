import Link from "next/link";
import Parallax from "@/features/landing/components/parallax";

export default function BodySection() {
  return (
    <section className="rose-followup" aria-label="EDMM navigation">
      <div className="rose-parallax-band" aria-hidden="true">
        <Parallax baseVelocity={-2}>Electronic</Parallax>
        <Parallax baseVelocity={2}>Dance Music</Parallax>
      </div>

      <div className="rose-followup__links">
        <Link href="/search">Search</Link>
        <Link href="/library">Library</Link>
      </div>
    </section>
  );
}
