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
  /* keep only triangles inside this box, in the mesh's own geometry space */
  crop?: { min: readonly [number, number, number]; max: readonly [number, number, number] };
};

function cropGeometry(src: THREE.BufferGeometry, box: THREE.Box3) {
  const g = src.index ? src.toNonIndexed() : src.clone();
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  const keep: number[] = [];
  for (let t = 0; t < pos.count; t += 3) {
    if ([0, 1, 2].every((k) => box.containsPoint(v.fromBufferAttribute(pos, t + k)))) keep.push(t, t + 1, t + 2);
  }
  const out = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(g.attributes)) {
    const { array, itemSize, normalized } = attr as THREE.BufferAttribute;
    const data = new Float32Array(keep.length * itemSize);
    keep.forEach((from, i) => {
      for (let c = 0; c < itemSize; c++) data[i * itemSize + c] = array[from * itemSize + c];
    });
    out.setAttribute(name, new THREE.BufferAttribute(data, itemSize, normalized));
  }
  g.dispose();
  return out;
}

/*
 * Loads a glTF, rescales it to a target size, and re-seats it so it rests on
 * y = 0 with its footprint centered on the origin — the same contract as the
 * procedural models.
 */
export function FitModel({ url, size, height, rotY = 0, hide, crop }: Props) {
  const { scene } = useGLTF(url);

  const object = useMemo(() => {
    const root = scene.clone(true);
    root.rotation.set(0, rotY, 0);
    hide?.forEach((name) => root.getObjectByName(name)?.removeFromParent());
    const cropBox = crop && new THREE.Box3(new THREE.Vector3(...crop.min), new THREE.Vector3(...crop.max));
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        if (cropBox) mesh.geometry = cropGeometry(mesh.geometry, cropBox);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
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
  }, [scene, size, height, rotY, hide, crop]);

  return <primitive object={object} />;
}

export const CAMERA_HIDE = ["Camera_01_strap"] as const;

/* the pad alone: its cord and plug are baked into the same mesh */
export const GAMEPAD_CROP = { min: [-0.075, -0.01, 0.145], max: [0.13, 0.03, 0.23] } as const;

export const MODEL_URLS = {
  camera: "/models/Camera_01/Camera_01.gltf",
  lamp: "/models/desk_lamp_arm_01/desk_lamp_arm_01.gltf",
  plant: "/models/potted_plant_02/potted_plant_02.gltf",
  gamepad: "/models/gamepad/gamepad.gltf",
  duck: "/models/rubber_duck_toy/rubber_duck_toy.gltf",
  elephant: "/models/carved_wooden_elephant/carved_wooden_elephant.gltf",
  succulent: "/models/potted_plant_04/potted_plant_04.gltf",
} as const;
