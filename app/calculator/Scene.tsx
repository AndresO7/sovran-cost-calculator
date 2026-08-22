"use client";

import { useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { House } from "./models/House";
import { setGlassEnvMap } from "./models/materials";
import { CalculatorState } from "./state";
import { CaptureRef } from "./thumbnail";

/**
 * Procedural studio env-map fed to the glazing only — gives the glass
 * sky/room reflections without touching the analytic lighting elsewhere.
 */
function GlassEnvironment() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    setGlassEnvMap(env.texture);
    pmrem.dispose();
    return () => {
      setGlassEnvMap(null);
      env.texture.dispose();
    };
  }, [gl]);
  return null;
}

/**
 * Expone una función de captura al exterior del Canvas. Renderiza a demanda y
 * lee el buffer en el mismo tick: así no hace falta preserveDrawingBuffer, que
 * obligaría a conservar el framebuffer en cada fotograma de la escena.
 */
function CaptureBridge({ captureRef }: { captureRef: CaptureRef }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    captureRef.current = () => {
      try {
        gl.render(scene, camera);
        return gl.domElement.toDataURL("image/webp", 0.9);
      } catch {
        return null;
      }
    };
    return () => {
      captureRef.current = null;
    };
  }, [captureRef, gl, scene, camera]);

  return null;
}

/**
 * The architect's-model viewport: soft daylight on a warm cream studio,
 * gentle sun with cool sky fill. Client-only (loaded with ssr: false).
 */
export default function Scene({
  state,
  captureRef,
}: {
  state: CalculatorState;
  captureRef?: CaptureRef;
}) {
  const [interacted, setInteracted] = useState(false);

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ position: [13.5, 8.5, 14.5], fov: 36 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#efe9dd"]} />
      <fog attach="fog" args={["#efe9dd", 34, 75]} />

      <GlassEnvironment />
      {captureRef && <CaptureBridge captureRef={captureRef} />}

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
        // keep the house framed as its depth changes — at the default 7.4 m
        // this is the original [0, 2.4, -1]
        target={[0, 2.4, -state.loft.depth / 2 + 2.7]}
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
