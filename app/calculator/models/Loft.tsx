import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LoftFinishId, LoftTypeId } from "../config";
import {
  flatMaterial,
  glassMaterial,
  metricMaterial,
  TILE_METRES,
} from "./materials";
import { CBox, Chimney, TexBox, usePopIn, WallWithOpenings, Win } from "./parts";

interface LoftProps {
  type: LoftTypeId;
  finish: LoftFinishId;
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

/** Box on the rear slope, zinc-tray clad, chimney riding the ridge. */
function BoxDormer(props: LoftProps) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.05);
  const { roofW, slopeHalfD, eaveY, rise, rearEaveZ } = props;
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
  const winH = 1.5;
  const openings = useMemo(
    () => [-1, 1].map((s) => ({ x: s * w * 0.22, y: h / 2, w: winW, h: winH })),
    [w, h]
  );
  const interiorColor = "#1a1e21";

  return (
    <group ref={ref}>
      {/* Hollow dormer — left/right/back walls only, front has punched openings */}
      {/* LEFT wall */}
      <TexBox
        size={[wallT, h, bodyD]}
        position={[-w / 2 + wallT / 2, baseY + h / 2, bodyZ]}
        matId="zincPanels"
      />
      {/* RIGHT wall */}
      <TexBox
        size={[wallT, h, bodyD]}
        position={[w / 2 - wallT / 2, baseY + h / 2, bodyZ]}
        matId="zincPanels"
      />
      {/* BACK wall */}
      <TexBox
        size={[w - wallT * 2, h, wallT]}
        position={[0, baseY + h / 2, bodyZ - bodyD / 2 + wallT / 2]}
        matId="zincPanels"
      />
      {/* Dark interior surfaces */}
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
        matId="zincPanels"
        position={[0, baseY, frontZ - wallT]}
      />
      {/* ribbed zinc deck meeting the ridge, framed all round by a lip */}
      <TexBox
        size={[deckW, deckT, deckD]}
        position={[0, deckTopY - deckT / 2, deckZ]}
        matId="zincPanels"
      />
      <DeckFrame w={deckW} d={deckD} y={deckTopY + 0.02} z={deckZ} />
      {/* frameless glazing sunk inside the openings, like the reference */}
      {([-1, 1] as const).map((s) => (
        <RecessedGlazing
          key={s}
          w={winW}
          h={winH}
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
  position,
  depth = 0.1,
}: {
  w: number;
  h: number;
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
        material={flatMaterial("#23272b", 0.8)}
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
  const { roofW, slopeHalfD, eaveY, rise, rearEaveZ, finish } = props;
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

  const mansardInterior = flatMaterial("#1a1e21", 0.95);

  return (
    <group ref={ref}>
      {/* steep slated face with the windows set into it */}
      <group
        position={[0, eaveY + hVert / 2, rearEaveZ - run / 2]}
        rotation={[-alpha, 0, 0]}
      >
        <TexBox size={[w, faceLen, 0.14]} position={[0, 0, 0]} matId={finish} />
        {([-1, 1] as const).map((s) => (
          <DormerWindow key={s} w={0.92} h={1.5} position={[s * w * 0.22, 0.12, 0.07]} />
        ))}
        {/* Dark interior wall behind the slated face */}
        <mesh position={[0, 0, -0.08]} material={mansardInterior}>
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
 * Dormer window: a dark hood boxed out from the face, with the glazing
 * recessed deep inside it — the window's own frame edges sit tucked
 * behind the hood boards, like the reference dormers.
 */
function DormerWindow({
  w,
  h,
  position,
  proj = 0.2,
}: {
  w: number;
  h: number;
  position: [number, number, number];
  /** hood projection from the face */
  proj?: number;
}) {
  const bt = 0.07; // hood board thickness
  const innerW = w + 0.06; // window frame tucks 2cm behind the hood boards
  const innerH = h + 0.06;
  const hood = "#272c31";
  return (
    <group position={position}>
      {/* projecting hood — jambs full height, head lip slightly proud */}
      {([-1, 1] as const).map((s) => (
        <CBox
          key={s}
          size={[bt, innerH + bt * 2, proj]}
          position={[s * ((innerW + bt) / 2), 0, proj / 2]}
          color={hood}
        />
      ))}
      <CBox
        size={[innerW, bt, proj + 0.05]}
        position={[0, (innerH + bt) / 2, (proj + 0.05) / 2]}
        color={hood}
      />
      <CBox
        size={[innerW, bt, proj]}
        position={[0, -(innerH + bt) / 2, proj / 2]}
        color={hood}
        castShadow={false}
      />
      {/* light-catching cap over the head */}
      <CBox
        size={[innerW + bt * 2 + 0.04, 0.045, proj + 0.07]}
        position={[0, (innerH + bt) / 2 + bt / 2 + 0.015, (proj + 0.07) / 2 - 0.01]}
        color="#4d545b"
        castShadow={false}
      />
      {/* the stepped sash recedes from here back towards the face plane */}
      <Win w={w} h={h} bars={false} mullion frameColor="#2e3338" position={[0, 0, 0.11]} />
    </group>
  );
}

/** Dark interior surfaces for the dormer, visible through windows. */
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
