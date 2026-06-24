import Link from "next/link";

export default function Hero() {
  return (
    <section className="rose-hero" aria-labelledby="rose-hero-title">
      <div className="rose-hero__inner">
        <p className="rose-hero__eyebrow">
          Rose signal / Dance floor / Night stream
        </p>
        <h1 id="rose-hero-title" className="rose-hero__title">
          EDMM
        </h1>
        <p className="rose-hero__kicker">Electronic Dance Music</p>
        <p className="rose-hero__copy">
          A rose-tinted signal for late-night electronic discovery.
        </p>
        <div className="rose-hero__actions">
          <Link className="rose-hero__cta" href="/search">
            Explore
          </Link>
        </div>
      </div>
    </section>
  );
}
