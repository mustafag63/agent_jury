import "./globals.css";
import NetworkGuard from "@/components/NetworkGuard";
import Link from "next/link";

export const metadata = {
  title: "Agent Jury — AI Evaluation + On-Chain Verdicts",
  description:
    "Multi-agent AI evaluation system with immutable on-chain verdict storage on Monad.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <header className="app-header" role="banner">
          <nav aria-label="Main navigation" className="nav-bar">
            <Link href="/" className="nav-brand">
              Agent Jury
            </Link>
            <ul className="nav-links" role="list">
              <li>
                <Link href="/connect">Connect</Link>
              </li>
              <li>
                <Link href="/submit">Evaluate</Link>
              </li>
              <li>
                <Link href="/history">History</Link>
              </li>
            </ul>
          </nav>
        </header>
        <main id="main-content" className="container" role="main">
          <NetworkGuard />
          {children}
        </main>
        <footer className="app-footer" role="contentinfo">
          <p>
            Agent Jury — Multi-agent AI evaluation with on-chain immutable
            storage
          </p>
        </footer>
      </body>
    </html>
  );
}
