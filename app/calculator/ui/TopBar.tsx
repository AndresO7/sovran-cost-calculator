"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { PROTOTYPES, PrototypeId } from "../config";
import { formatPrice, PriceRange } from "../pricing";
import { CalculatorAction, CalculatorState } from "../state";
import { ACCENT, Arrow, arrowButton, FG, LINE, microLabel, MUTED } from "./controls";

function useCountUp(value: number): number {
  const [display, setDisplay] = useState(value);
  const obj = useRef({ v: value });
  useEffect(() => {
    const tween = gsap.to(obj.current, {
      v: value,
      duration: 0.7,
      ease: "power2.out",
      onUpdate: () => setDisplay(obj.current.v),
    });
    return () => {
      tween.kill();
    };
  }, [value]);
  return display;
}

export function TopBar({
  state,
  price,
  dispatch,
}: {
  state: CalculatorState;
  price: PriceRange;
  dispatch: React.Dispatch<CalculatorAction>;
}) {
  const low = useCountUp(price.low);
  const high = useCountUp(price.high);

  return (
    <header
      className="calc-topbar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(14px, 2vw, 36px)",
        height: "var(--nav-height)",
        padding: "0 clamp(16px, 2.5vw, 44px)",
        borderBottom: `1px solid ${LINE}`,
        background: "var(--background)",
        position: "relative",
        zIndex: 20,
      }}
    >
      {/* serif wordmark, like the site */}
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 1.4vw, 22px)" }}>
        <span
          style={{
            fontFamily: "var(--font-bodoni)",
            fontWeight: 500,
            letterSpacing: "0.12em",
            fontSize: "clamp(20px, 1.7vw, 27px)",
            color: FG,
            lineHeight: 1,
          }}
        >
          SOVRAN
        </span>
        <span aria-hidden style={{ width: 1, height: 26, background: LINE }} />
        <span style={{ ...microLabel, whiteSpace: "nowrap" }}>Cost Calculator</span>
      </div>

      {/* prototype selector — quiet text tabs with gold rule */}
      <nav style={{ display: "flex", gap: "clamp(14px, 1.8vw, 30px)", marginLeft: "clamp(2px, 1.5vw, 20px)" }}>
        {(Object.keys(PROTOTYPES) as PrototypeId[]).map((id) => {
          const active = id === state.prototype;
          return (
            <button
              key={id}
              onClick={() => dispatch({ type: "SET_PROTOTYPE", prototype: id })}
              aria-pressed={active}
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: active ? 400 : 300,
                fontSize: "clamp(10px, 0.8vw, 11.5px)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: active ? FG : MUTED,
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${active ? ACCENT : "transparent"}`,
                padding: "10px 2px 8px",
                cursor: "pointer",
                transition: "all 0.35s ease",
                whiteSpace: "nowrap",
              }}
            >
              {PROTOTYPES[id].label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* live estimate, Didone numerals */}
      <div style={{ textAlign: "right" }}>
        <div style={{ ...microLabel, fontSize: "clamp(7px, 0.58vw, 9px)", marginBottom: 4 }}>
          Estimated Cost
        </div>
        <div
          style={{
            fontFamily: "var(--font-bodoni)",
            fontWeight: 600,
            fontSize: "clamp(18px, 1.8vw, 28px)",
            letterSpacing: "0.02em",
            color: FG,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
        >
          {formatPrice(low)}
          <span style={{ color: ACCENT, padding: "0 0.35em", fontWeight: 400 }}>—</span>
          {formatPrice(high)}
        </div>
      </div>

      <span aria-hidden style={{ width: 1, height: 26, background: LINE }} />

      {/* CTA — bordered rectangle with arrow, like the site */}
      <button
        className="calc-cta"
        onClick={() => dispatch({ type: "SET_QUOTE_OPEN", open: true })}
        style={arrowButton}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = FG;
          e.currentTarget.style.color = "#0d0c0a";
          e.currentTarget.style.borderColor = FG;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = FG;
          e.currentTarget.style.borderColor = "rgba(239,233,225,0.28)";
        }}
      >
        Detailed Quote
        <Arrow />
      </button>
    </header>
  );
}
