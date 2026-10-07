"use client";

/**
 * Jeff letter-shark — pure three.js
 * WebGLRenderer + FontLoader + TextGeometry (no R3F / drei).
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import {
  JEANNE_HOME,
  JEFF_LETTER_POSE,
  TEXT3D_FONT_URL,
} from "@/lib/jeffLetterPose";

export type SharkDrive = {
  morph: number;
  pointer: { x: number; y: number; active: boolean };
  swim: number;
};

type Props = {
  drive: React.MutableRefObject<SharkDrive>;
  active: boolean;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function makeLetterMesh(font: Font, char: string): THREE.Mesh {
  const geo = new TextGeometry(char, {
    font,
    size: 0.55,
    depth: 0.24,
    curveSegments: 5,
    bevelEnabled: true,
    bevelThickness: 0.028,
    bevelSize: 0.012,
    bevelOffset: 0,
    bevelSegments: 2,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(
    -(bb.max.x + bb.min.x) / 2,
    -(bb.max.y + bb.min.y) / 2,
    -(bb.max.z + bb.min.z) / 2,
  );

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#ece7df"),
    roughness: 0.36,
    metalness: 0.05,
    emissive: new THREE.Color("#8a847c"),
    emissiveIntensity: 0.12,
  });
  return new THREE.Mesh(geo, mat);
}

export function JeffLetterShark3D({ drive, active }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let raf = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    const letterGroups: THREE.Group[] = [];
    const flock = { x: 0, y: 0, rot: 0, bounce: 0 };
    const root = new THREE.Group();
    root.visible = false;
    let last = performance.now();

    const disposeScene = () => {
      cancelAnimationFrame(raf);
      letterGroups.forEach((g) => {
        g.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          const mat = mesh.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        });
      });
      letterGroups.length = 0;
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        if (renderer.domElement.parentElement === host) {
          host.removeChild(renderer.domElement);
        }
      }
      renderer = null;
      scene = null;
      camera = null;
    };

    const onResize = () => {
      if (!renderer || !camera || !host) return;
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const tick = (now: number) => {
      if (cancelled || !renderer || !scene || !camera) return;
      raf = requestAnimationFrame(tick);
      if (!active) return;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const d = drive.current;
      const t = d.morph;
      const eased = easeInOut(t);
      const show = t > 0.08;
      root.visible = show;

      if (!show) {
        // Clear transparent frame so nothing leaks under opacity:0 races
        renderer.clear();
        return;
      }

      for (let i = 0; i < 6; i++) {
        const home = JEANNE_HOME[i]!;
        const shark = JEFF_LETTER_POSE[i]!;
        const g = letterGroups[i];
        if (!g) continue;
        g.position.set(
          lerp(home.x, shark.x, eased),
          lerp(home.y, shark.y, eased),
          lerp(home.z, shark.z, eased),
        );
        g.rotation.set(
          0,
          (lerp(home.rotY, shark.rotY, eased) * Math.PI) / 180,
          (lerp(home.rot, shark.rot, eased) * Math.PI) / 180,
        );
        g.scale.setScalar(lerp(home.scale, shark.scale, eased));
      }

      if (d.swim > 0.05 && d.pointer.active) {
        const tx = THREE.MathUtils.clamp(d.pointer.x, -2.6, 2.6);
        const ty = THREE.MathUtils.clamp(d.pointer.y, -1.4, 1.4);
        flock.x += (tx - flock.x) * Math.min(1, 4 * dt);
        flock.y += (ty - flock.y) * Math.min(1, 4 * dt);
        const dx = tx - flock.x;
        const dy = ty - flock.y;
        flock.rot += (Math.atan2(dy, dx) * 0.18 - flock.rot) * 0.1;
        const speed = Math.hypot(dx, dy);
        const bounceTarget =
          Math.sin(now * 0.014) * Math.min(0.12, speed * 0.04);
        flock.bounce += (bounceTarget - flock.bounce) * 0.2;
      } else {
        flock.x += (0 - flock.x) * 0.08;
        flock.y += (0 - flock.y) * 0.08;
        flock.rot *= 0.9;
        flock.bounce *= 0.85;
      }

      const swim = d.swim;
      root.position.set(flock.x * swim, flock.y * swim + flock.bounce * swim, 0);
      root.rotation.z = flock.rot * swim;

      renderer.render(scene, camera);
    };

    const loader = new FontLoader();
    loader.load(
      TEXT3D_FONT_URL,
      (font) => {
        if (cancelled || !host) return;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
        camera.position.set(0, 0.15, 7.4);

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setClearColor(0x000000, 0);
        renderer.autoClear = true;
        const canvas = renderer.domElement;
        canvas.style.position = "absolute";
        canvas.style.inset = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        host.replaceChildren(canvas);

        scene.add(
          new THREE.AmbientLight(0xffffff, 0.72),
          (() => {
            const l = new THREE.DirectionalLight(0xffffff, 1.2);
            l.position.set(3.5, 4.5, 5.5);
            return l;
          })(),
          (() => {
            const l = new THREE.DirectionalLight(0xe85d04, 0.38);
            l.position.set(-3.5, -1, 2.5);
            return l;
          })(),
          root,
        );

        for (let i = 0; i < 6; i++) {
          const home = JEANNE_HOME[i]!;
          const group = new THREE.Group();
          group.add(makeLetterMesh(font, home.char));
          group.position.set(home.x, home.y, home.z);
          root.add(group);
          letterGroups.push(group);
        }

        onResize();
        window.addEventListener("resize", onResize);
        last = performance.now();
        raf = requestAnimationFrame(tick);
      },
      undefined,
      (err) => {
        if (!cancelled) console.error("[JeffLetterShark3D] FontLoader failed", err);
      },
    );

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      disposeScene();
    };
  }, [drive, active]);

  return <div ref={hostRef} className="absolute inset-0 h-full w-full" />;
}
