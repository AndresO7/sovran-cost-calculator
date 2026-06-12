import { useMemo } from "react";
import * as THREE from "three";
import { flatMaterial, metricMaterial } from "./materials";
import { CBox, TexBox } from "./parts";

import { PatioId } from "../config";

interface GardenProps {
  variant: "townhouse" | "villa";
  houseW: number;
  houseD: number;
  patio: PatioId;
  ext: { w: number; d: number; offsetX: number; wrap?: boolean };
}

/**
 * The architect's-model plinth plus everything that dresses the plot:
 * lawn, patio, garden walls/hedges, planters. Plot coordinates follow the
 * house: front garden at z < -houseD, rear garden at z > 0.
 */
export function Garden({ variant, houseW, houseD, patio, ext }: GardenProps) {
  const cfg =
    variant === "townhouse"
      ? { plotW: 7.6, frontD: 2.4, rearD: 7.6 }
      : { plotW: 15.2, frontD: 2.8, rearD: 6.2 };

  const plotD = cfg.frontD + houseD + cfg.rearD;
  const plotCenterZ = (cfg.rearD - cfg.frontD - houseD) / 2;

  const patioW = Math.min(ext.w + 2.6, cfg.plotW - 0.8);
  const patioZ = ext.d + 1.25;

  return (
    <group>
      {/* monolith plinth */}
      <CBox
        size={[cfg.plotW + 0.9, 0.55, plotD + 0.9]}
        position={[0, -0.278, plotCenterZ]}
        color="#141414"
        roughness={0.45}
        metalness={0.15}
      />
      <CBox
        size={[cfg.plotW + 1.3, 0.14, plotD + 1.3]}
        position={[0, -0.49, plotCenterZ]}
        color="#1d1d1d"
        roughness={0.5}
      />
      {/* gold edge trim on the plinth top */}
      <PlinthTrim w={cfg.plotW + 0.9} d={plotD + 0.9} z={plotCenterZ} />

      {/* rear lawn */}
      <Lawn
        size={[cfg.plotW - 0.3, cfg.rearD - 0.25]}
        position={[0, 0.025, cfg.rearD / 2]}
      />
      {/* front lawn */}
      <Lawn
        size={[cfg.plotW - 0.3, cfg.frontD - 0.25]}
        position={[0, 0.025, -houseD - cfg.frontD / 2]}
      />
      {/* path to the front door */}
      <TexBox
        size={[1.1, 0.07, cfg.frontD]}
        position={[
          variant === "townhouse" ? 1.6 : 0,
          0.04,
          -houseD - cfg.frontD / 2,
        ]}
        matId="paving"
        castShadow={false}
      />
      {/* patio by the extension doors */}
      <TexBox
        size={[patioW, 0.08, 2.5]}
        position={[ext.offsetX, 0.045, patioZ]}
        matId={patio === "york" ? "paving" : patio}
        castShadow={false}
      />

      {/* boundaries */}
      {variant === "townhouse" ? (
        <>
          {[-1, 1].map((s) => (
            <TexBox
              key={s}
              size={[0.2, 1.55, cfg.rearD]}
              position={[(s * (cfg.plotW - 0.25)) / 2, 0.775, cfg.rearD / 2]}
              matId="houseBrick"
            />
          ))}
          <TexBox
            size={[cfg.plotW - 0.1, 1.55, 0.2]}
            position={[0, 0.775, cfg.rearD - 0.12]}
            matId="houseBrick"
          />
        </>
      ) : (
        <>
          {[-1, 1].map((s) => (
            <CBox
              key={s}
              size={[0.5, 1.35, cfg.rearD - 0.3]}
              position={[(s * (cfg.plotW - 0.6)) / 2, 0.675, cfg.rearD / 2]}
              color="#2c3520"
              roughness={1}
            />
          ))}
          <CBox
            size={[cfg.plotW - 0.7, 1.35, 0.5]}
            position={[0, 0.675, cfg.rearD - 0.3]}
            color="#2c3520"
            roughness={1}
          />
        </>
      )}

      {/* planters at the patio corners */}
      {[-1, 1].map((s) => (
        <Planter
          key={s}
          position={[ext.offsetX + (s * (patioW - 0.9)) / 2, 0, patioZ + 0.65]}
        />
      ))}

      {/* a tree for the villa garden */}
      {variant === "villa" && <Tree position={[-5.6, 0, 4.6]} />}
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
        color: "#2a230f",
        emissive: "#c9a96e",
        emissiveIntensity: 0.45,
        roughness: 0.4,
        metalness: 0.6,
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

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} material={flatMaterial("#3b2e24", 1)} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 2.2, 8]} />
      </mesh>
      <mesh position={[0, 2.6, 0]} material={flatMaterial("#36422a", 1)} castShadow>
        <icosahedronGeometry args={[1.05, 1]} />
      </mesh>
      <mesh position={[0.5, 2.0, 0.3]} material={flatMaterial("#2f3a24", 1)} castShadow>
        <icosahedronGeometry args={[0.7, 1]} />
      </mesh>
    </group>
  );
}
