import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import { ExtRoofId, FRAMES, FrameId, GlazingId, LoftFinishId, MaterialId } from "../config";
import { flatMaterial, windowMaterial } from "./materials";
import { CBox, LeanTo, TexBox, usePopIn, Win } from "./parts";

export const EXT_WALL_H = 2.9;

interface ExtensionProps {
  width: number;
  depth: number;
  wrap?: boolean;
  material: MaterialId;
  roof: ExtRoofId;
  glazing: GlazingId;
  frame: FrameId;
  /** whole-house roof finish, also used on the pitched lean-to */
  roofFinish: LoftFinishId;
  /** group x offset (e.g. flush-left for the villa wrap-around) */
  offsetX?: number;
  houseWidth: number;
}

/**
 * Parametric rear extension. Anchored to the house face at z=0 and growing
 * into the garden (+z). Size changes morph smoothly: children are built at
 * their exact target dimensions and the group rescales from old/new → 1.
 */
export function Extension({
  width,
  depth,
  wrap = false,
  material,
  roof,
  glazing,
  frame,
  roofFinish,
  offsetX = 0,
  houseWidth,
}: ExtensionProps) {
  const frameColor = FRAMES[frame].color;
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
    easing.damp(group.current.position, "x", offsetX, 0.2, dt);
  });

  const wallH = EXT_WALL_H;
  const flatTop = roof !== "pitched";

  // glazing layout on the garden-facing facade
  const panelCount = glazing === "french" ? 2 : glazing === "sliding" ? 3 : 5;
  const glassTotal =
    glazing === "french"
      ? Math.min(2.2, width - 1)
      : Math.min(width * (glazing === "bifold" ? 0.82 : 0.72), width - 0.7);
  const glassH = 2.3;
  const panelW = glassTotal / panelCount;

  // skylights along the flat roof
  const skylightCount = depth >= 6 ? 3 : 2;
  const skylightW = Math.min(1.5, width * 0.42);
  const skylightMargin = 0.9;
  const skylightSpan = depth - skylightMargin * 2;

  return (
    <group ref={group} position={[offsetX, 0, 0]}>
      <TexBox
        size={[width, wallH, depth]}
        position={[0, wallH / 2, depth / 2]}
        matId={material}
      />

      {flatTop && (
        <>
          <CBox
            size={[width + 0.14, 0.07, depth + 0.14]}
            position={[0, wallH - 0.035, depth / 2]}
            color="#d8d2c6"
            castShadow={false}
          />
          <CBox
            size={[width + 0.1, 0.16, depth + 0.1]}
            position={[0, wallH + 0.08, depth / 2]}
            color="#2e3136"
          />
        </>
      )}

      {roof === "skylights" &&
        Array.from({ length: skylightCount }, (_, i) => {
          const z = skylightMargin + (skylightSpan * i) / (skylightCount - 1);
          return (
            <group key={i} position={[0, wallH + 0.16, z]}>
              <mesh material={flatMaterial(frameColor, 0.5)} castShadow={false}>
                <boxGeometry args={[skylightW + 0.14, 0.09, 1.04]} />
              </mesh>
              <mesh
                position={[0, 0.05, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                material={windowMaterial(1.8)}
                castShadow={false}
              >
                <planeGeometry args={[skylightW, 0.9]} />
              </mesh>
            </group>
          );
        })}

      {roof === "pitched" && (
        <LeanTo
          w={width}
          depth={depth}
          rise={0.85}
          wallTop={wallH}
          matId={roofFinish}
          cheekMatId={material}
        />
      )}

      {/* garden-facing glazing */}
      <group position={[0, 0, depth]}>
        <CBox
          size={[glassTotal + 0.22, glassH + 0.16, 0.12]}
          position={[0, glassH / 2 + 0.04, 0]}
          color={frameColor}
          castShadow={false}
        />
        {Array.from({ length: panelCount }, (_, i) => {
          const x = -glassTotal / 2 + panelW * (i + 0.5);
          return (
            <mesh
              key={i}
              position={[x, glassH / 2 + 0.04, 0.065]}
              material={windowMaterial(1.6)}
              castShadow={false}
            >
              <planeGeometry args={[panelW - 0.08, glassH - 0.12]} />
            </mesh>
          );
        })}
      </group>

      {/* side window on deeper extensions */}
      {depth >= 5 && (
        <Win
          w={1.1}
          h={1.2}
          position={[width / 2 + 0.04, 1.6, depth * 0.55]}
          rotation={[0, Math.PI / 2, 0]}
          bars={false}
          frameColor={frameColor}
        />
      )}

      {/* warm light spilling onto the patio */}
      <pointLight
        position={[0, 1.7, depth + 0.9]}
        color="#e9b878"
        intensity={4}
        distance={6.5}
        decay={2}
      />

      {wrap && (
        <SideReturn
          wallH={wallH}
          material={material}
          frameColor={frameColor}
          houseWidth={houseWidth}
          offsetX={offsetX}
        />
      )}
    </group>
  );
}

/** Villa wrap-around: side return running along the flank of the house. */
function SideReturn({
  wallH,
  material,
  frameColor,
  houseWidth,
  offsetX,
}: {
  wallH: number;
  material: MaterialId;
  frameColor: string;
  houseWidth: number;
  offsetX: number;
}) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.01);
  const w = 2.2;
  const len = 5;
  // flush against the house's outer wall, in world space (undo the group offset)
  const x = -houseWidth / 2 - w / 2 - offsetX;
  return (
    <group ref={ref} position={[x, 0, -len / 2]}>
      <TexBox size={[w, wallH, len]} position={[0, wallH / 2, 0]} matId={material} />
      <CBox
        size={[w + 0.12, 0.07, len + 0.12]}
        position={[0, wallH - 0.035, 0]}
        color="#d8d2c6"
        castShadow={false}
      />
      <CBox
        size={[w + 0.08, 0.16, len + 0.08]}
        position={[0, wallH + 0.08, 0]}
        color="#2e3136"
      />
      {[-1.4, 1.4].map((z) => (
        <group key={z} position={[0, wallH + 0.16, z]}>
          <mesh material={flatMaterial(frameColor, 0.5)} castShadow={false}>
            <boxGeometry args={[1.2, 0.09, 0.94]} />
          </mesh>
          <mesh
            position={[0, 0.05, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            material={windowMaterial(1.8)}
            castShadow={false}
          >
            <planeGeometry args={[1.05, 0.8]} />
          </mesh>
        </group>
      ))}
      <Win
        w={1}
        h={1.3}
        position={[-w / 2 - 0.04, 1.55, 0.8]}
        rotation={[0, -Math.PI / 2, 0]}
        bars={false}
        frameColor={frameColor}
      />
    </group>
  );
}
