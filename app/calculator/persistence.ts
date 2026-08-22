import { z } from "zod";
import { EXT_AREA, EXT_DEPTH, LOFT_DEPTH } from "./config";
import { CalculatorState, initialState } from "./state";

/**
 * Versión del formato guardado. Súbela cuando cambie la forma de SavedConfig
 * y añade el paso correspondiente en migrate().
 */
export const SAVED_SCHEMA_VERSION = 1;

/**
 * Una unión de literales que, ante un valor desconocido, cae en el por defecto
 * en lugar de invalidar el modelo entero: un proyecto guardado con una opción
 * que después se retiró debe seguir abriéndose.
 */
const fallbackEnum = <T extends readonly [string, ...string[]]>(
  values: T,
  fallback: T[number]
) => z.enum(values).catch(fallback as never);

/**
 * Un número acotado. Lo que no es número cae en el por defecto, pero un número
 * fuera de rango se recorta al extremo más cercano en lugar de descartarse:
 * quien guardó la extensión más profunda posible debe recuperar el máximo, no
 * el valor de fábrica.
 */
const num = (min: number, max: number, fallback: number) =>
  z
    .number()
    .catch(fallback)
    .transform((v) => Math.min(max, Math.max(min, v)));

const locationSchema = z
  .object({
    postcode: z.string().max(16).catch(""),
    zone: fallbackEnum(["zone1", "zone2"], initialState.location.zone),
    borough: z.string().max(80).nullable().catch(null),
    status: fallbackEnum(
      ["idle", "loading", "ok", "notfound", "error"],
      initialState.location.status
    ),
  })
  .catch(initialState.location);

const groundSchema = z
  .object({
    enabled: z.boolean().catch(initialState.ground.enabled),
    tier: fallbackEnum(["standard", "highEnd"], initialState.ground.tier),
    depth: num(EXT_DEPTH.min, EXT_DEPTH.max, initialState.ground.depth),
    area: num(EXT_AREA.min, EXT_AREA.max, initialState.ground.area),
    material: fallbackEnum(
      ["render", "londonStock", "redBrick", "charredTimber", "zinc"],
      initialState.ground.material
    ),
    roof: fallbackEnum(
      ["flat", "rooflights", "lantern", "pitched"],
      initialState.ground.roof
    ),
    glazing: fallbackEnum(["double", "bifold", "sliding"], initialState.ground.glazing),
    frame: fallbackEnum(
      ["black", "white", "anthracite", "bronze"],
      initialState.ground.frame
    ),
  })
  .catch(initialState.ground);

const loftSchema = z
  .object({
    type: fallbackEnum(["none", "boxDormer", "mansardDormer"], initialState.loft.type),
    depth: num(LOFT_DEPTH.min, LOFT_DEPTH.max, initialState.loft.depth),
    layout: fallbackEnum(["a", "b", "c", "d"], initialState.loft.layout),
    frame: fallbackEnum(
      ["black", "white", "anthracite", "bronze"],
      initialState.loft.frame
    ),
  })
  .catch(initialState.loft);

const savedConfigSchema = z.object({
  location: locationSchema,
  ground: groundSchema,
  loft: loftSchema,
});

export type SavedConfig = z.infer<typeof savedConfigSchema>;

/** El proyecto, sin el estado de interfaz que no tiene sentido persistir. */
export function toSavedConfig(state: CalculatorState): SavedConfig {
  return {
    location: { ...state.location },
    ground: { ...state.ground },
    loft: { ...state.loft },
  };
}

/**
 * Reconstruye el estado completo sobre initialState, de modo que un campo
 * añadido después de guardar el modelo arranca con su valor por defecto.
 */
export function fromSavedConfig(config: SavedConfig): CalculatorState {
  return {
    ...initialState,
    started: true,
    location: { ...initialState.location, ...config.location },
    ground: { ...initialState.ground, ...config.ground },
    loft: { ...initialState.loft, ...config.loft },
    activeTab: config.ground.enabled ? "ground" : "loft",
    quoteOpen: false,
  };
}

/** Punto de extensión para futuras versiones del formato. */
function migrate(raw: unknown, version: number): unknown | null {
  if (version === SAVED_SCHEMA_VERSION) return raw;
  return null; // versión desconocida o del futuro
}

/**
 * Valida lo que viene de la base de datos. Devuelve null en lugar de lanzar:
 * un modelo ilegible debe degradar una tarjeta, no romper la galería.
 */
export function parseSavedConfig(raw: unknown, version: number): SavedConfig | null {
  const migrated = migrate(raw, version);
  if (migrated === null || typeof migrated !== "object") return null;
  const result = savedConfigSchema.safeParse(migrated);
  return result.success ? result.data : null;
}
