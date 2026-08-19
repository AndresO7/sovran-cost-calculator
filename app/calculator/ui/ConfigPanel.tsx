"use client";

import {
  areaExceedsModel,
  DormerId,
  EXT_AREA,
  EXT_DEPTH,
  EXT_FRAMES,
  EXT_RATES,
  EXT_ROOFS,
  ExtRoofId,
  FrameId,
  GLAZING,
  GlazingId,
  HOUSE,
  LOFT_DEPTH,
  LOFT_FINISHES,
  LOFT_FRAMES,
  LOFT_LAYOUTS,
  LOFT_RATES,
  LOFT_TYPES,
  LoftFinishId,
  LoftLayoutId,
  LoftTypeId,
  MATERIALS,
  MaterialId,
  TIERS,
  TierId,
} from "../config";
import { formatExactRange, PriceBreakdown, PriceRange } from "../pricing";
import { CalculatorAction, CalculatorState, TabId } from "../state";
import {
  ACCENT,
  FAINT,
  FG,
  Icons,
  LINE,
  MUTED,
  NumberField,
  OptionGrid,
  Section,
  Slider,
  SwatchRow,
  TierPicker,
  Toggle,
} from "./controls";

const LOFT_ICONS: Record<LoftTypeId, React.ReactNode> = {
  none: Icons.loftNone,
  boxDormer: Icons.boxDormer,
  mansardDormer: Icons.mansardDormer,
};

const LAYOUT_ICONS: Record<LoftLayoutId, React.ReactNode> = {
  a: Icons.layoutA,
  b: Icons.layoutB,
  c: Icons.layoutC,
  d: Icons.layoutD,
};

const note: React.CSSProperties = {
  fontFamily: "var(--font-outfit)",
  fontWeight: 300,
  fontSize: 11,
  lineHeight: 1.7,
  color: FAINT,
  marginTop: 12,
};

/**
 * Live subtotal for one project, sat right under the control that drives it —
 * without it the sliders feel inert, because the only figure that responds is
 * up in the top bar.
 */
function Subtotal({ label, range }: { label: string; range: PriceRange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 14,
        paddingTop: 12,
        borderTop: `1px solid ${LINE}`,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-outfit)",
          fontWeight: 300,
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: FAINT,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-bodoni)",
          fontWeight: 600,
          fontSize: 14,
          color: ACCENT,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {formatExactRange(range)}
      </span>
    </div>
  );
}

export function ConfigPanel({
  state,
  price,
  dispatch,
}: {
  state: CalculatorState;
  price: PriceBreakdown;
  dispatch: React.Dispatch<CalculatorAction>;
}) {
  const tab = state.activeTab;
  const zone = state.location.zone;
  const { enabled } = state.ground;
  const hasLoft = state.loft.type !== "none";

  return (
    <aside
      className="calc-panel"
      style={{
        background: "#f8f6f3",
        borderLeft: `1px solid ${LINE}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
        {(["ground", "loft"] as TabId[]).map((t, i) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => dispatch({ type: "SET_TAB", tab: t })}
              aria-pressed={active}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: 8,
                padding: "17px 8px 14px",
                fontFamily: "var(--font-outfit)",
                fontWeight: active ? 400 : 300,
                fontSize: "clamp(10px, 0.85vw, 12px)",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: active ? FG : MUTED,
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${active ? ACCENT : "transparent"}`,
                marginBottom: -1,
                cursor: "pointer",
                transition: "all 0.35s ease",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-bodoni)",
                  fontStyle: "italic",
                  fontSize: 11,
                  color: active ? ACCENT : FAINT,
                  letterSpacing: 0,
                }}
              >
                0{i + 1}
              </span>
              {t === "ground" ? "Ground" : "Loft & Roof"}
            </button>
          );
        })}
      </div>

      {/* scrollable options */}
      <div
        key={tab}
        className="calc-panel-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "2px clamp(20px, 2vw, 32px) 20px",
          animation: "panelFade 0.45s ease both",
        }}
      >
        {tab === "ground" ? (
          <>
            <Section index="01" label="Rear extension">
              <Toggle
                checked={enabled}
                onChange={(v) => dispatch({ type: "SET_GROUND_ENABLED", enabled: v })}
                label={enabled ? "Included in this project" : "Not included"}
                hint={
                  enabled
                    ? "Full-width, reaching into the garden"
                    : "Switch on to add a rear extension"
                }
              />
            </Section>

            {enabled && (
              <>
                <Section index="02" label="Specification">
                  <TierPicker
                    options={(Object.keys(TIERS) as TierId[]).map((id) => ({
                      id,
                      label: TIERS[id].label,
                      description: TIERS[id].description,
                      rate: `£${EXT_RATES[id][zone].low.toLocaleString(
                        "en-GB"
                      )}–${EXT_RATES[id][zone].high.toLocaleString("en-GB")} / m²`,
                    }))}
                    value={state.ground.tier}
                    onChange={(id) => dispatch({ type: "SET_TIER", tier: id as TierId })}
                  />
                  <p style={note}>
                    {state.ground.tier === "highEnd"
                      ? "Bronze reveals, a lit ceiling shadow gap, recessed uplighters and a flush drainage channel — shown on the model."
                      : "High end adds bronze reveals, feature lighting and concealed drainage to the same structure."}
                  </p>
                </Section>

                <Section index="03" label="Extension size">
                  <Slider
                    value={state.ground.depth}
                    min={EXT_DEPTH.min}
                    max={EXT_DEPTH.max}
                    step={EXT_DEPTH.step}
                    onChange={(depth) => dispatch({ type: "SET_DEPTH", depth })}
                    label="Extension depth into the garden, metres"
                    readout={`${state.ground.depth.toFixed(2).replace(/\.?0+$/, "")} m deep`}
                    caption={`${HOUSE.w.toFixed(1)} m wide`}
                  />
                  <div style={{ marginTop: 16 }}>
                    <NumberField
                      value={state.ground.area}
                      min={EXT_AREA.min}
                      max={EXT_AREA.max}
                      suffix="m²"
                      label="Floor area"
                      onCommit={(area) => dispatch({ type: "SET_AREA", area })}
                    />
                  </div>
                  <p style={note}>
                    {areaExceedsModel(state.ground.area)
                      ? `Priced on ${state.ground.area} m². That is deeper than the model can draw, so the drawing stays at ${EXT_DEPTH.max} m — the estimate uses your figure.`
                      : "The extension spans the full width of the house, so the depth sets the area. Enter the area directly if you already know it."}
                  </p>
                  {price.extension && (
                    <Subtotal label="Extension" range={price.extension} />
                  )}
                </Section>

                <Section index="04" label="External finish">
                  <SwatchRow
                    options={(Object.keys(MATERIALS) as MaterialId[]).map((id) => ({
                      id,
                      label: MATERIALS[id].label,
                      price: MATERIALS[id].price,
                    }))}
                    value={state.ground.material}
                    onChange={(id) =>
                      dispatch({ type: "SET_MATERIAL", material: id as MaterialId })
                    }
                  />
                </Section>

                <Section index="05" label="Extension roof">
                  <OptionGrid
                    columns={2}
                    options={(Object.keys(EXT_ROOFS) as ExtRoofId[]).map((id) => ({
                      id,
                      label: EXT_ROOFS[id].label,
                      price: EXT_ROOFS[id].price,
                      icon: Icons[id],
                    }))}
                    value={state.ground.roof}
                    onChange={(id) =>
                      dispatch({ type: "SET_EXT_ROOF", roof: id as ExtRoofId })
                    }
                  />
                </Section>

                <Section index="06" label="Garden doors">
                  <OptionGrid
                    options={(Object.keys(GLAZING) as GlazingId[]).map((id) => ({
                      id,
                      label: GLAZING[id].label,
                      price: GLAZING[id].price,
                      icon: Icons[id],
                    }))}
                    value={state.ground.glazing}
                    onChange={(id) =>
                      dispatch({ type: "SET_GLAZING", glazing: id as GlazingId })
                    }
                  />
                </Section>

                <Section index="07" label="Window frame colour">
                  <SwatchRow
                    options={(Object.keys(EXT_FRAMES) as FrameId[]).map((id) => ({
                      id,
                      label: EXT_FRAMES[id].label,
                      price: EXT_FRAMES[id].price,
                    }))}
                    value={state.ground.frame}
                    onChange={(id) => dispatch({ type: "SET_FRAME", frame: id as FrameId })}
                  />
                </Section>
              </>
            )}
          </>
        ) : (
          <>
            <Section index="01" label="Loft conversion">
              <OptionGrid
                options={(Object.keys(LOFT_TYPES) as LoftTypeId[]).map((id) => ({
                  id,
                  label: LOFT_TYPES[id].label,
                  icon: LOFT_ICONS[id],
                  meta:
                    id === "none"
                      ? ""
                      : `£${LOFT_RATES[id as DormerId][
                          zone
                        ].toLocaleString("en-GB")} / m`,
                }))}
                value={state.loft.type}
                onChange={(id) =>
                  dispatch({ type: "SET_LOFT_TYPE", loftType: id as LoftTypeId })
                }
              />
            </Section>

            {hasLoft && (
              <>
                <Section index="02" label="House depth">
                  <Slider
                    value={state.loft.depth}
                    min={LOFT_DEPTH.min}
                    max={LOFT_DEPTH.max}
                    step={LOFT_DEPTH.step}
                    onChange={(depth) => dispatch({ type: "SET_LOFT_DEPTH", depth })}
                    label="Depth of the house front to back, metres"
                    readout={`${state.loft.depth.toFixed(1)} m`}
                    caption="front to back"
                  />
                  <p style={note}>
                    Loft conversions are priced per metre of house depth —
                    measure from the front wall to the rear. The model resizes
                    with it.
                  </p>
                  {price.loft && <Subtotal label="Loft" range={price.loft} />}
                </Section>

                <Section index="03" label="Interior layout">
                  <OptionGrid
                    columns={2}
                    options={(Object.keys(LOFT_LAYOUTS) as LoftLayoutId[]).map((id) => ({
                      id,
                      label: `${LOFT_LAYOUTS[id].note} — ${LOFT_LAYOUTS[id].label}`,
                      price: LOFT_LAYOUTS[id].price,
                      icon: LAYOUT_ICONS[id],
                    }))}
                    value={state.loft.layout}
                    onChange={(id) =>
                      dispatch({ type: "SET_LOFT_LAYOUT", layout: id as LoftLayoutId })
                    }
                  />
                </Section>

                <Section index="04" label="Window frame colour">
                  <SwatchRow
                    options={(Object.keys(LOFT_FRAMES) as FrameId[]).map((id) => ({
                      id,
                      label: LOFT_FRAMES[id].label,
                      price: LOFT_FRAMES[id].price,
                    }))}
                    value={state.loft.frame}
                    onChange={(id) =>
                      dispatch({ type: "SET_LOFT_FRAME", frame: id as FrameId })
                    }
                  />
                </Section>
              </>
            )}

            <Section index={hasLoft ? "05" : "02"} label="Roof finish — main roof">
              <SwatchRow
                options={(Object.keys(LOFT_FINISHES) as LoftFinishId[]).map((id) => ({
                  id,
                  label: LOFT_FINISHES[id].label,
                  price: LOFT_FINISHES[id].price,
                }))}
                value={state.loft.finish}
                onChange={(id) =>
                  dispatch({ type: "SET_LOFT_FINISH", finish: id as LoftFinishId })
                }
              />
              <p style={note}>
                Applied to the main roof slopes. Dormer cladding and extension
                roofing stay in standard grey. Shown for context; roofing is
                quoted separately.
              </p>
            </Section>
          </>
        )}

        {/* small print */}
        <p
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: 300,
            fontSize: 11,
            lineHeight: 1.75,
            color: FAINT,
            paddingTop: 20,
          }}
        >
          {`Construction estimate only, based on ${
            zone === "zone1" ? "prime inner London" : "Greater London"
          } build rates. Design & planning fees quoted separately.`}
        </p>
      </div>
    </aside>
  );
}
