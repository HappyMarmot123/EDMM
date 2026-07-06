import { DeferredCobeOrbit } from "./deferredCobeOrbit";

export default function Hero() {
  return (
    <section className="rose-hero" aria-labelledby="rose-hero-title">
      <div className="rose-hero__inner">
        <div className="rose-hero__content">
          <h1 id="rose-hero-title" className="rose-hero__title">
            EDMM
          </h1>
          <p className="rose-hero__kicker">Electronic dance music</p>
          <p className="rose-hero__copy">
            All you need to enjoy the show is the groove. Search late-night music, and keep the whole session inside a plum-blossom signal.
          </p>
          <div className="rose-hero__actions">
            <a className="rose-hero__cta rose-hero__cta--primary" href="/search">
              Start listening
            </a>
          </div>
          <div className="rose-hero__meta" aria-label="EDMM landing signals">
            <span>Tech House</span>
            <span>Bass House</span>
            <span>Future House</span>
          </div>
        </div>

        <DeferredCobeOrbit />
      </div>
    </section>
  );
}
