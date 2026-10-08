"use client";

import { RoundedBox } from "@react-three/drei";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FitModel, GAMEPAD_CROP, MODEL_URLS } from "./FitModel";
import { monitorTexture, pegboardTexture, photoTexture } from "./textures";

/*
 * The back wall: a floor-to-ceiling pegboard with everything hung on it, plus
 * the monitor standing at the back of the desk. None of this is draggable.
 * Wall-mounted pieces are placed in wall space: x across, y up from the desk
 * top, and depth measured out from the board face.
 */

export const WALL_Z = -4.9;
const FACE = WALL_Z + 0.075;

type V3 = [number, number, number];

/* deterministic scatter so clips and leaves land the same way every load */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* shared static geometry, built on first use and kept for the page's lifetime */
function once<T>(make: () => T) {
  let value: T | undefined;
  return () => (value ??= make());
}

function useDisposable<T extends { dispose(): void }>(value: T) {
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

function merge(parts: THREE.BufferGeometry[]) {
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const out = mergeGeometries(flat);
  parts.forEach((g) => g.dispose());
  flat.forEach((g) => g.dispose());
  if (!out) throw new Error("wall: geometry merge failed");
  return out;
}

type Inst = { p: V3; r?: V3; q?: THREE.Quaternion; s?: V3 | number; c?: string };

function Instances({
  items,
  geometry,
  shadow = true,
  children,
}: {
  items: Inst[];
  geometry?: THREE.BufferGeometry;
  shadow?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      if (it.q) o.quaternion.copy(it.q);
      else o.rotation.set(...(it.r ?? [0, 0, 0]));
      if (typeof it.s === "number") o.scale.setScalar(it.s);
      else o.scale.set(...(it.s ?? [1, 1, 1]));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      if (it.c) m.setColorAt(i, col.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} castShadow={shadow} receiveShadow>
      {children}
    </instancedMesh>
  );
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);

/* a cylinder strung between two points: cords, twine, hooks */
function Rod({ a, b, r, color, metal = false }: { a: V3; b: V3; r: number; color: string; metal?: boolean }) {
  const va = new THREE.Vector3(...a);
  const dir = new THREE.Vector3(...b).sub(va);
  const len = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, dir.normalize());
  const mid = va.addScaledVector(dir, len / 2);
  return (
    <mesh position={mid.toArray()} quaternion={quat} castShadow={metal}>
      <cylinderGeometry args={[r, r, len, 8]} />
      <meshStandardMaterial color={color} roughness={metal ? 0.3 : 0.9} metalness={metal ? 1 : 0} />
    </mesh>
  );
}

/* J-hook: an arm straight out of the board with an upturned tip */
function Peg({ x, y, out = 0.6 }: { x: number; y: number; out?: number }) {
  const tip: V3 = [x, y, FACE + out];
  return (
    <group>
      <Rod a={[x, y, FACE]} b={tip} r={0.035} color="#b9bab8" metal />
      <Rod a={tip} b={[x, y + 0.2, FACE + out + 0.05]} r={0.035} color="#b9bab8" metal />
      <mesh position={[x, y, FACE + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.02, 12]} />
        <meshStandardMaterial color="#9fa09e" metalness={1} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Pegboard() {
  const tex = useMemo(() => {
    const t = pegboardTexture();
    t.repeat.set(40, 22);
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={[0, 20, WALL_Z]} receiveShadow>
      <boxGeometry args={[80, 44, 0.15]} />
      <meshStandardMaterial map={tex} roughness={0.85} />
    </mesh>
  );
}

/* ── bins ── */

const WALL_T = 0.05;

/*
 * A pegboard bin: tall back with hanging tabs, sloped sides, a low front with
 * a rolled lip. Origin at the bottom of the back panel, opening toward +z.
 */
function binGeometry(w: number, h: number, d: number, front: number) {
  const t = WALL_T;
  const profile = new THREE.Shape();
  profile.moveTo(0, 0);
  profile.lineTo(d, 0);
  profile.lineTo(d, front);
  profile.lineTo(0, h);
  profile.closePath();
  const side = (x: number) => {
    const g = new THREE.ExtrudeGeometry(profile, { depth: t, bevelEnabled: false });
    g.rotateY(-Math.PI / 2);
    g.translate(x, 0, 0);
    return g;
  };
  const box = (sx: number, sy: number, sz: number, x: number, y: number, z: number) =>
    new THREE.BoxGeometry(sx, sy, sz).translate(x, y, z);
  const lip = new THREE.CylinderGeometry(t * 0.8, t * 0.8, w, 10).rotateZ(Math.PI / 2).translate(0, front, d - t / 2);
  return merge([
    side(-w / 2 + t),
    side(w / 2),
    box(w, h, t, 0, h / 2, t / 2),
    box(w, t, d, 0, t / 2, d / 2),
    box(w, front, t, 0, front / 2, d - t / 2),
    lip,
    box(0.3, 0.22, t, -w * 0.3, h + 0.1, t / 2),
    box(0.3, 0.22, t, w * 0.3, h + 0.1, t / 2),
  ]);
}

const BIN = { w: 2.1, h: 1.7, d: 1.3, front: 0.8 };
const TRAY = { w: 2.1, h: 1.35, d: 1.3, front: 1.0 };
const binGeo = once(() => binGeometry(BIN.w, BIN.h, BIN.d, BIN.front));
const trayGeo = once(() => binGeometry(TRAY.w, TRAY.h, TRAY.d, TRAY.front));

/* highlighter or pen: barrel, cap with a pocket clip, end plug. Origin at the base. */
function Marker({
  p,
  r,
  body,
  cap,
  len = 1.3,
  rad = 0.085,
  flat = 0.8,
  glow = 0.12,
}: {
  p: V3;
  r: V3;
  body: string;
  cap: string;
  len?: number;
  rad?: number;
  flat?: number;
  glow?: number;
}) {
  const capLen = len * 0.34;
  const squash: V3 = [1, 1, flat];
  return (
    <group position={p} rotation={r}>
      <mesh position={[0, len / 2, 0]} scale={squash} castShadow>
        <cylinderGeometry args={[rad, rad * 0.92, len, 18]} />
        <meshStandardMaterial color={body} emissive={body} emissiveIntensity={glow} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.01, 0]} scale={squash}>
        <cylinderGeometry args={[rad * 0.9, rad * 0.9, 0.03, 18]} />
        <meshStandardMaterial color="#2a2a28" roughness={0.6} />
      </mesh>
      <mesh position={[0, len + capLen / 2 - 0.08, 0]} scale={squash} castShadow>
        <cylinderGeometry args={[rad * 1.1, rad * 1.1, capLen, 18]} />
        <meshStandardMaterial color={cap} roughness={0.25} />
      </mesh>
      <mesh position={[0, len + capLen - 0.08, 0]} scale={[1, 0.35, flat]}>
        <sphereGeometry args={[rad * 1.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={cap} roughness={0.25} />
      </mesh>
      <mesh position={[0, len + capLen * 0.4, rad * flat * 1.1 + 0.02]}>
        <boxGeometry args={[rad * 0.55, capLen * 0.85, 0.025]} />
        <meshStandardMaterial color={cap} roughness={0.3} />
      </mesh>
    </group>
  );
}

const HIGHLIGHTER = {
  yellow: ["#f6e53a", "#efd20c"],
  pink: ["#ff6fa8", "#f04d8f"],
  green: ["#86e05e", "#5cc83a"],
  orange: ["#ffa04a", "#f5822a"],
} as const;

type MarkerSpec = { kind: keyof typeof HIGHLIGHTER; x: number; z: number; tilt: V3 };

const BIN_MARKERS: MarkerSpec[][] = [
  [
    { kind: "yellow", x: -0.55, z: 0.75, tilt: [-0.32, 0, 0.18] },
    { kind: "yellow", x: -0.2, z: 0.85, tilt: [-0.36, 0, -0.05] },
    { kind: "orange", x: 0.2, z: 0.7, tilt: [-0.28, 0, -0.2] },
    { kind: "yellow", x: 0.55, z: 0.8, tilt: [-0.33, 0, -0.32] },
  ],
  [
    { kind: "pink", x: -0.45, z: 0.8, tilt: [-0.3, 0, 0.25] },
    { kind: "yellow", x: -0.05, z: 0.72, tilt: [-0.34, 0, 0.04] },
    { kind: "green", x: 0.4, z: 0.82, tilt: [-0.3, 0, -0.22] },
  ],
];

function WhiteBin({ x, y, set }: { x: number; y: number; set?: number }) {
  const markers = set === undefined ? [] : BIN_MARKERS[set];
  return (
    <group position={[x, y - BIN.h / 2, FACE]}>
      <mesh geometry={binGeo()} castShadow receiveShadow>
        <meshStandardMaterial color="#f3f1ec" roughness={0.42} />
      </mesh>
      {markers.map((m, i) => (
        <Marker key={i} p={[m.x, WALL_T, m.z]} r={m.tilt} body={HIGHLIGHTER[m.kind][0]} cap={HIGHLIGHTER[m.kind][1]} />
      ))}
    </group>
  );
}

/* the third bin holds ballpoints and a steel rule instead */
function PenBin({ x, y }: { x: number; y: number }) {
  const pens: [number, number, V3, string][] = [
    [-0.5, 0.8, [-0.3, 0, 0.16], "#1f3f8a"],
    [-0.2, 0.7, [-0.36, 0, 0.05], "#1b1b1b"],
    [0.1, 0.82, [-0.3, 0, -0.1], "#c0392b"],
    [0.35, 0.72, [-0.34, 0, -0.2], "#1f3f8a"],
  ];
  return (
    <group position={[x, y - BIN.h / 2, FACE]}>
      <mesh geometry={binGeo()} castShadow receiveShadow>
        <meshStandardMaterial color="#f3f1ec" roughness={0.42} />
      </mesh>
      {pens.map(([px, pz, tilt, cap], i) => (
        <Marker key={i} p={[px, WALL_T, pz]} r={tilt} body="#f4f4f1" cap={cap} len={1.6} rad={0.045} flat={1} glow={0} />
      ))}
      <mesh position={[0.68, 1.0, 0.55]} rotation={[-0.3, 0.3, -0.12]} castShadow>
        <boxGeometry args={[0.2, 2.0, 0.012]} />
        <meshStandardMaterial color="#d4d6d8" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  );
}

/* ── tray contents ── */

/* binder clip: triangular steel body plus two folded wire handles */
const clipBodyGeo = once(() => new THREE.CylinderGeometry(0.1, 0.1, 0.3, 3).rotateZ(Math.PI / 2));
const clipWireGeo = once(() => {
  const arm = (tilt: number) =>
    new THREE.TorusGeometry(0.12, 0.009, 5, 16, Math.PI).rotateX(Math.PI / 2 + tilt).translate(0, 0, 0.09);
  return merge([arm(0.55), arm(-0.55)]);
});

/* gem paper clip: three nested loops of wire */
const paperclipGeo = once(() => {
  const pts: THREE.Vector3[] = [];
  const line = (x: number, y0: number, y1: number) => {
    pts.push(new THREE.Vector3(x, y0, 0), new THREE.Vector3(x, y1, 0));
  };
  const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
    for (let i = 1; i <= 10; i++) {
      const a = a0 + ((a1 - a0) * i) / 10;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0));
    }
  };
  line(-0.02, 0.05, -0.1);
  arc(0, -0.1, 0.02, Math.PI, Math.PI * 2);
  line(0.02, -0.1, 0.12);
  arc(-0.015, 0.12, 0.035, 0, Math.PI);
  line(-0.05, 0.12, -0.14);
  arc(0, -0.14, 0.05, Math.PI, Math.PI * 2);
  line(0.05, -0.14, 0.09);
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i].distanceTo(pts[i + 1]) > 1e-5) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  }
  return new THREE.TubeGeometry(path, 120, 0.007, 5, false);
});

/* push pin: lathed plastic head over a steel needle, origin at the head's base */
const pinHeadGeo = once(() =>
  new THREE.LatheGeometry(
    [
      [0, 0],
      [0.065, 0],
      [0.068, 0.015],
      [0.04, 0.03],
      [0.03, 0.07],
      [0.045, 0.085],
      [0.048, 0.1],
      [0, 0.11],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    16,
  ),
);
const pinNeedleGeo = once(() => new THREE.CylinderGeometry(0.006, 0.002, 0.12, 6).translate(0, -0.06, 0));

const PIN_COLORS = ["#e85d2c", "#f2c94c", "#5aa9e6", "#7bc47f", "#ef8fb1", "#ffffff", "#c0392b"];
const PAPERCLIP_COLORS = ["#c9cacc", "#c9cacc", "#c9cacc", "#e85d2c", "#5aa9e6", "#f2c94c", "#7bc47f"];
const CLIP_COLORS = ["#1b1b1c", "#1b1b1c", "#1b1b1c", "#d64a3b", "#3d7cc9"];

type Fill = "binder" | "pins" | "paperclips";

function pile(seed: number, n: number, colors: readonly string[], scale: number): Inst[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const depth = r() * r();
    return {
      p: [(r() - 0.5) * (TRAY.w - 0.4), WALL_T + 0.05 + depth * 0.45, 0.25 + r() * (TRAY.d - 0.5)],
      r: [r() * Math.PI, r() * Math.PI * 2, r() * Math.PI],
      s: scale,
      c: colors[Math.floor(r() * colors.length)],
    };
  });
}

function ClearTray({ x, y, fill, seed }: { x: number; y: number; fill: Fill; seed: number }) {
  const items = useMemo(() => {
    if (fill === "binder") return pile(seed, 26, CLIP_COLORS, 1);
    if (fill === "pins") return pile(seed, 60, PIN_COLORS, 1);
    return pile(seed, 70, PAPERCLIP_COLORS, 1.3);
  }, [fill, seed]);
  const steel = useMemo(() => items.map((it) => ({ ...it, c: undefined })), [items]);
  return (
    <group position={[x, y - TRAY.h / 2, FACE]}>
      {fill === "binder" && (
        <>
          <Instances items={items} geometry={clipBodyGeo()} shadow={false}>
            <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.5} />
          </Instances>
          <Instances items={steel} geometry={clipWireGeo()} shadow={false}>
            <meshStandardMaterial color="#cfd1d3" roughness={0.25} metalness={1} />
          </Instances>
        </>
      )}
      {fill === "pins" && (
        <>
          <Instances items={items} geometry={pinHeadGeo()} shadow={false}>
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </Instances>
          <Instances items={steel} geometry={pinNeedleGeo()} shadow={false}>
            <meshStandardMaterial color="#d8d9db" roughness={0.2} metalness={1} />
          </Instances>
        </>
      )}
      {fill === "paperclips" && (
        <Instances items={items} geometry={paperclipGeo()} shadow={false}>
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.6} />
        </Instances>
      )}
      <mesh geometry={trayGeo()} renderOrder={1}>
        <meshPhysicalMaterial
          color="#f2f8f9"
          transparent
          opacity={0.32}
          roughness={0.04}
          clearcoat={1}
          clearcoatRoughness={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ── controller, headphones, keyboard ── */

const PAD = { x: 6.6, peg: 10.2, w: 1.9 };

/* the pad hangs from its own cord, looped a few times over the hook */
function padCord() {
  const { x, peg } = PAD;
  const ring = 0.42;
  const cy = peg - ring + 0.05;
  const pts: THREE.Vector3[] = [
    new THREE.Vector3(x, peg - 1.25, FACE + 0.12),
    new THREE.Vector3(x + 0.02, peg - 1.1, FACE + 0.13),
    new THREE.Vector3(x + 0.08, cy - ring - 0.06, FACE + 0.15),
  ];
  const turns = 2.6;
  const n = 44;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = -Math.PI / 2 + t * turns * Math.PI * 2;
    const r = ring + Math.sin(t * 9) * 0.03;
    pts.push(new THREE.Vector3(x + Math.cos(a) * r * 0.9 + (t - 0.5) * 0.08, cy + Math.sin(a) * r, FACE + 0.16 + t * 0.2));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.022, 6);
}

function Gamepad() {
  const cord = useDisposable(useMemo(() => padCord(), []));
  return (
    <group>
      <Peg x={PAD.x} y={PAD.peg} out={0.55} />
      <mesh geometry={cord} castShadow>
        <meshStandardMaterial color="#5d5d60" roughness={0.6} />
      </mesh>
      <group position={[PAD.x, PAD.peg - 1.6, FACE + 0.03]} rotation={[Math.PI / 2 - 0.06, 0, 0]}>
        <Suspense fallback={null}>
          <FitModel url={MODEL_URLS.gamepad} size={PAD.w} crop={GAMEPAD_CROP} />
        </Suspense>
      </group>
    </group>
  );
}

/* over-ear headband, top of the arc at the origin, spanning ±0.8 in x */
function bandCurve(rx: number, ry: number) {
  const pts = Array.from({ length: 25 }, (_, i) => {
    const a = (i / 24 - 0.5) * Math.PI * 0.92;
    return new THREE.Vector3(Math.sin(a) * rx, Math.cos(a) * ry - ry, 0);
  });
  return new THREE.CatmullRomCurve3(pts);
}
const bandGeo = once(() => new THREE.TubeGeometry(bandCurve(0.8, 0.95), 60, 0.055, 12));
const padGeo = once(() => new THREE.TubeGeometry(bandCurve(0.62, 0.82), 50, 0.06, 10).translate(0, -0.1, 0));
const cupGeo = once(() =>
  new THREE.LatheGeometry(
    [
      [0, 0],
      [0.4, 0],
      [0.46, 0.03],
      [0.49, 0.1],
      [0.49, 0.22],
      [0.45, 0.3],
      [0.32, 0.35],
      [0, 0.36],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    40,
  ).rotateZ(-Math.PI / 2),
);
const cushionGeo = once(() => new THREE.TorusGeometry(0.33, 0.12, 14, 40).rotateY(Math.PI / 2).scale(0.75, 1, 1));
const yokeGeo = once(() => new THREE.TorusGeometry(0.53, 0.025, 8, 32, Math.PI).rotateY(Math.PI / 2));

function Headphones() {
  const shell = <meshStandardMaterial color="#e6e3dc" roughness={0.45} />;
  const leather = <meshStandardMaterial color="#cfcac0" roughness={0.75} />;
  const metal = <meshStandardMaterial color="#c4c6c8" roughness={0.25} metalness={1} />;
  const ends = Math.sin(Math.PI * 0.46) * 0.8;
  const endY = Math.cos(Math.PI * 0.46) * 0.95 - 0.95;
  const cupY = endY - 0.82;
  return (
    <group>
      <mesh geometry={bandGeo()} scale={[1, 1, 2.6]} castShadow>
        {shell}
      </mesh>
      <mesh geometry={padGeo()} scale={[1, 1, 2.0]}>
        {leather}
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rod a={[s * ends, endY + 0.05, 0]} b={[s * (ends + 0.24), cupY + 0.53, 0]} r={0.022} color="#c4c6c8" metal />
          <group position={[s * (ends + 0.06), cupY, 0]} scale={[s, 1, 1]}>
            <mesh geometry={yokeGeo()} position={[0.18, 0, 0]}>
              {metal}
            </mesh>
            <mesh geometry={cupGeo()} castShadow>
              {shell}
            </mesh>
            <mesh geometry={cushionGeo()} position={[-0.04, 0, 0]} castShadow>
              {leather}
            </mesh>
            <mesh position={[0.365, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.18, 32]} />
              <meshStandardMaterial color="#d6d3cc" roughness={0.3} metalness={0.4} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

/* 60% layout, in key units */
const KEY_ROWS = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];
const KEY_U = 0.24;
const KEY_H = 0.17;

/* sculpted keycap: a square frustum, top face toward +z, unit footprint */
const keycapGeo = once(() => {
  const g = new THREE.CylinderGeometry(0.5 * Math.SQRT2 * 0.76, 0.5 * Math.SQRT2, 1, 4, 1).rotateY(Math.PI / 4).rotateX(Math.PI / 2);
  const flat = g.toNonIndexed();
  g.dispose();
  flat.computeVertexNormals();
  return flat;
});

function Keyboard() {
  const keys = useMemo<Inst[]>(() => {
    const out: Inst[] = [];
    KEY_ROWS.forEach((row, r) => {
      let x = -7.5 * KEY_U;
      row.forEach((w, i) => {
        const mod = w !== 1 && w < 6;
        const accent = (r === 0 && i === 0) || (r === 2 && i === row.length - 1);
        out.push({
          p: [x + (w * KEY_U) / 2, 2 * KEY_U - r * KEY_U, 0.13 + KEY_H / 2],
          s: [w * KEY_U - 0.03, KEY_U - 0.03, KEY_H],
          c: accent ? "#e8792c" : mod ? "#4f6a3b" : "#86a36a",
        });
        x += w * KEY_U;
      });
    });
    return out;
  }, []);
  return (
    <group>
      <Peg x={6.8} y={5.22} out={0.55} />
      <Peg x={9.2} y={5.22} out={0.55} />
      <group position={[8.0, 6.0, FACE + 0.22]} rotation={[-0.08, 0, 0]}>
        <RoundedBox args={[15 * KEY_U + 0.22, 5 * KEY_U + 0.22, 0.3]} radius={0.07} smoothness={4} castShadow>
          <meshStandardMaterial color="#46583a" roughness={0.38} metalness={0.55} />
        </RoundedBox>
        <mesh position={[0, 0, 0.131]}>
          <planeGeometry args={[15 * KEY_U + 0.02, 5 * KEY_U + 0.02]} />
          <meshStandardMaterial color="#1f2419" roughness={0.8} />
        </mesh>
        <Instances items={keys} geometry={keycapGeo()}>
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </Instances>
      </group>
    </group>
  );
}

/* ── figurine shelf ── */

function Book({ p, r, size, cover }: { p: V3; r?: V3; size: V3; cover: string }) {
  const [w, h, d] = size;
  return (
    <group position={p} rotation={r}>
      <RoundedBox args={size} radius={0.02} smoothness={2} castShadow>
        <meshStandardMaterial color={cover} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0.025, 0, 0.01]}>
        <boxGeometry args={[w - 0.03, h * 0.82, d - 0.04]} />
        <meshStandardMaterial color="#efe8d8" roughness={0.95} />
      </mesh>
    </group>
  );
}

function FigureShelf() {
  const tex = useMemo(() => photoTexture("#f4d68a", "#6d4a3a"), []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group position={[-1.6, 8.4, FACE]}>
      <RoundedBox args={[5.6, 0.16, 1.15]} radius={0.04} smoothness={3} position={[0, 0, 0.58]} castShadow receiveShadow>
        <meshStandardMaterial color="#a8744a" roughness={0.55} />
      </RoundedBox>
      {[-2.3, 2.3].map((x) => (
        <group key={x} position={[x, -0.08, 0]}>
          <mesh position={[0, -0.32, 0.03]}>
            <boxGeometry args={[0.12, 0.7, 0.05]} />
            <meshStandardMaterial color="#2b2b2b" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.02, 0.45]}>
            <boxGeometry args={[0.12, 0.04, 0.85]} />
            <meshStandardMaterial color="#2b2b2b" metalness={0.7} roughness={0.4} />
          </mesh>
          <Rod a={[0, -0.6, 0.05]} b={[0, -0.04, 0.75]} r={0.025} color="#2b2b2b" metal />
        </group>
      ))}
      <group position={[0, 0.08, 0.58]}>
        <Suspense fallback={null}>
          <group position={[-2.05, 0, 0.05]} rotation={[0, 0.5, 0]}>
            <FitModel url={MODEL_URLS.duck} height={0.85} />
          </group>
          <group position={[-0.9, 0, 0.05]} rotation={[0, -0.35, 0]}>
            <FitModel url={MODEL_URLS.elephant} height={0.8} />
          </group>
          <group position={[1.05, 0, 0.05]}>
            <FitModel url={MODEL_URLS.succulent} height={1.15} />
          </group>
        </Suspense>
        {/* a small framed print leaning on the board */}
        <group position={[0.05, 0, -0.32]} rotation={[-0.16, 0.08, 0]}>
          <mesh position={[0, 0.42, 0]} castShadow>
            <boxGeometry args={[0.7, 0.86, 0.05]} />
            <meshStandardMaterial color="#2a1f17" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.42, 0.027]}>
            <planeGeometry args={[0.58, 0.74]} />
            <meshStandardMaterial color="#f6f2ea" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.44, 0.029]}>
            <planeGeometry args={[0.46, 0.56]} />
            <meshStandardMaterial map={tex} roughness={0.5} />
          </mesh>
        </group>
        <Book p={[2.1, 0.08, 0]} r={[0, 0.12, 0]} size={[0.95, 0.16, 0.68]} cover="#2f4a6b" />
        <Book p={[2.08, 0.22, 0.02]} r={[0, -0.1, 0]} size={[0.85, 0.12, 0.6]} cover="#c9692c" />
        <Book p={[2.12, 0.35, 0]} r={[0, 0.25, 0]} size={[0.78, 0.14, 0.55]} cover="#e9e1d0" />
      </group>
    </group>
  );
}

/* ── hanging pothos ── */

const LEAF_GREENS = ["#3f6a30", "#4f7a3a", "#5f8f45", "#6fa04f", "#7bab5a", "#9cbf63"];

/* heart-shaped leaf, base at the origin, tip toward +y, cupped along the midrib */
const leafGeo = once(() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.1);
  s.bezierCurveTo(-0.3, -0.12, -0.62, 0.35, 0, 1);
  s.bezierCurveTo(0.62, 0.35, 0.3, -0.12, 0, 0.1);
  const g = new THREE.ShapeGeometry(s, 12);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, -0.35 * x * x + 0.12 * y * y);
  }
  g.computeVertexNormals();
  return g.scale(0.26, 0.26, 0.26);
});

const potGeo = once(() =>
  new THREE.LatheGeometry(
    [
      [0, 0],
      [0.32, 0],
      [0.36, 0.03],
      [0.44, 0.3],
      [0.49, 0.56],
      [0.53, 0.6],
      [0.52, 0.64],
      [0.47, 0.63],
      [0.44, 0.5],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    36,
  ),
);

const tmpM = new THREE.Matrix4();

function leaf(p: THREE.Vector3, tip: THREE.Vector3, face: THREE.Vector3, s: number, c: string): Inst {
  const y = tip.normalize();
  const z = face.addScaledVector(y, -face.dot(y)).normalize();
  const x = new THREE.Vector3().crossVectors(y, z);
  return { p: p.toArray() as V3, q: new THREE.Quaternion().setFromRotationMatrix(tmpM.makeBasis(x, y, z)), s, c };
}

const RIM_Y = 0.6;

function pothos(seed: number, vines: number, drop: number) {
  const r = rng(seed);
  const green = () => LEAF_GREENS[Math.floor(r() * LEAF_GREENS.length)];
  const up = new THREE.Vector3(0, 1, 0);
  const leaves: Inst[] = [];
  const stems: THREE.BufferGeometry[] = [];

  /* crown over the rim, leaning out and toward the room */
  for (let i = 0; i < 34; i++) {
    const a = r() * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const d = 0.12 + r() * 0.36;
    const p = dir.clone().multiplyScalar(d).setY(RIM_Y - 0.02 + r() * 0.12);
    const tip = dir.clone().multiplyScalar(0.8).addScaledVector(up, 0.25 + r() * 0.6);
    const face = up.clone().multiplyScalar(0.6).add(dir.clone().multiplyScalar(0.4)).add(new THREE.Vector3(0, 0, 0.4));
    leaves.push(leaf(p, tip, face, 0.9 + r() * 0.5, green()));
  }

  /* vines spill over the front half of the rim and trail down */
  for (let v = 0; v < vines; v++) {
    const a = Math.PI * (0.02 + (0.96 * v) / Math.max(1, vines - 1)) + (r() - 0.5) * 0.3;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const len = drop * (0.45 + r() * 0.6);
    const sway = (r() - 0.5) * 0.5;
    const pts: THREE.Vector3[] = [dir.clone().multiplyScalar(0.42).setY(RIM_Y + 0.05), dir.clone().multiplyScalar(0.6).setY(RIM_Y - 0.08)];
    const steps = 6;
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      const rad = 0.62 + t * 0.2 + Math.sin(t * 4 + v) * 0.06;
      const p = dir.clone().multiplyScalar(rad).setY(RIM_Y - 0.1 - t * len);
      p.x += Math.sin(t * Math.PI) * sway;
      pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    stems.push(new THREE.TubeGeometry(curve, 40, 0.012, 4));
    const total = curve.getLength();
    const count = Math.floor(total / 0.16);
    for (let k = 1; k <= count; k++) {
      const t = k / (count + 0.5);
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const side = new THREE.Vector3().crossVectors(tan, dir).normalize().multiplyScalar(k % 2 ? 1 : -1);
      const tip = side.clone().multiplyScalar(0.75).addScaledVector(dir, 0.35).add(new THREE.Vector3(0, -0.35 + r() * 0.5, 0));
      const face = dir.clone().multiplyScalar(0.6).add(new THREE.Vector3(0, 0.2, 0.8));
      leaves.push(leaf(p, tip, face, 1.0 - t * 0.45 + r() * 0.15, green()));
    }
  }
  return { leaves, stems: merge(stems) };
}

const CORD = "#e6d9bf";

function HangingPlant({
  x,
  y,
  seed,
  drop = 2.6,
  pot = "#b8643f",
}: {
  x: number;
  y: number;
  seed: number;
  drop?: number;
  pot?: string;
}) {
  const { leaves, stems } = useMemo(() => pothos(seed, 7, drop), [seed, drop]);
  useDisposable(stems);
  const hang = 2.2;
  const out = 0.85;
  const gather: V3 = [0, hang - 0.32, 0];
  const corners = [0, 1, 2, 3].map((i) => {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    return {
      rim: [Math.cos(a) * 0.56, RIM_Y - 0.1, Math.sin(a) * 0.56] as V3,
      low: [Math.cos(a) * 0.39, 0.05, Math.sin(a) * 0.39] as V3,
    };
  });
  return (
    <group>
      <Peg x={x} y={y} out={out} />
      <group position={[x, y - hang + 0.02, FACE + out]}>
        <mesh position={[0, hang, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.07, 0.016, 8, 20]} />
          <meshStandardMaterial color="#b89a5e" metalness={0.8} roughness={0.35} />
        </mesh>
        <Rod a={[0, hang - 0.06, 0]} b={gather} r={0.02} color={CORD} />
        <mesh position={gather}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshStandardMaterial color={CORD} roughness={1} />
        </mesh>
        {corners.map(({ rim, low }, i) => (
          <group key={i}>
            <Rod a={gather} b={rim} r={0.012} color={CORD} />
            <Rod a={rim} b={low} r={0.012} color={CORD} />
            <Rod a={low} b={[0, -0.12, 0]} r={0.012} color={CORD} />
            <mesh position={rim}>
              <sphereGeometry args={[0.03, 8, 6]} />
              <meshStandardMaterial color={CORD} roughness={1} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.12, 0]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color={CORD} roughness={1} />
        </mesh>
        <mesh position={[0, -0.38, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.07, 0.48, 12, 1, true]} />
          <meshStandardMaterial color={CORD} roughness={1} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={potGeo()} castShadow receiveShadow>
          <meshStandardMaterial color={pot} roughness={0.8} />
        </mesh>
        <mesh position={[0, RIM_Y - 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.45, 28]} />
          <meshStandardMaterial color="#3a2a1e" roughness={1} />
        </mesh>
        <mesh geometry={stems}>
          <meshStandardMaterial color="#6b7d3a" roughness={0.8} />
        </mesh>
        <Instances items={leaves} geometry={leafGeo()}>
          <meshStandardMaterial color="#ffffff" roughness={0.45} side={THREE.DoubleSide} />
        </Instances>
      </group>
    </group>
  );
}

/* ── polaroids on a string ── */

const PRINT_TONES: [string, string][] = [
  ["#f3b27a", "#c0594a"],
  ["#9cc7e4", "#3e6d8f"],
  ["#f4d68a", "#a5793a"],
  ["#b9dcc1", "#4f7d5f"],
  ["#e6b3cc", "#8a4f72"],
  ["#f0c9a0", "#6d4a3a"],
];

function PhotoString({ x0, x1, y, sag = 0.5 }: { x0: number; x1: number; y: number; sag?: number }) {
  const textures = useMemo(() => PRINT_TONES.map(([a, b]) => photoTexture(a, b)), []);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  const z = FACE + 0.12;
  const at = (t: number): V3 => [x0 + (x1 - x0) * t, y - sag * 4 * t * (1 - t), z];
  const SEG = 14;
  return (
    <group>
      {Array.from({ length: SEG }, (_, i) => (
        <Rod key={i} a={at(i / SEG)} b={at((i + 1) / SEG)} r={0.012} color="#c8b48e" />
      ))}
      {[0, 1].map((t) => (
        <mesh key={t} position={at(t)}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color="#e85d2c" roughness={0.4} />
        </mesh>
      ))}
      {textures.map((tex, i) => {
        const t = (i + 0.7) / (textures.length + 0.4);
        const [px, py, pz] = at(t);
        return (
          <group key={i} position={[px, py, pz + 0.02]} rotation={[0, 0, (i % 2 ? 1 : -1) * (0.05 + (i % 3) * 0.03)]}>
            <mesh position={[0, 0, 0.04]}>
              <boxGeometry args={[0.08, 0.26, 0.06]} />
              <meshStandardMaterial color="#c9a273" roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.48, 0]} castShadow>
              <boxGeometry args={[0.66, 0.8, 0.015]} />
              <meshStandardMaterial color="#f6f2ea" roughness={0.75} />
            </mesh>
            <mesh position={[0, -0.42, 0.009]}>
              <planeGeometry args={[0.56, 0.56]} />
              <meshStandardMaterial map={tex} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ── monitor ── */

export const MONITOR = { x: -1.6, z: -3.75 };

function Monitor({ night }: { night: boolean }) {
  const tex = useMemo(() => monitorTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  const alu = <meshStandardMaterial color="#c8c9cc" metalness={0.85} roughness={0.3} />;
  return (
    <group position={[MONITOR.x, 0, MONITOR.z]} rotation={[0, 0.06, 0]}>
      <RoundedBox args={[2.3, 0.08, 1.4]} radius={0.04} smoothness={3} position={[0, 0.04, -0.2]} castShadow receiveShadow>
        {alu}
      </RoundedBox>
      <mesh position={[0, 1.25, -0.5]} rotation={[-0.06, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 2.4, 0.12]} />
        {alu}
      </mesh>
      <group position={[0, 4.1, 0]}>
        <RoundedBox args={[6.4, 3.75, 0.16]} radius={0.06} smoothness={3} castShadow>
          <meshStandardMaterial color="#1b1c1e" roughness={0.4} metalness={0.3} />
        </RoundedBox>
        <RoundedBox args={[3, 2, 0.3]} radius={0.1} smoothness={3} position={[0, 0, -0.2]}>
          {alu}
        </RoundedBox>
        <mesh position={[0, 0.02, 0.081]}>
          <planeGeometry args={[6.24, 3.51]} />
          <meshBasicMaterial map={tex} toneMapped={false} color={night ? "#ffffff" : "#cfcfcf"} />
        </mesh>
      </group>
      {/* screen spill onto the desk after dark; intensity only, so lit materials never recompile */}
      <pointLight position={[0, 4, 1.4]} color="#a9c4ff" intensity={night ? 5 : 0} distance={9} decay={2} />
    </group>
  );
}

export function Wall({ night }: { night: boolean }) {
  return (
    <group>
      <Pegboard />

      {/* upper left: white bins over clear trays */}
      <WhiteBin x={-12.6} y={9.2} set={0} />
      <WhiteBin x={-10.3} y={9.2} set={1} />
      <PenBin x={-8.0} y={9.2} />
      <ClearTray x={-12.6} y={6.3} fill="binder" seed={3} />
      <ClearTray x={-10.3} y={6.3} fill="pins" seed={7} />
      <ClearTray x={-8.0} y={6.3} fill="paperclips" seed={11} />

      <PhotoString x0={-6.4} x1={2.4} y={11} />
      <FigureShelf />
      <HangingPlant x={3.7} y={11.6} seed={21} />
      <HangingPlant x={13.6} y={12.2} seed={42} drop={3.2} pot="#ece8df" />

      {/* upper right: gear hung like the reference board */}
      <Gamepad />
      <Peg x={10.0} y={10.4} out={1.0} />
      <group position={[10.0, 10.4 + 0.1, FACE + 0.75]}>
        <Headphones />
      </group>
      <Keyboard />

      <Monitor night={night} />
    </group>
  );
}
