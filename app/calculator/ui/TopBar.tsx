"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { HOUSE } from "../config";
import { formatPrice, PriceRange } from "../pricing";
import { CalculatorAction } from "../state";
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

/** Sub-toolbar under the site nav: property label · live estimate · CTA. */
export function TopBar({
  price,
  dispatch,
}: {
  price: PriceRange;
  dispatch: React.Dispatch<CalculatorAction>;
}) {
  const low = useCountUp(price.low);
  const high = useCountUp(price.high);

  return (
    <div
      className="calc-topbar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(14px, 2vw, 36px)",
        height: 60,
        padding: "0 clamp(16px, 2.5vw, 44px)",
        borderBottom: `1px solid ${LINE}`,
        background: "rgba(17, 16, 14, 0.6)",
        position: "relative",
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      <span style={{ ...microLabel, whiteSpace: "nowrap" }}>Configure</span>
      <span aria-hidden style={{ width: 1, height: 22, background: LINE }} />

      {/* host property */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: 400,
            fontSize: "clamp(10px, 0.8vw, 11.5px)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: FG,
            whiteSpace: "nowrap",
          }}
        >
          {HOUSE.label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: 300,
            fontSize: "clamp(9px, 0.7vw, 10.5px)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: MUTED,
            whiteSpace: "nowrap",
          }}
        >
          {HOUSE.sub}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* live estimate, Didone numerals */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ ...microLabel, fontSize: "clamp(7px, 0.58vw, 9px)" }}>
          Estimated Cost
        </span>
        <span
          style={{
            fontFamily: "var(--font-bodoni)",
            fontWeight: 600,
            fontSize: "clamp(17px, 1.6vw, 24px)",
            letterSpacing: "0.02em",
            color: FG,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
        >
          {formatPrice(low)}
          <span style={{ color: ACCENT, padding: "0 0.3em", fontWeight: 400 }}>—</span>
          {formatPrice(high)}
        </span>
      </div>

      <span aria-hidden style={{ width: 1, height: 22, background: LINE }} />

      {/* CTA — bordered rectangle with arrow */}
      <button
        className="calc-cta"
        onClick={() => dispatch({ type: "SET_QUOTE_OPEN", open: true })}
        style={{ ...arrowButton, padding: "10px clamp(14px, 1.6vw, 22px)" }}
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
    </div>
  );
}
