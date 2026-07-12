import {
  BASE_RATE_PER_SQM,
  EXT_ROOFS,
  FRAMES,
  GLAZING,
  LOFT_FINISHES,
  LOFT_TYPES,
  MATERIALS,
  PATIOS,
  SIZES,
} from "./config";
import { CalculatorState } from "./state";

export interface PriceRange {
  /** mid-point estimate, GBP */
  total: number;
  /** total × 0.92, rounded to nearest £1k */
  low: number;
  /** total × 1.08, rounded to nearest £1k */
  high: number;
}

const roundToK = (n: number) => Math.round(n / 1000) * 1000;

export function calculatePrice(state: CalculatorState): PriceRange {
  const size = SIZES[state.ground.size];
  let total = size.area * BASE_RATE_PER_SQM;
  total += MATERIALS[state.ground.material].price;
  total += EXT_ROOFS[state.ground.roof].price;
  total += GLAZING[state.ground.glazing].price;
  total += FRAMES[state.ground.frame].price;
  total += PATIOS[state.ground.patio].price;
  total += LOFT_TYPES[state.loft.type].price;
  // roof finish re-roofs the whole house, priced independently of the loft
  total += LOFT_FINISHES[state.loft.finish].price;
  return {
    total,
    low: roundToK(total * 0.92),
    high: roundToK(total * 1.08),
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
  return `£${n.toLocaleString("en-GB")}`;
}
