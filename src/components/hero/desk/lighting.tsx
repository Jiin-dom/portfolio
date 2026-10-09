"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useState } from "react";
import * as THREE from "three";

/*
 * Desk lamp placement. In the glTF the shade points along local -z and the
 * bulb sits ~6.5 units up once the model is scaled to 7.5 units tall.
 */
const LAMP_POS = new THREE.Vector3(-7.8, 0, -3.3);
const LAMP_AIM = new THREE.Vector3(1.6, 0, 0.6);
const BULB_LOCAL = new THREE.Vector3(0.13, 6.5, -1.6);

export const LAMP = (() => {
  const dx = LAMP_AIM.x - LAMP_POS.x;
  const dz = LAMP_AIM.z - LAMP_POS.z;
  const yaw = Math.atan2(-dx, -dz);
  const bulb = BULB_LOCAL.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).add(LAMP_POS);
  return { pos: LAMP_POS, yaw, bulb, aim: LAMP_AIM };
})();

const DAY = {
  hemiSky: new THREE.Color("#ffe6c8"),
  hemiGround: new THREE.Color("#6a4226"),
  hemi: 1.05,
  sunColor: new THREE.Color("#ffe4c4"),
  sun: 2.8,
  env: 1,
};

const NIGHT = {
  hemiSky: new THREE.Color("#3c4a68"),
  hemiGround: new THREE.Color("#1a120c"),
  hemi: 0.12,
  sunColor: new THREE.Color("#8ea4d6"),
  sun: 0.22,
  env: 0.12,
};

/* a few quick stutters when the lamp switches on, like an old bulb */
const FLICKER = [1, 0.15, 0.9, 0.3, 1, 0.6, 1];

/* Mutable light rig, stepped every frame. */
class LightRig {
  hemi: THREE.HemisphereLight | null = null;
  sun: THREE.DirectionalLight | null = null;
  spot: THREE.SpotLight | null = null;
  glow: THREE.PointLight | null = null;
  bulbMat: THREE.MeshStandardMaterial | null = null;
  private mix = 0;
  private lamp = 0;
  private onAt = -1;
  private clock = 0;

  attach(kind: "hemi" | "sun" | "glow", light: THREE.Light | null) {
    if (kind === "hemi") this.hemi = light as THREE.HemisphereLight | null;
    if (kind === "sun") this.sun = light as THREE.DirectionalLight | null;
    if (kind === "glow") this.glow = light as THREE.PointLight | null;
  }

  /* the spot's target lives outside the scene graph, so keep its matrix fresh */
  attachSpot(spot: THREE.SpotLight | null) {
    this.spot = spot;
    if (!spot) return;
    spot.target.position.copy(LAMP.aim);
    spot.target.updateMatrixWorld();
  }

  findBulb(scene: THREE.Scene) {
    if (this.bulbMat) return;
    scene.getObjectByName("desk-lamp")?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m && m.name?.endsWith("_light")) {
        m.emissive = new THREE.Color("#ffb46b");
        this.bulbMat = m;
      }
    });
  }

  step(scene: THREE.Scene, night: boolean, reduced: boolean, delta: number) {
    const dt = Math.min(delta, 1 / 30);
    this.clock += dt;
    const goal = night ? 1 : 0;
    this.mix = reduced ? goal : THREE.MathUtils.damp(this.mix, goal, 2.4, dt);

    if (night && this.onAt < 0) this.onAt = this.clock + (reduced ? 0 : 0.35);
    if (!night) this.onAt = -1;
    let lampGoal = 0;
    if (night && this.clock >= this.onAt) {
      const step = Math.floor((this.clock - this.onAt) / 0.07);
      lampGoal = reduced ? 1 : (FLICKER[step] ?? 1);
    }
    this.lamp = reduced || lampGoal > this.lamp ? lampGoal : THREE.MathUtils.damp(this.lamp, lampGoal, 6, dt);

    const m = this.mix;
    if (this.hemi) {
      this.hemi.intensity = THREE.MathUtils.lerp(DAY.hemi, NIGHT.hemi, m);
      this.hemi.color.lerpColors(DAY.hemiSky, NIGHT.hemiSky, m);
      this.hemi.groundColor.lerpColors(DAY.hemiGround, NIGHT.hemiGround, m);
    }
    if (this.sun) {
      this.sun.intensity = THREE.MathUtils.lerp(DAY.sun, NIGHT.sun, m);
      this.sun.color.lerpColors(DAY.sunColor, NIGHT.sunColor, m);
    }
    scene.environmentIntensity = THREE.MathUtils.lerp(DAY.env, NIGHT.env, m);
    if (this.spot) {
      this.spot.intensity = 30 * this.lamp;
      /*
       * Skip the lamp's shadow pass while it is dark. castShadow stays on so no
       * shader recompiles, and the map must exist first: lit materials sample it.
       */
      this.spot.shadow.autoUpdate = this.lamp > 0 || this.spot.shadow.map === null;
    }
    if (this.glow) this.glow.intensity = 9 * this.lamp;
    if (this.bulbMat) this.bulbMat.emissiveIntensity = 6 * this.lamp;
  }
}

export function Lighting({ night, reduced }: { night: boolean; reduced: boolean }) {
  const scene = useThree((s) => s.scene);
  const [rig] = useState(() => new LightRig());
  const shadowSize = useMemo(() => [1024, 1024] as [number, number], []);

  useFrame((_, delta) => {
    rig.findBulb(scene);
    rig.step(scene, night, reduced, delta);
  });

  return (
    <>
      <hemisphereLight ref={(l) => rig.attach("hemi", l)} args={[DAY.hemiSky, DAY.hemiGround, DAY.hemi]} />
      <directionalLight
        ref={(l) => rig.attach("sun", l)}
        castShadow
        position={[-9, 20, 12]}
        intensity={DAY.sun}
        color={DAY.sunColor}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={10}
      />

      {/* desk lamp: warm 2700K cone onto the objects, plus a soft glow around the shade */}
      <spotLight
        ref={(l) => rig.attachSpot(l)}
        position={LAMP.bulb.toArray()}
        color="#ffb46b"
        intensity={0}
        angle={0.7}
        penumbra={0.9}
        decay={1}
        distance={40}
        castShadow
        shadow-mapSize={shadowSize}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-radius={6}
      />
      <pointLight ref={(l) => rig.attach("glow", l)} position={LAMP.bulb.clone().add(new THREE.Vector3(0, 0.6, 0)).toArray()} color="#ffae5e" intensity={0} distance={9} decay={2} />
    </>
  );
}
