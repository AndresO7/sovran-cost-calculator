import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import {
  AnyMaterialId,
  flatMaterial,
  metricMaterial,
  TILE_METRES,
  windowMaterial,
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
  roughness?: number;
  metalness?: number;
  castShadow?: boolean;
}

/** Plain coloured box. */
export function CBox({
  size,
  position,
  color,
  roughness = 0.85,
  metalness = 0,
  castShadow = true,
}: CBoxProps) {
  return (
    <mesh
      position={position}
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
  intensity?: number;
  /** surround/frame colour — pale sash by default, joinery colour on new-build */
  frameColor?: string;
}

/** A lit sash window with a pale surround — emissive Monolith Noir gold. */
export function Win({
  w,
  h,
  position,
  rotation = [0, 0, 0],
  bars = true,
  intensity = 1.5,
  frameColor = "#d8d2c6",
}: WinProps) {
  const frame = flatMaterial(frameColor, 0.85);
  return (
    <group position={position} rotation={rotation}>
      <mesh material={frame} castShadow={false}>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.07]} />
      </mesh>
      <mesh position={[0, 0, 0.045]} material={windowMaterial(intensity)} castShadow={false}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {bars && (
        <>
          <mesh position={[0, 0, 0.055]} material={frame} castShadow={false}>
            <boxGeometry args={[0.035, h, 0.012]} />
          </mesh>
          <mesh position={[0, 0, 0.055]} material={frame} castShadow={false}>
            <boxGeometry args={[w, 0.035, 0.012]} />
          </mesh>
        </>
      )}
    </group>
  );
}

/* --------------------------------- chimney --------------------------------- */

export function Chimney({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <TexBox size={[0.85, 1.15, 0.55]} position={[0, 0.575, 0]} matId="houseBrick" />
      <mesh position={[-0.2, 1.32, 0]} material={flatMaterial("#5a4439", 0.9)} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.35, 10]} />
      </mesh>
      <mesh position={[0.2, 1.32, 0]} material={flatMaterial("#5a4439", 0.9)} castShadow>
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
  hipR: number
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
  // rear slope (faces +z)
  tri(C, D, p1, [x1, 0], [x0, 0], [p1.x, slope]);
  tri(C, p1, p2, [x1, 0], [p1.x, slope], [p2.x, slope]);
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
  finish: AnyMaterialId;
  position: [number, number, number];
}

export function Roof({ w, d, h, hipL = 0, hipR = 0, finish, position }: RoofProps) {
  const geometry = useMemo(
    () => buildRoofGeometry(w, d, h, hipL, hipR),
    [w, d, h, hipL, hipR]
  );
  const material = useMemo(() => {
    const m = metricMaterial(finish, TILE_METRES, TILE_METRES).clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [finish]);
  return <mesh geometry={geometry} material={material} position={position} castShadow receiveShadow />;
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

/** Vertical triangular gable infill on a z-plane (front/back facing). */
export function GableWallZ({
  w,
  h,
  matId,
  position,
}: {
  w: number;
  h: number;
  matId: AnyMaterialId;
  position: [number, number, number];
}) {
  const geometry = useMemo(() => {
    const positions = [-w / 2, 0, 0, w / 2, 0, 0, 0, h, 0];
    const uvs = [0, 0, w / TILE_METRES, 0, w / 2 / TILE_METRES, h / TILE_METRES];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }, [w, h]);
  const material = useMemo(() => {
    const m = metricMaterial(matId, TILE_METRES, TILE_METRES).clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [matId]);
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
