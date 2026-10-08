"use client";

import { Html, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { DESK } from "./constants";
import { FitModel, MODEL_URLS } from "./FitModel";
import { LAMP } from "./lighting";
import type { SceneLink } from "./flashlight";
import { buildBookTextures, type BookProject, type BookTextures } from "./textures";

function useOak() {
  const maps = useTexture({
    map: "/textures/oak_veneer_01/diffuse.jpg",
    roughnessMap: "/textures/oak_veneer_01/rough.jpg",
    normalMap: "/textures/oak_veneer_01/nor_gl.jpg",
  });
  return useMemo(() => {
    const make = (repeatX: number, repeatY: number, rotate = false) => {
      const out: Record<string, THREE.Texture> = {};
      for (const [k, t] of Object.entries(maps)) {
        const c = t.clone();
        c.wrapS = c.wrapT = THREE.RepeatWrapping;
        c.repeat.set(repeatX, repeatY);
        if (rotate) c.rotation = Math.PI / 2;
        if (k === "map") c.colorSpace = THREE.SRGBColorSpace;
        c.anisotropy = 8;
        c.needsUpdate = true;
        out[k] = c;
      }
      return out as typeof maps;
    };
    return { top: make(2.4, 0.8), front: make(2.4, 0.4) };
  }, [maps]);
}

function DeskBody() {
  const oak = useOak();
  const depth = DESK.front - DESK.back;
  const drawers: [number, number, number][] = [
    /* x, y-center, height */
    [-7.45, -2.1, 2.9],
    [7.45, -2.1, 2.9],
    [-7.45, -6.0, 4.6],
    [7.45, -6.0, 4.6],
  ];
  return (
    <group>
      {/* top slab */}
      <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[DESK.halfW * 2, 0.5, depth]} />
        <meshStandardMaterial {...oak.top} color="#d39a63" roughness={0.75} normalScale={new THREE.Vector2(0.4, 0.4)} />
      </mesh>
      {/* carcass */}
      <mesh position={[0, -5.25, -0.1]} receiveShadow>
        <boxGeometry args={[DESK.halfW * 2 - 0.2, 9.5, depth - 0.4]} />
        <meshStandardMaterial {...oak.front} color="#5a3820" roughness={0.8} />
      </mesh>
      {/* push-to-open drawer fronts */}
      {drawers.map(([x, y, h], i) => (
        <mesh key={i} position={[x, y, DESK.front - 0.15]} castShadow receiveShadow>
          <boxGeometry args={[14.8, h, 0.3]} />
          <meshStandardMaterial {...oak.front} color="#8a5a34" roughness={0.7} />
        </mesh>
      ))}
      {/* floor, far below */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 8]} receiveShadow>
        <planeGeometry args={[120, 60]} />
        <meshStandardMaterial color="#3a2a1e" roughness={0.9} />
      </mesh>
    </group>
  );
}

type LampProps = { onLamp: () => void; onLampHover: (on: boolean) => void };

function Decor({ onLamp, onLampHover }: LampProps) {
  return (
    <Suspense fallback={null}>
      {/* the lamp is a light switch: click it to toggle night */}
      <group
        name="desk-lamp"
        position={LAMP.pos.toArray()}
        rotation={[0, LAMP.yaw, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onLamp();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerOver={(e) => {
          e.stopPropagation();
          onLampHover(true);
        }}
        onPointerOut={() => onLampHover(false)}
      >
        <FitModel url={MODEL_URLS.lamp} height={7.5} />
      </group>
      <group position={[11.8, 0, -2.8]}>
        <FitModel url={MODEL_URLS.plant} height={6.5} />
      </group>
    </Suspense>
  );
}

export function Room(props: LampProps) {
  return (
    <>
      <Suspense fallback={null}>
        <DeskBody />
      </Suspense>
      <Decor {...props} />
    </>
  );
}

/* ── Project bookshelf ── */

export const SHELF = { x: 4.3, z: -3.0 };
const BOOK_W = 2.0;
const COVER = 0.05;
const THICK = [0.56, 0.48, 0.62, 0.5, 0.58];
const HEIGHT = [3.1, 2.9, 3.3, 3.0, 3.2];
const OPEN_SECONDS = 1.7;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const phase = (p: number, a: number, b: number) => ease(THREE.MathUtils.clamp((p - a) / (b - a), 0, 1));

type ShelfProps = {
  projects: readonly BookProject[];
  open: number | null;
  reduced: boolean;
  onOpen: (index: number | null) => void;
  onHover: (index: number | null) => void;
  /* at night a flashlight clicks on over the open book */
  night: boolean;
  link: SceneLink;
};

/* click-on stutter for the flashlight, sampled every 60ms */
const TORCH_FLICKER = [0, 1, 0.1, 0.8, 0.25, 1];

function Book({ tex, edge, index, h, t }: { tex: BookTextures["books"][number]; edge: THREE.Texture; index: number; h: number; t: number }) {
  const cloth = <meshStandardMaterial color={tex.color} roughness={0.85} />;
  return (
    <>
      {/* back cover */}
      <mesh position={[BOOK_W / 2, 0, -t / 2 + COVER / 2]} castShadow receiveShadow>
        <boxGeometry args={[BOOK_W, h, COVER]} />
        {cloth}
      </mesh>
      {/* text block; +z face is the right-hand page */}
      <mesh position={[(BOOK_W - 0.1) / 2 + 0.04, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[BOOK_W - 0.1, h - 0.14, t - COVER * 2]} />
        <meshStandardMaterial attach="material-0" map={edge} roughness={0.95} />
        <meshStandardMaterial attach="material-1" map={edge} roughness={0.95} />
        <meshStandardMaterial attach="material-2" map={edge} roughness={0.95} />
        <meshStandardMaterial attach="material-3" map={edge} roughness={0.95} />
        <meshStandardMaterial attach="material-4" map={tex.right} roughness={0.9} />
        <meshStandardMaterial attach="material-5" map={edge} roughness={0.95} />
      </mesh>
      {/* spine */}
      <mesh position={[-0.03, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.06, h, t]} />
        <meshStandardMaterial attach="material-0" color={tex.color} roughness={0.85} />
        <meshStandardMaterial attach="material-1" map={tex.spine} roughness={0.8} />
        <meshStandardMaterial attach="material-2" color={tex.color} roughness={0.85} />
        <meshStandardMaterial attach="material-3" color={tex.color} roughness={0.85} />
        <meshStandardMaterial attach="material-4" color={tex.color} roughness={0.85} />
        <meshStandardMaterial attach="material-5" color={tex.color} roughness={0.85} />
      </mesh>
      {/* front cover, hinged on the spine */}
      <group name={`cover-${index}`} position={[0, 0, t / 2]}>
        <mesh position={[BOOK_W / 2, 0, -COVER / 2]} castShadow receiveShadow>
          <boxGeometry args={[BOOK_W, h, COVER]} />
          <meshStandardMaterial attach="material-0" color={tex.color} roughness={0.85} />
          <meshStandardMaterial attach="material-1" color={tex.color} roughness={0.85} />
          <meshStandardMaterial attach="material-2" color={tex.color} roughness={0.85} />
          <meshStandardMaterial attach="material-3" color={tex.color} roughness={0.85} />
          <meshStandardMaterial attach="material-4" map={tex.cover} roughness={0.85} />
          <meshStandardMaterial attach="material-5" map={tex.left} roughness={0.9} />
        </mesh>
      </group>
    </>
  );
}

/* Mutable animation state for the books, kept out of React. */
class ShelfAnim {
  private p: number[];
  private hover: number[];
  private groups: (THREE.Group | null)[] = [];
  private dim: THREE.Mesh | null = null;
  private tmp = {
    pos: new THREE.Vector3(),
    pulled: new THREE.Vector3(),
    present: new THREE.Vector3(),
    fwd: new THREE.Vector3(),
    right: new THREE.Vector3(),
    q: new THREE.Quaternion(),
  };
  private torch: THREE.SpotLight | null = null;
  private torchLevel = 0;
  private torchOnAt = -1;
  private clock = 0;
  private aim = new THREE.Vector3();
  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane();
  hovered = -1;
  active: number | null = null;
  readonly shelfQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  readonly slots: THREE.Vector3[];

  constructor(count: number) {
    this.p = Array.from({ length: count }, () => 0);
    this.hover = Array.from({ length: count }, () => 0);
    let x = -2.25;
    this.slots = THICK.slice(0, count).map((t, i) => {
      const cx = x + t / 2;
      x += t + 0.04;
      return new THREE.Vector3(SHELF.x + cx, 0.2 + HEIGHT[i] / 2, SHELF.z + 1.0);
    });
  }

  attach(i: number, g: THREE.Group | null) {
    this.groups[i] = g;
  }

  /*
   * Flashlight held just off the camera's shoulder. It clicks on with a short
   * stutter once the book is open, then tracks the cursor across the pages.
   */
  private stepTorch(camera: THREE.PerspectiveCamera, fwd: THREE.Vector3, dist: number, dt: number, reduced: boolean, on: boolean, pointer: THREE.Vector2) {
    const torch = this.torch;
    if (!torch) return;

    if (on && this.torchOnAt < 0) this.torchOnAt = this.clock;
    if (!on) this.torchOnAt = -1;
    let goal = 0;
    if (on) {
      const step = Math.floor((this.clock - this.torchOnAt) / 0.06);
      goal = reduced ? 1 : (TORCH_FLICKER[step] ?? 1);
    }
    this.torchLevel = reduced || goal > this.torchLevel ? goal : THREE.MathUtils.damp(this.torchLevel, goal, 8, dt);
    /* intensity only; toggling visibility would recompile every lit material */
    torch.intensity = 1.7 * dist * this.torchLevel;

    /* hand position: a little right of and below the eye */
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    torch.position.copy(camera.position).addScaledVector(right, 1.6).addScaledVector(up, -1.1);

    /* aim where the cursor meets the page plane */
    const center = camera.position.clone().addScaledVector(fwd, dist);
    this.plane.setFromNormalAndCoplanarPoint(fwd.clone().negate(), center);
    this.ray.setFromCamera(pointer, camera);
    const hit = this.ray.ray.intersectPlane(this.plane, new THREE.Vector3()) ?? center;
    /* while off, park on the middle of the spread so the beam sweeps out to the cursor */
    if (this.torchLevel === 0) this.aim.copy(center);
    if (reduced) this.aim.copy(hit);
    this.aim.x = THREE.MathUtils.damp(this.aim.x, hit.x, 9, dt);
    this.aim.y = THREE.MathUtils.damp(this.aim.y, hit.y, 9, dt);
    this.aim.z = THREE.MathUtils.damp(this.aim.z, hit.z, 9, dt);
    torch.target.position.copy(this.aim);
    torch.target.updateMatrixWorld();
  }

  attachTorch(l: THREE.SpotLight | null) {
    this.torch = l;
  }

  attachDim(m: THREE.Mesh | null) {
    this.dim = m;
  }

  setHovered(i: number) {
    this.hovered = i;
  }

  setActive(i: number | null) {
    this.active = i;
  }

  step(camera: THREE.PerspectiveCamera, aspect: number, delta: number, reduced: boolean, night: boolean, pointer: THREE.Vector2, link: SceneLink) {
    const { tmp } = this;
    const dt = Math.min(delta, 1 / 30);
    this.clock += dt;
    let openAmount = 0;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const widthFrac = aspect < 1 ? 0.92 : 0.5;
    const openW = BOOK_W * 2.1;
    const dist = Math.max(openW / (widthFrac * 2 * tanHalf * aspect), 3.4 / (0.7 * 2 * tanHalf));
    camera.getWorldDirection(tmp.fwd);
    tmp.right.set(1, 0, 0).applyQuaternion(camera.quaternion);

    let dimAmount = 0;
    for (let i = 0; i < this.p.length; i++) {
      /* only one book out at a time: the old one goes home before the next leaves */
      const othersOut = this.p.some((v, k) => k !== i && v > 0.001);
      const goal = this.active === i && !(othersOut && this.p[i] === 0) ? 1 : 0;
      const step = reduced ? 1 : dt / OPEN_SECONDS;
      this.p[i] = goal > this.p[i] ? Math.min(goal, this.p[i] + step) : Math.max(goal, this.p[i] - step * 1.3);
      this.hover[i] = THREE.MathUtils.damp(this.hover[i], this.hovered === i && this.p[i] === 0 ? 1 : 0, 12, dt);

      const p = this.p[i];
      const s1 = phase(p, 0, 0.22);
      const s2 = phase(p, 0.22, 0.7);
      const s3 = phase(p, 0.7, 1);
      dimAmount = Math.max(dimAmount, s2);
      openAmount = Math.max(openAmount, s3);

      const g = this.groups[i];
      if (!g) continue;
      tmp.pulled.copy(this.slots[i]).add(new THREE.Vector3(0, 0.25, 1.9));
      tmp.pos.copy(this.slots[i]).lerp(tmp.pulled, s1);
      tmp.pos.z += this.hover[i] * 0.35;
      tmp.present
        .copy(camera.position)
        .addScaledVector(tmp.fwd, dist)
        .addScaledVector(tmp.right, -(BOOK_W / 2) * (1 - s3));
      tmp.pos.lerp(tmp.present, s2);
      g.position.copy(tmp.pos);
      tmp.q.copy(this.shelfQ).slerp(camera.quaternion, s2);
      g.quaternion.copy(tmp.q);
      const cover = g.getObjectByName(`cover-${i}`);
      if (cover) cover.rotation.y = -Math.PI * 0.985 * s3;
    }

    link.setBook(camera.position.clone().addScaledVector(tmp.fwd, dist), tmp.fwd.clone().negate(), openAmount);
    /* a hand-held flashlight takes over from the built-in reading torch */
    this.stepTorch(camera, tmp.fwd, dist, dt, reduced, night && !link.flashHeld && openAmount > 0.6 && this.active !== null, pointer);

    if (this.dim) {
      const mat = this.dim.material as THREE.MeshBasicMaterial;
      mat.opacity = dimAmount * 0.55;
      const live = dimAmount > 0.01;
      this.dim.visible = live;
      this.dim.position.copy(camera.position).addScaledVector(tmp.fwd, live ? dist + 1.2 : -50);
      this.dim.quaternion.copy(camera.quaternion);
    }
  }
}

export function ProjectShelf({ projects, open, reduced, night, link, onOpen, onHover }: ShelfProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const [tex, setTex] = useState<BookTextures | null>(null);
  const [anim] = useState(() => new ShelfAnim(projects.length));

  useEffect(() => {
    let alive = true;
    let built: BookTextures | null = null;
    buildBookTextures(projects).then((t) => {
      built = t;
      if (alive) setTex(t);
    });
    return () => {
      alive = false;
      if (built) {
        built.paperEdge.dispose();
        built.books.forEach((b) => [b.spine, b.cover, b.left, b.right].forEach((x) => x.dispose()));
      }
    };
  }, [projects]);

  useEffect(() => {
    anim.setActive(open);
  }, [anim, open]);

  useFrame((state, delta) => anim.step(camera, size.width / size.height, delta, reduced, night, state.pointer, link));

  return (
    <group>
      {/* floating tag so the shelf reads as the way into the work */}
      {tex && open === null && (
        <Html position={[SHELF.x, 0.3, SHELF.z + 1.7]} center zIndexRange={[15, 10]}>
          <button type="button" className="shelf-tag" onClick={() => onOpen(0)}>
            <span className="shelf-tag__dot" aria-hidden />
            Projects <span className="shelf-tag__count">{String(projects.length).padStart(2, "0")}</span>
          </button>
        </Html>
      )}

      {/* the shelf itself */}
      <group position={[SHELF.x, 0, SHELF.z]}>
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.9, 0.2, 2.2]} />
          <meshStandardMaterial color="#6b4428" roughness={0.6} />
        </mesh>
        {[-2.45, 2.45].map((x) => (
          <mesh key={x} position={[x, 1.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.2, 3.8, 2.2]} />
            <meshStandardMaterial color="#6b4428" roughness={0.6} />
          </mesh>
        ))}
      </group>

      {tex &&
        tex.books.map((b, i) => (
          <group
            key={i}
            ref={(g) => anim.attach(i, g)}
            position={anim.slots[i].toArray()}
            quaternion={anim.shelfQ}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerOver={(e) => {
              e.stopPropagation();
              anim.setHovered(i);
              onHover(i);
            }}
            onPointerOut={() => {
              anim.setHovered(-1);
              onHover(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(anim.active === i ? null : i);
            }}
          >
            <Book tex={b} edge={tex.paperEdge} index={i} h={HEIGHT[i]} t={THICK[i]} />
          </group>
        ))}

      <spotLight
        ref={(l) => anim.attachTorch(l)}
        color="#ffe2b0"
        intensity={0}
        angle={0.16}
        penumbra={0.8}
        decay={1}
        distance={80}
      />

      {/* backdrop that dims the desk while a book is open; click it to close */}
      <mesh
        ref={(m) => anim.attachDim(m)}
        visible={false}
        renderOrder={10}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(null);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial color="#120a04" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
