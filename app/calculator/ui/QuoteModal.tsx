"use client";

import { FormEvent, useState } from "react";
import {
  areaExceedsModel,
  EXT_FRAMES,
  EXT_RATES,
  EXT_ROOFS,
  GLAZING,
  HOUSE,
  LOFT_FINISHES,
  LOFT_FRAMES,
  LOFT_LAYOUTS,
  LOFT_TYPES,
  MATERIALS,
  PATIOS,
  TIERS,
} from "../config";
import { formatRange, PriceBreakdown, PriceRange } from "../pricing";
import { CalculatorAction, CalculatorState } from "../state";
import { ZONES } from "../zones";
import { ACCENT, FAINT, FG, LINE, MUTED, priceTag } from "./controls";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(26,25,22,0.15)",
  padding: "10px 2px",
  fontFamily: "var(--font-outfit)",
  fontWeight: 300,
  fontSize: 14,
  color: FG,
  outline: "none",
  transition: "border-color 0.3s ease",
};

/** One priced line of the summary: label, chosen option, uplift. */
type Row = [string, string, number | null];

/** A project block — its own rows and its own range. */
interface Group {
  title: string;
  basis: string;
  rows: Row[];
  range: PriceRange;
}

export function QuoteModal({
  state,
  price,
  dispatch,
}: {
  state: CalculatorState;
  price: PriceBreakdown;
  dispatch: React.Dispatch<CalculatorAction>;
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => dispatch({ type: "SET_QUOTE_OPEN", open: false });

  const { ground, loft } = state;
  const zone = ZONES[price.zone];
  const groups: Group[] = [];

  if (price.extension) {
    const area = ground.area;
    const rate = EXT_RATES[ground.tier][price.zone];
    groups.push({
      title: "Rear extension",
      basis: `${area} m² × £${rate.low.toLocaleString(
        "en-GB"
      )}–${rate.high.toLocaleString("en-GB")} / m²`,
      range: price.extension,
      rows: [
        [
          "Size",
          areaExceedsModel(area)
            ? `${area} m² floor area`
            : `Full width × ${ground.depth.toFixed(2).replace(/\.?0+$/, "")} m deep (${area} m²)`,
          null,
        ],
        ["Spec", TIERS[ground.tier].label, null],
        ["Finish", MATERIALS[ground.material].label, MATERIALS[ground.material].price],
        ["Roof", EXT_ROOFS[ground.roof].label, EXT_ROOFS[ground.roof].price],
        ["Doors", GLAZING[ground.glazing].label, GLAZING[ground.glazing].price],
        ["Frames", EXT_FRAMES[ground.frame].label, EXT_FRAMES[ground.frame].price],
        ["Patio", PATIOS[ground.patio].label, PATIOS[ground.patio].price],
      ],
    });
  }

  if (price.loft) {
    groups.push({
      title: "Loft conversion",
      basis: `${loft.depth.toFixed(1)} m depth · ±15% range`,
      range: price.loft,
      rows: [
        ["Dormer", LOFT_TYPES[loft.type].label, null],
        [
          "Layout",
          `${LOFT_LAYOUTS[loft.layout].note} — ${LOFT_LAYOUTS[loft.layout].label}`,
          LOFT_LAYOUTS[loft.layout].price,
        ],
        ["Frames", LOFT_FRAMES[loft.frame].label, LOFT_FRAMES[loft.frame].price],
        ["Re-roof", LOFT_FINISHES[loft.finish].label, LOFT_FINISHES[loft.finish].price],
      ],
    });
  }

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
        background: "rgba(26,25,22,0.6)",
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
          background: "#f8f6f3",
          border: `1px solid rgba(26,25,22,0.12)`,
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
            <div style={{ marginBottom: 26 }}>
              {/* property + zone the rates come from */}
              <div style={{ borderTop: `1px solid ${LINE}` }}>
                <SummaryRow label="Property" value={`${HOUSE.label} · ${HOUSE.sub}`} />
                <SummaryRow
                  label="Zone"
                  value={`${zone.label} — ${
                    state.location.borough ?? zone.sub
                  }${state.location.postcode ? ` · ${state.location.postcode}` : ""}`}
                />
              </div>

              {groups.map((group) => (
                <div key={group.title} style={{ marginTop: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 12,
                      paddingBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-outfit)",
                        fontWeight: 400,
                        fontSize: 11,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: FG,
                      }}
                    >
                      {group.title}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-outfit)",
                        fontWeight: 300,
                        fontSize: 11,
                        color: FAINT,
                        textAlign: "right",
                      }}
                    >
                      {group.basis}
                    </span>
                  </div>
                  <div style={{ borderTop: `1px solid ${LINE}` }}>
                    {group.rows.map(([label, value, p]) => (
                      <SummaryRow key={label} label={label} value={value} price={p} />
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      padding: "10px 0 0",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-outfit)",
                        fontWeight: 300,
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: FAINT,
                      }}
                    >
                      Subtotal
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-bodoni)",
                        fontWeight: 600,
                        fontSize: 15,
                        color: MUTED,
                      }}
                    >
                      {formatRange(group.range)}
                    </span>
                  </div>
                </div>
              ))}

              {groups.length === 0 && (
                <p
                  style={{
                    fontFamily: "var(--font-outfit)",
                    fontWeight: 300,
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: MUTED,
                    padding: "18px 0",
                  }}
                >
                  Nothing is selected yet — switch on a rear extension or choose
                  a loft conversion to see an estimate.
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginTop: 22,
                  paddingTop: 14,
                  borderTop: `1px solid rgba(26,25,22,0.25)`,
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
                    color: groups.length ? FG : MUTED,
                  }}
                >
                  {groups.length ? formatRange(price.total) : "—"}
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
                  defaultValue={state.location.postcode}
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

/** One hairline-ruled line of the summary. */
function SummaryRow({
  label,
  value,
  price,
}: {
  label: string;
  value: string;
  price?: number | null;
}) {
  return (
    <div
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
          width: 72,
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
      {price !== null && price !== undefined && (
        <span
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: 300,
            fontSize: 12,
            whiteSpace: "nowrap",
            color: price === 0 ? FAINT : ACCENT,
          }}
        >
          {priceTag(price)}
        </span>
      )}
    </div>
  );
}

const solidButton: React.CSSProperties = {
  fontFamily: "var(--font-outfit)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#f8f6f3",
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
  border: "1px solid rgba(26,25,22,0.18)",
  padding: "13px 24px",
  cursor: "pointer",
  transition: "all 0.35s ease",
};
