import { describe, expect, it } from "vitest";
import { CalculatorState, initialState } from "../state";
import {
  fromSavedConfig,
  parseSavedConfig,
  SAVED_SCHEMA_VERSION,
  toSavedConfig,
} from "../persistence";

/** Una configuración completa y distinta de la inicial en todos sus campos. */
const configured: CalculatorState = {
  ...initialState,
  started: true,
  location: { postcode: "SW19 1AA", zone: "zone1", borough: "Merton", status: "ok" },
  ground: {
    enabled: true,
    tier: "highEnd",
    depth: 4.5,
    area: 29.7,
    material: "charredTimber",
    roof: "lantern",
    glazing: "sliding",
    frame: "bronze",
  },
  loft: { type: "mansardDormer", depth: 8.2, layout: "c", frame: "white" },
  activeTab: "loft",
  quoteOpen: true,
};

describe("toSavedConfig", () => {
  it("conserva location, ground y loft", () => {
    const saved = toSavedConfig(configured);
    expect(saved.location).toEqual(configured.location);
    expect(saved.ground).toEqual(configured.ground);
    expect(saved.loft).toEqual(configured.loft);
  });

  it("descarta el estado de interfaz", () => {
    const saved = toSavedConfig(configured) as Record<string, unknown>;
    expect(saved.started).toBeUndefined();
    expect(saved.activeTab).toBeUndefined();
    expect(saved.quoteOpen).toBeUndefined();
  });
});

describe("ida y vuelta", () => {
  it("reconstruye el proyecto y lo abre ya iniciado", () => {
    const restored = fromSavedConfig(toSavedConfig(configured));
    expect(restored.location).toEqual(configured.location);
    expect(restored.ground).toEqual(configured.ground);
    expect(restored.loft).toEqual(configured.loft);
    expect(restored.started).toBe(true);
    expect(restored.quoteOpen).toBe(false);
  });
});

/**
 * El JSON guardado visto como estructura suelta, para poder corromperlo en los
 * tests sin recurrir a `any`. Se clona en profundidad para que cada caso parta
 * de una copia limpia.
 */
type Loose = Record<string, Record<string, unknown>>;
const loose = (state: CalculatorState): Loose =>
  JSON.parse(JSON.stringify(toSavedConfig(state))) as Loose;

describe("parseSavedConfig", () => {
  it("acepta un JSON válido", () => {
    const parsed = parseSavedConfig(toSavedConfig(configured), SAVED_SCHEMA_VERSION);
    expect(parsed).not.toBeNull();
    expect(parsed!.ground.material).toBe("charredTimber");
  });

  it("rellena con los valores por defecto un campo que falta", () => {
    const saved = loose(configured);
    delete saved.loft.layout;
    const parsed = parseSavedConfig(saved, SAVED_SCHEMA_VERSION);
    expect(parsed).not.toBeNull();
    expect(parsed!.loft.layout).toBe(initialState.loft.layout);
  });

  it("recorta un valor fuera de rango en lugar de rechazar el modelo", () => {
    const saved = loose(configured);
    saved.ground.depth = 99;
    const parsed = parseSavedConfig(saved, SAVED_SCHEMA_VERSION);
    expect(parsed!.ground.depth).toBe(5);
  });

  it("descarta un valor de unión desconocido y usa el por defecto", () => {
    const saved = loose(configured);
    saved.ground.material = "unobtanium";
    const parsed = parseSavedConfig(saved, SAVED_SCHEMA_VERSION);
    expect(parsed!.ground.material).toBe(initialState.ground.material);
  });

  it("devuelve null ante basura, sin lanzar", () => {
    expect(parseSavedConfig(null, 1)).toBeNull();
    expect(parseSavedConfig("nope", 1)).toBeNull();
    expect(parseSavedConfig(42, 1)).toBeNull();
  });

  it("devuelve null ante un esquema del futuro", () => {
    expect(parseSavedConfig(toSavedConfig(configured), 99)).toBeNull();
  });
});
