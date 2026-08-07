import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import {
  EXT_FRAMES,
  ExtRoofId,
  FrameId,
  GlazingId,
  LoftFinishId,
  MaterialId,
  TierId,
} from "../config";
import { flatMaterial, glassMaterial, lightWashMaterial } from "./materials";
import { CBox, LeanTo, TexBox } from "./parts";

const EXT_WALL_H = 2.85;
// the lean-to head must stay below the host's first-floor cills (~y 3.38)
const PITCH_RISE = 0.45;

interface ExtensionProps {
  width: number;
  depth: number;
  tier: TierId;
  material: MaterialId;
  roof: ExtRoofId;
  glazing: GlazingId;
  frame: FrameId;
  /** whole-house roof finish, used on the pitched lean-to */
  roofFinish: LoftFinishId;
}

/**
 * Parametric full-width rear extension. Anchored to the house face at z=0
 * and growing into the garden (+z). Size changes morph smoothly: children
 * are built at their exact target dimensions and the group rescales from
 * old/new → 1.
 */
export function Extension({
  width,
  depth,
  tier,
  material,
  roof,
  glazing,
  frame,
  roofFinish,
}: ExtensionProps) {
  const frameColor = EXT_FRAMES[frame].color;
  const highEnd = tier === "highEnd";
  const group = useRef<THREE.Group>(null);
  const prev = useRef({ width, depth });

  useLayoutEffect(() => {
    const g = group.current;
    if (!g) return;
    if (prev.current.width !== width || prev.current.depth !== depth) {
      g.scale.set(prev.current.width / width, 1, prev.current.depth / depth);
      prev.current = { width, depth };
    }
  }, [width, depth]);

  useFrame((_, dt) => {
    if (!group.current) return;
    easing.damp3(group.current.scale, [1, 1, 1], 0.2, dt);
  });

  const wallH = EXT_WALL_H;
  const flatTop = roof !== "pitched";

  // garden-facing glazed unit: door leaves + fixed lights
  const segments =
    glazing === "double"
      ? [0.18, 0.32, 0.32, 0.18] // sidelight · leaf · leaf · sidelight
      : glazing === "sliding"
        ? [1 / 3, 1 / 3, 1 / 3]
        : [0.2, 0.2, 0.2, 0.2, 0.2];
  const unitW =
    glazing === "double"
      ? Math.min(3.2, width - 1.1)
      : width * (glazing === "sliding" ? 0.78 : 0.86);
  const glassH = 2.3;

  // real structural opening in the garden wall — the glazed unit sits inside
  // it, recessed behind the facade like the reference renders
  const wallT = 0.22; // garden wall thickness → visible reveal depth
  const openW = unitW + 0.16;
  const openH = 2.42;

  // pair of flat rooflights, smaller and spread apart like the reference
  const skyS = Math.min(0.95, width * 0.24);
  const skyX = width * 0.22;

  // lantern footprint, centred on the roof
  const lanW = Math.min(2.7, width * 0.58);
  const lanD = Math.min(1.9, depth * 0.42);

  // wall thickness for hollow construction
  const wt = 0.15;
  const interiorColor = "#b8b0a1";

  return (
    <group ref={group}>
      {/* LEFT exterior wall */}
      <TexBox
        size={[wt, wallH, depth - wallT]}
        position={[-width / 2 + wt / 2, wallH / 2, (depth - wallT) / 2]}
        matId={material}
      />
      {/* RIGHT exterior wall */}
      <TexBox
        size={[wt, wallH, depth - wallT]}
        position={[width / 2 - wt / 2, wallH / 2, (depth - wallT) / 2]}
        matId={material}
      />
      {/* BACK wall (against house) */}
      <TexBox
        size={[width - wt * 2, wallH, wt]}
        position={[0, wallH / 2, wt / 2]}
        matId={material}
      />

      {/* Interior surfaces seen through the glazing */}
      {/* floor */}
      <CBox
        size={[width - wt * 2, 0.02, depth - wallT - wt]}
        position={[0, 0.01, (depth - wallT + wt) / 2]}
        color={interiorColor}
        castShadow={false}
      />
      {/* ceiling */}
      <CBox
        size={[width - wt * 2, 0.02, depth - wallT - wt]}
        position={[0, wallH - 0.01, (depth - wallT + wt) / 2]}
        color={interiorColor}
        castShadow={false}
      />
      {/* left interior wall */}
      <CBox
        size={[0.02, wallH, depth - wallT - wt]}
        position={[-width / 2 + wt + 0.01, wallH / 2, (depth - wallT + wt) / 2]}
        color={interiorColor}
        castShadow={false}
      />
      {/* right interior wall */}
      <CBox
        size={[0.02, wallH, depth - wallT - wt]}
        position={[width / 2 - wt - 0.01, wallH / 2, (depth - wallT + wt) / 2]}
        color={interiorColor}
        castShadow={false}
      />
      {/* back interior wall */}
      <CBox
        size={[width - wt * 2, wallH, 0.02]}
        position={[0, wallH / 2, wt + 0.01]}
        color={interiorColor}
        castShadow={false}
      />
      {/* …and the garden wall is built as piers + header, leaving a real
          opening so the doors sit recessed with a visible reveal */}
      {([-1, 1] as const).map((s) => (
        <TexBox
          key={s}
          size={[(width - openW) / 2, wallH, wallT]}
          position={[s * ((width + openW) / 4), wallH / 2, depth - wallT / 2]}
          matId={material}
        />
      ))}
      <TexBox
        size={[openW, wallH - openH, wallT]}
        position={[0, (wallH + openH) / 2, depth - wallT / 2]}
        matId={material}
      />
      {/* stone threshold lining the recess floor */}
      <CBox
        size={[openW, 0.05, wallT]}
        position={[0, 0.025, depth - wallT / 2]}
        color="#9aa0a5"
        castShadow={false}
      />

      {flatTop && (
        <>
          {/* white soffit line + grey flat-roof slab with a trimmed edge */}
          <CBox
            size={[width + 0.12, 0.07, depth + 0.12]}
            position={[0, wallH - 0.035, depth / 2]}
            color="#eae5d9"
            castShadow={false}
          />
          <CBox
            size={[width + 0.18, 0.16, depth + 0.18]}
            position={[0, wallH + 0.08, depth / 2]}
            color="#4e5459"
          />
          <RoofEdgeTrim w={width + 0.18} d={depth + 0.18} y={wallH + 0.18} z={depth / 2} />
        </>
      )}

      {roof === "rooflights" &&
        ([-1, 1] as const).map((s) => (
          <Rooflight
            key={s}
            size={skyS}
            position={[s * skyX, wallH + 0.16, depth / 2]}
          />
        ))}

      {roof === "lantern" && (
        <Lantern w={lanW} d={lanD} position={[0, wallH + 0.16, depth * 0.45]} />
      )}

      {roof === "pitched" && (
        <>
          <LeanTo
            w={width}
            depth={depth}
            rise={PITCH_RISE}
            wallTop={wallH}
            matId={roofFinish}
            cheekMatId={material}
          />
          <SlopeRooflights width={width} depth={depth} wallH={wallH} />
        </>
      )}

      {/* garden-facing glazed doors, set back inside the opening */}
      <group position={[0, 0, depth - 0.12]}>
        <GlazedUnit
          unitW={unitW}
          h={glassH}
          segments={segments}
          frameColor={frameColor}
          handles={glazing === "double"}
        />
      </group>

      {/* corten wall sconces near the corners, washing the wall — like the reference */}
      {([-1, 1] as const).map((s) => {
        const x = s * (width / 2 - 0.28);
        const washW = 1.45;
        // top of the cone tucks behind the sconce so the light reads as
        // spilling straight out of the fixture
        const washH = wallH - 0.5;
        return (
          <group key={s} position={[x, 0, depth]}>
            {/* corten sconce body, mid-height on the wall */}
            <mesh position={[0, wallH - 0.45, 0.055]} castShadow={false}>
              <boxGeometry args={[0.1, 0.28, 0.09]} />
              <meshStandardMaterial
                color="#b0552e"
                emissive="#c96f3a"
                emissiveIntensity={0.25}
                roughness={0.55}
              />
            </mesh>
            {/* glowing lens on the underside */}
            <mesh
              position={[0, wallH - 0.592, 0.055]}
              rotation={[-Math.PI / 2, 0, 0]}
              castShadow={false}
            >
              <circleGeometry args={[0.04, 16]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffedc9"
                emissiveIntensity={2.2}
              />
            </mesh>
            {/* wide cone of light washing down the wall, centred on the sconce */}
            <mesh
              position={[0, washH / 2 + 0.05, 0.02]}
              material={lightWashMaterial()}
              castShadow={false}
            >
              <planeGeometry args={[washW, washH]} />
            </mesh>
          </group>
        );
      })}

      {highEnd && (
        <PremiumDetails
          width={width}
          depth={depth}
          wallH={wallH}
          wallT={wallT}
          wt={wt}
          openW={openW}
          openH={openH}
          flatTop={flatTop}
        />
      )}
    </group>
  );
}

/** Pale stone — how jambs, cornices and plinths are dressed in London. */
const STONE = "#e4ddcd";
/** Off-white joinery, read against the warm grey interior. */
const JOINERY = "#efeae0";

/**
 * What a high-end specification actually buys: relief. The standard shell has
 * no moulding anywhere — every surface is flat — so the premium tier dresses
 * it in joinery rather than changing it. A moulded surround frames the doors,
 * a stepped cornice and plinth band the walls, pilasters turn the garden
 * corners, and inside there is a coffered ceiling, skirting and paneling.
 *
 * Strictly additive: same height, same opening, same doors. Switching tier
 * reads as a change of finish, never of build.
 *
 * Profiles are stepped and flat rather than classical ogees — the shell is
 * contemporary, and bolection mouldings would fight it.
 */
function PremiumDetails({
  width,
  depth,
  wallH,
  wallT,
  wt,
  openW,
  openH,
  flatTop,
}: {
  width: number;
  depth: number;
  wallH: number;
  wallT: number;
  /** wall thickness of the hollow construction */
  wt: number;
  openW: number;
  openH: number;
  flatTop: boolean;
}) {
  const stone = { color: STONE, roughness: 0.72 };
  const joinery = { color: JOINERY, roughness: 0.78 };

  // interior envelope, matching the floor/ceiling slabs
  const innerW = width - wt * 2;
  const innerD = depth - wallT - wt;
  const innerZ = (depth - wallT + wt) / 2;

  // piers flanking the opening cap how wide the door surround can run
  const pierW = (width - openW) / 2;
  const archOuter = Math.min(0.13, pierW * 0.55);
  const archInner = archOuter * 0.5;

  // cornice and plinth set the span the pilasters run between
  const plinthTop = 0.185;
  const corniceBottom = wallH - 0.215;

  /** One band of a stepped cornice: a ring projecting off all four faces. */
  const corniceBand = (cy: number, h: number, p: number, key: string) => (
    <group key={key}>
      <CBox size={[width + p * 2, h, p]} position={[0, cy, depth + p / 2]} {...stone} />
      <CBox size={[width + p * 2, h, p]} position={[0, cy, -p / 2]} {...stone} />
      {([-1, 1] as const).map((s) => (
        <CBox
          key={s}
          size={[p, h, depth]}
          position={[s * (width / 2 + p / 2), cy, depth / 2]}
          {...stone}
        />
      ))}
    </group>
  );

  /**
   * One band of the plinth. Runs the sides and back unbroken, but on the
   * garden face only across the piers — a plinth never crosses a threshold.
   */
  const plinthBand = (cy: number, h: number, p: number, key: string) => (
    <group key={key}>
      <CBox size={[width + p * 2, h, p]} position={[0, cy, -p / 2]} {...stone} />
      {([-1, 1] as const).map((s) => (
        <CBox
          key={`side${s}`}
          size={[p, h, depth]}
          position={[s * (width / 2 + p / 2), cy, depth / 2]}
          {...stone}
        />
      ))}
      {([-1, 1] as const).map((s) => (
        <CBox
          key={`pier${s}`}
          size={[pierW + p, h, p]}
          position={[s * ((width + openW) / 4 + p / 2), cy, depth + p / 2]}
          {...stone}
        />
      ))}
    </group>
  );

  /** One step of the door surround: two jambs and a head on the wall face. */
  const architraveBand = (t: number, p: number, key: string) => (
    <group key={key}>
      {([-1, 1] as const).map((s) => (
        <CBox
          key={s}
          size={[t, openH, p]}
          position={[s * (openW / 2 + t / 2), openH / 2, depth + p / 2]}
          {...stone}
        />
      ))}
      <CBox
        size={[openW + t * 2, t, p]}
        position={[0, openH + t / 2, depth + p / 2]}
        {...stone}
      />
    </group>
  );

  // coffered ceiling — beams dropped below the ceiling slab
  const beamH = 0.07;
  const beamW = 0.1;
  const beamY = wallH - 0.02 - beamH / 2;
  const bayZ = [innerD / 3, (innerD * 2) / 3].map((d) => wt + d);

  // back-wall paneling
  const panelMargin = 0.35;
  const panelGap = 0.18;
  const panelW = (innerW - panelMargin * 2 - panelGap * 2) / 3;
  const panelH = 1.6;
  const panelCY = 1.12;
  const moulding = 0.04;
  const panelZ = wt + 0.03;

  return (
    <group>
      {/* 1 — moulded surround framing the garden doors */}
      {architraveBand(archOuter, 0.028, "arch-outer")}
      {architraveBand(archInner, 0.052, "arch-inner")}

      {/* 2 — stepped cornice banding the head of the walls. The pitched roof
             lands in this zone, so it only suits the flat-roofed variants. */}
      {flatTop && (
        <>
          {corniceBand(wallH - 0.185, 0.06, 0.022, "cornice-bed")}
          {corniceBand(wallH - 0.118, 0.068, 0.05, "cornice-corona")}
        </>
      )}

      {/* 3 — plinth grounding the walls */}
      {plinthBand(0.075, 0.15, 0.04, "plinth-main")}
      {plinthBand(0.1675, 0.035, 0.022, "plinth-fillet")}

      {/* 4 — pilasters turning the two garden corners, plinth to cornice */}
      {([-1, 1] as const).map((s) => {
        const pw = 0.2;
        const proj = 0.035;
        const hgt = corniceBottom - plinthTop;
        return (
          <CBox
            key={`pilaster${s}`}
            size={[pw, hgt, pw]}
            position={[
              s * (width / 2 + proj - pw / 2),
              plinthTop + hgt / 2,
              depth + proj - pw / 2,
            ]}
            {...stone}
          />
        );
      })}

      {/* 5 — coffered ceiling, seen through the glazing */}
      <group>
        {([-1, 1] as const).map((s) => (
          <CBox
            key={`cf-side${s}`}
            size={[beamW, beamH, innerD]}
            position={[s * (width / 2 - wt - beamW / 2), beamY, innerZ]}
            {...joinery}
            castShadow={false}
          />
        ))}
        <CBox
          size={[innerW, beamH, beamW]}
          position={[0, beamY, wt + beamW / 2]}
          {...joinery}
          castShadow={false}
        />
        <CBox
          size={[innerW, beamH, beamW]}
          position={[0, beamY, depth - wallT - beamW / 2]}
          {...joinery}
          castShadow={false}
        />
        {bayZ.map((z) => (
          <CBox
            key={`cf-bay${z}`}
            size={[innerW, beamH, beamW]}
            position={[0, beamY, z]}
            {...joinery}
            castShadow={false}
          />
        ))}
        <CBox
          size={[beamW, beamH, innerD]}
          position={[0, beamY, innerZ]}
          {...joinery}
          castShadow={false}
        />
      </group>

      {/* 6 — skirting round the room, and framed panels on the back wall */}
      {([-1, 1] as const).map((s) => (
        <CBox
          key={`skirt${s}`}
          size={[0.025, 0.13, innerD]}
          position={[s * (width / 2 - wt - 0.0125), 0.085, innerZ]}
          {...joinery}
          castShadow={false}
        />
      ))}
      <CBox
        size={[innerW - 0.05, 0.13, 0.025]}
        position={[0, 0.085, wt + 0.0325]}
        {...joinery}
        castShadow={false}
      />
      {[-1, 0, 1].map((i) => {
        const cx = i * (panelW + panelGap);
        return (
          <group key={`panel${i}`}>
            {([-1, 1] as const).map((s) => (
              <CBox
                key={`v${s}`}
                size={[moulding, panelH, 0.02]}
                position={[cx + (s * panelW) / 2, panelCY, panelZ]}
                {...joinery}
                castShadow={false}
              />
            ))}
            {([-1, 1] as const).map((s) => (
              <CBox
                key={`h${s}`}
                size={[panelW, moulding, 0.02]}
                position={[cx, panelCY + (s * panelH) / 2, panelZ]}
                {...joinery}
                castShadow={false}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}

/**
 * Glazed door unit set into the wall opening: dim interior at the back,
 * clear glass, a slim frame around every pane and an outer frame tucked
 * behind the reveal — its lip sits shy of the facade, never proud of it.
 */
function GlazedUnit({
  unitW,
  h,
  segments,
  frameColor,
  handles = false,
}: {
  unitW: number;
  h: number;
  segments: number[];
  frameColor: string;
  handles?: boolean;
}) {
  const frameMat = flatMaterial(frameColor, 0.6);
  const yMid = h / 2 + 0.02;
  const outerT = 0.11;
  const paneT = 0.056;

  // pane x-ranges from the segment ratios, each offset by the ones before it
  const panes = segments.map((s, i) => {
    const x0 =
      -unitW / 2 + segments.slice(0, i).reduce((a, b) => a + b, 0) * unitW;
    return [x0, x0 + s * unitW] as const;
  });

  return (
    <group>
      {/* outer frame — edges tucked behind the piers and header */}
      <mesh position={[0, h + 0.04 + outerT / 2, 0.03]} material={frameMat} castShadow={false}>
        <boxGeometry args={[unitW + outerT * 2, outerT, 0.1]} />
      </mesh>
      <mesh position={[0, 0.02, 0.03]} material={frameMat} castShadow={false}>
        <boxGeometry args={[unitW + outerT * 2, 0.06, 0.1]} />
      </mesh>
      {([-1, 1] as const).map((s) => (
        <mesh
          key={s}
          position={[s * (unitW / 2 + outerT / 2), yMid + 0.02, 0.03]}
          material={frameMat}
          castShadow={false}
        >
          <boxGeometry args={[outerT, h + 0.1, 0.1]} />
        </mesh>
      ))}

      {/* panes: clear glass + slim frame per pane, deepest in the reveal */}
      {panes.map(([x0, x1], i) => {
        const cx = (x0 + x1) / 2;
        const pw = x1 - x0;
        return (
          <group key={i} position={[cx, yMid, 0]}>
            <mesh position={[0, 0, 0.02]} material={glassMaterial()} castShadow={false}>
              <planeGeometry args={[pw - 0.1, h - 0.08]} />
            </mesh>
            {/* pane frame */}
            {([-1, 1] as const).map((s) => (
              <mesh
                key={`v${s}`}
                position={[s * (pw / 2 - paneT / 2), 0, 0.045]}
                material={frameMat}
                castShadow={false}
              >
                <boxGeometry args={[paneT, h, 0.05]} />
              </mesh>
            ))}
            {([-1, 1] as const).map((s) => (
              <mesh
                key={`h${s}`}
                position={[0, s * (h / 2 - paneT / 2), 0.045]}
                material={frameMat}
                castShadow={false}
              >
                <boxGeometry args={[pw, paneT, 0.05]} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* slim steel handles on the meeting stiles of the door pair */}
      {handles &&
        ([-1, 1] as const).map((s) => (
          <mesh
            key={s}
            position={[s * 0.09, yMid - 0.12, 0.085]}
            material={flatMaterial("#9aa0a6", 0.35, 0.7)}
            castShadow={false}
          >
            <boxGeometry args={[0.028, 0.34, 0.028]} />
          </mesh>
        ))}
    </group>
  );
}

/** Thin raised trim around the flat-roof perimeter. */
function RoofEdgeTrim({ w, d, y, z }: { w: number; d: number; y: number; z: number }) {
  const mat = flatMaterial("#9aa0a5", 0.6);
  const t = 0.06;
  return (
    <group position={[0, y, z]}>
      {([-1, 1] as const).map((s) => (
        <mesh key={`z${s}`} position={[0, 0, (s * (d - t)) / 2]} material={mat} castShadow={false}>
          <boxGeometry args={[w, 0.05, t]} />
        </mesh>
      ))}
      {([-1, 1] as const).map((s) => (
        <mesh key={`x${s}`} position={[(s * (w - t)) / 2, 0, 0]} material={mat} castShadow={false}>
          <boxGeometry args={[t, 0.05, d]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Flat rooflight — chunky black kerb frame with a real opening, glass
 * recessed inside it and a lit interior plane below so the unit reads
 * see-through instead of as a solid dark panel.
 */
function Rooflight({
  size,
  position,
}: {
  size: number;
  position: [number, number, number];
}) {
  const kerb = flatMaterial("#33383d", 0.55);
  const bt = 0.13; // kerb frame thickness
  const outer = size + bt * 2;
  return (
    <group position={position}>
      {/* kerb ring with a real opening */}
      {([-1, 1] as const).map((s) => (
        <mesh
          key={`z${s}`}
          position={[0, 0, (s * (outer - bt)) / 2]}
          material={kerb}
          castShadow={false}
        >
          <boxGeometry args={[outer, 0.13, bt]} />
        </mesh>
      ))}
      {([-1, 1] as const).map((s) => (
        <mesh
          key={`x${s}`}
          position={[(s * (outer - bt)) / 2, 0, 0]}
          material={kerb}
          castShadow={false}
        >
          <boxGeometry args={[bt, 0.13, size]} />
        </mesh>
      ))}
      {/* lit interior seen through the glazing */}
      <mesh
        position={[0, 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={flatMaterial("#b8b0a1", 0.95)}
        castShadow={false}
      >
        <planeGeometry args={[size, size]} />
      </mesh>
      <mesh
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={glassMaterial()}
        castShadow={false}
      >
        <planeGeometry args={[size, size]} />
      </mesh>
    </group>
  );
}

/** Rectangular roof lantern — clear glass pyramid on a black upstand. */
function Lantern({
  w,
  d,
  position,
}: {
  w: number;
  d: number;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh material={flatMaterial("#33383d", 0.55)} castShadow={false}>
        <boxGeometry args={[w + 0.18, 0.12, d + 0.18]} />
      </mesh>
      {/* lit interior seen through the lantern glazing */}
      <mesh
        position={[0, 0.065, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={flatMaterial("#b8b0a1", 0.95)}
        castShadow={false}
      >
        <planeGeometry args={[w, d]} />
      </mesh>
      {/* unit 4-sided pyramid stretched to the rectangular footprint */}
      <group position={[0, 0.24, 0]} scale={[w, 0.36, d]}>
        <mesh rotation={[0, Math.PI / 4, 0]} material={glassMaterial()} castShadow={false}>
          <coneGeometry args={[Math.SQRT1_2, 1, 4]} />
        </mesh>
      </group>
    </group>
  );
}

/** Three flat rooflights lying in the lean-to slope. */
function SlopeRooflights({
  width,
  depth,
  wallH,
}: {
  width: number;
  depth: number;
  wallH: number;
}) {
  const run = depth + 0.15;
  const theta = Math.atan2(PITCH_RISE, run);
  const z = depth * 0.45;
  const y = wallH + PITCH_RISE * (1 - z / run) + 0.06;
  // large units with outer margins wider than the gaps between them — like the reference
  const spread = width * 0.28;
  const kerbW = 1.2;
  const kerbD = 1.45;
  const glassW = 1.04;
  const glassD = 1.28;
  const kerb = flatMaterial("#22262b", 0.55);
  return (
    <>
      {[-spread, 0, spread].map((x) => (
        <group key={x} position={[x, y, z]} rotation={[theta, 0, 0]}>
          <mesh material={kerb} castShadow={false}>
            <boxGeometry args={[kerbW, 0.08, kerbD]} />
          </mesh>
          {/* lit interior seen through the glazing */}
          <mesh
            position={[0, 0.045, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            material={flatMaterial("#b8b0a1", 0.95)}
            castShadow={false}
          >
            <planeGeometry args={[glassW, glassD]} />
          </mesh>
          <mesh
            position={[0, 0.055, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            material={glassMaterial()}
            castShadow={false}
          >
            <planeGeometry args={[glassW, glassD]} />
          </mesh>
        </group>
      ))}
    </>
  );
}
