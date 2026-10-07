"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

type Props = {
  url: string;
  /* longest horizontal side, in world units */
  size?: number;
  /* or: total height, in world units */
  height?: number;
  /* yaw applied before measuring, in radians */
  rotY?: number;
  /* node names to drop, e.g. a camera strap */
  hide?: readonly string[];
};

/*
 * Loads a glTF, rescales it to a target size, and re-seats it so it rests on
 * y = 0 with its footprint centered on the origin — the same contract as the
 * procedural models.
 */
export function FitModel({ url, size, height, rotY = 0, hide }: Props) {
  const { scene } = useGLTF(url);

  const object = useMemo(() => {
    const root = scene.clone(true);
    root.rotation.set(0, rotY, 0);
    hide?.forEach((name) => root.getObjectByName(name)?.removeFromParent());
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const dims = box.getSize(new THREE.Vector3());
    const k = height ? height / dims.y : (size ?? 1) / Math.max(dims.x, dims.z);
    const center = box.getCenter(new THREE.Vector3());

    const holder = new THREE.Group();
    root.position.set(-center.x, -box.min.y, -center.z);
    holder.add(root);
    holder.scale.setScalar(k);
    return holder;
  }, [scene, size, height, rotY, hide]);

  return <primitive object={object} />;
}

export const CAMERA_HIDE = ["Camera_01_strap"] as const;

export const MODEL_URLS = {
  camera: "/models/Camera_01/Camera_01.gltf",
  lamp: "/models/desk_lamp_arm_01/desk_lamp_arm_01.gltf",
  plant: "/models/potted_plant_02/potted_plant_02.gltf",
} as const;
