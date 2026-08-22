// Single source of truth for the host house, options, dimensions and pricing.
// Every figure below comes from the Sovran "Cost Calculator — Pricing Logic"
// guide. Rates are GBP and depend on the location zone derived from the
// property postcode (see zones.ts).

import { ZoneId } from "./zones";

export type TierId = "standard" | "highEnd";
export type MaterialId =
  | "render"
  | "londonStock"
  | "redBrick"
  | "charredTimber"
  | "zinc";
export type ExtRoofId = "flat" | "rooflights" | "lantern" | "pitched";
export type GlazingId = "double" | "bifold" | "sliding";
export type LoftTypeId = "none" | "boxDormer" | "mansardDormer";
export type LoftLayoutId = "a" | "b" | "c" | "d";
export type FrameId = "black" | "white" | "anthracite" | "bronze";

/** The single host property every project is modelled on. */
export const HOUSE = {
  label: "Sovran House",
  sub: "Brick semi · London",
  /** width across the rear facade, metres */
  w: 6.6,
  /** depth front-to-back, metres */
  d: 7.4,
};

export interface PricedOption {
  label: string;
  price: number;
}

export interface RateRange {
  low: number;
  high: number;
}

/* --------------------------------- extension -------------------------------- */

/** £ per m², by specification tier and zone. */
export const EXT_RATES: Record<TierId, Record<ZoneId, RateRange>> = {
  standard: {
    zone1: { low: 2200, high: 2600 },
    zone2: { low: 1700, high: 2000 },
  },
  highEnd: {
    zone1: { low: 2800, high: 3400 },
    zone2: { low: 2200, high: 2600 },
  },
};

export const TIERS: Record<TierId, { label: string; description: string }> = {
  standard: {
    label: "Standard",
    description: "Quality build, well-specified throughout",
  },
  highEnd: {
    label: "High end",
    description: "Bronze detailing, feature lighting, concealed drainage",
  },
};

/**
 * The extension always spans the full width of the house — the user varies
 * how far it reaches into the garden, and the area follows.
 */
export const EXT_DEPTH = { min: 2, max: 5, step: 0.25, default: 4 };

/**
 * The guide prices on area, so area is what the estimate is built from and
 * it can be entered directly. The depth slider is a convenience that writes
 * to it; beyond what the model can draw the two stop agreeing, and the area
 * is the one that counts.
 */
export const EXT_AREA = { min: 5, max: 200 };

/** Floor area of a full-width extension at the given depth, m². */
export function extensionArea(depth: number): number {
  return Math.round(HOUSE.w * depth * 10) / 10;
}

/** True once the area outruns the deepest extension the model can show. */
export function areaExceedsModel(area: number): boolean {
  return area > extensionArea(EXT_DEPTH.max);
}

export const MATERIALS: Record<MaterialId, PricedOption> = {
  render: { label: "White render", price: 0 },
  londonStock: { label: "London stock brick", price: 1400 },
  redBrick: { label: "Red brick", price: 1800 },
  charredTimber: { label: "Timber cladding", price: 2200 },
  zinc: { label: "Zinc cladding", price: 3500 },
};

export const EXT_ROOFS: Record<ExtRoofId, PricedOption> = {
  flat: { label: "Flat roof", price: 0 },
  rooflights: { label: "Flat + rooflights", price: 2800 },
  lantern: { label: "Flat + lantern", price: 4500 },
  pitched: { label: "Single pitch", price: 1800 },
};

export const GLAZING: Record<GlazingId, PricedOption> = {
  double: { label: "Double doors", price: 0 },
  bifold: { label: "Bifold doors", price: 800 },
  sliding: { label: "Sliding doors", price: 1200 },
};

/* ----------------------------------- loft ----------------------------------- */

export type DormerId = Exclude<LoftTypeId, "none">;

/** £ per metre of loft depth, by dormer type and zone. */
export const LOFT_RATES: Record<DormerId, Record<ZoneId, number>> = {
  boxDormer: { zone1: 10000, zone2: 7500 },
  mansardDormer: { zone1: 12000, zone2: 9000 },
};

/** The ±buffer applied to the loft base figure to produce a range. */
export const LOFT_BUFFER = 0.15;

export const LOFT_TYPES: Record<LoftTypeId, { label: string }> = {
  none: { label: "No loft" },
  boxDormer: { label: "Box dormer" },
  mansardDormer: { label: "Mansard dormer" },
};

/** Loft depth is the front-to-back span of the house, in metres. */
export const LOFT_DEPTH = {
  min: 5,
  max: 10,
  step: 0.1,
  default: HOUSE.d,
};

export const LOFT_LAYOUTS: Record<LoftLayoutId, PricedOption & { note: string }> = {
  a: { label: "Bedroom only", price: 0, note: "A" },
  b: { label: "Bedroom + ensuite", price: 8500, note: "B" },
  c: { label: "2 bedrooms + ensuite", price: 14000, note: "C" },
  d: { label: "Bedroom + ensuite + office", price: 11000, note: "D" },
};

/* --------------------------------- joinery ---------------------------------- */

/**
 * Window frame colour is priced per project type — bronze carries a £600
 * uplift on an extension but £500 on a loft, so each keeps its own table.
 */
const FRAME_COLORS: Record<FrameId, string> = {
  black: "#16181a",
  white: "#e6e0d4",
  anthracite: "#3f4449",
  bronze: "#6d5839",
};

const frameTable = (
  prices: Record<FrameId, number>
): Record<FrameId, PricedOption & { color: string }> => ({
  black: { label: "Black", price: prices.black, color: FRAME_COLORS.black },
  white: { label: "White", price: prices.white, color: FRAME_COLORS.white },
  anthracite: {
    label: "Grey / anthracite",
    price: prices.anthracite,
    color: FRAME_COLORS.anthracite,
  },
  bronze: {
    label: "Brown / bronze",
    price: prices.bronze,
    color: FRAME_COLORS.bronze,
  },
});

export const EXT_FRAMES = frameTable({
  black: 0,
  white: 0,
  anthracite: 400,
  bronze: 600,
});

export const LOFT_FRAMES = frameTable({
  black: 0,
  white: 0,
  anthracite: 400,
  bronze: 500,
});
