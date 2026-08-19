import { describe, expect, it } from "vitest";
import { areaExceedsModel, EXT_DEPTH, HOUSE } from "../config";
import {
  calculatePrice,
  formatExact,
  formatExactRange,
  formatPrice,
  formatRange,
} from "../pricing";
import { CalculatorState, initialState, reducer } from "../state";

/** Zone 2, standard tier, 4m deep — the out-of-the-box configuration. */
const base: CalculatorState = {
  started: true,
  location: { postcode: "SW19 1AA", zone: "zone2", borough: "Merton", status: "ok" },
  ground: {
    enabled: true,
    tier: "standard",
    depth: 4,
    area: 26.4,
    material: "render",
    roof: "flat",
    glazing: "double",
    frame: "black",
  },
  loft: { type: "none", depth: 7.4, layout: "a", frame: "black", finish: "slate" },
  activeTab: "ground",
  quoteOpen: false,
};

const zone1 = (s: CalculatorState): CalculatorState => ({
  ...s,
  location: { ...s.location, zone: "zone1", borough: "Camden" },
});

/** A full-width 4m extension: 6.6m × 4m. */
const AREA = 26.4;

describe("extension pricing", () => {
  it("multiplies the Zone 2 standard rate range by the area", () => {
    const { extension } = calculatePrice(base);
    expect(extension!.low).toBeCloseTo(1700 * AREA, 6);
    expect(extension!.high).toBeCloseTo(2000 * AREA, 6);
  });

  it("uses the higher Zone 1 rates for a prime borough", () => {
    const { extension } = calculatePrice(zone1(base));
    expect(extension!.low).toBeCloseTo(2200 * AREA, 6);
    expect(extension!.high).toBeCloseTo(2600 * AREA, 6);
  });

  it("prices the high-end tier in both zones", () => {
    const highEnd = { ...base, ground: { ...base.ground, tier: "highEnd" as const } };
    const z2 = calculatePrice(highEnd).extension!;
    expect(z2.low).toBeCloseTo(2200 * AREA, 6);
    expect(z2.high).toBeCloseTo(2600 * AREA, 6);

    const z1 = calculatePrice(zone1(highEnd)).extension!;
    expect(z1.low).toBeCloseTo(2800 * AREA, 6);
    expect(z1.high).toBeCloseTo(3400 * AREA, 6);
  });

  it("scales with depth, always spanning the full width of the house", () => {
    const deep = reducer(base, { type: "SET_DEPTH", depth: 5 });
    const { extension } = calculatePrice(deep);
    expect(extension!.low).toBeCloseTo(1700 * HOUSE.w * 5, 6);
  });

  it("prices a directly entered area, even beyond what the model can draw", () => {
    const big = reducer(base, { type: "SET_AREA", area: 60 });
    expect(big.ground.area).toBe(60);
    // the drawing pins at its deepest, but the estimate uses the real figure
    expect(big.ground.depth).toBe(EXT_DEPTH.max);
    expect(areaExceedsModel(big.ground.area)).toBe(true);
    expect(calculatePrice(big).extension!.low).toBeCloseTo(1700 * 60, 6);
  });

  it("adds each uplift to both ends of the range", () => {
    const loaded = {
      ...base,
      ground: {
        ...base.ground,
        material: "zinc" as const, // 3500
        roof: "lantern" as const, // 4500
        glazing: "sliding" as const, // 1200
        frame: "bronze" as const, // 600
      },
    };
    const uplifts = 3500 + 4500 + 1200 + 600;
    const { extension } = calculatePrice(loaded);
    expect(extension!.low).toBeCloseTo(1700 * AREA + uplifts, 6);
    expect(extension!.high).toBeCloseTo(2000 * AREA + uplifts, 6);
  });

  it("charges nothing for the default flat roof, render and black frames", () => {
    const { extension } = calculatePrice(base);
    expect(extension!.low).toBeCloseTo(1700 * AREA, 6);
  });

  it("treats white frames as included, same as black", () => {
    const white = { ...base, ground: { ...base.ground, frame: "white" as const } };
    expect(calculatePrice(white).extension!.low).toBeCloseTo(
      calculatePrice(base).extension!.low,
      6
    );
  });

  it("returns null when the extension is switched off", () => {
    const off = { ...base, ground: { ...base.ground, enabled: false } };
    const { extension, total } = calculatePrice(off);
    expect(extension).toBeNull();
    expect(total).toEqual({ low: 0, high: 0 });
  });
});

describe("loft pricing", () => {
  const withLoft = (s: CalculatorState): CalculatorState => ({
    ...s,
    ground: { ...s.ground, enabled: false },
    loft: { ...s.loft, type: "boxDormer" },
  });

  it("applies a ±15% buffer to depth × rate", () => {
    const { loft } = calculatePrice(withLoft(zone1(base)));
    const expected = 7.4 * 10000; // £74,000
    expect(loft!.low).toBeCloseTo(expected * 0.85, 6);
    expect(loft!.high).toBeCloseTo(expected * 1.15, 6);
  });

  it("uses the lower Zone 2 depth multiplier", () => {
    const { loft } = calculatePrice(withLoft(base));
    const expected = 7.4 * 7500;
    expect(loft!.low).toBeCloseTo(expected * 0.85, 6);
    expect(loft!.high).toBeCloseTo(expected * 1.15, 6);
  });

  it("prices a mansard above a box dormer in the same zone", () => {
    const mansard = withLoft(zone1(base));
    mansard.loft = { ...mansard.loft, type: "mansardDormer" };
    const { loft } = calculatePrice(mansard);
    expect(loft!.low).toBeCloseTo(7.4 * 12000 * 0.85, 6);
  });

  it("adds layout and frame uplifts outside the buffer", () => {
    const s = withLoft(zone1(base));
    s.loft = { ...s.loft, layout: "c", frame: "bronze" }; // 14000 + 500
    const { loft } = calculatePrice(s);
    const buffered = 7.4 * 10000;
    expect(loft!.low).toBeCloseTo(buffered * 0.85 + 14500, 6);
    expect(loft!.high).toBeCloseTo(buffered * 1.15 + 14500, 6);
  });

  it("prices every interior layout from the guide", () => {
    const uplift = (layout: "a" | "b" | "c" | "d") => {
      const s = withLoft(base);
      s.loft = { ...s.loft, layout };
      return calculatePrice(s).loft!.low - calculatePrice(withLoft(base)).loft!.low;
    };
    expect(uplift("a")).toBeCloseTo(0, 6);
    expect(uplift("b")).toBeCloseTo(8500, 6);
    expect(uplift("c")).toBeCloseTo(14000, 6);
    expect(uplift("d")).toBeCloseTo(11000, 6);
  });

  it("charges bronze loft frames £500, not the extension's £600", () => {
    const s = withLoft(base);
    s.loft = { ...s.loft, frame: "bronze" };
    const delta = calculatePrice(s).loft!.low - calculatePrice(withLoft(base)).loft!.low;
    expect(delta).toBeCloseTo(500, 6);
  });

  it("scales with the depth of the house", () => {
    const s = withLoft(zone1(base));
    s.loft = { ...s.loft, depth: 9 };
    expect(calculatePrice(s).loft!.low).toBeCloseTo(9 * 10000 * 0.85, 6);
  });

  it("moves the total when the depth slider is dragged", () => {
    const start = withLoft(zone1(base));
    const deeper = reducer(start, { type: "SET_LOFT_DEPTH", depth: 9 });
    const a = calculatePrice(start).total;
    const b = calculatePrice(deeper).total;
    expect(b.low).toBeGreaterThan(a.low);
    expect(b.high).toBeGreaterThan(a.high);
  });

  it("returns null with no loft conversion", () => {
    expect(calculatePrice(base).loft).toBeNull();
  });
});

describe("combined total", () => {
  it("sums the matching ends of both project ranges", () => {
    const both: CalculatorState = {
      ...zone1(base),
      loft: { ...base.loft, type: "boxDormer" },
    };
    const { extension, loft, total } = calculatePrice(both);
    expect(total.low).toBeCloseTo(extension!.low + loft!.low, 6);
    expect(total.high).toBeCloseTo(extension!.high + loft!.high, 6);
  });

  it("reports the zone the figures were derived from", () => {
    expect(calculatePrice(base).zone).toBe("zone2");
    expect(calculatePrice(zone1(base)).zone).toBe("zone1");
  });
});

describe("formatting", () => {
  it("formats thousands as £NK", () => {
    expect(formatPrice(71000)).toBe("£71K");
    expect(formatPrice(64400)).toBe("£64K");
  });

  it("formats millions as £N.NM", () => {
    expect(formatPrice(1_230_000)).toBe("£1.2M");
    expect(formatPrice(2_000_000)).toBe("£2M");
  });

  it("formats a range with an en dash", () => {
    expect(formatRange({ low: 71000, high: 87000 })).toBe("£71K – £87K");
  });

  it("formats exact GBP figures with separators", () => {
    expect(formatExact(69400)).toBe("£69,400");
  });

  it("rounds fractional pennies out of exact figures", () => {
    expect(formatExact(58080.000000000004)).toBe("£58,080");
    expect(formatExactRange({ low: 44880, high: 52800 })).toBe("£44,880 – £52,800");
  });
});

describe("reducer intro flow", () => {
  const location = {
    postcode: "NW1 8NH",
    zone: "zone1" as const,
    borough: "Camden",
    status: "ok" as const,
  };

  it("BEGIN stores the resolved location", () => {
    const next = reducer(initialState, { type: "BEGIN", focus: "ground", location });
    expect(next.started).toBe(true);
    expect(next.location).toEqual(location);
  });

  it("BEGIN with ground focus starts on the ground tab with no loft", () => {
    const next = reducer(initialState, { type: "BEGIN", focus: "ground", location });
    expect(next.activeTab).toBe("ground");
    expect(next.loft.type).toBe("none");
    expect(next.ground.enabled).toBe(true);
  });

  it("BEGIN with loft focus switches the extension off entirely", () => {
    const next = reducer(initialState, { type: "BEGIN", focus: "loft", location });
    expect(next.activeTab).toBe("loft");
    expect(next.loft.type).toBe("boxDormer");
    expect(next.ground.enabled).toBe(false);
    expect(calculatePrice(next).extension).toBeNull();
  });

  it("BEGIN with both keeps the extension on and pre-selects a box dormer", () => {
    const next = reducer(initialState, { type: "BEGIN", focus: "both", location });
    expect(next.activeTab).toBe("ground");
    expect(next.ground.enabled).toBe(true);
    expect(next.loft.type).toBe("boxDormer");
  });
});

describe("reducer options", () => {
  it("clamps the extension depth to the buildable range", () => {
    expect(reducer(initialState, { type: "SET_DEPTH", depth: 99 }).ground.depth).toBe(5);
    expect(reducer(initialState, { type: "SET_DEPTH", depth: 0 }).ground.depth).toBe(2);
  });

  it("keeps depth and area in step in both directions", () => {
    const dragged = reducer(initialState, { type: "SET_DEPTH", depth: 3 });
    expect(dragged.ground.area).toBeCloseTo(HOUSE.w * 3, 1);

    const typed = reducer(initialState, { type: "SET_AREA", area: 19.8 });
    expect(typed.ground.depth).toBeCloseTo(3, 6);
  });

  it("clamps a typed area to the quotable range", () => {
    expect(reducer(initialState, { type: "SET_AREA", area: 9999 }).ground.area).toBe(200);
    expect(reducer(initialState, { type: "SET_AREA", area: -5 }).ground.area).toBe(5);
  });

  it("clamps the loft depth to the plausible range", () => {
    expect(reducer(initialState, { type: "SET_LOFT_DEPTH", depth: 42 }).loft.depth).toBe(10);
    expect(reducer(initialState, { type: "SET_LOFT_DEPTH", depth: 1 }).loft.depth).toBe(5);
  });

  it("keeps extension and loft frame colours independent", () => {
    const s = reducer(initialState, { type: "SET_FRAME", frame: "bronze" });
    const next = reducer(s, { type: "SET_LOFT_FRAME", frame: "white" });
    expect(next.ground.frame).toBe("bronze");
    expect(next.loft.frame).toBe("white");
  });

  it("keeps ground selections when changing the loft", () => {
    const withZinc = reducer(initialState, { type: "SET_MATERIAL", material: "zinc" });
    const next = reducer(withZinc, { type: "SET_LOFT_TYPE", loftType: "boxDormer" });
    expect(next.ground.material).toBe("zinc");
    expect(next.ground.depth).toBe(initialState.ground.depth);
  });
});
