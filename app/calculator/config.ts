// Single source of truth for prototypes, options, dimensions and pricing.
// All prices are indicative London-premium construction costs (GBP).

export type PrototypeId = "townhouse" | "villa";
export type SizeId = "S" | "M" | "L";
export type MaterialId =
  | "render"
  | "redBrick"
  | "londonStock"
  | "charredTimber"
  | "zinc";
export type ExtRoofId = "flat" | "skylights" | "pitched";
export type GlazingId = "french" | "sliding" | "bifold";
export type LoftTypeId = "none" | "velux" | "dormer" | "mansard" | "hipToGable";
export type LoftFinishId = "slate" | "clay" | "zincRoof";

export const BASE_RATE_PER_SQM = 3200;

export interface SizeOption {
  label: string;
  /** width across the rear of the house, metres */
  w: number;
  /** depth into the garden, metres */
  d: number;
  /** floor area in m² (includes side-return for wrap-around) */
  area: number;
  description: string;
  /** villa L only: adds a side-return wrap */
  wrap?: boolean;
}

export interface PrototypeDef {
  label: string;
  sub: string;
  sizes: Record<SizeId, SizeOption>;
  loftTypes: LoftTypeId[];
}

export const PROTOTYPES: Record<PrototypeId, PrototypeDef> = {
  townhouse: {
    label: "The Townhouse",
    sub: "Victorian · Chelsea",
    sizes: {
      S: { label: "S", w: 3, d: 4, area: 12, description: "Compact rear · 3m × 4m" },
      M: { label: "M", w: 4, d: 5, area: 20, description: "Full-width rear · 4m × 5m" },
      L: { label: "L", w: 4, d: 7, area: 28, description: "Extended rear · 4m × 7m" },
    },
    loftTypes: ["none", "velux", "dormer", "mansard"],
  },
  villa: {
    label: "The Villa",
    sub: "Detached · Hampstead",
    sizes: {
      S: { label: "S", w: 4, d: 4, area: 16, description: "Garden room · 4m × 4m" },
      M: { label: "M", w: 6, d: 4, area: 24, description: "Full-width rear · 6m × 4m" },
      L: {
        label: "L",
        w: 6,
        d: 4,
        area: 36,
        description: "Wrap-around · 36m²",
        wrap: true,
      },
    },
    loftTypes: ["none", "velux", "dormer", "hipToGable"],
  },
};

export interface PricedOption {
  label: string;
  price: number;
}

export const MATERIALS: Record<MaterialId, PricedOption> = {
  render: { label: "White render", price: 0 },
  redBrick: { label: "Red brick", price: 1800 },
  londonStock: { label: "London stock", price: 2600 },
  charredTimber: { label: "Charred timber", price: 3400 },
  zinc: { label: "Zinc cladding", price: 4800 },
};

export const EXT_ROOFS: Record<ExtRoofId, PricedOption> = {
  flat: { label: "Flat roof", price: 0 },
  skylights: { label: "Flat + skylights", price: 3600 },
  pitched: { label: "Pitched slate", price: 6800 },
};

export const GLAZING: Record<GlazingId, PricedOption> = {
  french: { label: "French doors", price: 0 },
  sliding: { label: "Sliding doors", price: 4200 },
  bifold: { label: "Bifold doors", price: 6400 },
};

export const LOFT_TYPES: Record<LoftTypeId, PricedOption> = {
  none: { label: "No loft", price: 0 },
  velux: { label: "Velux only", price: 42000 },
  dormer: { label: "Flat dormer", price: 68000 },
  mansard: { label: "Mansard", price: 95000 },
  hipToGable: { label: "Hip-to-gable", price: 85000 },
};

/** Whole-roof finish — re-roofs the main roof, loft and pitched extension. */
export const LOFT_FINISHES: Record<LoftFinishId, PricedOption> = {
  slate: { label: "Welsh slate", price: 0 },
  clay: { label: "Clay tiles", price: 8500 },
  zincRoof: { label: "Zinc seam", price: 14500 },
};

export type FrameId = "anthracite" | "bronze" | "white";

export const FRAMES: Record<FrameId, PricedOption & { color: string }> = {
  anthracite: { label: "Anthracite", price: 0, color: "#2b2e33" },
  bronze: { label: "Bronze", price: 1400, color: "#6d5839" },
  white: { label: "Soft white", price: 600, color: "#e6e0d4" },
};

export type PatioId = "york" | "porcelain" | "decking";

export const PATIOS: Record<PatioId, PricedOption> = {
  york: { label: "York stone", price: 0 },
  porcelain: { label: "Porcelain", price: 2200 },
  decking: { label: "Hardwood deck", price: 1800 },
};

/** Premium loft option equivalence when switching prototype. */
export const LOFT_SWAP: Partial<Record<LoftTypeId, LoftTypeId>> = {
  mansard: "hipToGable",
  hipToGable: "mansard",
};
