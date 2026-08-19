"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { HOUSE } from "../config";
import { formatPrice, PriceBreakdown } from "../pricing";
import { CalculatorAction, LocationState } from "../state";
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

/** Sub-toolbar under the site nav: property · location · live estimate · CTA. */
export function TopBar({
  price,
  location,
  dispatch,
}: {
  price: PriceBreakdown;
  location: LocationState;
  dispatch: React.Dispatch<CalculatorAction>;
}) {
  const low = useCountUp(price.total.low);
  const high = useCountUp(price.total.high);
  // the borough the postcode resolved to; the raw postcode is the fallback
  // when the lookup service was unreachable
  const place = location.borough ?? (location.postcode.trim() || null);
  // with neither project selected there is nothing to price — showing £0
  // would read as "this build is free" rather than "nothing chosen yet"
  const hasWorks = price.extension !== null || price.loft !== null;

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
        background: "rgba(248, 246, 243, 0.85)",
        position: "relative",
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      <span className="calc-topbar-trim" style={{ ...microLabel, whiteSpace: "nowrap" }}>
        Configure
      </span>
      <span
        aria-hidden
        className="calc-topbar-trim"
        style={{ width: 1, height: 22, background: LINE }}
      />

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
          className="calc-topbar-trim"
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

      {/* where the property is. The rate band it resolves to is deliberately
          not shown — it is an input to the arithmetic, not something the
          customer needs to read. */}
      {place && (
        <div
          className="calc-zone"
          style={{
            display: "flex",
            alignItems: "baseline",
            padding: "5px 11px",
            border: "1px solid rgba(184,148,78,0.4)",
            background: "rgba(184,148,78,0.07)",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 300,
              fontSize: "clamp(9px, 0.7vw, 10.5px)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            {place}
          </span>
        </div>
      )}

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
            color: hasWorks ? FG : MUTED,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
        >
          {hasWorks ? (
            <>
              {formatPrice(low)}
              <span style={{ color: ACCENT, padding: "0 0.3em", fontWeight: 400 }}>
                —
              </span>
              {formatPrice(high)}
            </>
          ) : (
            <span
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 300,
                fontSize: "clamp(11px, 0.9vw, 13px)",
                letterSpacing: "0.06em",
              }}
            >
              Select works to price
            </span>
          )}
        </span>
      </div>

      <span
        aria-hidden
        className="calc-topbar-trim"
        style={{ width: 1, height: 22, background: LINE }}
      />

      {/* CTA — bordered rectangle with arrow */}
      <button
        className="calc-cta"
        onClick={() => dispatch({ type: "SET_QUOTE_OPEN", open: true })}
        disabled={!hasWorks}
        title={hasWorks ? undefined : "Add an extension or a loft conversion first"}
        style={{
          ...arrowButton,
          padding: "10px clamp(14px, 1.6vw, 22px)",
          opacity: hasWorks ? 1 : 0.4,
          cursor: hasWorks ? "pointer" : "not-allowed",
        }}
        onMouseEnter={(e) => {
          if (!hasWorks) return;
          e.currentTarget.style.background = FG;
          e.currentTarget.style.color = "#f8f6f3";
          e.currentTarget.style.borderColor = FG;
        }}
        onMouseLeave={(e) => {
          if (!hasWorks) return;
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = FG;
          e.currentTarget.style.borderColor = "rgba(26,25,22,0.2)";
        }}
      >
        Detailed Quote
        <Arrow />
      </button>
    </div>
  );
}
