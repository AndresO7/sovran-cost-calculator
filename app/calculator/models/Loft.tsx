import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LoftFinishId, LoftTypeId } from "../config";
import { metricMaterial, TILE_METRES } from "./materials";
import { CBox, Chimney, TexBox, usePopIn, Win } from "./parts";

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

/** Zinc standing-seam box on the rear slope, chimney riding the ridge. */
function BoxDormer(props: LoftProps) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.05);
  const { roofW, slopeHalfD, eaveY, rise, rearEaveZ } = props;
  const w = roofW - 1.7; // set back from both gables
  const frontZ = rearEaveZ - 0.4;
  const ridgeZ = rearEaveZ - slopeHalfD;
  const baseY = eaveY + 0.2;
  const roofT = 0.12;
  // the flat roof sits level with the main ridge and runs back to meet it
  const topY = eaveY + rise;
  const h = topY - roofT - baseY;
  const dDepth = frontZ - (ridgeZ + 0.02);
  const centreZ = frontZ - dDepth / 2;
  return (
    <group ref={ref}>
      <TexBox
        size={[w, h, dDepth]}
        position={[0, baseY + h / 2, centreZ]}
        matId="zinc"
      />
      {/* zinc roof — same standing-seam cladding as the walls, slim drip edge */}
      <TexBox
        size={[w + 0.16, roofT, dDepth + 0.2]}
        position={[0, topY - roofT / 2 + 0.03, centreZ]}
        matId="zinc"
      />
      <CBox
        size={[w + 0.26, 0.05, dDepth + 0.24]}
        position={[0, topY - roofT + 0.01, centreZ]}
        color="#7d8388"
        castShadow={false}
      />
      {/* two double windows — dark frames with a central mullion */}
      {([-1, 1] as const).map((s) => (
        <Win
          key={s}
          w={1.5}
          h={1.5}
          bars={false}
          mullion
          frameColor="#33383d"
          position={[s * w * 0.22, baseY + h / 2, frontZ + 0.04]}
        />
      ))}
      {/* the conversion brings the stack back, riding the ridge at the gable */}
      <Chimney position={[roofW / 2 - 0.62, eaveY + rise - 0.35, ridgeZ + 0.05]} />
    </group>
  );
}

/**
 * Mansard: the rear slope re-clad as a steep slate face with windows set
 * into it, slate side cheeks and a light flat deck dying into the main roof.
 */
function MansardDormer(props: LoftProps) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.05);
  const { roofW, slopeHalfD, eaveY, rise, rearEaveZ, finish } = props;
  const alpha = 0.3; // lean from vertical, radians (~17°)
  const w = roofW - 0.6;
  const hVert = rise * 0.86;
  const faceLen = hVert / Math.cos(alpha);
  const run = hVert * Math.tan(alpha);
  const topY = eaveY + hVert;
  const topZ = rearEaveZ - run;
  // the deck runs forward only until the main rear slope overtakes it, so the
  // upper sliver of the roof and the ridge stay visible above the flat top
  const meetZ = rearEaveZ - slopeHalfD * (hVert / rise);
  const deckFrontZ = meetZ - 0.2;
  const deckRearZ = topZ + 0.12;

  // slate cheeks: eave → face head → under the deck, buried into the roof
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

  return (
    <group ref={ref}>
      {/* steep slated face with the windows set into it */}
      <group
        position={[0, eaveY + hVert / 2, rearEaveZ - run / 2]}
        rotation={[-alpha, 0, 0]}
      >
        <TexBox size={[w, faceLen, 0.14]} position={[0, 0, 0]} matId={finish} />
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[s * w * 0.22, -0.04, 0]}>
            {/* slim surround, hooded head and cill, barely proud of the slate */}
            <CBox size={[1.1, 1.64, 0.26]} position={[0, 0, 0.06]} color="#5d646b" />
            <CBox size={[1.2, 0.08, 0.3]} position={[0, 0.84, 0.07]} color="#4d545b" />
            <CBox size={[1.16, 0.06, 0.24]} position={[0, -0.84, 0.06]} color="#6a7178" castShadow={false} />
            <Win w={0.86} h={1.42} bars={false} frameColor="#2e3338" position={[0, 0, 0.115]} />
          </group>
        ))}
      </group>

      {/* slate cheeks close the sides */}
      <mesh geometry={cheekGeo} material={cheekMat} castShadow receiveShadow />

      {/* light flat deck with a slim edge trim along the head */}
      <CBox
        size={[w + 0.04, 0.1, deckRearZ - deckFrontZ]}
        position={[0, topY + 0.03, (deckRearZ + deckFrontZ) / 2]}
        color="#aab0b5"
      />
      <CBox
        size={[w + 0.12, 0.07, 0.28]}
        position={[0, topY + 0.045, topZ + 0.04]}
        color="#bcc0c4"
        castShadow={false}
      />
    </group>
  );
}
