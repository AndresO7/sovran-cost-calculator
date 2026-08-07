import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FrameId, LOFT_FRAMES, LoftFinishId, LoftTypeId } from "../config";
import {
  flatMaterial,
  glassMaterial,
  metricMaterial,
  TILE_METRES,
} from "./materials";
import { CBox, Chimney, TexBox, usePopIn, WallWithOpenings } from "./parts";

interface LoftProps {
  type: LoftTypeId;
  finish: LoftFinishId;
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

/** Box on the rear slope, clad in the whole-roof finish, chimney riding the ridge. */
function BoxDormer(props: LoftProps) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.05);
  const { roofW, slopeHalfD, eaveY, rise, rearEaveZ, finish, frame } = props;
  const frameColor = LOFT_FRAMES[frame].color;
  const w = roofW - 1.7; // set back from both gables
  const frontZ = rearEaveZ - 0.4;
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
  const winW = 1.5;
  // A shallower house gives a lower roof and so a shorter dormer face. The
  // glazing has to follow it — punching a 1.5 m opening into a 1.4 m wall
  // leaves WallWithOpenings with negative-height pieces.
  const winH = Math.min(1.5, h - 0.45);
  const openings = useMemo(
    () => [-1, 1].map((s) => ({ x: s * w * 0.22, y: h / 2, w: winW, h: winH })),
    [w, h, winH]
  );
  const interiorColor = "#b8b0a1";

  return (
    <group ref={ref}>
      {/* Hollow dormer — left/right/back walls only, front has punched openings */}
      {/* LEFT wall */}
      <TexBox
        size={[wallT, h, bodyD]}
        position={[-w / 2 + wallT / 2, baseY + h / 2, bodyZ]}
        matId={finish}
      />
      {/* RIGHT wall */}
      <TexBox
        size={[wallT, h, bodyD]}
        position={[w / 2 - wallT / 2, baseY + h / 2, bodyZ]}
        matId={finish}
      />
      {/* BACK wall */}
      <TexBox
        size={[w - wallT * 2, h, wallT]}
        position={[0, baseY + h / 2, bodyZ - bodyD / 2 + wallT / 2]}
        matId={finish}
      />
      {/* Interior surfaces seen through the glazing */}
      <DormerInterior
        w={w}
        h={h}
        d={bodyD}
        wallT={wallT}
        baseY={baseY}
        bodyZ={bodyZ}
        color={interiorColor}
      />
      <WallWithOpenings
        w={w}
        h={h}
        t={wallT}
        openings={openings}
        matId={finish}
        position={[0, baseY, frontZ - wallT]}
      />
      {/* deck meeting the ridge in the same finish, framed all round by a lip */}
      <TexBox
        size={[deckW, deckT, deckD]}
        position={[0, deckTopY - deckT / 2, deckZ]}
        matId={finish}
      />
      <DeckFrame w={deckW} d={deckD} y={deckTopY + 0.02} z={deckZ} />
      {/* frameless glazing sunk inside the openings, like the reference */}
      {([-1, 1] as const).map((s) => (
        <RecessedGlazing
          key={s}
          w={winW}
          h={winH}
          frameColor={frameColor}
          position={[s * w * 0.22, baseY + h / 2, frontZ]}
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
  const { roofW, slopeHalfD, eaveY, rise, rearEaveZ, finish, frame } = props;
  const frameColor = LOFT_FRAMES[frame].color;
  const alpha = 0.3; // lean from vertical, radians (~17°)
  const w = roofW - 0.6;
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
    const m = metricMaterial(finish, TILE_METRES, TILE_METRES).clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [finish]);

  const mansardInterior = flatMaterial("#b8b0a1", 0.95);

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
          matId={finish}
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
        {/* Interior wall behind the slated face, seen through the glazing */}
        <mesh position={[0, 0, -0.095]} material={mansardInterior}>
          <boxGeometry args={[w - 0.3, faceLen - 0.2, 0.02]} />
        </mesh>
      </group>

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

/** Interior surfaces for the dormer, visible through windows. */
function DormerInterior({
  w,
  h,
  d,
  wallT,
  baseY,
  bodyZ,
  color,
}: {
  w: number;
  h: number;
  d: number;
  wallT: number;
  baseY: number;
  bodyZ: number;
  color: string;
}) {
  const mat = flatMaterial(color, 0.95);
  const innerW = w - wallT * 2;
  const innerD = d - wallT;

  return (
    <group>
      {/* floor */}
      <mesh position={[0, baseY + 0.01, bodyZ]} material={mat}>
        <boxGeometry args={[innerW, 0.02, innerD]} />
      </mesh>
      {/* ceiling */}
      <mesh position={[0, baseY + h - 0.01, bodyZ]} material={mat}>
        <boxGeometry args={[innerW, 0.02, innerD]} />
      </mesh>
      {/* left interior wall */}
      <mesh position={[-w / 2 + wallT + 0.01, baseY + h / 2, bodyZ]} material={mat}>
        <boxGeometry args={[0.02, h, innerD]} />
      </mesh>
      {/* right interior wall */}
      <mesh position={[w / 2 - wallT - 0.01, baseY + h / 2, bodyZ]} material={mat}>
        <boxGeometry args={[0.02, h, innerD]} />
      </mesh>
      {/* back interior wall */}
      <mesh position={[0, baseY + h / 2, bodyZ - innerD / 2 + 0.01]} material={mat}>
        <boxGeometry args={[innerW, h, 0.02]} />
      </mesh>
    </group>
  );
}
