import { useRef } from "react";
import * as THREE from "three";
import { LoftFinishId, LoftTypeId } from "../config";
import { flatMaterial, windowMaterial } from "./materials";
import { CBox, TexBox, usePopIn, Win } from "./parts";

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
  /** cap for dormer width (hipped roofs have less room) */
  maxDormerW?: number;
}

/**
 * Loft conversion pieces sitting on the rear roof slope.
 * "hipToGable" is handled by the host roof geometry, not here.
 */
export function Loft(props: LoftProps) {
  switch (props.type) {
    case "velux":
      return <Velux {...props} />;
    case "dormer":
      return <Dormer {...props} />;
    case "mansard":
      return <Mansard {...props} />;
    default:
      return null;
  }
}

/** Position/rotation for an object lying on the rear slope at fraction t. */
function slopePose(p: LoftProps, t: number, lift = 0.045) {
  const { slopeHalfD, eaveY, rise, rearEaveZ } = p;
  const len = Math.hypot(slopeHalfD, rise);
  const nY = slopeHalfD / len;
  const nZ = rise / len;
  const z = rearEaveZ - t * slopeHalfD + nZ * lift;
  const y = eaveY + t * rise + nY * lift;
  const rotX = -Math.atan2(slopeHalfD, rise);
  return { position: [0, y, z] as [number, number, number], rotX };
}

function Velux(props: LoftProps) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.4);
  const { position, rotX } = slopePose(props, 0.45);
  const count = props.roofW > 7 ? 3 : 2;
  const spread = Math.min(props.roofW * 0.5, 4.2);
  return (
    <group ref={ref} position={position} rotation={[rotX, 0, 0]}>
      {Array.from({ length: count }, (_, i) => {
        const x = -spread / 2 + (spread * i) / (count - 1);
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh material={flatMaterial("#1c1e22", 0.5)} castShadow={false}>
              <boxGeometry args={[0.78, 1.18, 0.07]} />
            </mesh>
            <mesh position={[0, 0, 0.04]} material={windowMaterial(1.8)} castShadow={false}>
              <planeGeometry args={[0.62, 1.02]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Dormer(props: LoftProps) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.05);
  const { roofW, eaveY, rearEaveZ, finish, maxDormerW } = props;
  const w = Math.min(roofW * 0.58, maxDormerW ?? Infinity);
  const h = 1.75;
  const dDepth = 2.3;
  const frontZ = rearEaveZ - 0.85;
  const baseY = eaveY + 0.3;
  const winCount = w > 3.4 ? 3 : 2;
  return (
    <group ref={ref}>
      <TexBox
        size={[w, h, dDepth]}
        position={[0, baseY + h / 2, frontZ - dDepth / 2]}
        matId={finish}
      />
      <CBox
        size={[w + 0.16, 0.1, dDepth + 0.16]}
        position={[0, baseY + h + 0.05, frontZ - dDepth / 2]}
        color="#2e3136"
      />
      <CBox
        size={[w + 0.1, 0.08, dDepth + 0.1]}
        position={[0, baseY + h - 0.04, frontZ - dDepth / 2]}
        color="#d8d2c6"
        castShadow={false}
      />
      {Array.from({ length: winCount }, (_, i) => {
        const span = w - 1;
        const x = -span / 2 + (span * i) / (winCount - 1);
        return (
          <Win
            key={i}
            w={0.85}
            h={1.15}
            position={[x, baseY + h / 2 - 0.05, frontZ + 0.04]}
          />
        );
      })}
    </group>
  );
}

function Mansard(props: LoftProps) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.05);
  const { roofW, slopeHalfD, eaveY, rise, rearEaveZ, finish } = props;
  const alpha = 0.3; // lean from vertical, radians (~17°)
  const w = roofW - 0.6;
  const hVert = rise * 0.92;
  const faceLen = hVert / Math.cos(alpha);
  const run = hVert * Math.tan(alpha);
  const topZ = rearEaveZ - run;
  const ridgeZ = rearEaveZ - slopeHalfD;
  const slabLen = Math.abs(topZ - ridgeZ) + 0.25;
  return (
    <group ref={ref}>
      {/* steep slated face */}
      <group
        position={[0, eaveY + hVert / 2, rearEaveZ - run / 2]}
        rotation={[-alpha, 0, 0]}
      >
        <TexBox size={[w, faceLen, 0.16]} position={[0, 0, 0]} matId={finish} />
        {[-w / 4 - 0.35, 0, w / 4 + 0.35].map((x) => (
          <Win key={x} w={0.85} h={1.1} position={[x, -0.1, 0.12]} />
        ))}
      </group>
      {/* flat top deck back to the ridge */}
      <CBox
        size={[w, 0.12, slabLen]}
        position={[0, eaveY + hVert + 0.02, (topZ + ridgeZ) / 2]}
        color="#2e3136"
      />
      {/* side cheeks */}
      {[-1, 1].map((s) => (
        <CBox
          key={s}
          size={[0.14, hVert, run + 0.45]}
          position={[(s * w) / 2, eaveY + hVert / 2, rearEaveZ - (run + 0.45) / 2]}
          color="#33373d"
        />
      ))}
    </group>
  );
}
