import { useRef } from "react";
import * as THREE from "three";
import { PROTOTYPES } from "../config";
import { CalculatorState } from "../state";
import { Extension } from "./Extension";
import { Garden } from "./Garden";
import { Loft } from "./Loft";
import { CBox, Chimney, GableWall, Roof, TexBox, usePopIn, Win } from "./parts";

const W = 6;
const D = 8; // house z: -8 → 0, garden grows +z
const WALL_H = 8.55; // three storeys
const ROOF_H = 2.45;
const OVER = 0.18;

/** Victorian townhouse — Chelsea. Three storeys, bay window, portico. */
export function Townhouse({ state }: { state: CalculatorState }) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.94);
  const size = PROTOTYPES.townhouse.sizes[state.ground.size];

  return (
    <group ref={ref}>
      {/* main body */}
      <TexBox size={[W, WALL_H, D]} position={[0, WALL_H / 2, -D / 2]} matId="houseBrick" />

      {/* string courses at floor lines */}
      {[2.95, 5.85].map((y) => (
        <CBox
          key={y}
          size={[W + 0.08, 0.12, D + 0.08]}
          position={[0, y, -D / 2]}
          color="#d8d2c6"
          castShadow={false}
        />
      ))}

      {/* roof + brick gable ends + chimneys */}
      <Roof
        w={W + OVER * 2}
        d={D + OVER * 2}
        h={ROOF_H}
        finish={state.loft.finish}
        position={[0, WALL_H, -D / 2]}
      />
      {([-1, 1] as const).map((s) => (
        <GableWall
          key={s}
          side={s}
          w={W - 0.02}
          d={D}
          h={ROOF_H}
          matId="houseBrick"
          position={[0, WALL_H, -D / 2]}
        />
      ))}
      <Chimney position={[-2.35, WALL_H + ROOF_H - 0.55, -D / 2]} />
      <Chimney position={[2.35, WALL_H + ROOF_H - 0.55, -D / 2]} />

      {/* rear windows — upper floors (ground floor hosts the extension) */}
      {[4.6, 7.25].map((y) =>
        [-1.35, 1.35].map((x) => (
          <Win key={`${x}-${y}`} w={0.95} h={1.45} position={[x, y, 0.045]} />
        ))
      )}

      {/* front facade */}
      <group position={[0, 0, -D]} rotation={[0, Math.PI, 0]}>
        {/* door + portico */}
        <CBox size={[0.98, 2.18, 0.1]} position={[1.6, 1.17, 0.04]} color="#26331f" />
        <CBox size={[1.14, 0.08, 0.12]} position={[1.6, 2.32, 0.05]} color="#d8d2c6" castShadow={false} />
        {[1.08, 2.12].map((x) => (
          <CBox key={x} size={[0.13, 2.3, 0.13]} position={[x, 1.15, 0.55]} color="#ddd6cb" />
        ))}
        <CBox size={[1.4, 0.14, 0.9]} position={[1.6, 2.38, 0.42]} color="#ddd6cb" />
        <CBox size={[1.3, 0.17, 0.6]} position={[1.6, 0.085, 0.45]} color="#b6aea0" />
        {/* two-storey bay window */}
        <group position={[-1.5, 0, 0]}>
          <CBox size={[2.35, 5.85, 0.85]} position={[0, 2.925, 0.42]} color="#ddd6cb" />
          {[1.6, 4.55].map((y) =>
            [-0.78, 0, 0.78].map((x) => (
              <Win key={`${x}-${y}`} w={0.55} h={1.65} position={[x, y, 0.89]} />
            ))
          )}
          <CBox size={[2.55, 0.12, 1.0]} position={[0, 5.9, 0.45]} color="#3b3f45" castShadow={false} />
        </group>
        {/* upper front windows */}
        <Win w={1.0} h={1.45} position={[1.6, 4.6, 0.045]} />
        {[-1.5, 1.6].map((x) => (
          <Win key={x} w={0.95} h={1.25} position={[x, 7.25, 0.045]} />
        ))}
      </group>

      {/* configurable pieces */}
      <Extension
        width={size.w}
        depth={size.d}
        material={state.ground.material}
        roof={state.ground.roof}
        glazing={state.ground.glazing}
        frame={state.ground.frame}
        roofFinish={state.loft.finish}
        houseWidth={W}
      />
      <Loft
        type={state.loft.type}
        finish={state.loft.finish}
        roofW={W + OVER * 2}
        slopeHalfD={(D + OVER * 2) / 2}
        eaveY={WALL_H}
        rise={ROOF_H}
        rearEaveZ={-D / 2 + (D + OVER * 2) / 2}
      />

      <Garden
        variant="townhouse"
        houseW={W}
        houseD={D}
        patio={state.ground.patio}
        ext={{ w: size.w, d: size.d, offsetX: 0 }}
      />
    </group>
  );
}
