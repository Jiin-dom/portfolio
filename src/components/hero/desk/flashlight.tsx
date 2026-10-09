"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useState } from "react";
import * as THREE from "three";
import { DESK } from "./constants";

/*
 * Shared between the flashlight and the project shelf: the shelf publishes
 * where an open book sits, the flashlight publishes whether it is in hand.
 */
export class SceneLink {
  bookCenter = new THREE.Vector3();
  bookNormal = new THREE.Vector3(0, 0, 1);
  bookOpen = 0;
  flashHeld = false;

  setBook(center: THREE.Vector3, normal: THREE.Vector3, open: number) {
    this.bookCenter.copy(center);
    this.bookNormal.copy(normal);
    this.bookOpen = open;
  }

  setFlashHeld(held: boolean) {
    this.flashHeld = held;
  }
}

/* where the torch rests on the desk */
export const FLASH_HOME = new THREE.Vector3(-2.3, 0, 2.5);
const FLASH_YAW = 2.3;
const R = 0.2;
const PICKUP_SECONDS = 0.9;
const CLICK = [0, 1, 0.15, 1, 0.4, 1];

/* A machined aluminium torch; the head points along local +z. */
function TorchModel({ lensRef }: { lensRef: (m: THREE.MeshStandardMaterial | null) => void }) {
  const knurl = useMemo(() => Array.from({ length: 9 }, (_, i) => -0.55 + i * 0.09), []);
  const body = <meshStandardMaterial color="#4a4e54" metalness={0.35} roughness={0.42} />;
  return (
    <group>
      {/* barrel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
        <cylinderGeometry args={[R * 0.92, R * 0.92, 1.5, 40]} />
        {body}
      </mesh>
      {/* grip rings */}
      {knurl.map((z) => (
        <mesh key={z} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z]}>
          <torusGeometry args={[R * 0.93, 0.012, 8, 40]} />
          <meshStandardMaterial color="#1c1d1f" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}
      {/* tail cap + rubber switch */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.9]}>
        <cylinderGeometry args={[R, R, 0.16, 40]} />
        {body}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.99]}>
        <sphereGeometry args={[R * 0.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#121212" roughness={0.9} />
      </mesh>
      {/* flared head */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.82]}>
        <cylinderGeometry args={[R * 1.45, R * 0.95, 0.38, 40]} />
        {body}
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.03]}>
        <torusGeometry args={[R * 1.4, 0.035, 12, 48]} />
        <meshStandardMaterial color="#b9bbbe" metalness={1} roughness={0.22} />
      </mesh>
      {/* reflector + lens: glows when on */}
      <mesh position={[0, 0, 1.02]}>
        <circleGeometry args={[R * 1.36, 40]} />
        <meshStandardMaterial ref={lensRef} color="#d9dde2" metalness={0.9} roughness={0.08} emissive="#fff1d0" emissiveIntensity={0} />
      </mesh>
      {/* pocket clip */}
      <mesh position={[0, R * 0.98, -0.45]}>
        <boxGeometry args={[0.06, 0.03, 0.62]} />
        <meshStandardMaterial color="#9da0a4" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}

class FlashRig {
  group: THREE.Group | null = null;
  lens: THREE.MeshStandardMaterial | null = null;
  spot: THREE.SpotLight | null = null;
  fill: THREE.PointLight | null = null;
  private pick = 0;
  private light = 0;
  private onAt = -1;
  private clock = 0;
  private aim = new THREE.Vector3();
  private homeQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, FLASH_YAW, 0));
  private ray = new THREE.Raycaster();
  private m = new THREE.Matrix4();
  private tmp = {
    pos: new THREE.Vector3(),
    held: new THREE.Vector3(),
    fwd: new THREE.Vector3(),
    right: new THREE.Vector3(),
    up: new THREE.Vector3(),
    q: new THREE.Quaternion(),
    look: new THREE.Quaternion(),
    hit: new THREE.Vector3(),
    lensPos: new THREE.Vector3(),
  };

  attachGroup(g: THREE.Group | null) {
    this.group = g;
  }

  attachLens(m: THREE.MeshStandardMaterial | null) {
    this.lens = m;
  }

  attachSpot(l: THREE.SpotLight | null) {
    this.spot = l;
  }

  attachFill(l: THREE.PointLight | null) {
    this.fill = l;
  }

  /* nearest of: open book page, desk top, pegboard wall */
  private findAim(camera: THREE.Camera, pointer: THREE.Vector2, link: SceneLink) {
    this.ray.setFromCamera(pointer, camera);
    const r = this.ray.ray;
    let best = Infinity;
    const out = this.tmp.hit;
    const consider = (plane: THREE.Plane, ok: (p: THREE.Vector3) => boolean) => {
      const p = r.intersectPlane(plane, new THREE.Vector3());
      if (!p || !ok(p)) return;
      const d = p.distanceTo(r.origin);
      if (d < best) {
        best = d;
        out.copy(p);
      }
    };
    if (link.bookOpen > 0.5) {
      consider(new THREE.Plane().setFromNormalAndCoplanarPoint(link.bookNormal, link.bookCenter), () => true);
    }
    consider(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), (p) => Math.abs(p.x) < DESK.halfW && p.z > DESK.back && p.z < DESK.front + 0.5);
    consider(new THREE.Plane(new THREE.Vector3(0, 0, 1), 4.85), (p) => p.y > 0);
    if (best === Infinity) out.copy(r.origin).addScaledVector(r.direction, 20);
    return out;
  }

  step(camera: THREE.PerspectiveCamera, pointer: THREE.Vector2, link: SceneLink, held: boolean, reduced: boolean, delta: number) {
    const g = this.group;
    if (!g) return;
    const dt = Math.min(delta, 1 / 30);
    this.clock += dt;
    const { tmp } = this;

    /* pick up, then click on; switch off, then put down */
    const lit = held && this.pick > 0.98;
    if (lit && this.onAt < 0) this.onAt = this.clock;
    if (!lit) this.onAt = -1;
    const lightGoal = lit ? (reduced ? 1 : (CLICK[Math.floor((this.clock - this.onAt) / 0.06)] ?? 1)) : 0;
    this.light = reduced || lightGoal > this.light ? lightGoal : THREE.MathUtils.damp(this.light, lightGoal, 10, dt);
    const canMove = held || this.light < 0.02;
    const pickGoal = held ? 1 : 0;
    if (canMove) {
      const stepAmt = reduced ? 1 : dt / PICKUP_SECONDS;
      if (pickGoal > this.pick) this.pick = Math.min(1, this.pick + stepAmt);
      else if (pickGoal < this.pick) this.pick = Math.max(0, this.pick - stepAmt);
    }
    link.setFlashHeld(this.pick > 0.5);

    const s = this.pick < 0.5 ? 4 * this.pick ** 3 : 1 - (-2 * this.pick + 2) ** 3 / 2;

    camera.getWorldDirection(tmp.fwd);
    tmp.right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    tmp.up.set(0, 1, 0).applyQuaternion(camera.quaternion);

    /* held like a first-person item: low and to the right of the view */
    const narrow = camera.aspect < 1;
    tmp.held
      .copy(camera.position)
      .addScaledVector(tmp.fwd, 6.5)
      .addScaledVector(tmp.right, narrow ? 0.55 : 1.45)
      .addScaledVector(tmp.up, narrow ? -1.7 : -1.05);

    /* aim follows the cursor, with a little lag like a real wrist */
    const target = this.findAim(camera, pointer, link);
    if (this.pick < 0.01) this.aim.copy(target);
    const k = reduced ? 1 : 1 - Math.exp(-10 * dt);
    this.aim.lerp(target, k);

    tmp.pos.copy(FLASH_HOME).setY(R).lerp(tmp.held, s);
    tmp.pos.y += Math.sin(Math.PI * s) * 1.4;
    /* eye = aim, target = hand: the resulting +z axis runs from the hand to the aim */
    this.m.lookAt(this.aim, tmp.held, tmp.up);
    tmp.look.setFromRotationMatrix(this.m);
    tmp.q.copy(this.homeQ).slerp(tmp.look, s);
    g.position.copy(tmp.pos);
    g.quaternion.copy(tmp.q);

    if (this.lens) this.lens.emissiveIntensity = 3 * this.light;
    if (this.spot) {
      tmp.lensPos.set(0, 0, 1.1).applyQuaternion(g.quaternion).add(g.position);
      this.spot.position.copy(tmp.lensPos);
      this.spot.target.position.copy(this.aim);
      this.spot.target.updateMatrixWorld();
      this.spot.intensity = 3.2 * Math.max(4, this.aim.distanceTo(tmp.lensPos)) * this.light;
      /* a dark torch skips its shadow pass once the map exists (lit materials sample it) */
      this.spot.shadow.autoUpdate = this.spot.intensity > 0 || this.spot.shadow.map === null;
    }
    /* short-range fill so the torch in hand reads as metal, not a silhouette */
    if (this.fill) {
      this.fill.position.copy(g.position).addScaledVector(tmp.up, 1.1).addScaledVector(tmp.right, -0.9).addScaledVector(tmp.fwd, -1.2);
      this.fill.intensity = 16 * s;
    }
  }
}

type Props = {
  link: SceneLink;
  held: boolean;
  reduced: boolean;
  onToggle: () => void;
  onHover: (on: boolean) => void;
};

export function Flashlight({ link, held, reduced, onToggle, onHover }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const [rig] = useState(() => new FlashRig());

  useFrame((state, delta) => rig.step(camera, state.pointer, link, held, reduced, delta));

  return (
    <>
      <group
        ref={(g) => rig.attachGroup(g)}
        position={[FLASH_HOME.x, R, FLASH_HOME.z]}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
        }}
        onPointerOut={() => onHover(false)}
      >
        <group
          ref={(g) =>
            g?.traverse((o) => {
              o.castShadow = true;
              o.receiveShadow = true;
            })
          }
        >
          <TorchModel lensRef={(m) => rig.attachLens(m)} />
        </group>
      </group>
      <pointLight ref={(l) => rig.attachFill(l)} color="#ffd9b0" intensity={0} distance={4} decay={2} />
      <spotLight ref={(l) => rig.attachSpot(l)} color="#fff3dc" intensity={0} angle={0.22} penumbra={0.65} decay={1} distance={90} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} />
    </>
  );
}
