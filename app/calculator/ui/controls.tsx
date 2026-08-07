"use client";

import { CSSProperties, ReactNode, useState } from "react";

export const ACCENT = "#b8944e";
export const FG = "#1a1916";
export const MUTED = "rgba(26, 25, 22, 0.55)";
export const FAINT = "rgba(26, 25, 22, 0.4)";
export const GHOST = "rgba(26, 25, 22, 0.08)";
export const LINE = "rgba(26, 25, 22, 0.12)";

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

/* ----------------------------------- slider --------------------------------- */

/**
 * Hairline range slider with a Didone read-out — used for the continuous
 * dimensions the pricing guide takes as inputs (extension depth, loft depth).
 */
export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  readout,
  caption,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** the headline figure, e.g. "4.0 m" */
  readout: string;
  /** the derived line underneath, e.g. "26.4 m² gross internal area" */
  caption?: string;
  label: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-bodoni)",
            fontWeight: 600,
            fontSize: 22,
            color: FG,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {readout}
        </span>
        {caption && (
          <span
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 300,
              fontSize: 11.5,
              letterSpacing: "0.06em",
              color: MUTED,
            }}
          >
            {caption}
          </span>
        )}
      </div>
      <input
        className="calc-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={
          {
            width: "100%",
            "--calc-slider-pct": `${pct}%`,
          } as CSSProperties
        }
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontFamily: "var(--font-outfit)",
          fontWeight: 300,
          fontSize: 10,
          letterSpacing: "0.14em",
          color: FAINT,
        }}
      >
        <span>{min} m</span>
        <span>{max} m</span>
      </div>
    </div>
  );
}

/* -------------------------------- number field ------------------------------ */

/**
 * Numeric entry that commits on blur or Enter rather than per keystroke —
 * clamping mid-typing would fight the user (typing "40" would snap at "4").
 */
export function NumberField({
  value,
  min,
  max,
  suffix,
  label,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  suffix: string;
  label: string;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [seen, setSeen] = useState(value);

  // follow the value when something else changes it — e.g. the depth slider.
  // Adjusted during render rather than in an effect, so the field never paints
  // a stale figure first.
  if (value !== seen) {
    setSeen(value);
    setDraft(String(value));
  }

  const commit = () => {
    const n = Number(draft.replace(",", "."));
    if (draft.trim() === "" || !Number.isFinite(n)) {
      setDraft(String(value));
      return;
    }
    onCommit(Math.min(max, Math.max(min, n)));
  };

  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: `1px solid ${LINE}`,
        padding: "9px 12px",
        cursor: "text",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-outfit)",
          fontWeight: 300,
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: FAINT,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <input
        value={draft}
        inputMode="decimal"
        aria-label={`${label} in ${suffix}`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        style={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          textAlign: "right",
          fontFamily: "var(--font-bodoni)",
          fontWeight: 600,
          fontSize: 16,
          color: FG,
          fontVariantNumeric: "tabular-nums",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-outfit)",
          fontWeight: 300,
          fontSize: 12,
          color: MUTED,
        }}
      >
        {suffix}
      </span>
    </label>
  );
}

/* ----------------------------------- toggle --------------------------------- */

/** Hairline switch for including or omitting a whole project. */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: "12px 14px",
        textAlign: "left",
        cursor: "pointer",
        background: checked ? "rgba(201,169,110,0.06)" : "transparent",
        border: `1px solid ${checked ? "rgba(201,169,110,0.65)" : LINE}`,
        transition: "all 0.3s ease",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "relative",
          width: 34,
          height: 18,
          flexShrink: 0,
          borderRadius: 9,
          border: `1px solid ${checked ? ACCENT : "rgba(26,25,22,0.25)"}`,
          background: checked ? "rgba(201,169,110,0.22)" : "transparent",
          transition: "all 0.3s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 18 : 3,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: checked ? ACCENT : "rgba(26,25,22,0.35)",
            transition: "all 0.3s ease",
          }}
        />
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: 400,
            fontSize: 13,
            color: checked ? FG : MUTED,
          }}
        >
          {label}
        </span>
        {hint && (
          <span
            style={{
              fontFamily: "var(--font-outfit)",
              fontWeight: 300,
              fontSize: 11,
              letterSpacing: "0.05em",
              color: FAINT,
            }}
          >
            {hint}
          </span>
        )}
      </span>
    </button>
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
  black: { background: "#16181a" },
  anthracite: { background: "#3f4449" },
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
                border: active ? `1px solid ${ACCENT}` : "1px solid rgba(26,25,22,0.14)",
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
  /** flat uplift; omit when the option is priced some other way */
  price?: number;
  /** shown in place of the price tag, e.g. a per-metre rate */
  meta?: string;
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
            <span style={{ color: active ? ACCENT : "rgba(26,25,22,0.45)" }}>{o.icon}</span>
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
                color: o.meta || o.price ? ACCENT : FAINT,
                minHeight: 12,
              }}
            >
              {o.meta ?? (o.price === undefined ? "" : priceTag(o.price))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- tier picker -------------------------------- */

interface TierOptionView {
  id: string;
  label: string;
  description: string;
  /** the £/m² band this tier commands in the current zone */
  rate: string;
}

/** Two stacked cards showing what each specification level costs per m². */
export function TierPicker({
  options,
  value,
  onChange,
}: {
  options: TierOptionView[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              textAlign: "left",
              padding: "13px 15px",
              cursor: "pointer",
              border: `1px solid ${active ? "rgba(201,169,110,0.65)" : LINE}`,
              background: active ? "rgba(201,169,110,0.06)" : "transparent",
              transition: "all 0.3s ease",
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
              <span
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 400,
                  fontSize: 13.5,
                  color: active ? FG : MUTED,
                }}
              >
                {o.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 300,
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: FAINT,
                }}
              >
                {o.description}
              </span>
            </span>
            <span
              style={{
                fontFamily: "var(--font-bodoni)",
                fontWeight: 500,
                fontSize: 12.5,
                whiteSpace: "nowrap",
                color: active ? ACCENT : MUTED,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {o.rate}
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
  border: "1px solid rgba(26,25,22,0.2)",
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
  rooflights: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="4" y="8" width="26" height="14" {...stroke} />
      <line x1="2" y1="8" x2="32" y2="8" {...stroke} />
      <rect x="8" y="4" width="6" height="3" {...stroke} />
      <rect x="20" y="4" width="6" height="3" {...stroke} />
    </svg>
  ),
  lantern: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="4" y="8" width="26" height="14" {...stroke} />
      <line x1="2" y1="8" x2="32" y2="8" {...stroke} />
      <path d="M11 8 L17 3 L23 8" {...stroke} />
    </svg>
  ),
  pitched: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="4" y="11" width="26" height="11" {...stroke} />
      <path d="M4 4 L30 11" {...stroke} />
      <line x1="4" y1="4" x2="4" y2="11" {...stroke} />
      <rect x="12" y="5" width="4.6" height="3" transform="rotate(15 14 6.5)" {...stroke} />
    </svg>
  ),
  double: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="11" y="3" width="6" height="20" {...stroke} />
      <rect x="17" y="3" width="6" height="20" {...stroke} />
      <line x1="4" y1="23" x2="30" y2="23" {...stroke} />
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
  boxDormer: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <path d="M5 13 L17 4 L29 13" {...stroke} />
      <rect x="8" y="13" width="18" height="9" {...stroke} />
      <rect x="12" y="6" width="10" height="7" {...stroke} />
      <line x1="12" y1="6" x2="22" y2="6" {...stroke} />
    </svg>
  ),
  mansardDormer: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <path d="M6 13 L9 4 L25 4 L28 13" {...stroke} />
      <rect x="8" y="13" width="18" height="9" {...stroke} />
      <rect x="12" y="6.5" width="3.4" height="4" {...stroke} />
      <rect x="18.5" y="6.5" width="3.4" height="4" {...stroke} />
    </svg>
  ),
  // interior layouts, drawn as plans: bed symbols in rooms, hatched wet areas
  layoutA: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="4" y="4" width="26" height="18" {...stroke} />
      <rect x="12" y="8" width="10" height="10" {...stroke} />
      <line x1="12" y1="11" x2="22" y2="11" {...stroke} />
    </svg>
  ),
  layoutB: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="4" y="4" width="26" height="18" {...stroke} />
      <line x1="21" y1="4" x2="21" y2="22" {...stroke} />
      <rect x="8" y="8" width="9" height="10" {...stroke} />
      <line x1="8" y1="11" x2="17" y2="11" {...stroke} />
      <circle cx="25.5" cy="12" r="2.4" {...stroke} />
    </svg>
  ),
  layoutC: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="4" y="4" width="26" height="18" {...stroke} />
      <line x1="17" y1="4" x2="17" y2="22" {...stroke} />
      <line x1="17" y1="15" x2="30" y2="15" {...stroke} />
      <rect x="7" y="8" width="7" height="9" {...stroke} />
      <line x1="7" y1="10.6" x2="14" y2="10.6" {...stroke} />
      <rect x="19.5" y="6" width="8" height="7" {...stroke} />
      <line x1="19.5" y1="8.2" x2="27.5" y2="8.2" {...stroke} />
    </svg>
  ),
  layoutD: (
    <svg width="34" height="26" viewBox="0 0 34 26" style={S}>
      <rect x="4" y="4" width="26" height="18" {...stroke} />
      <line x1="19" y1="4" x2="19" y2="22" {...stroke} />
      <line x1="19" y1="13" x2="30" y2="13" {...stroke} />
      <rect x="7" y="8" width="9" height="10" {...stroke} />
      <line x1="7" y1="11" x2="16" y2="11" {...stroke} />
      <circle cx="24.5" cy="8.5" r="2.1" {...stroke} />
      <line x1="21" y1="18" x2="28" y2="18" {...stroke} />
      <line x1="24.5" y1="18" x2="24.5" y2="21" {...stroke} />
    </svg>
  ),
} satisfies Record<string, ReactNode>;
