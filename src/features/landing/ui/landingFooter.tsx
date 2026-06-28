import { Link } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="rose-footer"
      aria-label="EDMM footer"
      data-testid="rose-footer"
    >
      <div className="rose-footer__shell">
        <div className="rose-footer__identity">
          <p className="rose-footer__brand">EDMM</p>
          <p className="rose-footer__tagline">@2026 EDMM / Made by Lucas
          </p>
        </div>

        <a
          className="rose-footer__github"
          href="https://github.com/HappyMarmot123/Music-Marmot"
          target="_blank"
          rel="noreferrer"
          aria-label="Open EDMM GitHub repository"
        >
          <Link size={18} strokeWidth={2.2} aria-hidden="true" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
}
