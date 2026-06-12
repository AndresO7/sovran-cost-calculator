"use client";

import { FormEvent, useState } from "react";
import {
  EXT_ROOFS,
  FRAMES,
  GLAZING,
  LOFT_FINISHES,
  LOFT_TYPES,
  MATERIALS,
  PATIOS,
  PROTOTYPES,
} from "../config";
import { formatRange, PriceRange } from "../pricing";
import { CalculatorAction, CalculatorState } from "../state";
import { ACCENT, FAINT, FG, LINE, MUTED, priceTag } from "./controls";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(245,240,235,0.15)",
  padding: "10px 2px",
  fontFamily: "var(--font-outfit)",
  fontWeight: 300,
  fontSize: 14,
  color: FG,
  outline: "none",
  transition: "border-color 0.3s ease",
};

export function QuoteModal({
  state,
  price,
  dispatch,
}: {
  state: CalculatorState;
  price: PriceRange;
  dispatch: React.Dispatch<CalculatorAction>;
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => dispatch({ type: "SET_QUOTE_OPEN", open: false });

  const proto = PROTOTYPES[state.prototype];
  const size = proto.sizes[state.ground.size];

  const rows: Array<[string, string, number | null]> = [
    ["Prototype", `${proto.label} · ${proto.sub}`, null],
    ["Extension", `${size.description} (${size.area} m²)`, null],
    ["Finish", MATERIALS[state.ground.material].label, MATERIALS[state.ground.material].price],
    ["Roof", EXT_ROOFS[state.ground.roof].label, EXT_ROOFS[state.ground.roof].price],
    ["Glazing", GLAZING[state.ground.glazing].label, GLAZING[state.ground.glazing].price],
    ["Joinery", FRAMES[state.ground.frame].label, FRAMES[state.ground.frame].price],
    ["Patio", PATIOS[state.ground.patio].label, PATIOS[state.ground.patio].price],
    ["Loft", LOFT_TYPES[state.loft.type].label, LOFT_TYPES[state.loft.type].price],
    ["Re-roof", LOFT_FINISHES[state.loft.finish].label, LOFT_FINISHES[state.loft.finish].price],
  ];

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const postcode = String(data.get("postcode") ?? "").trim();
    if (!name || !email || !postcode) {
      setError("Please complete all fields.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSent(true);
  };

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(10,10,10,0.78)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(14px, 3vw, 40px)",
        animation: "panelFade 0.35s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(580px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#11100e",
          border: `1px solid rgba(239,233,225,0.12)`,
          padding: "clamp(24px, 3.5vw, 44px)",
        }}
      >
        {sent ? (
          <div style={{ textAlign: "center", padding: "30px 0 20px" }}>
            <div
              style={{
                width: 58,
                height: 58,
                margin: "0 auto 22px",
                borderRadius: "50%",
                border: `1px solid ${ACCENT}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M5 12.5 L10 17.5 L19 7"
                  stroke={ACCENT}
                  strokeWidth="1.6"
                  fill="none"
                />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-inter-tight)",
                fontWeight: 900,
                textTransform: "uppercase",
                fontSize: "clamp(20px, 2.3vw, 27px)",
                letterSpacing: "-0.005em",
                lineHeight: 1.05,
                color: FG,
                marginBottom: 12,
              }}
            >
              Request received
            </h2>
            <p
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 300,
                fontSize: 14,
                lineHeight: 1.75,
                color: MUTED,
                maxWidth: 380,
                margin: "0 auto 28px",
              }}
            >
              Our team will review your design and send a detailed quotation
              within two working days.
            </p>
            <button onClick={close} style={ghostButton}>
              Back to design
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: 10,
                fontWeight: 400,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: FAINT,
                marginBottom: 10,
              }}
            >
              Your design
            </div>
            <h2
              style={{
                fontFamily: "var(--font-inter-tight)",
                fontWeight: 900,
                textTransform: "uppercase",
                fontSize: "clamp(22px, 2.5vw, 30px)",
                letterSpacing: "-0.005em",
                lineHeight: 1.05,
                color: FG,
                marginBottom: 22,
              }}
            >
              Your detailed <em style={{ fontStyle: "italic", color: ACCENT }}>quote</em>
            </h2>

            {/* summary */}
            <div style={{ borderTop: `1px solid ${LINE}`, marginBottom: 26 }}>
              {rows.map(([label, value, p]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 14,
                    padding: "9px 0",
                    borderBottom: `1px solid ${LINE}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontWeight: 400,
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: FAINT,
                      width: 92,
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontWeight: 300,
                      fontSize: 13.5,
                      color: FG,
                      flex: 1,
                    }}
                  >
                    {value}
                  </span>
                  {p !== null && (
                    <span
                      style={{
                        fontFamily: "var(--font-outfit)",
                        fontWeight: 300,
                        fontSize: 12,
                        color: p === 0 ? FAINT : ACCENT,
                      }}
                    >
                      {priceTag(p)}
                    </span>
                  )}
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  padding: "14px 0 4px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontWeight: 400,
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: FAINT,
                  }}
                >
                  Estimated cost
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-bodoni)",
                    fontWeight: 600,
                    fontSize: "clamp(21px, 2.3vw, 28px)",
                    letterSpacing: "0.02em",
                    color: FG,
                  }}
                >
                  {formatRange(price)}
                </span>
              </div>
            </div>

            {/* lead form */}
            <form onSubmit={submit} noValidate>
              <div style={{ display: "grid", gap: 18, marginBottom: 24 }}>
                <input name="name" placeholder="Full name" autoComplete="name" style={inputStyle} />
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  style={inputStyle}
                />
                <input
                  name="postcode"
                  placeholder="Property postcode"
                  autoComplete="postal-code"
                  style={inputStyle}
                />
              </div>
              {error && (
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontSize: 12,
                    color: "#d08770",
                    marginBottom: 16,
                  }}
                >
                  {error}
                </p>
              )}
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" style={solidButton}>
                  Request detailed quote
                </button>
                <button type="button" onClick={close} style={ghostButton}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const solidButton: React.CSSProperties = {
  fontFamily: "var(--font-outfit)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#0a0a0a",
  background: FG,
  border: `1px solid ${FG}`,
  padding: "13px 24px",
  cursor: "pointer",
  transition: "all 0.35s ease",
};

const ghostButton: React.CSSProperties = {
  fontFamily: "var(--font-outfit)",
  fontWeight: 400,
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: MUTED,
  background: "transparent",
  border: "1px solid rgba(245,240,235,0.2)",
  padding: "13px 24px",
  cursor: "pointer",
  transition: "all 0.35s ease",
};
