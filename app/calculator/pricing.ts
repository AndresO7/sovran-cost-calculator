import {
  DormerId,
  EXT_FRAMES,
  EXT_RATES,
  EXT_ROOFS,
  GLAZING,
  LOFT_BUFFER,
  LOFT_FRAMES,
  LOFT_LAYOUTS,
  LOFT_RATES,
  MATERIALS,
} from "./config";
import { CalculatorState } from "./state";
import { ZoneId } from "./zones";

export interface PriceRange {
  low: number;
  high: number;
}

export interface PriceBreakdown {
  zone: ZoneId;
  /** null when the extension is switched off */
  extension: PriceRange | null;
  /** null when there is no loft conversion */
  loft: PriceRange | null;
  total: PriceRange;
}

const EMPTY: PriceRange = { low: 0, high: 0 };

const add = (a: PriceRange, b: PriceRange): PriceRange => ({
  low: a.low + b.low,
  high: a.high + b.high,
});

/**
 * Rear extension: a rate range multiplied by the area, with flat uplifts
 * added to both ends of the range.
 */
export function priceExtension(
  state: CalculatorState,
  zone: ZoneId
): PriceRange | null {
  if (!state.ground.enabled) return null;

  const { tier, area, material, roof, glazing, frame } = state.ground;
  const rate = EXT_RATES[tier][zone];
  const uplifts =
    MATERIALS[material].price +
    EXT_ROOFS[roof].price +
    GLAZING[glazing].price +
    EXT_FRAMES[frame].price;

  return {
    low: rate.low * area + uplifts,
    high: rate.high * area + uplifts,
  };
}

/**
 * Loft conversion: depth × rate gives a single base figure, a ±15% buffer
 * turns it into a range, then uplifts are added to both ends.
 */
export function priceLoft(
  state: CalculatorState,
  zone: ZoneId
): PriceRange | null {
  if (state.loft.type === "none") return null;

  const { type, depth, layout, frame } = state.loft;
  const base = depth * LOFT_RATES[type as DormerId][zone];
  const uplifts = LOFT_LAYOUTS[layout].price + LOFT_FRAMES[frame].price;

  return {
    low: base * (1 - LOFT_BUFFER) + uplifts,
    high: base * (1 + LOFT_BUFFER) + uplifts,
  };
}

export function calculatePrice(state: CalculatorState): PriceBreakdown {
  const zone = state.location.zone;
  const extension = priceExtension(state, zone);
  const loft = priceLoft(state, zone);

  return {
    zone,
    extension,
    loft,
    total: add(extension ?? EMPTY, loft ?? EMPTY),
  };
}

/** Formats 71000 → "£71K", 1230000 → "£1.2M". */
export function formatPrice(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const rounded = Math.round(m * 10) / 10;
    return `£${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}M`;
  }
  return `£${Math.round(n / 1000)}K`;
}

export function formatRange(range: PriceRange): string {
  return `${formatPrice(range.low)} – ${formatPrice(range.high)}`;
}

/** Exact figure for the quote summary, e.g. "£64,000". */
export function formatExact(n: number): string {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

export function formatExactRange(range: PriceRange): string {
  return `${formatExact(range.low)} – ${formatExact(range.high)}`;
}
