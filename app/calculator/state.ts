import {
  EXT_AREA,
  EXT_DEPTH,
  extensionArea,
  ExtRoofId,
  FrameId,
  GlazingId,
  HOUSE,
  LOFT_DEPTH,
  LoftFinishId,
  LoftLayoutId,
  LoftTypeId,
  MaterialId,
  PatioId,
  TierId,
} from "./config";
import { LookupStatus, ZoneId } from "./zones";

export type TabId = "ground" | "loft";

export interface LocationState {
  /** as entered by the user, or as formatted by the API once resolved */
  postcode: string;
  zone: ZoneId;
  borough: string | null;
  status: LookupStatus;
}

export interface CalculatorState {
  /** false until the intro questions are answered */
  started: boolean;
  location: LocationState;
  ground: {
    /** a loft-only project switches the extension off entirely */
    enabled: boolean;
    tier: TierId;
    /** metres into the garden; the extension always spans the full width */
    depth: number;
    /**
     * m² the estimate is actually built from. Normally `depth × house width`,
     * but it can be entered directly for extensions bigger than the model can
     * draw — in which case `depth` stays pinned at its maximum.
     */
    area: number;
    material: MaterialId;
    roof: ExtRoofId;
    glazing: GlazingId;
    frame: FrameId;
    patio: PatioId;
  };
  loft: {
    type: LoftTypeId;
    /** front-to-back span of the house, metres — drives the loft base rate */
    depth: number;
    layout: LoftLayoutId;
    frame: FrameId;
    finish: LoftFinishId;
  };
  activeTab: TabId;
  quoteOpen: boolean;
}

export const initialState: CalculatorState = {
  started: false,
  location: { postcode: "", zone: "zone2", borough: null, status: "idle" },
  ground: {
    enabled: true,
    tier: "standard",
    depth: EXT_DEPTH.default,
    area: extensionArea(EXT_DEPTH.default),
    material: "render",
    roof: "flat",
    glazing: "bifold",
    frame: "black",
    patio: "york",
  },
  loft: {
    type: "none",
    depth: LOFT_DEPTH.default,
    layout: "a",
    frame: "black",
    finish: "slate",
  },
  activeTab: "ground",
  quoteOpen: false,
};

export type CalculatorAction =
  | {
      type: "BEGIN";
      focus: "ground" | "loft" | "both";
      location: LocationState;
    }
  | { type: "SET_GROUND_ENABLED"; enabled: boolean }
  | { type: "SET_TIER"; tier: TierId }
  | { type: "SET_DEPTH"; depth: number }
  | { type: "SET_AREA"; area: number }
  | { type: "SET_MATERIAL"; material: MaterialId }
  | { type: "SET_EXT_ROOF"; roof: ExtRoofId }
  | { type: "SET_GLAZING"; glazing: GlazingId }
  | { type: "SET_FRAME"; frame: FrameId }
  | { type: "SET_PATIO"; patio: PatioId }
  | { type: "SET_LOFT_TYPE"; loftType: LoftTypeId }
  | { type: "SET_LOFT_DEPTH"; depth: number }
  | { type: "SET_LOFT_LAYOUT"; layout: LoftLayoutId }
  | { type: "SET_LOFT_FRAME"; frame: FrameId }
  | { type: "SET_LOFT_FINISH"; finish: LoftFinishId }
  | { type: "SET_TAB"; tab: TabId }
  | { type: "SET_QUOTE_OPEN"; open: boolean };

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export function reducer(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState {
  switch (action.type) {
    case "BEGIN": {
      // a loft-led project opens on the Loft tab with a box dormer ready;
      // a loft-only project switches the extension off so it costs nothing
      const wantsLoft = action.focus !== "ground";
      return {
        ...state,
        started: true,
        location: action.location,
        ground: { ...state.ground, enabled: action.focus !== "loft" },
        loft: { ...state.loft, type: wantsLoft ? "boxDormer" : "none" },
        activeTab: action.focus === "loft" ? "loft" : "ground",
      };
    }
    case "SET_GROUND_ENABLED":
      return { ...state, ground: { ...state.ground, enabled: action.enabled } };
    case "SET_TIER":
      return { ...state, ground: { ...state.ground, tier: action.tier } };
    case "SET_DEPTH": {
      // dragging the slider re-derives the area from the depth
      const depth = clamp(action.depth, EXT_DEPTH.min, EXT_DEPTH.max);
      return {
        ...state,
        ground: { ...state.ground, depth, area: extensionArea(depth) },
      };
    }
    case "SET_AREA": {
      // typing an area drives the drawing back the other way, pinned at the
      // deepest extension the model can render
      const area = Math.round(clamp(action.area, EXT_AREA.min, EXT_AREA.max) * 10) / 10;
      return {
        ...state,
        ground: {
          ...state.ground,
          area,
          depth: clamp(area / HOUSE.w, EXT_DEPTH.min, EXT_DEPTH.max),
        },
      };
    }
    case "SET_MATERIAL":
      return { ...state, ground: { ...state.ground, material: action.material } };
    case "SET_EXT_ROOF":
      return { ...state, ground: { ...state.ground, roof: action.roof } };
    case "SET_GLAZING":
      return { ...state, ground: { ...state.ground, glazing: action.glazing } };
    case "SET_FRAME":
      return { ...state, ground: { ...state.ground, frame: action.frame } };
    case "SET_PATIO":
      return { ...state, ground: { ...state.ground, patio: action.patio } };
    case "SET_LOFT_TYPE":
      return { ...state, loft: { ...state.loft, type: action.loftType } };
    case "SET_LOFT_DEPTH":
      return {
        ...state,
        loft: {
          ...state.loft,
          depth: clamp(action.depth, LOFT_DEPTH.min, LOFT_DEPTH.max),
        },
      };
    case "SET_LOFT_LAYOUT":
      return { ...state, loft: { ...state.loft, layout: action.layout } };
    case "SET_LOFT_FRAME":
      return { ...state, loft: { ...state.loft, frame: action.frame } };
    case "SET_LOFT_FINISH":
      return { ...state, loft: { ...state.loft, finish: action.finish } };
    case "SET_TAB":
      return { ...state, activeTab: action.tab };
    case "SET_QUOTE_OPEN":
      return { ...state, quoteOpen: action.open };
    default:
      return state;
  }
}
