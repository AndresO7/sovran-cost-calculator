import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import {
  AnyMaterialId,
  flatMaterial,
  glassMaterial,
  metricMaterial,
  TILE_METRES,
} from "./materials";

/* ---------------------------------- hooks ---------------------------------- */

/** Grows a group in from `from` scale on mount (used for lofts / wraps). */
export function usePopIn(ref: React.RefObject<THREE.Group | null>, from = 0.01) {
  const started = useRef(false);
  useLayoutEffect(() => {
    if (!started.current && ref.current) {
      ref.current.scale.setScalar(from);
      started.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useFrame((_, dt) => {
    if (ref.current) easing.damp3(ref.current.scale, [1, 1, 1], 0.16, dt);
  });
}

/* -------------------------------- primitives ------------------------------- */

interface TexBoxProps {
  size: [number, number, number];
  position: [number, number, number];
  matId: AnyMaterialId;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Box with a procedural texture repeated at real-world scale.
 * Each face pair gets its own repeat so brick courses and seams never
 * stretch: ±x uses depth×height, ±z uses width×height, ±y width×depth.
 */
export function TexBox({
  size,
  position,
  matId,
  castShadow = true,
  receiveShadow = true,
}: TexBoxProps) {
  const [w, h, d] = size;
  const materials = useMemo(() => {
    const mx = metricMaterial(matId, d, h);
    const mz = metricMaterial(matId, w, h);
    const my = metricMaterial(matId, w, d);
    return [mx, mx, my, my, mz, mz];
  }, [matId, w, h, d]);
  return (
    <mesh
      position={position}
      material={materials}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <boxGeometry args={size} />
    </mesh>
  );
}

interface CBoxProps {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  roughness?: number;
  metalness?: number;
  castShadow?: boolean;
}

/** Plain coloured box. */
export function CBox({
  size,
  position,
  color,
  rotation = [0, 0, 0],
  roughness = 0.85,
  metalness = 0,
  castShadow = true,
}: CBoxProps) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      material={flatMaterial(color, roughness, metalness)}
      castShadow={castShadow}
      receiveShadow
    >
      <boxGeometry args={size} />
    </mesh>
  );
}

/* --------------------------------- windows --------------------------------- */

interface WinProps {
  w: number;
  h: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  /** georgian glazing bars */
  bars?: boolean;
  /** central vertical mullion splitting the unit into a pair */
  mullion?: boolean;
  /** surround/frame colour — pale sash by default, joinery colour on new-build */
  frameColor?: string;
  /** protruding stone cill, traditional brick facades */
  stone?: boolean;
  /**
   * depth the sash unit sits sunk behind the facade plane. Needs a real
   * opening in the wall (see WallWithOpenings) so the reveal is visible.
   */
  reveal?: number;
}

/**
 * Rectangular frame ring built from four members — one stepped layer of
 * joinery. `w`/`h` are outer dims, `t` member thickness, `d` depth, `z`
 * the depth-wise centre of the ring.
 */
function FrameRing({
  w,
  h,
  t,
  d,
  z,
  material,
}: {
  w: number;
  h: number;
  t: number;
  d: number;
  z: number;
  material: THREE.Material;
}) {
  return (
    <group position={[0, 0, z]}>
      {([-1, 1] as const).map((s) => (
        <mesh key={`h${s}`} position={[0, (s * (h - t)) / 2, 0]} material={material} castShadow={false}>
          <boxGeometry args={[w, t, d]} />
        </mesh>
      ))}
      {([-1, 1] as const).map((s) => (
        <mesh key={`v${s}`} position={[(s * (w - t)) / 2, 0, 0]} material={material} castShadow={false}>
          <boxGeometry args={[t, h - t * 2, d]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * A sash window built from three stepped layers of joinery — outer
 * surround, box frame, then the sash carrying the glazing bars — each
 * set deeper than the last so the unit reads with real depth. With
 * `reveal` the whole unit sinks into the wall opening, leaving the brick
 * return and a shadow gap visible — stone head/cill stay on the facade
 * plane.
 */
export function Win({
  w,
  h,
  position,
  rotation = [0, 0, 0],
  bars = true,
  mullion = false,
  frameColor = "#ece7db",
  stone = false,
  reveal = 0,
}: WinProps) {
  const frame = flatMaterial(frameColor, 0.85);
  const stoneMat = flatMaterial("#d9d2c2", 0.9);
  return (
    <group position={position} rotation={rotation}>
      <group position={[0, 0, -reveal]}>
        {/* layer 1 — outer surround, proud of the opening */}
        <FrameRing w={w + 0.12} h={h + 0.12} t={0.06} d={0.07} z={0} material={frame} />
        {/* layer 2 — box frame, stepped back */}
        <FrameRing w={w + 0.02} h={h + 0.02} t={0.055} d={0.06} z={-0.035} material={frame} />
        {/* layer 3 — sash, deepest, carries bars/mullion */}
        <FrameRing w={w - 0.07} h={h - 0.07} t={0.05} d={0.05} z={-0.07} material={frame} />
        {/* transparent glass only — no interior plane blocking the view */}
        <mesh position={[0, 0, -0.085]} material={glassMaterial()} castShadow={false}>
          <planeGeometry args={[w, h]} />
        </mesh>
        {bars && (
          <>
            <mesh position={[0, 0, -0.075]} material={frame} castShadow={false}>
              <boxGeometry args={[0.035, h - 0.12, 0.014]} />
            </mesh>
            <mesh position={[0, 0, -0.075]} material={frame} castShadow={false}>
              <boxGeometry args={[w - 0.12, 0.035, 0.014]} />
            </mesh>
          </>
        )}
        {mullion && (
          <mesh position={[0, 0, -0.075]} material={frame} castShadow={false}>
            <boxGeometry args={[0.07, h - 0.12, 0.016]} />
          </mesh>
        )}
      </group>
      {stone && (
        /* projecting cill only — head and jambs stay plain brick */
        <mesh position={[0, -h / 2.5 - 0.12, 0.05]} material={stoneMat} castShadow>
          <boxGeometry args={[w + 0.34, 0.09, 0.18]} />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------ walls with holes ----------------------------- */

export interface WallOpening {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Brick wall panel with real punched openings so windows and doors sit in
 * genuine reveals. Lies in the XY plane (x centred, y from 0), extruding
 * into +z by `t`. UVs are metric so the texture tiles at world scale,
 * including on the opening returns. Pass a stable `openings` array.
 */
export function WallWithOpenings({
  w,
  h,
  t,
  openings,
  matId,
  position,
}: {
  w: number;
  h: number;
  t: number;
  openings: WallOpening[];
  matId: AnyMaterialId;
  position: [number, number, number];
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(w / 2, h);
    shape.lineTo(-w / 2, h);
    shape.closePath();
    for (const o of openings) {
      const p = new THREE.Path();
      p.moveTo(o.x - o.w / 2, o.y - o.h / 2);
      p.lineTo(o.x - o.w / 2, o.y + o.h / 2);
      p.lineTo(o.x + o.w / 2, o.y + o.h / 2);
      p.lineTo(o.x + o.w / 2, o.y - o.h / 2);
      p.closePath();
      shape.holes.push(p);
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
    // ExtrudeGeometry UVs are in world units — rescale into tile space
    const uv = geo.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) / TILE_METRES, uv.getY(i) / TILE_METRES);
    }
    return geo;
  }, [w, h, t, openings]);
  const material = useMemo(
    () => metricMaterial(matId, TILE_METRES, TILE_METRES),
    [matId]
  );
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      castShadow
      receiveShadow
    />
  );
}

/* --------------------------------- chimney --------------------------------- */

export function Chimney({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <TexBox size={[0.85, 1.15, 0.55]} position={[0, 0.575, 0]} matId="houseBrick" />
      <mesh position={[-0.2, 1.32, 0]} material={flatMaterial("#b0603f", 0.9)} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.35, 10]} />
      </mesh>
      <mesh position={[0.2, 1.32, 0]} material={flatMaterial("#b0603f", 0.9)} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.35, 10]} />
      </mesh>
    </group>
  );
}

/* ----------------------------------- roofs ---------------------------------- */

/**
 * Hipped/gabled roof slopes. Local origin at eaves centre (y=0).
 * hipL/hipR = 0 produces a gable at that end (no slate on the vertical end —
 * pair it with a <GableWall/>). UVs are authored in TILE_METRES units.
 */
function buildRoofGeometry(
  w: number,
  d: number,
  h: number,
  hipL: number,
  hipR: number,
  rearDepth: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const x0 = -w / 2;
  const x1 = w / 2;
  const z0 = -d / 2;
  const z1 = d / 2;
  const p1 = new THREE.Vector3(x0 + hipL, h, 0);
  const p2 = new THREE.Vector3(x1 - hipR, h, 0);
  const slope = Math.hypot(d / 2, h);
  const T = TILE_METRES;

  const tri = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    uva: [number, number],
    uvb: [number, number],
    uvc: [number, number]
  ) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    uvs.push(uva[0] / T, uva[1] / T, uvb[0] / T, uvb[1] / T, uvc[0] / T, uvc[1] / T);
  };

  const A = new THREE.Vector3(x0, 0, z0);
  const B = new THREE.Vector3(x1, 0, z0);
  const C = new THREE.Vector3(x1, 0, z1);
  const D = new THREE.Vector3(x0, 0, z1);

  // front slope (faces -z)
  tri(A, B, p2, [x0, 0], [x1, 0], [p2.x, slope]);
  tri(A, p2, p1, [x0, 0], [p2.x, slope], [p1.x, slope]);
  // Rear slope (faces +z). A dormer eats into it from the ridge down, so it
  // is drawn only as far up as `rearDepth` — otherwise the slope would run
  // straight through the dormer and show as a ceiling inside the loft.
  const cut = Math.min(rearDepth, d / 2);
  if (cut > 0.001) {
    const zc = z1 - cut;
    const yc = (h * cut) / (d / 2);
    const v = (slope * cut) / (d / 2);
    const C2 = new THREE.Vector3(x1, yc, zc);
    const D2 = new THREE.Vector3(x0, yc, zc);
    tri(C, D, D2, [x1, 0], [x0, 0], [x0, v]);
    tri(C, D2, C2, [x1, 0], [x0, v], [x1, v]);
  }
  // hip ends (only when hipped)
  if (hipL > 0.001) tri(D, A, p1, [z1, 0], [z0, 0], [0, slope]);
  if (hipR > 0.001) tri(B, C, p2, [z0, 0], [z1, 0], [0, slope]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

interface RoofProps {
  /** width along x at eaves, metres (include overhang) */
  w: number;
  /** depth along z at eaves */
  d: number;
  /** rise from eaves to ridge */
  h: number;
  hipL?: number;
  hipR?: number;
  /**
   * How much of the rear slope to draw, measured up from the rear eave.
   * Defaults to the whole slope; a dormer passes the strip it leaves below
   * its face so the roof stops where the dormer starts.
   */
  rearDepth?: number;
  finish: AnyMaterialId;
  position: [number, number, number];
}

export function Roof({
  w,
  d,
  h,
  hipL = 0,
  hipR = 0,
  rearDepth = Infinity,
  finish,
  position,
}: RoofProps) {
  const geometry = useMemo(
    () => buildRoofGeometry(w, d, h, hipL, hipR, rearDepth),
    [w, d, h, hipL, hipR, rearDepth]
  );
  const material = useMemo(() => {
    const m = metricMaterial(finish, TILE_METRES, TILE_METRES).clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [finish]);
  return <mesh geometry={geometry} material={material} position={position} castShadow receiveShadow />;
}

/**
 * Single-pitch lean-to roof for the pitched extension option.
 * High edge against the house (z=0), falling to the rear (z=depth).
 */
export function LeanTo({
  w,
  depth,
  rise,
  wallTop,
  matId,
  cheekMatId,
}: {
  w: number;
  depth: number;
  rise: number;
  wallTop: number;
  matId: AnyMaterialId;
  cheekMatId: AnyMaterialId;
}) {
  const over = 0.15;
  const slopeGeo = useMemo(() => {
    const x0 = -w / 2 - over;
    const x1 = w / 2 + over;
    const zh = -0.02; // against house
    const zl = depth + over;
    const yh = wallTop + rise;
    const yl = wallTop;
    const T = TILE_METRES;
    const slope = Math.hypot(zl - zh, rise);
    const positions = [
      x0, yh, zh, x1, yh, zh, x1, yl, zl,
      x0, yh, zh, x1, yl, zl, x0, yl, zl,
    ];
    const uvs = [
      x0 / T, 0, x1 / T, 0, x1 / T, slope / T,
      x0 / T, 0, x1 / T, slope / T, x0 / T, slope / T,
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }, [w, depth, rise, wallTop]);

  const cheekGeo = useMemo(() => {
    const T = TILE_METRES;
    const make = (x: number) => [
      x, wallTop, 0, x, wallTop, depth, x, wallTop + rise, 0,
    ];
    const positions = [...make(-w / 2), ...make(w / 2)];
    const uvs = [
      0, 0, depth / T, 0, 0, rise / T,
      0, 0, depth / T, 0, 0, rise / T,
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }, [w, depth, rise, wallTop]);

  const slateMat = useMemo(() => {
    const m = metricMaterial(matId, TILE_METRES, TILE_METRES).clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [matId]);
  const cheekMat = useMemo(() => {
    const m = metricMaterial(cheekMatId, TILE_METRES, TILE_METRES).clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [cheekMatId]);

  return (
    <group>
      <mesh geometry={slopeGeo} material={slateMat} castShadow receiveShadow />
      <mesh geometry={cheekGeo} material={cheekMat} castShadow receiveShadow />
    </group>
  );
}

/** Vertical triangular gable infill for a gabled roof end (x = ±w/2 plane). */
export function GableWall({
  side,
  w,
  d,
  h,
  matId,
  position,
}: {
  side: 1 | -1;
  w: number;
  d: number;
  h: number;
  matId: AnyMaterialId;
  position: [number, number, number];
}) {
  const geometry = useMemo(() => {
    const x = (side * w) / 2;
    const positions = [x, 0, -d / 2, x, 0, d / 2, x, h, 0];
    const uvs = [0, 0, d / TILE_METRES, 0, d / 2 / TILE_METRES, h / TILE_METRES];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }, [side, w, d, h]);
  const material = useMemo(() => {
    const m = metricMaterial(matId, TILE_METRES, TILE_METRES).clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [matId]);
  return <mesh geometry={geometry} material={material} position={position} castShadow receiveShadow />;
}

