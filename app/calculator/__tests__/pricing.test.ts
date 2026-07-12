import { describe, expect, it } from "vitest";
import { calculatePrice, formatExact, formatPrice, formatRange } from "../pricing";
import { CalculatorState, initialState, reducer } from "../state";

const base: CalculatorState = {
  started: true,
  ground: {
    size: "M",
    material: "render",
    roof: "rooflights",
    glazing: "double",
    frame: "anthracite",
    patio: "york",
  },
  loft: { type: "none", finish: "slate" },
  activeTab: "ground",
  quoteOpen: false,
};

describe("calculatePrice", () => {
  it("prices a bare M extension at area × base rate", () => {
    const { total } = calculatePrice(base);
    expect(total).toBe(26 * 3200);
  });

  it("adds material, roof and door premiums", () => {
    const { total } = calculatePrice({
      ...base,
      ground: { ...base.ground, material: "redBrick", roof: "lantern", glazing: "bifold" },
    });
    expect(total).toBe(83200 + 1800 + 4800 + 6400);
  });

  it("prices the pitched roof and sliding door options", () => {
    const { total } = calculatePrice({
      ...base,
      ground: { ...base.ground, roof: "pitched", glazing: "sliding" },
    });
    expect(total).toBe(83200 + 6800 + 4200);
  });

  it("adds frame colour and patio premiums", () => {
    const { total } = calculatePrice({
      ...base,
      ground: { ...base.ground, frame: "bronze", patio: "porcelain" },
    });
    expect(total).toBe(83200 + 1400 + 2200);
  });

  it("adds loft type and whole-roof finish together", () => {
    const { total } = calculatePrice({
      ...base,
      loft: { type: "boxDormer", finish: "clay" },
    });
    expect(total).toBe(83200 + 68000 + 8500);
  });

  it("prices a full re-roof even without a loft conversion", () => {
    const { total } = calculatePrice({
      ...base,
      loft: { type: "none", finish: "zincRoof" },
    });
    expect(total).toBe(83200 + 14500);
  });

  it("uses the deepest full-width area for size L", () => {
    const { total } = calculatePrice({
      ...base,
      ground: { ...base.ground, size: "L" },
    });
    expect(total).toBe(33 * 3200);
  });

  it("produces a ±8% range rounded to the nearest £1k", () => {
    const { low, high } = calculatePrice(base); // total 83,200
    expect(low).toBe(77000); // 76,544 → 77,000
    expect(high).toBe(90000); // 89,856 → 90,000
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
    expect(formatRange({ total: 0, low: 71000, high: 87000 })).toBe("£71K – £87K");
  });

  it("formats exact GBP figures with separators", () => {
    expect(formatExact(69400)).toBe("£69,400");
  });
});

describe("reducer intro flow", () => {
  it("BEGIN with ground focus starts on the ground tab with no loft", () => {
    const next = reducer(initialState, { type: "BEGIN", focus: "ground" });
    expect(next.started).toBe(true);
    expect(next.activeTab).toBe("ground");
    expect(next.loft.type).toBe("none");
  });

  it("BEGIN with loft focus opens the loft tab with a box dormer pre-selected", () => {
    const next = reducer(initialState, { type: "BEGIN", focus: "loft" });
    expect(next.activeTab).toBe("loft");
    expect(next.loft.type).toBe("boxDormer");
  });

  it("BEGIN with both keeps ground tab and pre-selects a box dormer", () => {
    const next = reducer(initialState, { type: "BEGIN", focus: "both" });
    expect(next.activeTab).toBe("ground");
    expect(next.loft.type).toBe("boxDormer");
  });
});

describe("reducer options", () => {
  it("switches the loft type", () => {
    const next = reducer(initialState, {
      type: "SET_LOFT_TYPE",
      loftType: "mansardDormer",
    });
    expect(next.loft.type).toBe("mansardDormer");
  });

  it("keeps ground selections when changing the loft", () => {
    const withZinc = reducer(initialState, { type: "SET_MATERIAL", material: "zinc" });
    const next = reducer(withZinc, { type: "SET_LOFT_TYPE", loftType: "boxDormer" });
    expect(next.ground.material).toBe("zinc");
    expect(next.ground.size).toBe(initialState.ground.size);
  });
});
