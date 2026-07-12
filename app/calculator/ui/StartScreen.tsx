"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { CalculatorAction } from "../state";
import { ACCENT, Arrow, FAINT, FG, GHOST, LINE, microLabel, MUTED } from "./controls";

type Focus = "ground" | "loft" | "both";

const FOCUS_OPTIONS: Array<{ id: Focus; label: string; blurb: string; icon: React.ReactNode }> = [
  {
    id: "ground",
    label: "Ground floor",
    blurb: "Rear extension onto the garden",
    icon: (
      <svg width="40" height="34" viewBox="0 0 44 36" aria-hidden>
        <g stroke="currentColor" strokeWidth="1.1" fill="none">
          <rect x="10" y="10" width="14" height="23" />
          <path d="M10 10 L17 5 L24 10" />
          <rect x="24" y="20" width="12" height="13" stroke="#c9a96e" />
          <line x1="6" y1="33" x2="40" y2="33" />
        </g>
      </svg>
    ),
  },
  {
    id: "loft",
    label: "Loft",
    blurb: "Dormer conversion within the roof",
    icon: (
      <svg width="40" height="34" viewBox="0 0 44 36" aria-hidden>
        <g stroke="currentColor" strokeWidth="1.1" fill="none">
          <rect x="12" y="16" width="20" height="17" />
          <path d="M12 16 L22 8 L32 16" />
          <rect x="18" y="10.5" width="8" height="5.5" stroke="#c9a96e" />
          <line x1="8" y1="33" x2="36" y2="33" />
        </g>
      </svg>
    ),
  },
  {
    id: "both",
    label: "Both",
    blurb: "Extension and loft together",
    icon: (
      <svg width="40" height="34" viewBox="0 0 44 36" aria-hidden>
        <g stroke="currentColor" strokeWidth="1.1" fill="none">
          <rect x="10" y="14" width="14" height="19" />
          <path d="M10 14 L17 7 L24 14" />
          <rect x="14" y="9.5" width="6" height="4.5" stroke="#c9a96e" />
          <rect x="24" y="22" width="11" height="11" stroke="#c9a96e" />
          <line x1="6" y1="33" x2="39" y2="33" />
        </g>
      </svg>
    ),
  },
];

const optionRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "clamp(14px, 1.4vw, 20px)",
  width: "100%",
  textAlign: "left",
  padding: "clamp(13px, 1.9vh, 19px) clamp(16px, 1.6vw, 24px)",
  background: "rgba(239,233,225,0.02)",
  border: "1px solid rgba(239,233,225,0.1)",
  cursor: "pointer",
  transition: "border-color 0.3s ease, background 0.3s ease, transform 0.3s ease",
  color: "rgba(239,233,225,0.55)",
};

/**
 * Title-sheet intro: one question — what are you extending — then straight
 * into the configurator.
 */
export function StartScreen({ dispatch }: { dispatch: React.Dispatch<CalculatorAction> }) {
  const [leaving, setLeaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-intro]", {
        y: 24,
        opacity: 0,
        duration: 0.85,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.1,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const begin = (focus: Focus) => {
    if (leaving) return;
    setLeaving(true);
    gsap.to(rootRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
      onComplete: () => dispatch({ type: "BEGIN", focus }),
    });
  };

  return (
    <div
      ref={rootRef}
      className="start-root"
      style={{
        flex: 1,
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(1100px 600px at 74% 14%, rgba(201,169,110,0.05), transparent 60%), var(--background)",
      }}
    >
      {/* ghost numeral, clipped by the container */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: "clamp(8px, 3vw, 56px)",
          bottom: "-0.22em",
          fontFamily: "var(--font-bodoni)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(180px, 26vw, 380px)",
          lineHeight: 1,
          color: GHOST,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        01
      </span>

      <div
        className="start-cols"
        style={{
          height: "100%",
          display: "grid",
          gridTemplateColumns: "1.05fr 1px 1fr",
          alignItems: "stretch",
          padding: "0 clamp(20px, 4vw, 64px)",
          gap: "clamp(20px, 3.5vw, 56px)",
          maxWidth: 1380,
          margin: "0 auto",
        }}
      >
        {/* left — editorial heading */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "clamp(14px, 2.4vh, 24px)",
            paddingBottom: "4vh",
          }}
        >
          <div data-intro style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 36, height: 1, background: ACCENT, display: "inline-block" }} />
            <span style={microLabel}>Sovran Cost Calculator</span>
          </div>
          <h1
            data-intro
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: "clamp(30px, 3.9vw, 58px)",
              letterSpacing: "-0.01em",
              lineHeight: 1.04,
              color: FG,
              maxWidth: "12em",
            }}
          >
            Your extension,
            <br />
            priced{" "}
            <em style={{ fontStyle: "italic", color: ACCENT }}>in thirty seconds</em>
          </h1>
          <p
            data-intro
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 300,
              fontSize: "clamp(12.5px, 1vw, 15px)",
              lineHeight: 1.8,
              color: MUTED,
              maxWidth: 440,
            }}
          >
            One question, then shape your project on a live architectural
            model — sizes, materials and finishes, costed as you design.
          </p>
        </div>

        {/* hairline divider */}
        <div data-intro style={{ background: LINE, margin: "10vh 0" }} className="start-divider" />

        {/* right — the question */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingBottom: "4vh",
          }}
        >
          <div data-intro style={{ width: "100%", maxWidth: 520 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--font-bodoni)", fontStyle: "italic", color: ACCENT, fontSize: 15 }}>
                01
              </span>
              <span style={{ ...microLabel, color: "rgba(239,233,225,0.6)" }}>
                What do you want to extend?
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {FOCUS_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => begin(o.id)}
                  style={optionRow}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(201,169,110,0.65)";
                    e.currentTarget.style.background = "rgba(201,169,110,0.07)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(239,233,225,0.1)";
                    e.currentTarget.style.background = "rgba(239,233,225,0.02)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  {o.icon}
                  <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-outfit)",
                        fontWeight: 400,
                        fontSize: "clamp(14px, 1.15vw, 16.5px)",
                        letterSpacing: "0.05em",
                        color: "rgba(239,233,225,0.88)",
                      }}
                    >
                      {o.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-outfit)",
                        fontWeight: 300,
                        fontSize: 11.5,
                        letterSpacing: "0.06em",
                        color: FAINT,
                      }}
                    >
                      {o.blurb}
                    </span>
                  </span>
                  <span className="row-arrow" style={{ marginLeft: "auto", color: ACCENT, opacity: 0.45 }}>
                    <Arrow />
                  </span>
                </button>
              ))}
            </div>
            <p
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 300,
                fontSize: 11,
                letterSpacing: "0.06em",
                color: FAINT,
                marginTop: 14,
              }}
            >
              You can change any of this later in the configurator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
