import { useRef } from "react";
import * as THREE from "three";
import { HOUSE, LoftFinishId } from "../config";
import { CalculatorState } from "../state";
import { Extension } from "./Extension";
import { Garden } from "./Garden";
import { BOX_DORMER_EAVE_STRIP, Loft } from "./Loft";
import { flatMaterial } from "./materials";
import {
  CBox,
  GableWall,
  Roof,
  TexBox,
  usePopIn,
  WallOpening,
  WallWithOpenings,
  Win,
} from "./parts";

const W = HOUSE.w;
const WALL_H = 5.6; // two storeys
const OVER = 0.18;
const WALL_T = 0.22; // facade thickness → real window reveals
/**
 * Roof rise as a fraction of the depth. The ridge runs across the width, so
 * the slopes span the depth — holding this ratio keeps the pitch constant as
 * the house gets deeper, instead of flattening the roof out.
 */
const ROOF_PITCH = 2.5 / HOUSE.d;

// structural openings, in world x (the front facade group is rotated 180°,
// so a window at local x sits at world -x)
const FRONT_OPENINGS: WallOpening[] = [
  { x: 1.7, y: 1.155, w: 0.94, h: 2.05 }, // front door
  { x: -1.35, y: 1.55, w: 1.76, h: 1.51 }, // ground-floor window
  { x: 1.7, y: 4.25, w: 1.01, h: 1.41 }, // first-floor windows
  { x: -1.35, y: 4.25, w: 1.51, h: 1.41 },
];
const REAR_OPENINGS: WallOpening[] = [
  { x: -1.55, y: 4.25, w: 1.01, h: 1.46 },
  { x: 1.55, y: 4.25, w: 1.01, h: 1.46 },
];
// Ground-floor rear elevation — the original garden doors and kitchen window.
// Only punched when no extension covers this wall, otherwise the extension's
// own interior is what you see through the glazing.
const REAR_GROUND_OPENINGS: WallOpening[] = [
  { x: -1.45, y: 1.16, w: 1.62, h: 2.12 },
  { x: 1.55, y: 1.6, w: 1.5, h: 1.45 },
];

// roof-edge trim reads as part of the roof, not white-painted timber
const ROOF_TRIM: Record<LoftFinishId, string> = {
  slate: "#565d66",
  clay: "#8f4b32",
  zincRoof: "#54595f",
};

/** Brick semi — two storeys, gabled roof. Hosts the extension and loft. */
export function House({ state }: { state: CalculatorState }) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.94);
  // the extension always spans the full width — only the depth varies, and a
  // loft-only project switches it off entirely
  const ext = { w: HOUSE.w, d: state.ground.enabled ? state.ground.depth : 0 };
  // house z: -D → 0, garden grows +z. The depth is the same figure the loft
  // is priced per metre against, so the drawing tracks the estimate.
  const D = state.loft.depth;
  const ROOF_H = D * ROOF_PITCH;
  // A full-width dormer replaces the rear slope. Cutting the roof back to
  // where the dormer starts is what stops the slope running through the
  // converted room and showing as a ceiling through the dormer windows.
  const rearRoofDepth =
    state.loft.type === "boxDormer"
      ? BOX_DORMER_EAVE_STRIP
      : state.loft.type === "mansardDormer"
        ? 0
        : Infinity;

  return (
    <group ref={ref}>
      {/* Hollow house structure — left/right walls only, front/rear are
          separate panels with punched openings. Interior reads as a lit room. */}
      {/* LEFT side wall */}
      <TexBox
        size={[WALL_T, WALL_H, D - 0.44]}
        position={[-W / 2 + WALL_T / 2, WALL_H / 2, -D / 2]}
        matId="houseBrick"
      />
      {/* RIGHT side wall */}
      <TexBox
        size={[WALL_T, WALL_H, D - 0.44]}
        position={[W / 2 - WALL_T / 2, WALL_H / 2, -D / 2]}
        matId="houseBrick"
      />
      {/* Interior surfaces seen through the glazing */}
      <HouseInterior w={W} h={WALL_H} d={D} wallT={WALL_T} />
      <WallWithOpenings
        w={W}
        h={WALL_H}
        t={WALL_T}
        openings={FRONT_OPENINGS}
        matId="houseBrick"
        position={[0, 0, -D]}
      />
      <WallWithOpenings
        w={W}
        h={WALL_H}
        t={WALL_T}
        openings={
          state.ground.enabled
            ? REAR_OPENINGS
            : [...REAR_OPENINGS, ...REAR_GROUND_OPENINGS]
        }
        matId="houseBrick"
        position={[0, 0, -WALL_T]}
      />

      {/* eaves fascia — front and rear gutter lines only, gables stay clean;
          finished in the roof trim colour, not painted timber */}
      {([-1, 1] as const).map((s) => (
        <CBox
          key={s}
          size={[W + 0.16, 0.14, 0.2]}
          position={[0, WALL_H - 0.07, s === 1 ? 0.04 : -D - 0.04]}
          color={ROOF_TRIM[state.loft.finish]}
          castShadow={false}
        />
      ))}

      {/* gabled roof + brick gable ends + ridge cap + chimney */}
      <Roof
        w={W + OVER * 2}
        d={D + OVER * 2}
        h={ROOF_H}
        rearDepth={rearRoofDepth}
        finish={state.loft.finish}
        position={[0, WALL_H, -D / 2]}
      />
      {([-1, 1] as const).map((s) => (
        <GableWall
          key={s}
          side={s}
          w={W - 0.02}
          d={D}
          h={ROOF_H}
          matId="houseBrick"
          position={[0, WALL_H, -D / 2]}
        />
      ))}
      <CBox
        size={[W + OVER * 2 + 0.06, 0.09, 0.2]}
        position={[0, WALL_H + ROOF_H + 0.02, -D / 2]}
        color="#59606a"
        castShadow={false}
      />
      {/* bargeboards frame the roof edge at each gable, matching the finish */}
      {([-1, 1] as const).map((sx) =>
        ([-1, 1] as const).map((sz) => {
          const halfD = D / 2 + OVER;
          const pitch = Math.atan2(ROOF_H, halfD);
          const len = Math.hypot(halfD, ROOF_H) + 0.15;
          return (
            <CBox
              key={`${sx}${sz}`}
              size={[0.08, 0.17, len]}
              position={[
                sx * (W / 2 + OVER - 0.02),
                WALL_H + ROOF_H / 2 - 0.02,
                -D / 2 + (sz * halfD) / 2,
              ]}
              rotation={[sz * pitch, 0, 0]}
              color={ROOF_TRIM[state.loft.finish]}
              castShadow={false}
            />
          );
        })
      )}

      {/* rear sash windows — first floor, sunk into the wall openings */}
      {[-1.55, 1.55].map((x) => (
        <Win key={x} w={0.95} h={1.4} stone reveal={0.12} position={[x, 4.25, 0.01]} />
      ))}

      {/* rear ground floor — revealed once the extension is switched off */}
      {!state.ground.enabled && (
        <>
          <Win
            w={1.56}
            h={2.06}
            mullion
            frameColor="#1e2124"
            reveal={0.12}
            position={[-1.45, 1.16, 0.01]}
          />
          <Win w={1.44} h={1.39} stone reveal={0.12} position={[1.55, 1.6, 0.01]} />
          {/* stone threshold under the garden doors */}
          <CBox
            size={[1.86, 0.08, 0.42]}
            position={[-1.45, 0.06, 0.2]}
            color="#c9c2b2"
            castShadow={false}
          />
        </>
      )}

      {/* front facade */}
      <group position={[0, 0, -D]} rotation={[0, Math.PI, 0]}>
        <FrontDoor x={-1.7} />
        {/* ground-floor window */}
        <Win w={1.7} h={1.45} stone reveal={0.12} position={[1.35, 1.55, 0.01]} />
        {/* first-floor windows */}
        <Win w={0.95} h={1.35} stone reveal={0.12} position={[-1.7, 4.25, 0.01]} />
        <Win w={1.45} h={1.35} stone reveal={0.12} position={[1.35, 4.25, 0.01]} />
      </group>

      {/* configurable pieces */}
      {state.ground.enabled && (
        <Extension
          width={ext.w}
          depth={ext.d}
          tier={state.ground.tier}
          material={state.ground.material}
          roof={state.ground.roof}
          glazing={state.ground.glazing}
          frame={state.ground.frame}
        />
      )}
      <Loft
        type={state.loft.type}
        layout={state.loft.layout}
        frame={state.loft.frame}
        roofW={W + OVER * 2}
        slopeHalfD={(D + OVER * 2) / 2}
        eaveY={WALL_H}
        rise={ROOF_H}
        rearEaveZ={-D / 2 + (D + OVER * 2) / 2}
      />

      <Garden houseW={W} houseD={D} ext={ext} />
    </group>
  );
}

/** Panelled black door with stone surround, brass furniture and steps. */
function FrontDoor({ x }: { x: number }) {
  const stone = "#d9d2c2";
  return (
    <group position={[x, 0, 0]}>
      {/* stone jambs + head */}
      {([-1, 1] as const).map((s) => (
        <CBox key={s} size={[0.14, 2.24, 0.14]} position={[s * 0.56, 1.2, 0.05]} color={stone} />
      ))}
      <CBox size={[1.26, 0.15, 0.16]} position={[0, 2.36, 0.05]} color={stone} />
      {/* door leaf, sunk into the wall opening behind the stone surround */}
      <CBox size={[0.98, 2.12, 0.1]} position={[0, 1.14, -0.1]} color="#1e2124" />
      {/* recessed panels */}
      {[0.62, 1.62].map((y) =>
        ([-1, 1] as const).map((s) => (
          <CBox
            key={`${y}-${s}`}
            size={[0.32, 0.62, 0.02]}
            position={[s * 0.21, y, -0.045]}
            color="#26292d"
            castShadow={false}
          />
        ))
      )}
      {/* brass handle + letter plate */}
      <CBox size={[0.05, 0.16, 0.05]} position={[0.36, 1.1, -0.03]} color="#b98a3f" castShadow={false} />
      <CBox size={[0.24, 0.05, 0.03]} position={[0, 0.98, -0.035]} color="#b98a3f" castShadow={false} />
      {/* steps */}
      <CBox size={[1.3, 0.16, 0.5]} position={[0, 0.08, 0.3]} color="#c9c2b2" />
      <CBox size={[1.5, 0.08, 0.7]} position={[0, 0.04, 0.42]} color="#bdb6a6" />
    </group>
  );
}

/** Softly lit interior surfaces visible through windows. */
function HouseInterior({
  w,
  h,
  d,
  wallT,
}: {
  w: number;
  h: number;
  d: number;
  wallT: number;
}) {
  const color = "#b8b0a1";
  const innerW = w - wallT * 2;
  const innerD = d - 0.44;
  const mat = flatMaterial(color, 0.95);

  return (
    <group>
      {/* floor */}
      <mesh position={[0, 0.01, -d / 2]} material={mat} receiveShadow={false}>
        <boxGeometry args={[innerW, 0.02, innerD]} />
      </mesh>
      {/* ceiling / first floor */}
      <mesh position={[0, h / 2, -d / 2]} material={mat} receiveShadow={false}>
        <boxGeometry args={[innerW, 0.02, innerD]} />
      </mesh>
      {/* top ceiling */}
      <mesh position={[0, h - 0.01, -d / 2]} material={mat} receiveShadow={false}>
        <boxGeometry args={[innerW, 0.02, innerD]} />
      </mesh>
      {/* left interior wall */}
      <mesh position={[-w / 2 + wallT + 0.01, h / 2, -d / 2]} material={mat} receiveShadow={false}>
        <boxGeometry args={[0.02, h, innerD]} />
      </mesh>
      {/* right interior wall */}
      <mesh position={[w / 2 - wallT - 0.01, h / 2, -d / 2]} material={mat} receiveShadow={false}>
        <boxGeometry args={[0.02, h, innerD]} />
      </mesh>
      {/* front interior wall */}
      <mesh position={[0, h / 2, -d + wallT + 0.01]} material={mat} receiveShadow={false}>
        <boxGeometry args={[innerW, h, 0.02]} />
      </mesh>
      {/* rear interior wall */}
      <mesh position={[0, h / 2, -wallT - 0.01]} material={mat} receiveShadow={false}>
        <boxGeometry args={[innerW, h, 0.02]} />
      </mesh>
    </group>
  );
}
