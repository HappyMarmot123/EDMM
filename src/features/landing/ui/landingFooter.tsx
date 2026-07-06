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
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.62 1.62" />
            <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.62-1.62" />
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
}
