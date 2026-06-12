"use client";

import { CSSProperties, ReactNode } from "react";

export const ACCENT = "#c9a96e";
export const FG = "#efe9e1";
export const MUTED = "rgba(239, 233, 225, 0.45)";
export const FAINT = "rgba(239, 233, 225, 0.32)";
export const GHOST = "rgba(239, 233, 225, 0.1)";
export const LINE = "rgba(239, 233, 225, 0.1)";

export function priceTag(price: number): string {
  return price === 0 ? "Included" : `+£${price.toLocaleString("en-GB")}`;
}

/** Micro-label: letter-spaced uppercase, the Sovran signature. */
export const microLabel: CSSProperties = {
  fontFamily: "var(--font-outfit)",
  fontWeight: 400,
  fontSize: "clamp(9px, 0.7vw, 10.5px)",
  letterSpacing: "0.28em",
  textTransform: "uppercase",
  color: FAINT,
};

/* --------------------------------- section --------------------------------- */

export function Section({
  index,
  label,
  children,
}: {
  index: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        padding: "clamp(20px, 2.4vh, 28px) 0",
        borderBottom: `1px solid ${LINE}`,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "clamp(10px, 1.4vh, 16px)",
          right: 0,
          fontFamily: "var(--font-bodoni)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(26px, 2.6vw, 38px)",
          lineHeight: 1,
          color: GHOST,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {index}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "clamp(14px, 1.8vh, 20px)" }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", border: `1px solid ${ACCENT}`, flexShrink: 0 }} />
        <span style={microLabel}>{label}</span>
      </div>
      {children}
    </div>
  );
}

/* -------------------------------- size picker ------------------------------- */

interface SizeOptionView {
  id: string;
  label: string;
  description: string;
  area: number;
}

export function SizePicker({
  options,
  value,
  onChange,
}: {
  options: SizeOptionView[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = options.find((o) => o.id === value);
  return (
    <div>
      <div style={{ display: "flex", gap: 14 }}>
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              aria-pressed={active}
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                border: `1px solid ${active ? ACCENT : "rgba(239,233,225,0.18)"}`,
                background: active ? "rgba(201,169,110,0.1)" : "transparent",
                color: active ? ACCENT : MUTED,
                fontFamily: "var(--font-bodoni)",
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {selected && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: "var(--font-outfit)", fontWeight: 400, fontSize: 13.5, color: FG }}>
            {selected.description}
          </div>
          <div style={{ fontFamily: "var(--font-outfit)", fontWeight: 300, fontSize: 11.5, color: MUTED, marginTop: 3, letterSpacing: "0.06em" }}>
            {selected.area} m² gross internal area
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- swatches --------------------------------- */

const SWATCH_STYLES: Record<string, CSSProperties> = {
  render: { background: "#ddd6cb" },
  redBrick: {
    background: "repeating-linear-gradient(0deg, #94604b 0px 6px, #9d8d7c 6px 7.5px)",
  },
  londonStock: {
    background: "repeating-linear-gradient(0deg, #ab9a74 0px 6px, #968a78 6px 7.5px)",
  },
  charredTimber: {
    background: "repeating-linear-gradient(90deg, #1d1a17 0px 5px, #0c0b0a 5px 6.5px)",
  },
  zinc: {
    background: "repeating-linear-gradient(90deg, #5b6066 0px 8px, #3c4045 8px 9.5px)",
  },
  slate: {
    background: "repeating-linear-gradient(0deg, #3b3f45 0px 7px, #23262a 7px 8.5px)",
  },
  clay: {
    background: "repeating-linear-gradient(0deg, #9c5237 0px 6px, #5e3322 6px 7.5px)",
  },
  zincRoof: {
    background: "repeating-linear-gradient(90deg, #5b6066 0px 8px, #3c4045 8px 9.5px)",
  },
  anthracite: { background: "#2b2e33" },
  bronze: { background: "linear-gradient(135deg, #7a6442 0%, #5e4a30 100%)" },
  white: { background: "#e6e0d4" },
  york: {
    background: "repeating-linear-gradient(0deg, #8d8474 0px 10px, #3a362f 10px 11.5px)",
  },
  porcelain: {
    background: "repeating-linear-gradient(0deg, #b9b3a8 0px 13px, #56524a 13px 14.5px)",
  },
  decking: {
    background: "repeating-linear-gradient(0deg, #6e5439 0px 6px, #3a2d20 6px 7.5px)",
  },
};

interface SwatchOptionView {
  id: string;
  label: string;
  price: number;
}

export function SwatchRow({
  options,
  value,
  onChange,
}: {
  options: SwatchOptionView[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = options.find((o) => o.id === value);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              aria-pressed={active}
              title={o.label}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                padding: 0,
                cursor: "pointer",
                border: active ? `1px solid ${ACCENT}` : "1px solid rgba(239,233,225,0.16)",
                outline: active ? `1px solid ${ACCENT}` : "1px solid transparent",
                outlineOffset: 3,
                transition: "all 0.3s ease",
                overflow: "hidden",
                ...SWATCH_STYLES[o.id],
              }}
            />
          );
        })}
      </div>
      {selected && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 400, fontSize: 13.5, color: FG }}>
            {selected.label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 300,
              fontSize: 11.5,
              letterSpacing: "0.08em",
              color: selected.price === 0 ? MUTED : ACCENT,
            }}
          >
            {priceTag(selected.price)}
          </span>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- option cards ------------------------------ */

interface CardOptionView {
  id: string;
  label: string;
  price: number;
  icon: ReactNode;
}

export function OptionGrid({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: CardOptionView[];
  value: string;
  onChange: (id: string) => void;
  columns?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 9,
      }}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "15px 6px 13px",
              cursor: "pointer",
              border: `1px solid ${active ? "rgba(201,169,110,0.65)" : LINE}`,
              background: active ? "rgba(201,169,110,0.06)" : "transparent",
              color: active ? FG : MUTED,
              transition: "all 0.3s ease",
            }}
          >
            <span style={{ color: active ? ACCENT : "rgba(239,233,225,0.5)" }}>{o.icon}</span>
            <span
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 400,
                fontSize: "clamp(10px, 0.8vw, 11.5px)",
                letterSpacing: "0.04em",
                textAlign: "center",
                lineHeight: 1.35,
              }}
            >
              {o.label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-outfit)",
                fontWeight: 300,
                fontSize: 9.5,
                letterSpacing: "0.08em",
                color: o.price === 0 ? FAINT : ACCENT,
              }}
            >
              {priceTag(o.price)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- buttons ---------------------------------- */

/** Rectangular hairline button with arrow — the Sovran CTA. */
export const arrowButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 12,
  fontFamily: "var(--font-outfit)",
  fontWeight: 400,
  fontSize: "clamp(9.5px, 0.75vw, 11px)",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: FG,
  background: "transparent",
  border: "1px solid rgba(239,233,225,0.28)",
  padding: "13px clamp(16px, 1.8vw, 26px)",
  cursor: "pointer",
  transition: "all 0.35s ease",
  whiteSpace: "nowrap",
};

export function Arrow({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden>
      <path
        d="M1 7 H12 M8 2.5 L12.5 7 L8 11.5"
        stroke="currentColor"
        strokeWidth="1.1"
        fill="none"
      />
    </svg>
  );
}

/* ----------------------------------- icons ---------------------------------- */

const S: CSSProperties = { display: "block" };
const stroke = { stroke: "currentColor", strokeWidth: 1.2, fill: "none" } as const;

export const Icons = {
  flat: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="4" y="8" width="26" height="14" {...stroke} />
      <line x1="2" y1="8" x2="32" y2="8" {...stroke} />
    </svg>
  ),
  skylights: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="4" y="8" width="26" height="14" {...stroke} />
      <line x1="2" y1="8" x2="32" y2="8" {...stroke} />
      <rect x="8" y="4" width="5" height="3" {...stroke} />
      <rect x="15" y="4" width="5" height="3" {...stroke} />
      <rect x="22" y="4" width="5" height="3" {...stroke} />
    </svg>
  ),
  pitched: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="4" y="11" width="26" height="11" {...stroke} />
      <path d="M4 4 L30 11" {...stroke} />
      <line x1="4" y1="4" x2="4" y2="11" {...stroke} />
    </svg>
  ),
  french: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="11" y="3" width="6" height="20" {...stroke} />
      <rect x="17" y="3" width="6" height="20" {...stroke} />
    </svg>
  ),
  sliding: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="5" y="3" width="8" height="20" {...stroke} />
      <rect x="13" y="3" width="8" height="20" {...stroke} />
      <rect x="21" y="3" width="8" height="20" {...stroke} />
      <path d="M24 13 l3 0 m-1.2 -1.4 l1.4 1.4 l-1.4 1.4" {...stroke} />
    </svg>
  ),
  bifold: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <path d="M4 23 L8 3 L12 23 L16 3 L20 23 L24 3 L28 23" {...stroke} />
      <line x1="4" y1="23" x2="28" y2="23" {...stroke} />
    </svg>
  ),
  loftNone: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <path d="M5 13 L17 4 L29 13" {...stroke} />
      <rect x="8" y="13" width="18" height="9" {...stroke} />
    </svg>
  ),
  velux: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <path d="M5 13 L17 4 L29 13" {...stroke} />
      <rect x="8" y="13" width="18" height="9" {...stroke} />
      <rect x="11" y="7.2" width="4" height="3.4" transform="rotate(-37 13 9)" {...stroke} />
      <rect x="19" y="7.2" width="4" height="3.4" transform="rotate(-37 21 9)" {...stroke} />
    </svg>
  ),
  dormer: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <path d="M5 13 L17 4 L29 13" {...stroke} />
      <rect x="8" y="13" width="18" height="9" {...stroke} />
      <rect x="13" y="6.5" width="8" height="6.5" {...stroke} />
      <line x1="13" y1="6.5" x2="21" y2="6.5" {...stroke} />
    </svg>
  ),
  mansard: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <path d="M6 13 L9 4 L25 4 L28 13" {...stroke} />
      <rect x="8" y="13" width="18" height="9" {...stroke} />
      <rect x="12" y="6.5" width="3.4" height="4" {...stroke} />
      <rect x="18.5" y="6.5" width="3.4" height="4" {...stroke} />
    </svg>
  ),
  hipToGable: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <path d="M5 13 L11 4 L29 4 L29 13" {...stroke} />
      <rect x="8" y="13" width="18" height="9" {...stroke} />
      <rect x="23" y="6.5" width="4" height="4.5" {...stroke} />
    </svg>
  ),
} satisfies Record<string, ReactNode>;
