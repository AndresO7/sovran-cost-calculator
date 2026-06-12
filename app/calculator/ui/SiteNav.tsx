"use client";

import { ACCENT, FG, LINE } from "./controls";

const LEFT_LINKS = ["Services", "Projects", "About Us"];
const RIGHT_LINKS = ["Resources", "Contact"];

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--font-outfit)",
  fontWeight: 300,
  fontSize: "clamp(10px, 0.78vw, 11.5px)",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(239,233,225,0.7)",
  textDecoration: "none",
  transition: "color 0.3s ease",
  whiteSpace: "nowrap",
};

/** The sovrangroup.co.uk navbar: links · SOVRAN centred · links + gold CTA. */
export function SiteNav() {
  return (
    <header
      className="site-nav"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        height: "var(--nav-height)",
        padding: "0 clamp(16px, 2.5vw, 44px)",
        borderBottom: `1px solid ${LINE}`,
        background: "var(--background)",
        position: "relative",
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      <nav className="site-nav-links" style={{ display: "flex", gap: "clamp(18px, 2.6vw, 44px)" }}>
        {LEFT_LINKS.map((l) => (
          <a
            key={l}
            href="#"
            style={linkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.color = FG)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(239,233,225,0.7)")}
          >
            {l}
          </a>
        ))}
      </nav>

      <a
        href="#"
        style={{
          fontFamily: "var(--font-bodoni)",
          fontWeight: 500,
          fontSize: "clamp(22px, 1.9vw, 30px)",
          letterSpacing: "0.14em",
          color: FG,
          textDecoration: "none",
          lineHeight: 1,
          padding: "0 clamp(10px, 2vw, 30px)",
        }}
      >
        SOVRAN
      </a>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "clamp(18px, 2.6vw, 44px)",
        }}
      >
        <nav className="site-nav-links" style={{ display: "flex", gap: "clamp(18px, 2.6vw, 44px)" }}>
          {RIGHT_LINKS.map((l) => (
            <a
              key={l}
              href="#"
              style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = FG)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(239,233,225,0.7)")}
            >
              {l}
            </a>
          ))}
        </nav>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "var(--font-outfit)",
            fontWeight: 400,
            fontSize: "clamp(9.5px, 0.72vw, 11px)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: FG,
            border: `1px solid rgba(201,169,110,0.55)`,
            background: "rgba(201,169,110,0.07)",
            padding: "11px clamp(13px, 1.4vw, 20px)",
            whiteSpace: "nowrap",
            cursor: "default",
          }}
        >
          Cost Calculator
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden>
            <path d="M1 7 H12 M8 2.5 L12.5 7 L8 11.5" stroke={ACCENT} strokeWidth="1.1" fill="none" />
          </svg>
        </span>
      </div>
    </header>
  );
}
