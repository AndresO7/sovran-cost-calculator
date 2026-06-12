import { describe, expect, it } from "vitest";
import { calculatePrice, formatExact, formatPrice, formatRange } from "../pricing";
import { CalculatorState, initialState, reducer } from "../state";

const base: CalculatorState = {
  prototype: "townhouse",
  ground: {
    size: "M",
    material: "render",
    roof: "flat",
    glazing: "french",
    frame: "anthracite",
    patio: "york",
  },
  loft: { type: "none", finish: "slate" },
  activeTab: "ground",
  quoteOpen: false,
};

describe("calculatePrice", () => {
  it("prices a bare townhouse M extension at area × base rate", () => {
    const { total } = calculatePrice(base);
    expect(total).toBe(20 * 3200);
  });

  it("adds material, roof and glazing premiums", () => {
    const { total } = calculatePrice({
      ...base,
      ground: { ...base.ground, material: "redBrick", roof: "skylights", glazing: "bifold" },
    });
    expect(total).toBe(64000 + 1800 + 3600 + 6400);
  });

  it("adds frame colour and patio premiums", () => {
    const { total } = calculatePrice({
      ...base,
      ground: { ...base.ground, frame: "bronze", patio: "porcelain" },
    });
    expect(total).toBe(64000 + 1400 + 2200);
  });

  it("adds loft type and whole-roof finish together", () => {
    const { total } = calculatePrice({
      ...base,
      loft: { type: "dormer", finish: "clay" },
    });
    expect(total).toBe(64000 + 68000 + 8500);
  });

  it("prices a full re-roof even without a loft conversion", () => {
    const { total } = calculatePrice({
      ...base,
      loft: { type: "none", finish: "zincRoof" },
    });
    expect(total).toBe(64000 + 14500);
  });

  it("uses villa wrap-around area for villa L", () => {
    const { total } = calculatePrice({
      ...base,
      prototype: "villa",
      ground: { ...base.ground, size: "L" },
    });
    expect(total).toBe(36 * 3200);
  });

  it("produces a ±8% range rounded to the nearest £1k", () => {
    const { low, high } = calculatePrice(base); // total 64,000
    expect(low).toBe(59000); // 58,880 → 59,000
    expect(high).toBe(69000); // 69,120 → 69,000
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

describe("reducer prototype switching", () => {
  it("maps mansard to hip-to-gable when switching townhouse → villa", () => {
    const withMansard = reducer(initialState, {
      type: "SET_LOFT_TYPE",
      loftType: "mansard",
    });
    const next = reducer(withMansard, { type: "SET_PROTOTYPE", prototype: "villa" });
    expect(next.loft.type).toBe("hipToGable");
  });

  it("keeps shared loft types when switching prototype", () => {
    const withDormer = reducer(initialState, {
      type: "SET_LOFT_TYPE",
      loftType: "dormer",
    });
    const next = reducer(withDormer, { type: "SET_PROTOTYPE", prototype: "villa" });
    expect(next.loft.type).toBe("dormer");
  });

  it("keeps ground selections when switching prototype", () => {
    const next = reducer(
      { ...initialState, ground: { ...initialState.ground, material: "zinc" } },
      { type: "SET_PROTOTYPE", prototype: "villa" }
    );
    expect(next.ground.material).toBe("zinc");
    expect(next.ground.size).toBe(initialState.ground.size);
  });
});
