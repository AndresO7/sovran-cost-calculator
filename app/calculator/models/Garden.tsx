import { useMemo } from "react";
import * as THREE from "three";
import { flatMaterial, metricMaterial } from "./materials";
import { CBox, TexBox } from "./parts";

import { PatioId } from "../config";

interface GardenProps {
  houseW: number;
  houseD: number;
  patio: PatioId;
  ext: { w: number; d: number };
}

/**
 * The architect's-model plinth plus everything that dresses the plot:
 * lawn, patio, planters. Plot coordinates follow the house: front garden
 * at z < -houseD, rear garden at z > 0.
 */
export function Garden({ houseW, houseD, patio, ext }: GardenProps) {
  const plotW = houseW + 2.6;
  const frontD = 2.6;
  const rearD = 7.8;
  const plotD = frontD + houseD + rearD;
  const plotCenterZ = (rearD - frontD - houseD) / 2;

  const patioW = Math.min(ext.w + 2.2, plotW - 0.8);
  const patioZ = ext.d + 1.2;

  return (
    <group>
      {/* pale stone plinth */}
      <CBox
        size={[plotW + 0.9, 0.55, plotD + 0.9]}
        position={[0, -0.278, plotCenterZ]}
        color="#d8d2c4"
        roughness={0.85}
      />
      <CBox
        size={[plotW + 1.3, 0.14, plotD + 1.3]}
        position={[0, -0.49, plotCenterZ]}
        color="#c6c0b2"
        roughness={0.9}
      />
      {/* crisp edge trim on the plinth top */}
      <PlinthTrim w={plotW + 0.9} d={plotD + 0.9} z={plotCenterZ} />

      {/* rear lawn */}
      <Lawn size={[plotW - 0.3, rearD - 0.25]} position={[0, 0.025, rearD / 2]} />
      {/* front lawn */}
      <Lawn
        size={[plotW - 0.3, frontD - 0.25]}
        position={[0, 0.025, -houseD - frontD / 2]}
      />
      {/* path to the front door */}
      <TexBox
        size={[1.1, 0.07, frontD]}
        position={[1.7, 0.04, -houseD - frontD / 2]}
        matId="paving"
        castShadow={false}
      />
      {/* patio by the extension doors */}
      <TexBox
        size={[patioW, 0.08, 2.4]}
        position={[0, 0.045, patioZ]}
        matId={patio === "york" ? "paving" : patio}
        castShadow={false}
      />

      {/* planters at the patio corners */}
      {[-1, 1].map((s) => (
        <Planter key={s} position={[(s * (patioW - 0.9)) / 2, 0, patioZ + 0.6]} />
      ))}
    </group>
  );
}

function Lawn({
  size,
  position,
}: {
  size: [number, number];
  position: [number, number, number];
}) {
  return (
    <mesh
      position={position}
      material={metricMaterial("grass", size[0], size[1])}
      receiveShadow
    >
      <boxGeometry args={[size[0], 0.05, size[1]]} />
    </mesh>
  );
}

function PlinthTrim({ w, d, z }: { w: number; d: number; z: number }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#a89f8d",
        roughness: 0.6,
      }),
    []
  );
  const t = 0.035;
  const y = 0.0;
  return (
    <group>
      <mesh position={[0, y, z - d / 2]} material={mat}>
        <boxGeometry args={[w, t, t]} />
      </mesh>
      <mesh position={[0, y, z + d / 2]} material={mat}>
        <boxGeometry args={[w, t, t]} />
      </mesh>
      <mesh position={[-w / 2, y, z]} material={mat}>
        <boxGeometry args={[t, t, d]} />
      </mesh>
      <mesh position={[w / 2, y, z]} material={mat}>
        <boxGeometry args={[t, t, d]} />
      </mesh>
    </group>
  );
}

function Planter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <CBox size={[0.52, 0.48, 0.52]} position={[0, 0.24, 0]} color="#1b1b1b" roughness={0.6} />
      <mesh position={[0, 0.78, 0]} material={flatMaterial("#3c4a2c", 1)} castShadow>
        <icosahedronGeometry args={[0.36, 1]} />
      </mesh>
    </group>
  );
}
