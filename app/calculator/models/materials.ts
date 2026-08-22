import * as THREE from "three";
import { MaterialId } from "../config";

// All textures are generated procedurally on a 2D canvas — no external assets.
// Textures are authored at a fixed physical scale (TILE_METRES) and repeated
// per-mesh so brick courses and slate rows keep a constant real-world size.

export const TILE_METRES = 1.6;

type Painter = (ctx: CanvasRenderingContext2D, size: number) => void;

function makeTexture(paint: Painter, size = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  paint(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Deterministic pseudo-random so textures look the same on every load. */
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return `#${c.getHexString()}`;
}

function paintBricks(
  base: string,
  variants: string[],
  mortar: string,
  seed: number
): Painter {
  return (ctx, size) => {
    const rand = mulberry(seed);
    // TILE_METRES of wall ≈ 21 brick courses (75mm course height)
    const courses = 21;
    const brickH = size / courses;
    const brickW = brickH * 3.1;
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, size, size);
    const palette = [base, ...variants];
    for (let row = 0; row < courses; row++) {
      const offset = row % 2 === 0 ? 0 : brickW / 2;
      for (let x = -brickW; x < size + brickW; x += brickW) {
        const color = palette[Math.floor(rand() * palette.length)];
        ctx.fillStyle = shade(color, (rand() - 0.5) * 0.06);
        ctx.fillRect(x + offset + 1, row * brickH + 1, brickW - 2, brickH - 2);
      }
    }
  };
}

function paintNoise(base: string, jitter: number, seed: number): Painter {
  return (ctx, size) => {
    const rand = mulberry(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    const cell = 4;
    for (let y = 0; y < size; y += cell) {
      for (let x = 0; x < size; x += cell) {
        ctx.fillStyle = shade(base, (rand() - 0.5) * jitter);
        ctx.fillRect(x, y, cell, cell);
      }
    }
  };
}

function paintCourses(
  base: string,
  jitter: number,
  rows: number,
  gap: string,
  seed: number,
  staggered = true
): Painter {
  return (ctx, size) => {
    const rand = mulberry(seed);
    const rowH = size / rows;
    const tileW = rowH * 1.7;
    ctx.fillStyle = gap;
    ctx.fillRect(0, 0, size, size);
    for (let row = 0; row < rows; row++) {
      const offset = staggered && row % 2 === 1 ? tileW / 2 : 0;
      for (let x = -tileW; x < size + tileW; x += tileW) {
        ctx.fillStyle = shade(base, (rand() - 0.5) * jitter);
        ctx.fillRect(x + offset, row * rowH, tileW - 1.5, rowH - 1.5);
      }
    }
  };
}

function paintVerticalSeams(
  base: string,
  seam: string,
  seams: number,
  jitter: number,
  seed: number
): Painter {
  return (ctx, size) => {
    const rand = mulberry(seed);
    const panelW = size / seams;
    for (let i = 0; i < seams; i++) {
      ctx.fillStyle = shade(base, (rand() - 0.5) * jitter);
      ctx.fillRect(i * panelW, 0, panelW, size);
      ctx.fillStyle = seam;
      ctx.fillRect(i * panelW, 0, 2, size);
    }
  };
}

function paintPanelSeams(
  base: string,
  seam: string,
  cols: number,
  jitter: number,
  seed: number
): Painter {
  return (ctx, size) => {
    const rand = mulberry(seed);
    const panelW = size / cols;
    const panelH = size; // fixed-length trays, one per tile height
    ctx.fillStyle = seam;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < cols; i++) {
      // cross joints stagger between neighbouring trays, reading as
      // the rectangular panel grid of standing-seam cladding
      const offset = i % 2 === 0 ? 0 : panelH / 2;
      for (let y = -panelH; y < size + panelH; y += panelH) {
        ctx.fillStyle = shade(base, (rand() - 0.5) * jitter);
        ctx.fillRect(i * panelW + 2, y + offset + 1.5, panelW - 3, panelH - 3);
      }
    }
  };
}

function paintPaving(seed: number, base: string, gap: string, cols = 4, jitter = 0.08): Painter {
  return (ctx, size) => {
    const rand = mulberry(seed);
    const tile = size / cols;
    ctx.fillStyle = gap;
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < cols; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = shade(base, (rand() - 0.5) * jitter);
        ctx.fillRect(x * tile + 1.5, y * tile + 1.5, tile - 3, tile - 3);
      }
    }
  };
}

function paintPlanks(base: string, gap: string, rows: number, seed: number): Painter {
  return (ctx, size) => {
    const rand = mulberry(seed);
    const rowH = size / rows;
    ctx.fillStyle = gap;
    ctx.fillRect(0, 0, size, size);
    for (let row = 0; row < rows; row++) {
      ctx.fillStyle = shade(base, (rand() - 0.5) * 0.1);
      ctx.fillRect(0, row * rowH + 1, size, rowH - 2);
    }
  };
}

interface MaterialSpec {
  painter: Painter;
  roughness: number;
  metalness?: number;
}

const WALL_SPECS: Record<MaterialId, MaterialSpec> = {
  render: { painter: paintNoise("#ddd6cb", 0.035, 11), roughness: 0.92 },
  redBrick: {
    painter: paintBricks("#94604b", ["#8a5743", "#9e6952", "#815141", "#905d49"], "#9d8d7c", 21),
    roughness: 0.95,
  },
  londonStock: {
    painter: paintBricks("#ab9a74", ["#a08f6c", "#b3a37e", "#948462", "#a59470"], "#968a78", 31),
    roughness: 0.95,
  },
  charredTimber: {
    painter: paintVerticalSeams("#1d1a17", "#0c0b0a", 12, 0.12, 41),
    roughness: 0.7,
  },
  zinc: {
    painter: paintVerticalSeams("#5b6066", "#3c4045", 8, 0.06, 51),
    roughness: 0.45,
    metalness: 0.55,
  },
};

const EXTRA_SPECS = {
  // the one roofing finish — every roof surface in the model uses it
  slate: { painter: paintCourses("#5a626c", 0.09, 17, "#40464e", 61), roughness: 0.75 },
  houseBrick: {
    painter: paintBricks("#7d4f3d", ["#734736", "#875a46", "#6a4132", "#815341"], "#b0a496", 91),
    roughness: 0.95,
  },
  grass: { painter: paintNoise("#5f7c38", 0.08, 101), roughness: 1 },
  paving: { painter: paintPaving(111, "#d3c8a4", "#a89a78"), roughness: 0.9 },
  // pale engineered oak, seen through the extension glazing
  oakFloor: { painter: paintPlanks("#c3a87f", "#a98d64", 7, 121), roughness: 0.62 },
  zincPanels: {
    painter: paintPanelSeams("#7d858e", "#656c74", 4, 0.06, 141),
    roughness: 0.45,
    metalness: 0.55,
  },
} satisfies Record<string, MaterialSpec>;

export type ExtraMaterialId = keyof typeof EXTRA_SPECS;
export type AnyMaterialId = MaterialId | ExtraMaterialId;

const ALL_SPECS: Record<AnyMaterialId, MaterialSpec> = {
  ...WALL_SPECS,
  ...EXTRA_SPECS,
};

const materialCache = new Map<string, THREE.MeshStandardMaterial>();
const textureCache = new Map<string, THREE.CanvasTexture>();

function getBaseTexture(id: AnyMaterialId): THREE.CanvasTexture {
  let tex = textureCache.get(id);
  if (!tex) {
    tex = makeTexture(ALL_SPECS[id].painter);
    textureCache.set(id, tex);
  }
  return tex;
}

/**
 * Material whose texture repeats at real-world scale for a face of
 * roughly `w`×`h` metres. Cached, so repeated calls are cheap.
 */
export function metricMaterial(
  id: AnyMaterialId,
  w: number,
  h: number
): THREE.MeshStandardMaterial {
  const rw = Math.max(0.5, Math.round((w / TILE_METRES) * 4) / 4);
  const rh = Math.max(0.5, Math.round((h / TILE_METRES) * 4) / 4);
  const key = `${id}|${rw}|${rh}`;
  let mat = materialCache.get(key);
  if (!mat) {
    const spec = ALL_SPECS[id];
    const tex = getBaseTexture(id).clone();
    tex.repeat.set(rw, rh);
    tex.needsUpdate = true;
    mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: spec.roughness,
      metalness: spec.metalness ?? 0,
    });
    materialCache.set(key, mat);
  }
  return mat;
}

const flatCache = new Map<string, THREE.MeshStandardMaterial>();

/** Plain untextured material, cached by colour. */
export function flatMaterial(
  color: string,
  roughness = 0.85,
  metalness = 0
): THREE.MeshStandardMaterial {
  const key = `${color}|${roughness}|${metalness}`;
  let mat = flatCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    flatCache.set(key, mat);
  }
  return mat;
}

let glassMat: THREE.MeshPhysicalMaterial | null = null;
let glassEnv: THREE.Texture | null = null;

/**
 * Clear architectural glass — faint cool tint, low opacity, strongly
 * reflective. Reads as real glazing once the scene provides an env-map
 * via `setGlassEnvMap`; fresnel keeps grazing angles mirror-like.
 */
export function glassMaterial(): THREE.MeshPhysicalMaterial {
  if (!glassMat) {
    glassMat = new THREE.MeshPhysicalMaterial({
      color: "#c8dce8",
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.15,
      ior: 1.5,
      envMapIntensity: 1.2,
      envMap: glassEnv,
    });
  }
  return glassMat;
}

/**
 * Environment reflected in the glazing only — set once by the scene so
 * the rest of the model keeps its hand-tuned analytic lighting.
 */
export function setGlassEnvMap(tex: THREE.Texture | null) {
  glassEnv = tex;
  if (glassMat) {
    glassMat.envMap = tex;
    glassMat.needsUpdate = true;
  }
}

let washMat: THREE.MeshBasicMaterial | null = null;

/**
 * Soft cone of warm light for the facade downlights — an additive gradient
 * plane laid flush on the wall, so the fixtures read as lit without adding
 * real lights to the analytic rig.
 */
export function lightWashMaterial(): THREE.MeshBasicMaterial {
  if (!washMat) {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // downward cone: narrow at the fixture, splaying wide open by the ground
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, "rgba(255, 243, 216, 0.9)");
    grad.addColorStop(0.5, "rgba(255, 240, 210, 0.45)");
    grad.addColorStop(1, "rgba(255, 238, 205, 0)");
    ctx.filter = "blur(12px)";
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(size * 0.44, 10);
    ctx.lineTo(size * 0.56, 10);
    ctx.lineTo(size * 0.98, size);
    ctx.lineTo(size * 0.02, size);
    ctx.closePath();
    ctx.fill();
    // hotspot right under the lamp head
    const hot = ctx.createRadialGradient(size / 2, 16, 2, size / 2, 16, 36);
    hot.addColorStop(0, "rgba(255, 250, 235, 0.95)");
    hot.addColorStop(1, "rgba(255, 250, 235, 0)");
    ctx.filter = "blur(4px)";
    ctx.fillStyle = hot;
    ctx.beginPath();
    ctx.arc(size / 2, 16, 38, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    washMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }
  return washMat;
}

let interiorMat: THREE.MeshStandardMaterial | null = null;

/** The dim room seen behind clear glazing — semi-transparent dark plane. */
export function interiorMaterial(): THREE.MeshStandardMaterial {
  if (!interiorMat) {
    interiorMat = new THREE.MeshStandardMaterial({
      color: "#1a1d1f",
      roughness: 0.95,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
  }
  return interiorMat;
}
