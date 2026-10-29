import * as THREE from "three";
import { deskItems, flashlightSlot, type DeskItem } from "./items";
import { DESK, TANK } from "./constants";

/*
 * Plain mutable simulation for the desk. Kept outside React state so the
 * per-frame loop and pointer handlers can write to it freely.
 */

type Body = {
  item: DeskItem;
  pos: THREE.Vector3;
  target: THREE.Vector2;
  rotY: number;
  targetRotY: number;
  order: number;
  dragging: boolean;
  riding: boolean;
  hovered: boolean;
  tiltX: number;
  tiltZ: number;
  spawnAt: number;
  liftUntil: number;
  /* hover push: offset along the pointer's travel, eased back to rest */
  nudge: THREE.Vector2;
  nudgeGoal: THREE.Vector2;
  lastHover: THREE.Vector2 | null;
  group: THREE.Group | null;
};

const NUDGE_MAX = 0.28;

/* "tank" has no button of its own; the Skills chip flies there */
export type ViewName = "top" | "front" | "angle" | "tank";
type View = { pos: THREE.Vector3; target: THREE.Vector3; up: THREE.Vector3 };

const DRAG_LIFT = 0.9;
const { damp, clamp } = THREE.MathUtils;

function extents(b: Body): [number, number] {
  const c = Math.abs(Math.cos(b.rotY));
  const s = Math.abs(Math.sin(b.rotY));
  return [(c * b.item.w + s * b.item.d) / 2, (s * b.item.w + c * b.item.d) / 2];
}

function overlaps(a: Body, b: Body) {
  const [ax, az] = extents(a);
  const [bx, bz] = extents(b);
  return Math.abs(a.pos.x - b.pos.x) < (ax + bx) * 0.8 && Math.abs(a.pos.z - b.pos.z) < (az + bz) * 0.8;
}

export class DeskWorld {
  private bodies: Body[];
  private laidOut = false;
  private views: Record<ViewName, View> | null = null;
  private view: ViewName = "top";
  private zoom = 1;
  private zoomGoal = 1;
  private viewPos = new THREE.Vector3();
  private cam = { pos: new THREE.Vector3(0, 20, 2), target: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) };
  private screenToDesk: (nx: number, ny: number) => [number, number] = () => [0, 0];
  private seq = deskItems.length;
  private clock = 0;
  private portrait = false;
  /* the drop-in waits until the loader lifts, so nobody misses it */
  private live = false;
  grabbing = false;
  readonly flashHome = new THREE.Vector3();

  constructor(private reduced: boolean) {
    this.bodies = deskItems.map((item, i) => ({
      item,
      pos: new THREE.Vector3(0, reduced ? 0 : 4 + i * 0.25, 0),
      target: new THREE.Vector2(),
      rotY: item.rot,
      targetRotY: item.rot,
      order: i,
      dragging: false,
      riding: false,
      hovered: false,
      tiltX: reduced ? 0 : (Math.random() - 0.5) * 0.6,
      tiltZ: reduced ? 0 : (Math.random() - 0.5) * 0.6,
      spawnAt: reduced ? 0 : 0.25 + i * 0.07,
      liftUntil: 0,
      nudge: new THREE.Vector2(),
      nudgeGoal: new THREE.Vector2(),
      lastHover: null,
      group: null,
    }));
  }

  start() {
    this.live = true;
  }

  attach(index: number, group: THREE.Group | null) {
    const b = this.bodies[index];
    b.group = group;
    group?.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
    });
  }

  /*
   * Builds the camera presets for this viewport. Layout always comes from the
   * top view, so objects keep their composition whichever view is active.
   */
  frame(camera: THREE.PerspectiveCamera, width: number, height: number) {
    const aspect = width / height;
    const portrait = aspect < 1;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const tanHalf = Math.tan(vfov / 2);

    /* top: tight, almost straight-down product shot; portrait runs the desk lengthways */
    const visibleW = portrait ? 7.2 : 11.5;
    const topDist = visibleW / aspect / 2 / tanHalf;
    const el = THREE.MathUtils.degToRad(84);
    const top: View = {
      pos: portrait
        ? new THREE.Vector3(-Math.cos(el) * topDist, Math.sin(el) * topDist, 0)
        : new THREE.Vector3(0, Math.sin(el) * topDist, Math.cos(el) * topDist),
      target: new THREE.Vector3(),
      up: portrait ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0),
    };

    this.views = {
      top,
      front: {
        pos: new THREE.Vector3(0, portrait ? 5 : 4.4, portrait ? 50 : 28),
        target: new THREE.Vector3(0, portrait ? 3.6 : 3.2, -2),
        up: new THREE.Vector3(0, 1, 0),
      },
      angle: {
        pos: portrait ? new THREE.Vector3(14, 20, 30) : new THREE.Vector3(15, 12, 16),
        target: new THREE.Vector3(0.5, 0.4, -0.8),
        up: new THREE.Vector3(0, 1, 0),
      },
      /*
       * Square onto the tank's front glass, which faces +x. Wide screens shift
       * the tank right of center to leave the left side for the field guide;
       * portrait aims low so the tank rides above the bottom sheet.
       */
      tank: portrait
        ? { pos: new THREE.Vector3(TANK.x + 27, 2.4, TANK.z), target: new THREE.Vector3(TANK.x, -1.7, TANK.z), up: new THREE.Vector3(0, 1, 0) }
        : { pos: new THREE.Vector3(TANK.x + 12.5, 2.3, TANK.z + 1.5), target: new THREE.Vector3(TANK.x, 1.55, TANK.z + 1.5), up: new THREE.Vector3(0, 1, 0) },
    };

    /* scratch camera posed at the top view, for screen-to-desk mapping */
    const scratch = new THREE.PerspectiveCamera(camera.fov, aspect, camera.near, camera.far);
    scratch.position.copy(top.pos);
    scratch.up.copy(top.up);
    scratch.lookAt(top.target);
    scratch.updateMatrixWorld();
    scratch.updateProjectionMatrix();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const ray = new THREE.Raycaster();
    this.screenToDesk = (nx: number, ny: number) => {
      ray.setFromCamera(new THREE.Vector2(nx, ny), scratch);
      const p = ray.ray.intersectPlane(plane, new THREE.Vector3()) ?? new THREE.Vector3();
      return [p.x, p.z];
    };

    const first = !this.laidOut;
    const portraitChanged = this.portrait !== portrait;
    this.portrait = portrait;
    this.laidOut = true;

    const slot = portrait ? flashlightSlot.m : flashlightSlot;
    const [fx, fz] = this.screenToDesk(slot.fx * 0.93, -slot.fz * 0.84);
    this.flashHome.set(fx, 0, fz);

    for (const b of this.bodies) {
      if (first || portraitChanged) {
        const [x, z] = this.home(b);
        b.pos.x = x;
        b.pos.z = z;
        b.target.set(x, z);
      } else {
        b.target.set(...this.clampToDesk(b, b.target.x, b.target.y));
      }
    }

    if (first) this.snapCamera(camera);
    camera.updateProjectionMatrix();
  }

  setView(view: ViewName) {
    this.view = view;
    this.zoomGoal = 1;
  }

  /* wheel zoom: dolly toward / away from the view target */
  zoomBy(deltaY: number) {
    this.zoomGoal = clamp(this.zoomGoal * Math.exp(deltaY * 0.0011), 0.42, 1.55);
  }

  private snapCamera(camera: THREE.PerspectiveCamera) {
    const v = this.views?.[this.view];
    if (!v) return;
    this.zoom = this.zoomGoal;
    this.cam.pos.copy(v.pos).sub(v.target).multiplyScalar(this.zoom).add(v.target);
    this.cam.target.copy(v.target);
    this.cam.up.copy(v.up);
    this.applyCamera(camera);
  }

  private applyCamera(camera: THREE.PerspectiveCamera) {
    camera.position.copy(this.cam.pos);
    camera.up.copy(this.cam.up).normalize();
    camera.lookAt(this.cam.target);
    camera.updateMatrixWorld();
  }

  stepCamera(camera: THREE.PerspectiveCamera, delta: number) {
    const v = this.views?.[this.view];
    if (!v) return;
    if (this.reduced) {
      this.snapCamera(camera);
      return;
    }
    const dt = Math.min(delta, 1 / 30);
    const k = 1 - Math.exp(-3.2 * dt);
    this.zoom = damp(this.zoom, this.zoomGoal, 8, dt);
    this.viewPos.copy(v.pos).sub(v.target).multiplyScalar(this.zoom).add(v.target);
    this.cam.pos.lerp(this.viewPos, k);
    this.cam.target.lerp(v.target, k);
    this.cam.up.lerp(v.up, k).normalize();
    this.applyCamera(camera);
  }

  private home(b: Body): [number, number] {
    const { fx, fz } = this.portrait && b.item.m ? b.item.m : b.item;
    return this.screenToDesk(fx * 0.93, -fz * 0.84);
  }

  private clampToDesk(b: Body, x: number, z: number): [number, number] {
    const [ex, ez] = extents(b);
    /* keep everything on the desk top */
    const mx = DESK.halfW - ex * 0.6;
    return [clamp(x, -mx, mx), clamp(z, DESK.back + ez * 0.55, DESK.front - ez * 0.45)];
  }

  tidy() {
    this.bodies.forEach((b, i) => {
      b.target.set(...this.home(b));
      b.targetRotY = b.item.rot;
      b.order = i;
      b.liftUntil = this.clock + 0.55 + i * 0.02;
    });
    this.seq = this.bodies.length;
  }

  scatter() {
    if (!this.laidOut) return;
    this.bodies.forEach((b, i) => {
      const [x, z] = this.screenToDesk((Math.random() * 2 - 1) * 0.9, (Math.random() * 2 - 1) * 0.8);
      b.target.set(...this.clampToDesk(b, x, z));
      b.targetRotY = b.rotY + (Math.random() - 0.5) * Math.PI;
      /* mats stay underneath so the scatter still reads as a desk */
      b.order = (b.item.id.startsWith("mat") ? 0 : 1000) + Math.random() * 1000;
      b.liftUntil = this.clock + 0.55 + i * 0.02;
    });
    [...this.bodies].sort((a, b) => a.order - b.order).forEach((b, i) => (b.order = i));
    this.seq = this.bodies.length;
  }

  setCursor(dom: HTMLElement, cursor: string) {
    dom.style.cursor = cursor;
  }

  hover(index: number, on: boolean) {
    const b = this.bodies[index];
    b.hovered = on;
    b.lastHover = null;
    if (!on) b.nudgeGoal.set(0, 0);
  }

  /* the pointer brushing across an object pushes it a little the same way */
  hoverMove(index: number, point: THREE.Vector3) {
    const b = this.bodies[index];
    if (!b.hovered || this.grabbing || this.reduced || b.item.heavy) return;
    if (b.lastHover) {
      b.nudgeGoal.x += (point.x - b.lastHover.x) * 0.85;
      b.nudgeGoal.y += (point.z - b.lastHover.y) * 0.85;
      if (b.nudgeGoal.length() > NUDGE_MAX) b.nudgeGoal.setLength(NUDGE_MAX);
      b.lastHover.set(point.x, point.z);
    } else {
      b.lastHover = new THREE.Vector2(point.x, point.z);
    }
  }

  turn(index: number) {
    this.bodies[index].targetRotY += Math.PI / 2;
  }

  /*
   * Starts a drag from a pointer hit. Returns a cleanup-free controller:
   * listeners remove themselves on release.
   */
  grab(index: number, point: THREE.Vector3, pointerId: number, dom: HTMLElement, camera: THREE.Camera, onEnd: () => void) {
    const b = this.bodies[index];
    this.grabbing = true;
    b.dragging = true;
    b.target.set(b.pos.x, b.pos.z);
    /* a heavy mat keeps its place in the stack and drags whatever sits on it */
    const riders = b.item.heavy ? this.bodies.filter((o) => o !== b && o.order > b.order && overlaps(b, o)) : [];
    riders.forEach((o) => (o.riding = true));
    if (!b.item.heavy) b.order = ++this.seq;

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -point.y);
    const offset = new THREE.Vector2(b.pos.x - point.x, b.pos.z - point.z);
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const r = dom.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        const [x, z] = this.clampToDesk(b, hit.x + offset.x, hit.z + offset.y);
        const dx = x - b.target.x;
        const dz = z - b.target.y;
        b.target.set(x, z);
        for (const o of riders) o.target.set(o.target.x + dx, o.target.y + dz);
      }
    };
    const wheel = (ev: WheelEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      b.targetRotY -= Math.sign(ev.deltaY) * (Math.PI / 12);
    };
    const release = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      b.dragging = false;
      this.grabbing = false;
      riders.forEach((o) => {
        o.riding = false;
        o.target.set(...this.clampToDesk(o, o.target.x, o.target.y));
      });
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("wheel", wheel, { capture: true });
      onEnd();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    /* capture on window runs before Lenis, so the page holds still while rotating */
    window.addEventListener("wheel", wheel, { capture: true, passive: false });
  }

  private writeGroup(b: Body) {
    if (!b.group) return;
    b.group.position.set(b.pos.x + b.nudge.x, b.pos.y, b.pos.z + b.nudge.y);
    b.group.rotation.set(b.tiltX, b.rotY, b.tiltZ, "XZY");
  }

  step(delta: number) {
    if (!this.laidOut) return;
    if (!this.live) {
      for (const b of this.bodies) this.writeGroup(b);
      return;
    }
    const dt = Math.min(delta, 1 / 30);
    this.clock += dt;
    const t = this.clock;

    for (const b of this.bodies) {
      /* a lifted object hovers over everything; resting ones sit on whatever is below them */
      const floating = b.dragging && !b.item.heavy;
      let support = 0;
      for (const o of this.bodies) {
        if (o === b || (o.dragging && !o.item.heavy)) continue;
        if (!floating && o.order > b.order) continue;
        if (overlaps(b, o)) support = Math.max(support, o.pos.y + o.item.h);
      }

      const heavy = !!b.item.heavy;
      const lifting = b.liftUntil > t && !heavy;
      const lift = floating ? DRAG_LIFT : lifting ? 0.7 : 0;
      const spawning = t < b.spawnAt;
      const ty = spawning ? b.pos.y : support + lift;

      const still = !b.hovered || this.grabbing || this.reduced || heavy;
      if (still) b.nudgeGoal.set(0, 0);
      else {
        b.nudgeGoal.x = damp(b.nudgeGoal.x, 0, 2.4, dt);
        b.nudgeGoal.y = damp(b.nudgeGoal.y, 0, 2.4, dt);
      }
      b.nudge.x = damp(b.nudge.x, b.nudgeGoal.x, 14, dt);
      b.nudge.y = damp(b.nudge.y, b.nudgeGoal.y, 14, dt);

      const px = b.pos.x;
      const pz = b.pos.z;
      const follow = floating ? 22 : b.dragging || b.riding ? 12 : lifting ? 7 : 10;
      b.pos.x = damp(b.pos.x, b.target.x, follow, dt);
      b.pos.z = damp(b.pos.z, b.target.y, follow, dt);
      b.pos.y = damp(b.pos.y, ty, b.dragging ? 14 : 9, dt);
      b.rotY = damp(b.rotY, b.targetRotY, 12, dt);

      const k = this.reduced || heavy || b.riding ? 0 : 0.03;
      const vx = (b.pos.x - px) / dt;
      const vz = (b.pos.z - pz) / dt;
      if (!spawning) {
        b.tiltX = damp(b.tiltX, clamp(vz * k + b.nudge.y * 0.55, -0.35, 0.35), 9, dt);
        b.tiltZ = damp(b.tiltZ, clamp(-vx * k - b.nudge.x * 0.55, -0.35, 0.35), 9, dt);
      }

      this.writeGroup(b);
    }
  }
}
