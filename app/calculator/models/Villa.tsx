import { useRef } from "react";
import * as THREE from "three";
import { PROTOTYPES } from "../config";
import { CalculatorState } from "../state";
import { Extension } from "./Extension";
import { Garden } from "./Garden";
import { Loft } from "./Loft";
import {
  CBox,
  Chimney,
  GableWall,
  GableWallZ,
  Roof,
  TexBox,
  usePopIn,
  Win,
} from "./parts";

const W = 10;
const D = 8;
const WALL_H = 5.7; // two storeys
const ROOF_H = 2.6;
const OVER = 0.35; // generous Edwardian eaves
const HIP = 2.2;

/** Detached villa — Hampstead. Double front gables, hipped roof, garage. */
export function Villa({ state }: { state: CalculatorState }) {
  const ref = useRef<THREE.Group>(null);
  usePopIn(ref, 0.94);
  const size = PROTOTYPES.villa.sizes[state.ground.size];
  const wrap = !!size.wrap;
  const offsetX = wrap ? -(W - size.w) / 2 : 0;
  const hipToGable = state.loft.type === "hipToGable";

  return (
    <group ref={ref}>
      {/* main body */}
      <TexBox size={[W, WALL_H, D]} position={[0, WALL_H / 2, -D / 2]} matId="houseBrick" />
      <CBox
        size={[W + 0.08, 0.12, D + 0.08]}
        position={[0, 2.95, -D / 2]}
        color="#d8d2c6"
        castShadow={false}
      />

      {/* hipped roof; right hip becomes a gable with the hip-to-gable loft */}
      <Roof
        w={W + OVER * 2}
        d={D + OVER * 2}
        h={ROOF_H}
        hipL={HIP}
        hipR={hipToGable ? 0 : HIP}
        finish={state.loft.finish}
        position={[0, WALL_H, -D / 2]}
      />
      {hipToGable && (
        <>
          <GableWall
            side={1}
            w={W - 0.02}
            d={D + OVER * 2}
            h={ROOF_H}
            matId="houseBrick"
            position={[0, WALL_H, -D / 2]}
          />
          <Win
            w={1.0}
            h={1.15}
            position={[W / 2 + 0.05, WALL_H + 1.05, -D / 2]}
            rotation={[0, Math.PI / 2, 0]}
          />
        </>
      )}
      <Chimney position={[1.2, WALL_H + ROOF_H - 0.5, -D / 2]} />

      {/* front double gables */}
      {[-2.6, 2.6].map((x) => (
        <group key={x} position={[x, 0, -D - 0.5]}>
          <TexBox size={[2.8, WALL_H, 1.0]} position={[0, WALL_H / 2, 0]} matId="houseBrick" />
          <Roof
            w={3.15}
            d={1.5}
            h={1.05}
            finish={state.loft.finish}
            position={[0, WALL_H, 0]}
          />
          <GableWallZ
            w={3.0}
            h={1.0}
            matId="render"
            position={[0, WALL_H, -0.52]}
          />
          <Win w={1.75} h={1.3} position={[0, 1.55, -0.46]} rotation={[0, Math.PI, 0]} />
          <Win w={1.55} h={1.2} position={[0, 4.35, -0.46]} rotation={[0, Math.PI, 0]} />
        </group>
      ))}

      {/* front door + porch, centred */}
      <group position={[0, 0, -D]} rotation={[0, Math.PI, 0]}>
        <CBox size={[1.0, 2.15, 0.1]} position={[0, 1.15, 0.04]} color="#2b2118" />
        {[-0.62, 0.62].map((x) => (
          <CBox key={x} size={[0.13, 2.25, 0.13]} position={[x, 1.12, 0.6]} color="#ddd6cb" />
        ))}
        <CBox size={[1.65, 0.14, 1.0]} position={[0, 2.32, 0.45]} color="#ddd6cb" />
        <CBox size={[1.5, 0.17, 0.7]} position={[0, 0.085, 0.5]} color="#b6aea0" />
        <Win w={1.05} h={1.2} position={[0, 4.35, 0.045]} />
      </group>

      {/* rear windows — first floor + ground corners clear of the extension */}
      {[-3, 0, 3].map((x) => (
        <Win key={x} w={1.05} h={1.3} position={[x, 4.35, 0.045]} />
      ))}
      {!wrap && <Win w={1.0} h={1.2} position={[-3.9, 1.55, 0.045]} />}
      <Win w={1.0} h={1.2} position={[3.9, 1.55, 0.045]} />

      {/* side garage (right flank) */}
      <group position={[W / 2 + 1.2, 0, -6]}>
        <TexBox size={[2.4, 2.6, 4.5]} position={[0, 1.3, 0]} matId="houseBrick" />
        <CBox size={[2.5, 0.14, 4.6]} position={[0, 2.67, 0]} color="#2e3136" />
        <CBox size={[1.95, 1.95, 0.08]} position={[0, 1.0, -2.27]} color="#2a2d31" castShadow={false} />
      </group>

      {/* configurable pieces */}
      <Extension
        width={size.w}
        depth={size.d}
        wrap={wrap}
        material={state.ground.material}
        roof={state.ground.roof}
        glazing={state.ground.glazing}
        frame={state.ground.frame}
        roofFinish={state.loft.finish}
        offsetX={offsetX}
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
        maxDormerW={W + OVER * 2 - HIP * 2 - 0.5}
      />

      <Garden
        variant="villa"
        houseW={W}
        houseD={D}
        patio={state.ground.patio}
        ext={{ w: size.w, d: size.d, offsetX, wrap }}
      />
    </group>
  );
}
