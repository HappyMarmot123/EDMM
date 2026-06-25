import Link from "next/link";

export default function Hero() {
  return (
    <section className="rose-hero" aria-labelledby="rose-hero-title">
      <div className="rose-hero__inner">
        <div className="rose-hero__content">
          <p className="rose-hero__eyebrow">
            Rose Orbit / Midnight signal / Dance floor
          </p>
          <h1 id="rose-hero-title" className="rose-hero__title">
            EDMM
          </h1>
          <p className="rose-hero__kicker">
            Electronic dance music in rose orbit
          </p>
          <p className="rose-hero__copy">
            Search late-night electronic tracks, collect the cuts that stay
            with you, and keep the whole session inside a rose-lit signal.
          </p>
          <div className="rose-hero__actions">
            <Link className="rose-hero__cta rose-hero__cta--primary" href="/search">
              Start listening
            </Link>
            <Link className="rose-hero__cta rose-hero__cta--secondary" href="/library">
              Open library
            </Link>
          </div>
          <div className="rose-hero__meta" aria-label="EDMM landing signals">
            <span>Search-first</span>
            <span>Rosefall background</span>
            <span>Library flow</span>
          </div>
        </div>

        <div
          className="rose-hero__orbit"
          aria-hidden="true"
          data-testid="rose-hero-orbit"
        >
          <span className="rose-hero__orbit-ring rose-hero__orbit-ring--outer" />
          <span className="rose-hero__orbit-ring rose-hero__orbit-ring--middle" />
          <span className="rose-hero__orbit-ring rose-hero__orbit-ring--inner" />
          <span
            className="rose-hero__orbit-tracer rose-hero__orbit-tracer--outer"
            data-testid="rose-orbit-tracer"
          >
            <span className="rose-hero__orbit-marker" />
          </span>
          <span
            className="rose-hero__orbit-tracer rose-hero__orbit-tracer--middle"
            data-testid="rose-orbit-tracer"
          >
            <span className="rose-hero__orbit-marker" />
          </span>
          <span
            className="rose-hero__orbit-tracer rose-hero__orbit-tracer--inner"
            data-testid="rose-orbit-tracer"
          >
            <span className="rose-hero__orbit-marker" />
          </span>
          <span className="rose-hero__orbit-core" />
          <span className="rose-hero__orbit-satellite rose-hero__orbit-satellite--one" />
          <span className="rose-hero__orbit-satellite rose-hero__orbit-satellite--two" />
          <span className="rose-hero__orbit-label">ROSE ORBIT</span>
        </div>
      </div>
    </section>
  );
}
