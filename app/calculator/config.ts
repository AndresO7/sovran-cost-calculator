// Single source of truth for the host house, options, dimensions and pricing.
// All prices are indicative London-premium construction costs (GBP).

export type SizeId = "S" | "M" | "L";
export type MaterialId =
  | "render"
  | "redBrick"
  | "londonStock"
  | "charredTimber"
  | "zinc";
export type ExtRoofId = "rooflights" | "lantern" | "pitched";
export type GlazingId = "double" | "sliding" | "bifold";
export type LoftTypeId = "none" | "boxDormer" | "mansardDormer";
export type LoftFinishId = "slate" | "clay" | "zincRoof";

export const BASE_RATE_PER_SQM = 3200;

/** The single host property every project is modelled on. */
export const HOUSE = {
  label: "The Sovran House",
  sub: "Brick semi · London",
  /** width across the rear facade, metres */
  w: 6.6,
  /** depth front-to-back, metres */
  d: 7.4,
};

export interface SizeOption {
  label: string;
  /** width across the rear of the house, metres */
  w: number;
  /** depth into the garden, metres */
  d: number;
  /** floor area in m² */
  area: number;
  description: string;
}

/** The extension always spans the full width of the house — sizes vary depth. */
export const SIZES: Record<SizeId, SizeOption> = {
  S: { label: "S", w: 6.6, d: 3, area: 20, description: "Full-width rear · 3m deep" },
  M: { label: "M", w: 6.6, d: 4, area: 26, description: "Full-width rear · 4m deep" },
  L: { label: "L", w: 6.6, d: 5, area: 33, description: "Full-width rear · 5m deep" },
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
  rooflights: { label: "Rooflights", price: 0 },
  lantern: { label: "Roof lantern", price: 4800 },
  pitched: { label: "Pitched slate", price: 6800 },
};

export const GLAZING: Record<GlazingId, PricedOption> = {
  double: { label: "Double doors", price: 0 },
  sliding: { label: "Sliding doors", price: 4200 },
  bifold: { label: "Bifold doors", price: 6400 },
};

export const LOFT_TYPES: Record<LoftTypeId, PricedOption> = {
  none: { label: "No loft", price: 0 },
  boxDormer: { label: "Box dormer", price: 68000 },
  mansardDormer: { label: "Mansard dormer", price: 95000 },
};

/** Whole-roof finish — re-roofs the main roof and clads the dormer. */
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
