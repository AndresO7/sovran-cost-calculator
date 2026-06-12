"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Townhouse } from "./models/Townhouse";
import { Villa } from "./models/Villa";
import { CalculatorState } from "./state";

/**
 * The architect's-model viewport: deep #0a0a0a studio, warm key light,
 * cool rim, gold-lit windows. Client-only (loaded with ssr: false).
 */
export default function Scene({ state }: { state: CalculatorState }) {
  const [interacted, setInteracted] = useState(false);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [11.5, 7, 12.5], fov: 36 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0d0c0a"]} />
      <fog attach="fog" args={["#0d0c0a", 24, 52]} />

      <hemisphereLight args={["#3d4256", "#181410", 0.55]} />
      <directionalLight
        position={[9, 12, 7]}
        intensity={1.9}
        color="#ffe2c2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-far={45}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-10, 5.5, -8]} intensity={0.5} color="#8fa0d8" />

      {state.prototype === "townhouse" ? (
        <Townhouse key="townhouse" state={state} />
      ) : (
        <Villa key="villa" state={state} />
      )}

      <GlowDisc />

      <OrbitControls
        target={[0, 2.8, -1]}
        autoRotate={!interacted}
        autoRotateSpeed={0.45}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={8}
        maxDistance={28}
        minPolarAngle={0.2}
        maxPolarAngle={1.42}
        onStart={() => setInteracted(true)}
      />
    </Canvas>
  );
}

/** Faint warm radial pool of light beneath the plinth, seats the model. */
function GlowDisc() {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    grad.addColorStop(0, "rgba(201, 169, 110, 0.55)");
    grad.addColorStop(0.45, "rgba(201, 169, 110, 0.14)");
    grad.addColorStop(1, "rgba(201, 169, 110, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <mesh position={[0, -0.58, -1]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[17, 48]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
