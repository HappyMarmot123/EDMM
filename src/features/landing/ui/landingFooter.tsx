import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="rose-footer"
      aria-label="EDMM footer"
      data-testid="rose-footer"
    >
      <p className="rose-footer__brand">EDMM / Rose Orbit</p>
      <nav className="rose-footer__nav" aria-label="Footer navigation">
        <Link href="/search">Search</Link>
        <Link href="/library">Library</Link>
      </nav>
      <p className="rose-footer__meta">2026 EDMM. Midnight signal stays live.</p>
    </footer>
  );
}
