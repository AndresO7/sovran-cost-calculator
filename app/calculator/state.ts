import {
  ExtRoofId,
  FrameId,
  GlazingId,
  LoftFinishId,
  LoftTypeId,
  LOFT_SWAP,
  MaterialId,
  PatioId,
  PROTOTYPES,
  PrototypeId,
  SizeId,
} from "./config";

export type TabId = "ground" | "loft";

export interface CalculatorState {
  /** false until the intro questions are answered */
  started: boolean;
  prototype: PrototypeId;
  ground: {
    size: SizeId;
    material: MaterialId;
    roof: ExtRoofId;
    glazing: GlazingId;
    frame: FrameId;
    patio: PatioId;
  };
  loft: {
    type: LoftTypeId;
    finish: LoftFinishId;
  };
  activeTab: TabId;
  quoteOpen: boolean;
}

export const initialState: CalculatorState = {
  started: false,
  prototype: "townhouse",
  ground: {
    size: "M",
    material: "redBrick",
    roof: "skylights",
    glazing: "french",
    frame: "anthracite",
    patio: "york",
  },
  loft: { type: "none", finish: "slate" },
  activeTab: "ground",
  quoteOpen: false,
};

export type CalculatorAction =
  | { type: "BEGIN"; prototype: PrototypeId; focus: "ground" | "loft" | "both" }
  | { type: "SET_PROTOTYPE"; prototype: PrototypeId }
  | { type: "SET_SIZE"; size: SizeId }
  | { type: "SET_MATERIAL"; material: MaterialId }
  | { type: "SET_EXT_ROOF"; roof: ExtRoofId }
  | { type: "SET_GLAZING"; glazing: GlazingId }
  | { type: "SET_FRAME"; frame: FrameId }
  | { type: "SET_PATIO"; patio: PatioId }
  | { type: "SET_LOFT_TYPE"; loftType: LoftTypeId }
  | { type: "SET_LOFT_FINISH"; finish: LoftFinishId }
  | { type: "SET_TAB"; tab: TabId }
  | { type: "SET_QUOTE_OPEN"; open: boolean };

export function reducer(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState {
  switch (action.type) {
    case "BEGIN": {
      // loft-led projects open on the Loft tab with a dormer pre-selected
      const wantsLoft = action.focus !== "ground";
      return {
        ...state,
        started: true,
        prototype: action.prototype,
        loft: { ...state.loft, type: wantsLoft ? "dormer" : "none" },
        activeTab: action.focus === "loft" ? "loft" : "ground",
      };
    }
    case "SET_PROTOTYPE": {
      if (action.prototype === state.prototype) return state;
      const allowed = PROTOTYPES[action.prototype].loftTypes;
      let loftType = state.loft.type;
      if (!allowed.includes(loftType)) {
        loftType = LOFT_SWAP[loftType] ?? "none";
      }
      return {
        ...state,
        prototype: action.prototype,
        loft: { ...state.loft, type: loftType },
      };
    }
    case "SET_SIZE":
      return { ...state, ground: { ...state.ground, size: action.size } };
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
