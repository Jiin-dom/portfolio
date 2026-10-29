"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Skill } from "@/lib/skills";
import { TANK } from "./constants";
import { speciesOf, type Species } from "./species";

/*
 * A planted, rimless tank on the L return. Everything here is in tank space:
 * x across the front glass, y up from the desk, z out of the front glass.
 * The group is turned so that front faces the room (+x in world space).
 */

const GLASS = 0.05;
const WATER_TOP = TANK.h - 0.24;
const IN_W = TANK.w - GLASS * 2;
const IN_D = TANK.d - GLASS * 2;
const { damp, clamp, smoothstep } = THREE.MathUtils;

/* deterministic scatter so plants and stones land the same way every load */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* gravel slopes up toward the back, with a mound behind the stones */
function groundY(x: number, z: number) {
  const back = (IN_D / 2 - z) / IN_D;
  return GLASS + 0.26 + 0.42 * Math.pow(clamp(back, 0, 1), 1.3) + 0.16 * Math.exp(-((x + 0.9) ** 2 + (z + 0.35) ** 2) / 0.5);
}

function surface(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

function texture(c: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/* ── skins ── */

function skinTexture(sp: Species) {
  const W = 512;
  const H = 256;
  const { c, ctx } = surface(W, H);
  /* canvas top is the fish's back, left is the nose */
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, sp.back);
  g.addColorStop(0.38, sp.side);
  g.addColorStop(0.64, sp.side);
  g.addColorStop(1, sp.belly);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const accent = sp.accent ?? sp.back;
  const bar = (u: number, width: number, alpha: number) => {
    const x = u * W;
    const b = ctx.createLinearGradient(x - width, 0, x + width, 0);
    b.addColorStop(0, "transparent");
    b.addColorStop(0.5, accent);
    b.addColorStop(1, "transparent");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = b;
    ctx.fillRect(x - width, 0, width * 2, H);
    ctx.globalAlpha = 1;
  };

  switch (sp.pattern) {
    case "bars":
      (sp.depth > 0.6 ? [0.13, 0.44, 0.8] : [0.14, 0.34, 0.56, 0.8]).forEach((u) => bar(u, W * 0.035, 0.85));
      break;
    case "slants":
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 9;
      for (let k = 0; k < 15; k++) {
        const x = W * (0.2 + k * 0.053);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 34, H);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    case "stripe": {
      const s = ctx.createLinearGradient(0, H * 0.44, 0, H * 0.56);
      s.addColorStop(0, "transparent");
      s.addColorStop(0.5, accent);
      s.addColorStop(1, "transparent");
      ctx.fillStyle = s;
      ctx.fillRect(W * 0.16, H * 0.44, W * 0.84, H * 0.12);
      break;
    }
    case "neon": {
      /* the red flank first, then the electric stripe over it */
      const red = ctx.createLinearGradient(W * 0.45, 0, W * 0.6, 0);
      red.addColorStop(0, "transparent");
      red.addColorStop(1, accent);
      ctx.fillStyle = red;
      ctx.fillRect(W * 0.45, H * 0.52, W * 0.55, H * 0.4);
      ctx.shadowColor = "#7ff2ff";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#38dcff";
      ctx.fillRect(W * 0.13, H * 0.36, W * 0.78, H * 0.09);
      ctx.shadowBlur = 0;
      break;
    }
    case "waves":
      ctx.strokeStyle = accent;
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.85;
      for (let k = 0; k < 10; k++) {
        const y0 = H * (0.1 + k * 0.088);
        ctx.beginPath();
        for (let x = 0; x <= W; x += 8) ctx.lineTo(x, y0 + Math.sin(x / 38 + k * 1.7) * 6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    default:
      break;
  }

  /* gill plate, lateral line, darker snout */
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(W * 0.2, H * 0.5, W * 0.045, H * 0.36, 0, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.23, H * 0.42);
  ctx.quadraticCurveTo(W * 0.6, H * 0.36, W * 0.99, H * 0.5);
  ctx.stroke();
  const snout = ctx.createRadialGradient(0, H * 0.45, 0, 0, H * 0.45, W * 0.16);
  snout.addColorStop(0, "rgba(0,0,0,0.3)");
  snout.addColorStop(1, "transparent");
  ctx.fillStyle = snout;
  ctx.fillRect(0, 0, W * 0.2, H);

  /* scale edging */
  ctx.strokeStyle = "rgba(0,0,0,0.13)";
  ctx.lineWidth = 1.4;
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 40; col++) {
      const x = W * 0.2 + col * 11 + (row % 2) * 5.5;
      if (x > W) continue;
      ctx.beginPath();
      ctx.arc(x, row * 16 + 8, 7, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
  }
  return texture(c);
}

/* grey scale relief, shared by every fish as a bump map */
function scaleBump() {
  const { c, ctx } = surface(256, 256);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 17; row++) {
    for (let col = 0; col < 17; col++) {
      const x = col * 16 + (row % 2) * 8;
      const y = row * 16;
      const g = ctx.createRadialGradient(x - 3, y, 1, x, y, 10);
      g.addColorStop(0, "#c8c8c8");
      g.addColorStop(0.8, "#7a7a7a");
      g.addColorStop(1, "#505050");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const t = texture(c, false);
  t.repeat.set(5, 2.5);
  return t;
}

/* fin rays, as horizontal lines; fins that need vertical rays swap their uvs */
function finRays() {
  const { c, ctx } = surface(128, 128);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 1.6;
  for (let y = 3; y < 128; y += 7) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y + 2);
    ctx.stroke();
  }
  return texture(c);
}

/* ── fish geometry ── */

function fishShape(sp: Species) {
  const L = sp.len;
  const Hb = sp.depth * L;
  const profile = (t: number) =>
    Math.max(Math.pow(Math.sin(Math.PI * Math.pow(clamp(t, 0, 1), 0.6)), 0.85), 0.16 * smoothstep(t, 0.55, 1), 0.05);
  return {
    L,
    Hb,
    x: (t: number) => L * (0.5 - t),
    top: (t: number) => (Hb / 2) * 1.08 * profile(t),
    bottom: (t: number) => (Hb / 2) * 0.92 * profile(t),
    half: (t: number) => ((sp.width * L) / 2) * Math.pow(profile(t), 0.9) * (1 - 0.45 * t),
  };
}

function bodyGeometry(sp: Species) {
  const f = fishShape(sp);
  const N = 32;
  const M = 24;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    for (let j = 0; j <= M; j++) {
      /* the seam runs along the belly, where nobody looks */
      const a = -Math.PI / 2 + (j / M) * Math.PI * 2;
      const s = Math.sin(a);
      pos.push(f.x(t), s * (s > 0 ? f.top(t) : f.bottom(t)), Math.cos(a) * f.half(t));
      uv.push(t, 0.5 + 0.5 * s);
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      const a = i * (M + 1) + j;
      const b = a + M + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function finGeometry(shape: THREE.Shape, swapUV = false) {
  const g = new THREE.ShapeGeometry(shape, 10);
  g.computeBoundingBox();
  const b = g.boundingBox!;
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const u = (p.getX(i) - b.min.x) / (b.max.x - b.min.x || 1);
    const v = (p.getY(i) - b.min.y) / (b.max.y - b.min.y || 1);
    if (swapUV) uv.setXY(i, v, u);
    else uv.setXY(i, u, v);
  }
  return g;
}

function finsGeometry(sp: Species) {
  const f = fishShape(sp);
  const { L, Hb } = f;
  const parts: THREE.BufferGeometry[] = [];

  /* caudal */
  const x0 = -L / 2 + 0.01;
  const ph = f.top(0.97);
  const tail = new THREE.Shape();
  if (sp.tail === "fork") {
    const tl = L * 0.32;
    const S = Hb * 0.52;
    tail.moveTo(x0, ph);
    tail.quadraticCurveTo(x0 - tl * 0.5, S * 0.7, x0 - tl, S);
    tail.lineTo(x0 - tl * 0.55, 0);
    tail.lineTo(x0 - tl, -S);
    tail.quadraticCurveTo(x0 - tl * 0.5, -S * 0.7, x0, -ph);
  } else if (sp.tail === "veil") {
    const tl = L * 0.75;
    const S = Hb * 0.95;
    tail.moveTo(x0, ph);
    tail.bezierCurveTo(x0 - tl * 0.3, S * 0.9, x0 - tl * 0.8, S, x0 - tl, S * 0.5);
    tail.quadraticCurveTo(x0 - tl * 1.1, -S * 0.3, x0 - tl * 0.8, -S * 0.9);
    tail.bezierCurveTo(x0 - tl * 0.5, -S, x0 - tl * 0.2, -S * 0.6, x0, -ph);
  } else if (sp.tail === "sword") {
    const tl = L * 0.28;
    const S = Hb * 0.5;
    tail.moveTo(x0, ph);
    tail.quadraticCurveTo(x0 - tl * 0.4, S * 0.9, x0 - tl, S * 0.8);
    tail.lineTo(x0 - tl, -S * 0.2);
    tail.lineTo(x0 - tl * 2.4, -S * 0.75);
    tail.lineTo(x0 - tl * 2.3, -S * 0.98);
    tail.quadraticCurveTo(x0 - tl * 0.6, -S * 0.9, x0, -ph);
  } else if (sp.tail === "lyre") {
    const tl = L * 0.42;
    const S = Hb * 0.6;
    tail.moveTo(x0, ph);
    tail.quadraticCurveTo(x0 - tl * 0.4, S * 0.6, x0 - tl * 1.4, S * 1.1);
    tail.quadraticCurveTo(x0 - tl * 0.7, S * 0.25, x0 - tl * 0.55, 0);
    tail.quadraticCurveTo(x0 - tl * 0.7, -S * 0.25, x0 - tl * 1.4, -S * 1.1);
    tail.quadraticCurveTo(x0 - tl * 0.4, -S * 0.6, x0, -ph);
  } else {
    const tl = L * 0.3;
    const S = Hb * 0.48;
    tail.moveTo(x0, ph);
    tail.quadraticCurveTo(x0 - tl * 0.4, S * 0.9, x0 - tl, S * 0.85);
    tail.quadraticCurveTo(x0 - tl * 1.15, 0, x0 - tl, -S * 0.85);
    tail.quadraticCurveTo(x0 - tl * 0.4, -S * 0.9, x0, -ph);
  }
  parts.push(finGeometry(tail));

  /* dorsal and anal: a leading edge that rises, a trailing tip that sweeps back */
  const median = ([t0, t1, h]: [number, number, number], dir: 1 | -1) => {
    const edge = dir > 0 ? f.top : f.bottom;
    const xa = f.x(t0);
    const xb = f.x(t1);
    const ya = dir * edge(t0) * 0.82;
    const yb = dir * edge(t1) * 0.82;
    const span = xa - xb;
    const hp = dir * h * Hb;
    const e = dir * 0.02;
    const s = new THREE.Shape();
    s.moveTo(xa, ya - e);
    s.quadraticCurveTo(xa, ya + hp * 0.9, xa - span * 0.35, (dir > 0 ? Math.max(ya, yb) : Math.min(ya, yb)) + hp);
    s.quadraticCurveTo(xb - span * 0.1, yb + hp * 0.7, xb - L * 0.12 * h, yb + hp * 0.15);
    s.quadraticCurveTo(xb, yb, xb, yb - e);
    s.closePath();
    return finGeometry(s, true);
  };
  parts.push(median(sp.dorsal, 1), median(sp.anal, -1));

  /* paired fins, angled out from the flanks */
  const paired = (t: number, size: number, drop: number, yaw: number, roll: number) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(-size * 0.5, size * 0.35, -size, size * 0.1);
    s.quadraticCurveTo(-size * 0.6, -size * 0.25, 0, -size * 0.1);
    [1, -1].forEach((side) => {
      const g = finGeometry(s);
      g.rotateZ(roll);
      g.rotateY(side * yaw);
      g.translate(f.x(t), -f.bottom(t) * drop, side * f.half(t) * 0.9);
      parts.push(g);
    });
  };
  paired(0.27, L * 0.16, 0.35, 0.55, -0.15);
  paired(0.4, L * 0.12, 0.9, 0.25, -0.6);

  const flat = parts.map((p) => p.toNonIndexed());
  const merged = mergeGeometries(flat);
  parts.forEach((p) => p.dispose());
  flat.forEach((p) => p.dispose());
  if (!merged) throw new Error("aquarium: fin merge failed");
  return merged;
}

/* ── swimming ── */

type Bend = {
  uPhase: { value: number };
  uAmp: { value: number };
  uHead: { value: number };
  uLen: { value: number };
  uK: { value: number };
};

/* bends the body and fins as a travelling wave, growing toward the tail */
function bendable<T extends THREE.Material>(m: T, u: Bend) {
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uPhase, uAmp, uHead, uLen, uK;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
float bendS = clamp((uHead - transformed.x) / uLen, 0.0, 1.8);
transformed.z += uAmp * bendS * bendS * sin(uPhase - transformed.x * uK);`,
      );
  };
  m.customProgramCacheKey = () => "fish-bend";
  return m;
}

type Swimmer = {
  sp: Species;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  goal: THREE.Vector3;
  regoalAt: number;
  zone: string;
  heading: number;
  pitch: number;
  grow: number;
  cruise: number;
  bend: Bend;
  group: THREE.Group | null;
};

/* Mutable school state, kept out of React like the desk and the shelf. */
class School {
  readonly fish: Swimmer[];
  active: number | null = null;
  hovered = -1;
  featured = new Set<number>();
  private clock = 0;
  private dir = new THREE.Vector3();
  private rand = rng(7);

  constructor(species: Species[], private reduced: boolean) {
    this.fish = species.map((sp, i) => {
      const f: Swimmer = {
        sp,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        goal: new THREE.Vector3(),
        regoalAt: 0,
        zone: "",
        heading: this.rand() * Math.PI * 2,
        pitch: 0,
        grow: 0,
        cruise: 0.28 + this.rand() * 0.2,
        bend: {
          uPhase: { value: this.rand() * 10 },
          uAmp: { value: 0 },
          uHead: { value: sp.len * 0.22 },
          uLen: { value: sp.len },
          uK: { value: (Math.PI * 2) / (sp.len * 1.25) },
        },
        group: null,
      };
      this.pickGoal(f, i);
      f.pos.copy(f.goal);
      return f;
    });
  }

  setActive(i: number | null) {
    this.active = i;
  }

  setFeatured(indices: readonly number[]) {
    this.featured = new Set(indices);
  }

  setHovered(i: number) {
    this.hovered = i;
  }

  attach(i: number, g: THREE.Group | null) {
    this.fish[i].group = g;
    if (g) g.rotation.order = "YZX";
  }

  private bounds(len: number) {
    return { x: IN_W / 2 - 0.12 - len / 2, z: IN_D / 2 - 0.1 - len / 2, y1: WATER_TOP - 0.22 };
  }

  private zoneOf(i: number) {
    if (this.active === i) return "show";
    /* the rest of the school makes room for the one on show */
    if (this.active !== null) return "back";
    if (this.featured.size === 0) return "free";
    return this.featured.has(i) ? "front" : "back";
  }

  private floor(f: Swimmer) {
    return groundY(f.pos.x, f.pos.z) + f.sp.depth * f.sp.len * 0.6 + 0.08;
  }

  private pickGoal(f: Swimmer, i: number) {
    const b = this.bounds(f.sp.len);
    const zone = this.zoneOf(i);
    f.zone = zone;
    f.regoalAt = this.reduced ? Infinity : this.clock + 3 + this.rand() * 4;
    if (zone === "show") {
      /* front and center, side-on to the room */
      f.goal.set(0, (WATER_TOP + groundY(0, b.z)) / 2, b.z);
      return;
    }
    const z0 = zone === "front" ? b.z * 0.3 : -b.z;
    const z1 = zone === "back" ? -b.z * 0.15 : b.z;
    /* in reduced motion each fish keeps a fixed spot, spread by index */
    const x = this.reduced ? -b.x + ((i + 0.5) / this.fish.length) * 2 * b.x : -b.x + this.rand() * 2 * b.x;
    const z = z0 + this.rand() * (z1 - z0);
    const y0 = groundY(x, z) + 0.3;
    f.goal.set(x, y0 + this.rand() * Math.max(0, b.y1 - y0), z);
  }

  step(delta: number) {
    const dt = Math.min(delta, 1 / 30);
    this.clock += dt;

    this.fish.forEach((f, i) => {
      if (f.zone !== this.zoneOf(i) || this.clock > f.regoalAt) this.pickGoal(f, i);

      const showing = f.zone === "show";
      this.dir.subVectors(f.goal, f.pos);
      const dist = this.dir.length();
      if (this.reduced) {
        f.pos.copy(f.goal);
        f.vel.set(0, 0, 0);
      } else {
        /* steer toward the goal and ease off on arrival */
        const speed = Math.min(f.cruise * (showing ? 0.8 : 1), dist * 1.4);
        this.dir.normalize().multiplyScalar(speed);
        f.vel.x = damp(f.vel.x, this.dir.x, 1.8, dt);
        f.vel.y = damp(f.vel.y, this.dir.y * 0.6, 1.8, dt);
        f.vel.z = damp(f.vel.z, this.dir.z, 1.8, dt);
        f.pos.addScaledVector(f.vel, dt);
        if (dist < 0.12 && !showing) f.regoalAt = this.clock;
      }
      const b = this.bounds(f.sp.len);
      f.pos.x = clamp(f.pos.x, -b.x, b.x);
      f.pos.z = clamp(f.pos.z, -b.z, b.z);
      f.pos.y = clamp(f.pos.y, this.floor(f), b.y1);

      /* the model faces +x; a parked fish turns side-on so the room sees its profile */
      const flat = Math.hypot(f.vel.x, f.vel.z);
      let yaw = f.heading;
      if (flat > 0.04) yaw = Math.atan2(-f.vel.z, f.vel.x);
      else if (showing || this.reduced) yaw = Math.cos(f.heading) >= 0 ? 0 : Math.PI;
      const turn = Math.atan2(Math.sin(yaw - f.heading), Math.cos(yaw - f.heading));
      f.heading += this.reduced ? turn : turn * (1 - Math.exp(-4 * dt));
      f.pitch = damp(f.pitch, clamp(Math.atan2(f.vel.y, flat + 0.05), -0.4, 0.4), 4, dt);
      f.grow = damp(f.grow, this.hovered === i || showing ? 1 : 0, 10, dt);

      /* tail beat speeds up with swimming speed; a hovering fish still sculls */
      const pace = Math.min(f.vel.length() / 0.4, 1);
      f.bend.uPhase.value += dt * (5 + pace * 9);
      f.bend.uAmp.value = this.reduced ? 0 : f.sp.len * (0.05 + pace * 0.09) + Math.abs(turn) * f.sp.len * 0.08;

      const g = f.group;
      if (!g) return;
      g.position.copy(f.pos);
      g.rotation.set(0, f.heading, f.pitch);
      /* the fish on show gets a little larger than a hovered one, so it reads across the room */
      g.scale.setScalar(1 + f.grow * (showing ? 0.35 : 0.15));
    });
  }
}

function Fish({ sp, bend, bump, rays }: { sp: Species; bend: Bend; bump: THREE.Texture; rays: THREE.Texture }) {
  const parts = useMemo(() => {
    const body = bodyGeometry(sp);
    const fins = finsGeometry(sp);
    const skin = skinTexture(sp);
    const bodyMat = bendable(
      new THREE.MeshPhysicalMaterial({
        map: skin,
        bumpMap: bump,
        bumpScale: 0.6,
        roughness: 0.38,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
        iridescence: sp.sheen,
        iridescenceIOR: 1.35,
        iridescenceThicknessRange: [180, 520],
      }),
      bend,
    );
    const finMat = bendable(
      new THREE.MeshStandardMaterial({
        map: rays,
        color: sp.fin,
        roughness: 0.5,
        transparent: true,
        opacity: sp.finAlpha,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      bend,
    );
    return { body, fins, skin, bodyMat, finMat };
  }, [sp, bend, bump, rays]);

  useEffect(
    () => () => {
      parts.body.dispose();
      parts.fins.dispose();
      parts.skin.dispose();
      parts.bodyMat.dispose();
      parts.finMat.dispose();
    },
    [parts],
  );

  const f = fishShape(sp);
  const t = 0.12;
  const er = Math.min(f.Hb * 0.11, sp.len * 0.075);
  return (
    <>
      <mesh geometry={parts.body} material={parts.bodyMat} />
      <mesh geometry={parts.fins} material={parts.finMat} renderOrder={3} />
      {[1, -1].map((s) => (
        <group key={s} position={[f.x(t), f.top(t) * 0.28, s * f.half(t) * 0.86]}>
          <mesh scale={[1, 1, 0.55]}>
            <sphereGeometry args={[er, 14, 10]} />
            <meshPhysicalMaterial color="#060606" roughness={0.1} clearcoat={1} />
          </mesh>
          <mesh position={[0, 0, s * er * 0.32]}>
            <torusGeometry args={[er * 0.62, er * 0.24, 8, 18]} />
            <meshStandardMaterial color={sp.iris} roughness={0.35} metalness={0.3} />
          </mesh>
        </group>
      ))}
      {/* a generous invisible target: small moving fish are hard to hit, worse on touch */}
      <mesh scale={[sp.len * 1.4, Math.max(f.Hb * 1.6, 0.4), Math.max(sp.width * sp.len * 3, 0.4)]}>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </>
  );
}

/* ── the tank's furnishings ── */

function gravelTexture() {
  const S = 512;
  const { c, ctx } = surface(S, S);
  ctx.fillStyle = "#5e5142";
  ctx.fillRect(0, 0, S, S);
  const r = rng(11);
  const palette = ["#8b7b64", "#5e5243", "#a8987c", "#6f665c", "#c2b49a", "#4a4038", "#9a8c78"];
  for (let i = 0; i < 5200; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 2 + r() * 5;
    const rot = r() * Math.PI;
    const col = palette[Math.floor(r() * palette.length)];
    /* wrap pebbles over the edges so the texture tiles */
    for (const [dx, dy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) {
      const px = x + dx;
      const py = y + dy;
      if (px < -8 || px > S + 8 || py < -8 || py > S + 8) continue;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(px + 1, py + 1.2, rad, rad * 0.75, rot, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(px, py, rad, rad * 0.75, rot, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.ellipse(px - rad * 0.3, py - rad * 0.3, rad * 0.35, rad * 0.25, rot, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const t = texture(c);
  t.repeat.set(3, 1.4);
  return t;
}

/* tiling caustic net: where the two nearest cell seeds are almost equidistant */
function causticTexture() {
  const S = 256;
  const { c, ctx } = surface(S, S);
  const r = rng(5);
  const seeds = Array.from({ length: 22 }, () => [r() * S, r() * S]);
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let d1 = Infinity;
      let d2 = Infinity;
      for (const [sx, sy] of seeds) {
        let dx = Math.abs(x - sx);
        let dy = Math.abs(y - sy);
        dx = Math.min(dx, S - dx);
        dy = Math.min(dy, S - dy);
        const d = Math.hypot(dx, dy);
        if (d < d1) {
          d2 = d1;
          d1 = d;
        } else if (d < d2) d2 = d;
      }
      const v = Math.pow(1 - smoothstep(d2 - d1, 0, 9), 2) * 255;
      const k = (y * S + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = v;
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = texture(c);
  t.repeat.set(2.2, 1);
  return t;
}

function stoneTexture() {
  const S = 256;
  const { c, ctx } = surface(S, S);
  ctx.fillStyle = "#7f807b";
  ctx.fillRect(0, 0, S, S);
  const r = rng(23);
  for (let i = 0; i < 2600; i++) {
    const v = 90 + r() * 70;
    ctx.fillStyle = `rgba(${v},${v},${v - 6},0.5)`;
    ctx.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 3);
  }
  /* the pale calcite veins of seiryu stone */
  ctx.strokeStyle = "rgba(225,222,212,0.22)";
  ctx.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    ctx.lineWidth = 0.8 + r() * 1.4;
    ctx.beginPath();
    let x = r() * S;
    let y = r() * S;
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      const cx = x + (r() - 0.5) * 30;
      const cy = y + (r() - 0.5) * 30;
      x += (r() - 0.3) * 50;
      y += (r() - 0.5) * 24;
      ctx.quadraticCurveTo(cx, cy, x, y);
    }
    ctx.stroke();
  }
  return texture(c);
}

function barkTexture() {
  const { c, ctx } = surface(512, 64);
  ctx.fillStyle = "#4a3222";
  ctx.fillRect(0, 0, 512, 64);
  const r = rng(31);
  for (let i = 0; i < 160; i++) {
    const v = r();
    ctx.strokeStyle = v > 0.6 ? "rgba(140,104,72,0.55)" : "rgba(26,16,10,0.5)";
    ctx.lineWidth = 0.8 + r() * 2.2;
    const y = r() * 64;
    const x = r() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40 + r() * 160, y + (r() - 0.5) * 4);
    ctx.stroke();
  }
  return texture(c);
}

function filmTexture() {
  const { c, ctx } = surface(64, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#16353b");
  g.addColorStop(0.6, "#0b1d20");
  g.addColorStop(1, "#060e0f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  return texture(c);
}

function stoneGeometry(seed: number) {
  const r = rng(seed);
  const waves = Array.from({ length: 7 }, () => ({
    d: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
    f: 1.5 + r() * 4,
    p: r() * 6.28,
    a: 0.03 + r() * 0.07,
  }));
  const base = new THREE.IcosahedronGeometry(1, 4);
  base.deleteAttribute("normal");
  base.deleteAttribute("uv");
  const g = mergeVertices(base);
  base.dispose();
  const p = g.attributes.position;
  const n = new THREE.Vector3();
  const uv: number[] = [];
  for (let i = 0; i < p.count; i++) {
    n.fromBufferAttribute(p, i).normalize();
    const k = 1 + waves.reduce((s, w) => s + Math.sin(n.dot(w.d) * w.f + w.p) * w.a, 0);
    /* flatten the base so stones sit into the gravel */
    p.setXYZ(i, n.x * k, Math.max(n.y * k, -0.35), n.z * k);
    uv.push(0.5 + Math.atan2(n.z, n.x) / (Math.PI * 2), 0.5 + n.y * 0.5);
  }
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/* every grass blade and stem leaf in the tank, merged into one swaying mesh */
function plantsGeometry() {
  const r = rng(41);
  const blades: THREE.BufferGeometry[] = [];
  const col = new THREE.Color();
  const blade = (x: number, z: number, len: number, width: number, curl: number, base: string, tip: string) => {
    const g = new THREE.PlaneGeometry(width, len, 1, 6);
    g.translate(0, len / 2, 0);
    const p = g.attributes.position;
    const h = new Float32Array(p.count);
    const phase = new Float32Array(p.count).fill(r() * 6.28);
    const colors = new Float32Array(p.count * 3);
    const c0 = new THREE.Color(base);
    const c1 = new THREE.Color(tip);
    for (let i = 0; i < p.count; i++) {
      const t = p.getY(i) / len;
      p.setX(i, p.getX(i) * (1 - t * 0.7) + curl * t * t * len * 0.35);
      p.setZ(i, Math.sin(t * Math.PI) * 0.04 * curl);
      h[i] = (t * len) / 2.4;
      col.lerpColors(c0, c1, t);
      colors.set([col.r, col.g, col.b], i * 3);
    }
    g.setAttribute("aH", new THREE.BufferAttribute(h, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.rotateY(r() * Math.PI * 2);
    g.translate(x, groundY(x, z) - 0.03, z);
    blades.push(g);
  };

  /* vallisneria along the back, tall enough to reach the surface */
  for (let i = 0; i < 46; i++) {
    const x = -IN_W / 2 + 0.2 + r() * (IN_W - 0.4);
    const z = -IN_D / 2 + 0.12 + r() * 0.45;
    const room = WATER_TOP - groundY(x, z);
    blade(x, z, room * (0.6 + r() * 0.45), 0.055, (r() - 0.5) * 1.6, "#24502a", "#7bb04c");
  }
  /* rotala bushes in the back corners, red at the tips */
  for (const cx of [-IN_W / 2 + 0.45, IN_W / 2 - 0.5]) {
    for (let i = 0; i < 60; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 0.38;
      blade(cx + Math.cos(a) * d, -0.25 + Math.sin(a) * d * 0.8, 0.5 + r() * 0.9, 0.04, (r() - 0.5) * 2, "#3b6a2e", r() > 0.4 ? "#c8644a" : "#8fbf52");
    }
  }
  /* dwarf hairgrass carpet across the front */
  for (let i = 0; i < 320; i++) {
    const x = -IN_W / 2 + 0.1 + r() * (IN_W - 0.2);
    const z = r() * (IN_D / 2 - 0.12);
    blade(x, z, 0.1 + r() * 0.16, 0.014, (r() - 0.5) * 2, "#2f6a2c", "#8ccc5a");
  }
  const merged = mergeGeometries(blades);
  blades.forEach((b) => b.dispose());
  if (!merged) throw new Error("aquarium: plant merge failed");
  return merged;
}

function swaying(m: THREE.MeshStandardMaterial, time: { value: number }) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aH;\nattribute float aPhase;\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
float sway = aH * aH;
transformed.x += sin(uTime * 0.8 + aPhase) * 0.12 * sway;
transformed.z += cos(uTime * 0.6 + aPhase * 1.3) * 0.06 * sway;`,
      );
  };
  m.customProgramCacheKey = () => "plant-sway";
  return m;
}

/* the gravel bed, and its cut face seen through the front and side glass */
function groundGeometry() {
  const top = new THREE.PlaneGeometry(IN_W, IN_D, 64, 32).rotateX(-Math.PI / 2);
  const p = top.attributes.position;
  const r = rng(3);
  for (let i = 0; i < p.count; i++) p.setY(i, groundY(p.getX(i), p.getZ(i)) + (r() - 0.5) * 0.02);
  top.computeVertexNormals();

  const skirt = (along: "x" | "z", fixed: number, flip: boolean) => {
    const n = 48;
    const len = along === "x" ? IN_W : IN_D;
    const pos: number[] = [];
    const uv: number[] = [];
    for (let i = 0; i <= n; i++) {
      const s = -len / 2 + (i / n) * len;
      const [x, z] = along === "x" ? [s, fixed] : [fixed, s];
      const y = groundY(x, z);
      pos.push(x, y, z, x, GLASS, z);
      uv.push(i / n, y / 0.4, i / n, 0);
    }
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = i * 2;
      if (flip) idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      else idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  /* the cut face stays out of the caustics, so it gets its own mesh */
  const parts = [skirt("x", IN_D / 2, false), skirt("z", -IN_W / 2, false), skirt("z", IN_W / 2, true)];
  const flat = parts.map((g) => g.toNonIndexed());
  const face = mergeGeometries(flat);
  parts.forEach((g) => g.dispose());
  flat.forEach((g) => g.dispose());
  if (!face) throw new Error("aquarium: ground merge failed");
  return { top, face };
}

const DRIFTWOOD: [number, number, number][][] = [
  [[-1.5, 0.55, 0.2], [-1.0, 0.75, -0.05], [-0.45, 1.25, -0.35], [0.1, 1.85, -0.55]],
  [[-1.0, 0.75, -0.05], [-1.35, 1.3, -0.3], [-1.6, 1.75, -0.45]],
  [[-0.45, 1.25, -0.35], [-0.2, 1.45, -0.1], [0.2, 1.5, 0.05]],
];

/* glass panes: clear faces, with the green tint showing only on the cut edges */
function Pane({ size, at, thin }: { size: [number, number, number]; at: [number, number, number]; thin: 0 | 1 | 2 }) {
  return (
    <mesh position={at} renderOrder={4} raycast={() => null}>
      <boxGeometry args={size} />
      {[0, 1, 2, 3, 4, 5].map((k) =>
        Math.floor(k / 2) === thin ? (
          <meshStandardMaterial key={k} attach={`material-${k}`} color="#f1fbf8" roughness={0.02} metalness={0.1} envMapIntensity={2} transparent opacity={0.07} depthWrite={false} />
        ) : (
          <meshStandardMaterial key={k} attach={`material-${k}`} color="#7cc4a9" roughness={0.1} transparent opacity={0.6} depthWrite={false} />
        ),
      )}
    </mesh>
  );
}

function Bubbles() {
  const count = 18;
  const ref = useRef<THREE.InstancedMesh>(null);
  const [state] = useState(() => {
    const r = rng(17);
    return Array.from({ length: count }, () => ({ y: r(), speed: 0.4 + r() * 0.35, phase: r() * 6, size: 0.018 + r() * 0.03 }));
  });
  const m = useMemo(() => new THREE.Matrix4(), []);
  const x = IN_W / 2 - 0.35;
  const z = -IN_D / 2 + 0.25;
  const base = groundY(x, z);
  const span = WATER_TOP - base;

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const dt = Math.min(delta, 1 / 30);
    state.forEach((b, i) => {
      b.y += (b.speed * dt) / span;
      if (b.y > 1) b.y = 0;
      b.phase += dt * 3;
      const s = b.size * (0.7 + b.y * 0.6);
      m.makeScale(s, s, s).setPosition(x + Math.sin(b.phase) * 0.03, base + b.y * span, z + Math.cos(b.phase * 0.7) * 0.03);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} raycast={() => null}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial color="#f4fbff" roughness={0.05} transparent opacity={0.5} />
    </instancedMesh>
  );
}

const STONES: [number, number, number, [number, number, number], number][] = [
  /* x, z, yaw, scale, geometry */
  [-0.85, -0.35, 0.4, [0.5, 0.62, 0.4], 0],
  [-0.25, -0.15, 1.6, [0.3, 0.32, 0.26], 1],
  [0.55, -0.4, 2.4, [0.38, 0.4, 0.3], 2],
  [1.2, 0.1, 0.8, [0.2, 0.16, 0.18], 3],
];

/* plant sway clock and caustic drift, stepped every frame */
class Water {
  readonly time = { value: 0 };

  step(dt: number, caustic: THREE.Texture) {
    this.time.value += dt;
    caustic.offset.x += dt * 0.012;
    caustic.offset.y += dt * 0.008;
  }
}

type AquariumProps = {
  skills: readonly Skill[];
  active: number | null;
  featured: readonly number[];
  /* the fish wearing a name tag: hovered in the guide or the tank, or selected */
  labelled: number | null;
  reduced: boolean;
  night: boolean;
  onSelect: (index: number | null) => void;
  onHover: (index: number | null) => void;
};

export function Aquarium({ skills, active, featured, labelled, reduced, night, onSelect, onHover }: AquariumProps) {
  const species = useMemo(() => skills.map((s) => speciesOf(s.name)), [skills]);
  const [school] = useState(() => new School(species, reduced));
  const [water] = useState(() => new Water());
  const groundMat = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.SpotLight>(null);
  const label = useRef<THREE.Group>(null);

  const tex = useMemo(
    () => ({
      bump: scaleBump(),
      rays: finRays(),
      gravel: gravelTexture(),
      caustic: causticTexture(),
      stone: stoneTexture(),
      bark: barkTexture(),
      film: filmTexture(),
    }),
    [],
  );
  const geo = useMemo(
    () => ({
      ground: groundGeometry(),
      plants: plantsGeometry(),
      stones: [stoneGeometry(1), stoneGeometry(2), stoneGeometry(3), stoneGeometry(4)],
      wood: DRIFTWOOD.map((pts, i) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 40, 0.09 - i * 0.02, 8)),
    }),
    [],
  );
  const plantMat = useMemo(
    () => swaying(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.55 }), water.time),
    [water],
  );

  useEffect(
    () => () => {
      Object.values(tex).forEach((t) => t.dispose());
      geo.ground.top.dispose();
      geo.ground.face.dispose();
      geo.plants.dispose();
      geo.stones.forEach((g) => g.dispose());
      geo.wood.forEach((g) => g.dispose());
      plantMat.dispose();
    },
    [tex, geo, plantMat],
  );

  useEffect(() => {
    school.setActive(active);
  }, [school, active]);

  useEffect(() => {
    school.setFeatured(featured);
  }, [school, featured]);

  /* place the fish before the first paint so nobody sees them at the origin */
  useLayoutEffect(() => school.step(0), [school]);

  /* the light's target lives outside the scene graph, so keep its matrix fresh */
  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(TANK.x, 0, TANK.z);
    l.target.updateMatrixWorld();
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    school.step(delta);
    /* plants sway and caustics drift across the gravel */
    if (!reduced) water.step(dt, tex.caustic);
    /* the tank light reads brighter once the room goes dark */
    if (groundMat.current) groundMat.current.emissiveIntensity = damp(groundMat.current.emissiveIntensity, night ? 0.55 : 0.22, 3, dt);
    if (light.current) light.current.intensity = damp(light.current.intensity, night ? 26 : 12, 3, dt);
    if (label.current && labelled !== null) {
      const f = school.fish[labelled];
      label.current.position.set(f.pos.x, f.pos.y + f.sp.depth * f.sp.len * 0.5 + 0.16, f.pos.z);
    }
  });

  const glassH = TANK.h - GLASS;
  const noHit = () => null;

  return (
    <>
      {/* the light bar's spot, in world space so its target is easy to aim */}
      <spotLight ref={light} position={[TANK.x, TANK.h + 0.2, TANK.z]} color="#eef7ff" intensity={12} angle={1.05} penumbra={0.7} decay={1.4} distance={7} />

      <group position={[TANK.x, 0, TANK.z]} rotation={[0, Math.PI / 2, 0]}>
        {/* leveling mat */}
        <mesh position={[0, 0.01, 0]} receiveShadow raycast={noHit}>
          <boxGeometry args={[TANK.w + 0.06, 0.02, TANK.d + 0.06]} />
          <meshStandardMaterial color="#141414" roughness={0.9} />
        </mesh>

        {/* rimless glass box */}
        <Pane size={[TANK.w, GLASS, TANK.d]} at={[0, 0.02 + GLASS / 2, 0]} thin={1} />
        <Pane size={[TANK.w, glassH, GLASS]} at={[0, GLASS + glassH / 2, TANK.d / 2 - GLASS / 2]} thin={2} />
        <Pane size={[TANK.w, glassH, GLASS]} at={[0, GLASS + glassH / 2, -TANK.d / 2 + GLASS / 2]} thin={2} />
        <Pane size={[GLASS, glassH, TANK.d - GLASS * 2]} at={[-TANK.w / 2 + GLASS / 2, GLASS + glassH / 2, 0]} thin={0} />
        <Pane size={[GLASS, glassH, TANK.d - GLASS * 2]} at={[TANK.w / 2 - GLASS / 2, GLASS + glassH / 2, 0]} thin={0} />
        {/* silicone seams in the corners */}
        {[
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ].map(([sx, sz]) => (
          <mesh key={`${sx}${sz}`} position={[sx * (IN_W / 2 - 0.012), GLASS + glassH / 2, sz * (IN_D / 2 - 0.012)]} raycast={noHit}>
            <boxGeometry args={[0.026, glassH, 0.026]} />
            <meshStandardMaterial color="#101010" roughness={0.4} />
          </mesh>
        ))}

        {/* background film on the back glass, for contrast behind the fish */}
        <mesh position={[0, GLASS + glassH / 2, -IN_D / 2 + 0.003]} raycast={noHit}>
          <planeGeometry args={[IN_W, glassH]} />
          <meshStandardMaterial map={tex.film} roughness={0.9} />
        </mesh>

        {/* gravel with caustics */}
        <mesh geometry={geo.ground.face} raycast={noHit}>
          <meshStandardMaterial map={tex.gravel} bumpMap={tex.gravel} bumpScale={1.5} roughness={0.95} color="#b9ab98" />
        </mesh>
        <mesh geometry={geo.ground.top} receiveShadow raycast={noHit}>
          <meshStandardMaterial
            ref={groundMat}
            map={tex.gravel}
            bumpMap={tex.gravel}
            bumpScale={1.5}
            roughness={0.95}
            emissive="#cfeeff"
            emissiveMap={tex.caustic}
            emissiveIntensity={0.22}
          />
        </mesh>

        {/* seiryu stones */}
        {STONES.map(([x, z, yaw, s, gi], i) => (
          <mesh key={i} geometry={geo.stones[gi]} position={[x, groundY(x, z) + s[1] * 0.2, z]} rotation={[0, yaw, 0]} scale={s} castShadow raycast={noHit}>
            <meshStandardMaterial map={tex.stone} bumpMap={tex.stone} bumpScale={1.2} roughness={0.85} />
          </mesh>
        ))}

        {/* driftwood */}
        {geo.wood.map((g, i) => (
          <mesh key={i} geometry={g} castShadow raycast={noHit}>
            <meshStandardMaterial map={tex.bark} bumpMap={tex.bark} bumpScale={2} roughness={0.9} />
          </mesh>
        ))}

        <mesh geometry={geo.plants} material={plantMat} raycast={noHit} />
        {!reduced && <Bubbles />}

        {/* one fish per skill */}
        {skills.map((s, i) => (
          <group
            key={s.name}
            ref={(g) => school.attach(i, g)}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerOver={(e) => {
              e.stopPropagation();
              school.setHovered(i);
              onHover(i);
            }}
            onPointerOut={() => {
              if (school.hovered === i) school.setHovered(-1);
              onHover(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(school.active === i ? null : i);
            }}
          >
            <Fish sp={species[i]} bend={school.fish[i].bend} bump={tex.bump} rays={tex.rays} />
          </group>
        ))}

        <group ref={label}>
          {labelled !== null && (
            <Html center zIndexRange={[15, 10]} pointerEvents="none">
              <p className="tank-label">{skills[labelled].name}</p>
            </Html>
          )}
        </group>

        {/* water: a faint tint through the volume and a bright surface line */}
        <mesh position={[0, (GLASS + WATER_TOP) / 2, 0]} renderOrder={2} raycast={noHit}>
          <boxGeometry args={[IN_W - 0.01, WATER_TOP - GLASS, IN_D - 0.01]} />
          <meshStandardMaterial color="#9fd8d0" roughness={0.1} transparent opacity={0.1} depthWrite={false} />
        </mesh>
        <mesh position={[0, WATER_TOP, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3} raycast={noHit}>
          <planeGeometry args={[IN_W - 0.01, IN_D - 0.01]} />
          <meshStandardMaterial color="#dff6f2" roughness={0.05} metalness={0.2} transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>

        {/* LED light bar resting on the glass */}
        <group position={[0, TANK.h, 0]}>
          <mesh position={[0, 0.24, 0]} castShadow raycast={noHit}>
            <boxGeometry args={[TANK.w * 0.96, 0.05, 0.34]} />
            <meshStandardMaterial color="#b9bcbf" metalness={0.85} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.214, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={noHit}>
            <planeGeometry args={[TANK.w * 0.9, 0.22]} />
            <meshStandardMaterial color="#ffffff" emissive="#f2f9ff" emissiveIntensity={night ? 2.4 : 1.4} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * TANK.w * 0.47, 0.12, 0]} raycast={noHit}>
              <boxGeometry args={[0.04, 0.24, 0.3]} />
              <meshStandardMaterial color="#9a9da0" metalness={0.85} roughness={0.35} />
            </mesh>
          ))}
        </group>
      </group>
    </>
  );
}
