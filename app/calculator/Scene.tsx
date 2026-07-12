"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { House } from "./models/House";
import { CalculatorState } from "./state";

/**
 * The architect's-model viewport: soft daylight on a warm cream studio,
 * gentle sun with cool sky fill. Client-only (loaded with ssr: false).
 */
export default function Scene({ state }: { state: CalculatorState }) {
  const [interacted, setInteracted] = useState(false);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [13.5, 8.5, 14.5], fov: 36 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#efe9dd"]} />
      <fog attach="fog" args={["#efe9dd", 34, 75]} />

      <hemisphereLight args={["#e8f0f8", "#cfc5b2", 0.95]} />
      {/* sun — warm, raking across the garden elevation */}
      <directionalLight
        position={[12, 16, 9]}
        intensity={2.1}
        color="#fff1dd"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-far={50}
        shadow-bias={-0.0004}
      />
      {/* front fill — lifts the street facade when orbiting round */}
      <directionalLight position={[4, 7, -12]} intensity={0.65} color="#f4ecdd" />
      {/* side fill — cool sky wash on the left flank */}
      <directionalLight position={[-12, 6, -2]} intensity={0.45} color="#dfe8f2" />

      <House state={state} />

      <OrbitControls
        target={[0, 2.4, -1]}
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
