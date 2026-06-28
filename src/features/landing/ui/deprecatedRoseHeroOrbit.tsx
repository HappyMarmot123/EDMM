type DeprecatedRoseHeroOrbitProps = {
  enabled?: boolean;
};

// Deprecated: kept temporarily while the hero visual is replaced by Cobe.
export default function DeprecatedRoseHeroOrbit({
  enabled = false,
}: DeprecatedRoseHeroOrbitProps) {
  if (!enabled) {
    return null;
  }

  return (
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
      <span className="rose-hero__orbit-core" data-testid="rose-orbit-core">
        <span
          className="rose-hero__orbit-core-pulse rose-hero__orbit-core-pulse--outer"
          data-testid="rose-orbit-core-pulse"
        />
        <span
          className="rose-hero__orbit-core-pulse rose-hero__orbit-core-pulse--inner"
          data-testid="rose-orbit-core-pulse"
        />
        <span className="rose-hero__orbit-core-shell" />
      </span>
      <span className="rose-hero__orbit-label">ROSE ORBIT</span>
    </div>
  );
}
