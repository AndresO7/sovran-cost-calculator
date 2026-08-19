import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FrameId, LOFT_FRAMES, LoftLayoutId, LoftTypeId } from "../config";
import {
  flatMaterial,
  glassMaterial,
  metricMaterial,
  TILE_METRES,
} from "./materials";
import { CBox, Chimney, TexBox, usePopIn, WallWithOpenings } from "./parts";

interface LoftProps {
  type: LoftTypeId;
  /** which rooms the conversion is divided into */
  layout: LoftLayoutId;
  /** joinery colour for the dormer windows */
  frame: FrameId;
  /** eaves width of the host roof (incl. overhang) */
  roofW: number;
  /** half-depth of the roof footprint (eave to ridge, horizontal) */
  slopeHalfD: number;
  /** y of the eaves */
  eaveY: number;
  /** ridge rise above the eaves */
  rise: number;
  /** z of the rear eave edge */
  rearEaveZ: number;
}

/**
 * Dormer cladding is always standard grey slate. It deliberately does not
 * follow the whole-house re-roof choice: the dormer is new construction and
 * reads as such, and a clay-tiled house getting a clay-tiled dormer box
 * flattens the two into one shape.
 */
const DORMER_FINISH = "slate" as const;

/**
 * Strip of rear roof left below a box dormer face. The house passes this to
 * `Roof` so the slope stops where the dormer starts.
 */
export const BOX_DORMER_EAVE_STRIP = 0.4;

/** Loft conversion pieces sitting on the rear roof slope. */
export function Loft(props: LoftProps) {
  switch (props.type) {
    case "boxDormer":
      return <BoxDormer {...props} />;
    case "mansardDormer":
      return <MansardDormer {...props} />;
    default:
      return null;
  }
}

/** Full-width box on the rear slope, slate-clad, chimney riding the ridge. */
function BoxDormer(props: LoftProps) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.05);
  const { roofW, slopeHalfD, eaveY, rise, rearEaveZ, frame, layout } = props;
  const frameColor = LOFT_FRAMES[frame].color;
  // full width: the box runs the whole roof, stopping just inside the gable
  // walls so its cheeks never fight them for the same plane
  const w = roofW - 0.42;
  const frontZ = rearEaveZ - BOX_DORMER_EAVE_STRIP;
  const ridgeZ = rearEaveZ - slopeHalfD;
  const baseY = eaveY + 0.2;
  const deckT = 0.12;
  const wallT = 0.14;
  // the deck runs level with the main ridge and tucks under the ridge cap,
  // so dormer and roof read as one construction
  const topY = eaveY + rise;
  const deckTopY = topY + 0.02;
  const h = topY - 0.1 - baseY;
  const bodyD = frontZ - wallT - (ridgeZ + 0.02);
  const bodyZ = frontZ - wallT - bodyD / 2;
  const deckW = w + 0.16;
  const deckD = frontZ + 0.08 - (ridgeZ + 0.06);
  const deckZ = (frontZ + 0.08 + ridgeZ + 0.06) / 2;
  const winW = 1.7;
  // A shallower house gives a lower roof and so a shorter dormer face. The
  // glazing has to follow it — punching a 1.5 m opening into a 1.4 m wall
  // leaves WallWithOpenings with negative-height pieces.
  const winH = Math.min(1.5, h - 0.45);
  const winX = w * 0.235;
  const openings = useMemo(
    () => [-1, 1].map((s) => ({ x: s * winX, y: h / 2, w: winW, h: winH })),
    [winX, h, winH]
  );

  return (
    <group ref={ref}>
      {/* Hollow dormer — left/right/back walls only, front has punched openings */}
      {/* LEFT wall */}
      <TexBox
        size={[wallT, h, bodyD]}
        position={[-w / 2 + wallT / 2, baseY + h / 2, bodyZ]}
        matId={DORMER_FINISH}
      />
      {/* RIGHT wall */}
      <TexBox
        size={[wallT, h, bodyD]}
        position={[w / 2 - wallT / 2, baseY + h / 2, bodyZ]}
        matId={DORMER_FINISH}
      />
      {/* BACK wall */}
      <TexBox
        size={[w - wallT * 2, h, wallT]}
        position={[0, baseY + h / 2, bodyZ - bodyD / 2 + wallT / 2]}
        matId={DORMER_FINISH}
      />
      {/* the converted room, seen through the glazing */}
      <LoftRoom
        w={w - wallT * 2}
        h={h - 0.04}
        zBack={bodyZ - (bodyD - wallT) / 2}
        zFront={bodyZ + (bodyD - wallT) / 2}
        floorY={baseY + 0.02}
        layout={layout}
      />
      <WallWithOpenings
        w={w}
        h={h}
        t={wallT}
        openings={openings}
        matId={DORMER_FINISH}
        position={[0, baseY, frontZ - wallT]}
      />
      {/* deck meeting the ridge in the same cladding, framed all round by a lip */}
      <TexBox
        size={[deckW, deckT, deckD]}
        position={[0, deckTopY - deckT / 2, deckZ]}
        matId={DORMER_FINISH}
      />
      <DeckFrame w={deckW} d={deckD} y={deckTopY + 0.02} z={deckZ} />
      {/* frameless glazing sunk inside the openings, like the reference */}
      {([-1, 1] as const).map((s) => (
        <RecessedGlazing
          key={s}
          w={winW}
          h={winH}
          frameColor={frameColor}
          position={[s * winX, baseY + h / 2, frontZ]}
        />
      ))}
      {/* the conversion brings the stack back, riding the ridge at the gable */}
      <Chimney position={[roofW / 2 - 0.62, eaveY + rise - 0.35, ridgeZ + 0.05]} />
    </group>
  );
}

/**
 * Frameless glazing sunk behind a punched opening — the clad reveal and
 * its shadow do the framing work, like the reference box dormer.
 */
function RecessedGlazing({
  w,
  h,
  frameColor,
  position,
  depth = 0.1,
}: {
  w: number;
  h: number;
  /** joinery colour of the mullion */
  frameColor: string;
  position: [number, number, number];
  /** how far the panes sit behind the cladding face */
  depth?: number;
}) {
  return (
    <group position={position}>
      {/* transparent glass only — no interior plane blocking the view */}
      <mesh position={[0, 0, -depth]} material={glassMaterial()} castShadow={false}>
        <planeGeometry args={[w + 0.04, h + 0.04]} />
      </mesh>
      {/* slim central mullion splits the unit into a pair */}
      <mesh
        position={[0, 0, -depth + 0.012]}
        material={flatMaterial(frameColor, 0.8)}
        castShadow={false}
      >
        <boxGeometry args={[0.05, h, 0.022]} />
      </mesh>
    </group>
  );
}

/** Raised trim lip framing the whole perimeter of a dormer flat deck. */
function DeckFrame({ w, d, y, z }: { w: number; d: number; y: number; z: number }) {
  const t = 0.09;
  return (
    <group position={[0, y, z]}>
      {([-1, 1] as const).map((s) => (
        <CBox
          key={`z${s}`}
          size={[w, 0.07, t]}
          position={[0, 0, (s * (d - t)) / 2]}
          color="#41464c"
          castShadow={false}
        />
      ))}
      {([-1, 1] as const).map((s) => (
        <CBox
          key={`x${s}`}
          size={[t, 0.07, d]}
          position={[(s * (w - t)) / 2, 0, 0]}
          color="#41464c"
          castShadow={false}
        />
      ))}
    </group>
  );
}

/**
 * Mansard: the rear slope re-clad as a steep slate face with windows set
 * into it, slate side cheeks and a flat crown running level from the face
 * head to the main ridge, so dormer roof and house roof meet with no gap.
 */
function MansardDormer(props: LoftProps) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.05);
  const { roofW, slopeHalfD, eaveY, rise, rearEaveZ, frame, layout } = props;
  const frameColor = LOFT_FRAMES[frame].color;
  const alpha = 0.3; // lean from vertical, radians (~17°)
  // full width, matching the box dormer — a mansard always runs gable to gable
  const w = roofW - 0.42;
  // face rises to just under the crown, which sits level with the main ridge
  const hVert = rise - 0.06;
  const faceLen = hVert / Math.cos(alpha);
  const run = hVert * Math.tan(alpha);
  const topY = eaveY + hVert;
  const topZ = rearEaveZ - run;
  const ridgeZ = rearEaveZ - slopeHalfD;
  // flat crown level with the main ridge, tucked under the ridge cap like
  // the box dormer deck, capping the face head at the rear
  const deckT = 0.12;
  const deckTopY = eaveY + rise + 0.02;
  const deckFrontZ = ridgeZ + 0.06;
  const deckRearZ = topZ + 0.12;
  const deckW = w + 0.08;
  const deckZ = (deckFrontZ + deckRearZ) / 2;

  // slate cheeks: eave → face head → ridge, buried into the roof
  const cheekGeo = useMemo(() => {
    const T = TILE_METRES;
    const positions: number[] = [];
    const uvs: number[] = [];
    for (const s of [-1, 1]) {
      const x = s * (w / 2 - 0.02);
      const quad: [number, number][] = [
        [rearEaveZ, eaveY],
        [topZ, topY],
        [deckFrontZ, topY],
        [deckFrontZ, eaveY],
      ];
      for (const i of [0, 1, 2, 0, 2, 3]) {
        positions.push(x, quad[i][1], quad[i][0]);
        uvs.push((rearEaveZ - quad[i][0]) / T, (quad[i][1] - eaveY) / T);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }, [w, eaveY, topY, rearEaveZ, topZ, deckFrontZ]);

  const cheekMat = useMemo(() => {
    const m = metricMaterial(DORMER_FINISH, TILE_METRES, TILE_METRES).clone();
    m.side = THREE.DoubleSide;
    return m;
  }, []);

  const winW = 1.1;
  // Same constraint as the box dormer: the slated face shortens with the roof,
  // and the opening sits 0.12 above its centre, so it runs out of face at the
  // head first. Leaving 0.22 of slate top and bottom keeps the reveal intact.
  const winH = Math.min(1.5, faceLen - 0.44);
  const openings = useMemo(
    () =>
      [-1, 1].map((s) => ({
        x: s * w * 0.22,
        y: faceLen / 2 + 0.12,
        w: winW,
        h: winH,
      })),
    [w, faceLen, winH]
  );

  return (
    <group ref={ref}>
      {/* steep slated face with real punched openings for the windows */}
      <group
        position={[0, eaveY + hVert / 2, rearEaveZ - run / 2]}
        rotation={[-alpha, 0, 0]}
      >
        <WallWithOpenings
          w={w}
          h={faceLen}
          t={0.14}
          openings={openings}
          matId={DORMER_FINISH}
          position={[0, -faceLen / 2, -0.07]}
        />
        {([-1, 1] as const).map((s) => (
          <MansardWindow
            key={s}
            w={winW}
            h={winH}
            frameColor={frameColor}
            position={[s * w * 0.22, 0.12, 0]}
          />
        ))}
      </group>

      {/* the converted room, seen through the glazing */}
      <LoftRoom
        w={w - 0.3}
        h={deckTopY - deckT - (eaveY + 0.02)}
        zBack={deckFrontZ + 0.02}
        zFront={rearEaveZ - 0.06}
        innerTo={topZ - 0.04}
        floorY={eaveY + 0.02}
        layout={layout}
      />

      {/* slate cheeks close the sides */}
      <mesh geometry={cheekGeo} material={cheekMat} castShadow receiveShadow />

      {/* grey membrane crown meeting the ridge, framed all round by a lip */}
      <CBox
        size={[deckW, deckT, deckRearZ - deckFrontZ]}
        position={[0, deckTopY - deckT / 2, deckZ]}
        color="#565b61"
      />
      <DeckFrame w={deckW} d={deckRearZ - deckFrontZ} y={deckTopY + 0.02} z={deckZ} />
    </group>
  );
}

/**
 * Mansard window: glazing recessed behind the slate face inside the punched
 * opening — a dark lining sleeves the reveal, one slim anthracite sash with
 * a central mullion sits at the back, and a proud surround hoods the head:
 * the top board projects off the slate and the jambs taper back to flush
 * at the cill, like the reference mansard.
 */
function MansardWindow({
  w,
  h,
  frameColor,
  position,
  recess = 0.1,
}: {
  w: number;
  h: number;
  /** joinery colour of the sash and mullion */
  frameColor: string;
  position: [number, number, number];
  /** how far the sash sits behind the slate face */
  recess?: number;
}) {
  const lining = flatMaterial("#23272b", 0.85);
  const sash = flatMaterial(frameColor, 0.7);
  const lt = 0.025; // lining board thickness
  const ld = 0.14; // lining depth — sleeves the full reveal
  const lz = 0.07 - ld / 2;
  const innerW = w - lt * 2;
  const innerH = h - lt * 2;
  const ft = 0.055; // sash frame thickness
  const glassZ = 0.07 - recess;
  const surround = "#262b30";
  const bt = 0.06; // surround board thickness
  const proj = 0.15; // head projection off the slate face
  const jambL = h + bt;

  // solid wedge jambs: proud of the slate at the head, tapering back to
  // near-flush at the cill — solid from inside the wall out, so no gap
  // opens between board and face
  const jambGeo = useMemo(() => {
    type V3 = [number, number, number];
    const yTop = jambL / 2;
    const yBot = -jambL / 2;
    const zBack = 0.03; // buried behind the slate surface
    const zTop = 0.07 + proj;
    const zBot = 0.085;
    const positions: number[] = [];
    const push = (...verts: V3[]) => {
      for (const v of verts) positions.push(...v);
    };
    for (const s of [-1, 1]) {
      const x0 = s * (w / 2 + bt / 2) - bt / 2;
      const x1 = x0 + bt;
      const A0: V3 = [x0, yBot, zBack];
      const A1: V3 = [x1, yBot, zBack];
      const B0: V3 = [x0, yTop, zBack];
      const B1: V3 = [x1, yTop, zBack];
      const C0: V3 = [x0, yTop, zTop];
      const C1: V3 = [x1, yTop, zTop];
      const D0: V3 = [x0, yBot, zBot];
      const D1: V3 = [x1, yBot, zBot];
      push(A1, B1, C1, A1, C1, D1); // +x cap
      push(A0, C0, B0, A0, D0, C0); // −x cap
      push(D0, D1, C1, D0, C1, C0); // sloped front
      push(B0, C0, C1, B0, C1, B1); // top
      push(A0, A1, D1, A0, D1, D0); // bottom
      push(A0, B0, B1, A0, B1, A1); // back, buried in the slate
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, [w, jambL]);

  return (
    <group position={position}>
      {/* proud surround — projecting head board over the window */}
      <CBox
        size={[w + bt * 2, bt, 0.2]}
        position={[0, h / 2 + bt / 2, 0.12]}
        color={surround}
      />
      <mesh
        geometry={jambGeo}
        material={flatMaterial(surround, 0.85)}
        castShadow
        receiveShadow
      />
      {/* slim cill line under the opening */}
      <CBox
        size={[w + bt * 2, 0.05, 0.1]}
        position={[0, -(h / 2 + 0.025), 0.06]}
        color={surround}
        castShadow={false}
      />
      {/* dark lining sleeving the punched reveal */}
      {([-1, 1] as const).map((s) => (
        <mesh
          key={`j${s}`}
          position={[s * (w / 2 - lt / 2), 0, lz]}
          material={lining}
          castShadow={false}
        >
          <boxGeometry args={[lt, h, ld]} />
        </mesh>
      ))}
      {([-1, 1] as const).map((s) => (
        <mesh
          key={`h${s}`}
          position={[0, s * (h / 2 - lt / 2), lz]}
          material={lining}
          castShadow={false}
        >
          <boxGeometry args={[innerW, lt, ld]} />
        </mesh>
      ))}
      {/* slim sash frame at the back of the reveal */}
      {([-1, 1] as const).map((s) => (
        <mesh
          key={`fj${s}`}
          position={[s * (innerW / 2 - ft / 2), 0, glassZ + 0.02]}
          material={sash}
          castShadow={false}
        >
          <boxGeometry args={[ft, innerH, 0.045]} />
        </mesh>
      ))}
      {([-1, 1] as const).map((s) => (
        <mesh
          key={`fh${s}`}
          position={[0, s * (innerH / 2 - ft / 2), glassZ + 0.02]}
          material={sash}
          castShadow={false}
        >
          <boxGeometry args={[innerW - ft * 2, ft, 0.045]} />
        </mesh>
      ))}
      {/* central mullion splits the unit into a pair */}
      <mesh position={[0, 0, glassZ + 0.015]} material={sash} castShadow={false}>
        <boxGeometry args={[0.06, innerH - ft * 2, 0.035]} />
      </mesh>
      {/* transparent glass only — no interior plane blocking the view */}
      <mesh position={[0, 0, glassZ]} material={glassMaterial()} castShadow={false}>
        <planeGeometry args={[innerW - 0.02, innerH - 0.02]} />
      </mesh>
    </group>
  );
}

/* --------------------------------- interiors -------------------------------- */

/** Off-white plaster on every surface of the converted room. */
const ROOM = "#cfc7b7";

type RoomKind = "bed" | "office" | "bath";

/**
 * How the conversion is divided, as fractions across the width of the loft.
 * These mirror the priced layouts in `config.ts` — B buys an ensuite off the
 * bedroom, C splits the bedroom in two, D turns the second room into a study.
 */
const LAYOUT_ROOMS: Record<LoftLayoutId, Array<{ x0: number; x1: number; kind: RoomKind }>> = {
  a: [{ x0: 0, x1: 1, kind: "bed" }],
  b: [
    { x0: 0, x1: 0.72, kind: "bed" },
    { x0: 0.72, x1: 1, kind: "bath" },
  ],
  c: [
    { x0: 0, x1: 0.42, kind: "bed" },
    { x0: 0.42, x1: 0.78, kind: "bed" },
    { x0: 0.78, x1: 1, kind: "bath" },
  ],
  d: [
    { x0: 0, x1: 0.44, kind: "bed" },
    { x0: 0.44, x1: 0.78, kind: "office" },
    { x0: 0.78, x1: 1, kind: "bath" },
  ],
};

/**
 * The converted loft itself: a plastered shell, the partitions the chosen
 * layout implies, and enough furniture for each room to read as what it is
 * through a dormer window. It also does the structural job of closing the
 * loft off — without a floor and a back wall you look straight through the
 * glazing at the underside of the roof.
 */
function LoftRoom({
  w,
  h,
  zBack,
  zFront,
  floorY,
  layout,
  innerTo,
}: {
  /** clear internal width */
  w: number;
  /** floor to ceiling */
  h: number;
  /** z of the wall furthest from the windows (the ridge side) */
  zBack: number;
  /** z the floor runs out to */
  zFront: number;
  floorY: number;
  layout: LoftLayoutId;
  /**
   * Where the full-height pieces — walls, partitions, ceiling — have to stop.
   * A mansard face leans back as it rises, so anything built to the eave line
   * would break out through it near the head. The floor still runs to
   * `zFront`, below the windows where nothing can poke through.
   */
  innerTo?: number;
}) {
  const d = zFront - zBack;
  const innerD = (innerTo ?? zFront) - zBack;
  if (w < 0.5 || h < 0.5 || d < 0.5 || innerD < 0.3) return null;

  const shell = flatMaterial(ROOM, 0.95);
  const midZ = (zBack + zFront) / 2;
  const innerZ = zBack + innerD / 2;
  const rooms = LAYOUT_ROOMS[layout];

  return (
    <group>
      {/* floor */}
      <TexBox
        size={[w, 0.04, d]}
        position={[0, floorY - 0.02, midZ]}
        matId="oakFloor"
        castShadow={false}
      />
      {/* ceiling */}
      <mesh position={[0, floorY + h, innerZ]} material={shell} castShadow={false}>
        <boxGeometry args={[w, 0.04, innerD]} />
      </mesh>
      {/* back wall, against the ridge */}
      <mesh position={[0, floorY + h / 2, zBack]} material={shell} castShadow={false}>
        <boxGeometry args={[w, h, 0.04]} />
      </mesh>
      {/* side walls */}
      {([-1, 1] as const).map((s) => (
        <mesh
          key={s}
          position={[(s * w) / 2, floorY + h / 2, innerZ]}
          material={shell}
          castShadow={false}
        >
          <boxGeometry args={[0.04, h, innerD]} />
        </mesh>
      ))}

      {/* partitions between rooms */}
      {rooms.slice(1).map((r) => (
        <mesh
          key={`part-${r.x0}`}
          position={[(r.x0 - 0.5) * w, floorY + h / 2, innerZ]}
          material={shell}
          castShadow={false}
        >
          <boxGeometry args={[0.09, h, innerD]} />
        </mesh>
      ))}

      {/* what each room is furnished with */}
      {rooms.map((r) => {
        const zoneW = (r.x1 - r.x0) * w - 0.14;
        if (zoneW < 0.55) return null;
        const cx = ((r.x0 + r.x1) / 2 - 0.5) * w;
        const props = { zoneW, roomD: innerD, cx, zBack, floorY };
        if (r.kind === "bed") return <Bed key={`${r.kind}${r.x0}`} {...props} />;
        if (r.kind === "office") return <Desk key={`${r.kind}${r.x0}`} {...props} />;
        return <Ensuite key={`${r.kind}${r.x0}`} {...props} />;
      })}
    </group>
  );
}

interface FurnitureProps {
  /** clear width of the room this piece sits in */
  zoneW: number;
  /** clear depth of the loft, front to back */
  roomD: number;
  /** centre of the room in x */
  cx: number;
  /** z of the back wall — furniture stands against it, facing the windows */
  zBack: number;
  floorY: number;
}

/** Double bed against the back wall: base, duvet, pillows, headboard. */
function Bed({ zoneW, roomD, cx, zBack, floorY }: FurnitureProps) {
  const bw = Math.min(1.35, zoneW * 0.78);
  const bd = Math.min(1.95, roomD * 0.74);
  return (
    <group position={[cx, floorY, zBack + bd / 2 + 0.12]}>
      <CBox size={[bw, 0.26, bd]} position={[0, 0.13, 0]} color="#7a6448" castShadow={false} />
      <CBox
        size={[bw - 0.05, 0.14, bd * 0.68]}
        position={[0, 0.33, bd * 0.14]}
        color="#e9e4d9"
        castShadow={false}
      />
      <CBox
        size={[bw * 0.82, 0.11, 0.32]}
        position={[0, 0.33, -bd / 2 + 0.24]}
        color="#f4f1ea"
        castShadow={false}
      />
      <CBox
        size={[bw, 0.6, 0.05]}
        position={[0, 0.3, -bd / 2 - 0.03]}
        color="#6a563f"
        castShadow={false}
      />
    </group>
  );
}

/** Study: desk against the back wall with a chair pulled out from it. */
function Desk({ zoneW, roomD, cx, zBack, floorY }: FurnitureProps) {
  const dw = Math.min(1.25, zoneW * 0.82);
  const dd = Math.min(0.55, roomD * 0.3);
  return (
    <group position={[cx, floorY, zBack + dd / 2 + 0.14]}>
      <CBox size={[dw, 0.05, dd]} position={[0, 0.73, 0]} color="#8d7455" castShadow={false} />
      {([-1, 1] as const).map((s) => (
        <CBox
          key={s}
          size={[0.06, 0.71, 0.06]}
          position={[s * (dw / 2 - 0.06), 0.355, 0]}
          color="#4a4038"
          castShadow={false}
        />
      ))}
      <CBox
        size={[0.42, 0.05, 0.42]}
        position={[0, 0.44, dd / 2 + 0.34]}
        color="#3f4449"
        castShadow={false}
      />
      <CBox
        size={[0.42, 0.48, 0.05]}
        position={[0, 0.7, dd / 2 + 0.53]}
        color="#3f4449"
        castShadow={false}
      />
    </group>
  );
}

/** Ensuite: vanity unit and mirror on the back wall, glass shower screen. */
function Ensuite({ zoneW, roomD, cx, zBack, floorY }: FurnitureProps) {
  const vw = Math.min(0.72, zoneW * 0.66);
  const screenZ = Math.min(0.9, roomD * 0.45);
  return (
    <group position={[cx, floorY, zBack]}>
      <CBox size={[vw, 0.78, 0.4]} position={[0, 0.39, 0.28]} color="#e2ddd2" castShadow={false} />
      <CBox
        size={[vw + 0.05, 0.05, 0.44]}
        position={[0, 0.8, 0.28]}
        color="#f3f0e9"
        castShadow={false}
      />
      <CBox
        size={[vw * 0.78, 0.5, 0.02]}
        position={[0, 1.42, 0.05]}
        color="#b9c2c6"
        castShadow={false}
      />
      {/* frameless shower screen further down the room */}
      <mesh
        position={[0, 0.9, screenZ + 0.5]}
        material={glassMaterial()}
        castShadow={false}
      >
        <planeGeometry args={[Math.max(0.4, vw), 1.8]} />
      </mesh>
    </group>
  );
}
