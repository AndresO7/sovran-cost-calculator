"use client";

import {
  EXT_ROOFS,
  ExtRoofId,
  FRAMES,
  FrameId,
  GLAZING,
  GlazingId,
  LOFT_FINISHES,
  LOFT_TYPES,
  LoftFinishId,
  LoftTypeId,
  MATERIALS,
  MaterialId,
  PATIOS,
  PatioId,
  SIZES,
  SizeId,
} from "../config";
import { CalculatorAction, CalculatorState, TabId } from "../state";
import {
  ACCENT,
  FAINT,
  FG,
  Icons,
  LINE,
  MUTED,
  OptionGrid,
  Section,
  SizePicker,
  SwatchRow,
} from "./controls";

const LOFT_ICONS: Record<LoftTypeId, React.ReactNode> = {
  none: Icons.loftNone,
  boxDormer: Icons.boxDormer,
  mansardDormer: Icons.mansardDormer,
};

export function ConfigPanel({
  state,
  dispatch,
}: {
  state: CalculatorState;
  dispatch: React.Dispatch<CalculatorAction>;
}) {
  const tab = state.activeTab;

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
            <Section index="01" label="Extension size">
              <SizePicker
                options={(Object.keys(SIZES) as SizeId[]).map((id) => ({
                  id,
                  label: SIZES[id].label,
                  description: SIZES[id].description,
                  area: SIZES[id].area,
                }))}
                value={state.ground.size}
                onChange={(id) => dispatch({ type: "SET_SIZE", size: id as SizeId })}
              />
            </Section>

            <Section index="02" label="External finish">
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

            <Section index="03" label="Extension roof">
              <OptionGrid
                options={(Object.keys(EXT_ROOFS) as ExtRoofId[]).map((id) => ({
                  id,
                  label: EXT_ROOFS[id].label,
                  price: EXT_ROOFS[id].price,
                  icon: Icons[id],
                }))}
                value={state.ground.roof}
                onChange={(id) => dispatch({ type: "SET_EXT_ROOF", roof: id as ExtRoofId })}
              />
            </Section>

            <Section index="04" label="Garden doors">
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

            <Section index="05" label="Joinery colour">
              <SwatchRow
                options={(Object.keys(FRAMES) as FrameId[]).map((id) => ({
                  id,
                  label: FRAMES[id].label,
                  price: FRAMES[id].price,
                }))}
                value={state.ground.frame}
                onChange={(id) => dispatch({ type: "SET_FRAME", frame: id as FrameId })}
              />
            </Section>

            <Section index="06" label="Patio finish">
              <SwatchRow
                options={(Object.keys(PATIOS) as PatioId[]).map((id) => ({
                  id,
                  label: PATIOS[id].label,
                  price: PATIOS[id].price,
                }))}
                value={state.ground.patio}
                onChange={(id) => dispatch({ type: "SET_PATIO", patio: id as PatioId })}
              />
            </Section>
          </>
        ) : (
          <>
            <Section index="01" label="Loft conversion">
              <OptionGrid
                options={(Object.keys(LOFT_TYPES) as LoftTypeId[]).map((id) => ({
                  id,
                  label: LOFT_TYPES[id].label,
                  price: LOFT_TYPES[id].price,
                  icon: LOFT_ICONS[id],
                }))}
                value={state.loft.type}
                onChange={(id) =>
                  dispatch({ type: "SET_LOFT_TYPE", loftType: id as LoftTypeId })
                }
              />
            </Section>

            <Section index="02" label="Roof finish — full re-roof">
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
              <p
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontWeight: 300,
                  fontSize: 11,
                  lineHeight: 1.7,
                  color: FAINT,
                  marginTop: 12,
                }}
              >
                Applied across the entire roof — main slopes and dormer
                cladding.
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
          Construction estimate only, based on premium London build rates.
          Design &amp; planning fees quoted separately.
        </p>
      </div>
    </aside>
  );
}
