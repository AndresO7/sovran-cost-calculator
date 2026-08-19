import { useMemo } from "react";
import * as THREE from "three";
import { metricMaterial } from "./materials";
import { CBox, TexBox } from "./parts";

interface GardenProps {
  houseW: number;
  houseD: number;
  ext: { w: number; d: number };
}

/**
 * The architect's-model plinth and the one piece of landscaping that stays:
 * a rear lawn. Plot coordinates follow the house: front garden at
 * z < -houseD, rear garden at z > 0.
 *
 * The lawn is deliberately held inside the width of the house and clear of
 * the extension — it reads as the garden the extension opens onto rather
 * than as a green carpet the model is sitting on, and nothing green ever
 * shows through the glazing.
 */
export function Garden({ houseW, houseD, ext }: GardenProps) {
  const plotW = houseW + 2.6;
  const frontD = 2.6;
  const rearD = 7.8;
  const plotD = frontD + houseD + rearD;
  const plotCenterZ = (rearD - frontD - houseD) / 2;

  // lawn runs from just clear of the extension's rear face to the back of
  // the plot; a deep extension simply leaves less garden behind it
  const lawnZ0 = ext.d + 0.5;
  const lawnZ1 = rearD - 0.3;
  const lawnD = lawnZ1 - lawnZ0;

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

      {/* rear lawn — house width, behind the extension */}
      {lawnD > 0.5 && (
        <Lawn size={[houseW, lawnD]} position={[0, 0.025, lawnZ0 + lawnD / 2]} />
      )}
      {/* path to the front door */}
      <TexBox
        size={[1.1, 0.07, frontD]}
        position={[1.7, 0.04, -houseD - frontD / 2]}
        matId="paving"
        castShadow={false}
      />
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
