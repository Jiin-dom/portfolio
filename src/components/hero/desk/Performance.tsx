"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type Quality = "auto" | "full" | "balanced";

/** Only enabled inside the local comparison harness. No listener in normal visits. */
export function useComparisonControls() {
  const [paused, setPaused] = useState(false);
  const [quality, setQuality] = useState<Quality>("auto");
  useEffect(() => {
    if (!new URLSearchParams(location.search).has("comparison")) return;
    const receive = (event: MessageEvent) => {
      if (window.parent === window || event.source !== window.parent || !document.referrer) return;
      if (event.origin !== new URL(document.referrer).origin || event.data?.type !== "portfolio:compare") return;
      const { command, value } = event.data;
      if (command === "pause" && typeof value === "boolean") setPaused(value);
      if (command === "quality" && ["auto", "full", "balanced"].includes(value)) setQuality(value);
      if (command === "view" && ["Top", "Front", "Angle"].includes(value)) {
        const buttons = document.querySelectorAll<HTMLButtonElement>('[aria-label="Camera angle"] button');
        Array.from(buttons).find((button) => button.textContent?.trim() === value)?.click();
      }
      if (command === "spot" && ["home", "about", "skills", "projects", "contact"].includes(value)) {
        window.dispatchEvent(new Event(`desk:${value}`));
      }
      if (command === "night" && typeof value === "boolean") {
        document.querySelector<HTMLButtonElement>(`[aria-label="Switch to ${value ? "night" : "day"}"]`)?.click();
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  return { paused, quality };
}

/** Read the previous completed render; never take over R3F's render loop. */
export function ComparisonProbe({ paused }: { paused: boolean }) {
  const enabled = useRef(false);
  const resumed = useRef(true);
  const sample = useRef({ frames: 0, elapsed: 0, calls: 0, triangles: 0 });
  useEffect(() => {
    resumed.current = true;
  }, [paused]);
  useEffect(() => {
    enabled.current = window.parent !== window && !!document.referrer && new URLSearchParams(location.search).has("comparison");
  }, []);
  useFrame(({ gl }, delta) => {
    if (!enabled.current) return;
    const stats = sample.current;
    // Exclude the pause/resume gap from the next sampling window.
    if (resumed.current) {
      resumed.current = false;
      stats.frames = stats.elapsed = stats.calls = stats.triangles = 0;
      return;
    }
    stats.frames++;
    stats.elapsed += delta;
    stats.calls += gl.info.render.calls;
    stats.triangles += gl.info.render.triangles;
    if (stats.elapsed < 1) return;
    window.parent.postMessage({
      type: "portfolio:stats",
      fps: Math.round(stats.frames / stats.elapsed),
      frameMs: +(stats.elapsed * 1000 / stats.frames).toFixed(1),
      calls: Math.round(stats.calls / stats.frames),
      triangles: Math.round(stats.triangles / stats.frames),
      dpr: gl.getPixelRatio(),
      ready: !document.documentElement.classList.contains("desk-loading"),
    }, new URL(document.referrer).origin);
    stats.frames = stats.elapsed = stats.calls = stats.triangles = 0;
  }, -100);
  return null;
}

/** Preserve full shadows on fast devices; budget just the sun on slower ones. */
export function ShadowBudget({ balanced }: { balanced: boolean }) {
  const elapsed = useRef(0);
  const light = useRef<THREE.DirectionalLight | null>(null);
  useFrame(({ scene }, delta) => {
    const sun = light.current ?? (scene.getObjectByName("desk-sun") as THREE.DirectionalLight | undefined);
    if (!sun) return;
    light.current = sun;
    const shadow = sun.shadow;
    const size = balanced ? 1024 : 2048;
    if (shadow.mapSize.x !== size) {
      shadow.map?.dispose();
      shadow.map = null;
      shadow.mapSize.set(size, size);
      shadow.needsUpdate = true;
    }
    elapsed.current += delta;
    shadow.autoUpdate = !balanced;
    if (balanced && (elapsed.current >= 1 / 30 || !shadow.map)) {
      shadow.needsUpdate = true;
      elapsed.current %= 1 / 30;
    }
  });
  return null;
}
