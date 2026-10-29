"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

/*
 * The work folder on the desk. The sheet inside is drawn here while it rests;
 * once opened, the page itself (HTML) lifts off from exactly where this sheet
 * sits on screen, so there is never a hand-over between two different sheets.
 */

/* A4 proportions, sized to sit inside the folder */
export const PAPER = { w: 1.4, h: 1.98 };
const FOLDER = { w: 1.55, d: 2.1 };
const COVER_SECONDS = 0.55;
const FLAT = -Math.PI / 2;
/* the cover rests a touch open so the sheet inside shows */
const AJAR = 0.09;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* The resting sheet's place on screen, for the page to start its flight from. */
export type SheetOrigin = { cx: number; cy: number; width: number; height: number; angle: number };

/* Shared between the folder (3D) and the page (HTML). */
export class PaperLink {
  /* cover: 0 closed, 1 open */
  cover = 0;
  /* while the page is out, the resting sheet hides so there is only ever one */
  out = false;
  anchor: THREE.Object3D | null = null;
  private v = new THREE.Vector3();

  setAnchor(o: THREE.Object3D | null) {
    this.anchor = o;
  }

  setOut(out: boolean) {
    this.out = out;
  }

  step(open: boolean, reduced: boolean, dt: number) {
    const goal = open ? 1 : 0;
    const step = reduced ? 1 : dt / COVER_SECONDS;
    this.cover = goal > this.cover ? Math.min(goal, this.cover + step) : Math.max(goal, this.cover - step);
  }

  /* project the sheet's edges to canvas pixels: centre, size and in-plane angle */
  origin(camera: THREE.Camera, w: number, h: number): SheetOrigin | null {
    const a = this.anchor;
    if (!a) return null;
    a.updateWorldMatrix(true, false);
    const at = (x: number, y: number) => {
      this.v.set(x, y, 0).applyMatrix4(a.matrixWorld).project(camera);
      return { x: ((this.v.x + 1) / 2) * w, y: ((1 - this.v.y) / 2) * h };
    };
    const l = at(-PAPER.w / 2, 0);
    const r = at(PAPER.w / 2, 0);
    const b = at(0, -PAPER.h / 2);
    const t = at(0, PAPER.h / 2);
    const c = at(0, 0);
    return {
      cx: c.x,
      cy: c.y,
      width: Math.hypot(r.x - l.x, r.y - l.y),
      height: Math.hypot(t.x - b.x, t.y - b.y),
      angle: Math.atan2(r.y - l.y, r.x - l.x),
    };
  }
}

function Sheet({ map }: { map: THREE.Texture }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[PAPER.w, PAPER.h, 0.008]} />
      {[0, 1, 2, 3, 5].map((k) => (
        <meshStandardMaterial key={k} attach={`material-${k}`} color="#f2ecdd" roughness={0.9} />
      ))}
      <meshStandardMaterial attach="material-4" map={map} roughness={0.88} />
    </mesh>
  );
}

type FolderProps = {
  cover: THREE.Texture;
  paper: THREE.Texture;
  link: PaperLink;
  open: boolean;
  reduced: boolean;
  onOpen: () => void;
};

export function ExperienceFolder({ cover, paper, link, open, reduced, onOpen }: FolderProps) {
  const flap = useRef<THREE.Group>(null);
  const resting = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    link.step(open, reduced, Math.min(delta, 1 / 30));
    if (flap.current) flap.current.rotation.z = THREE.MathUtils.lerp(AJAR, 2.75, ease(link.cover));
    if (resting.current) resting.current.visible = !link.out;
  });

  /* a drag that ends on the folder is a move, not a request to read */
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 10) return;
    onOpen();
  };

  return (
    <group onClick={onClick}>
      {/* back panel, with the tab along the far edge */}
      <RoundedBox args={[FOLDER.w, 0.02, FOLDER.d]} radius={0.01} smoothness={2} position={[0, 0.01, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#c9a46a" roughness={0.92} />
      </RoundedBox>
      <RoundedBox args={[0.6, 0.02, 0.22]} radius={0.01} smoothness={2} position={[-0.32, 0.01, -FOLDER.d / 2 - 0.09]} castShadow>
        <meshStandardMaterial color="#c9a46a" roughness={0.92} />
      </RoundedBox>

      {/* the sheet, pushed off-center so its edge and corner stick out of the folder */}
      <group
        ref={(g) => {
          resting.current = g;
          link.setAnchor(g);
        }}
        position={[0.2, 0.03, -0.2]}
        rotation={[FLAT, 0, -0.06]}
      >
        <Sheet map={paper} />
      </group>

      {/* front cover, hinged on the spine at -x */}
      <group ref={flap} position={[-FOLDER.w / 2, 0.045, 0]} rotation={[0, 0, AJAR]}>
        <group position={[FOLDER.w / 2, 0, 0]}>
          <RoundedBox args={[FOLDER.w, 0.016, FOLDER.d - 0.04]} radius={0.008} smoothness={2} castShadow receiveShadow>
            <meshStandardMaterial color="#d4b07a" roughness={0.92} />
          </RoundedBox>
          <mesh position={[0, 0.0085, 0]} rotation={[FLAT, 0, 0]}>
            <planeGeometry args={[FOLDER.w - 0.02, FOLDER.d - 0.06]} />
            <meshStandardMaterial map={cover} roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
