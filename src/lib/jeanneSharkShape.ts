/**
 * Six-letter Jeff land-shark for "Jeanne" (no repeats).
 * SHARK-poster technique + Jeff: big head, wide grin, chonk, stubby legs, short tail.
 * Coordinates are local px offsets around the flock origin (snout faces +x).
 */

export type LetterPose = {
  char: string;
  x: number;
  y: number;
  rot: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  wdth: number;
  wght: number;
  z: number;
};

export const JEANNE_CHARS = ["J", "e", "a", "n", "n", "e"] as const;

/** Local-pixel Jeff pose — designed at ~display size 5–6rem. */
export const JEFF_POSE: LetterPose[] = [
  // J — oversized head + grin on the right (chase direction)
  {
    char: "J",
    x: 110,
    y: -8,
    rot: -0.22,
    scaleX: 1.45,
    scaleY: 1.7,
    skewX: -7,
    wdth: 100,
    wght: 800,
    z: 6,
  },
  // e — cheek / lower jaw tucked into the head
  {
    char: "e",
    x: 42,
    y: 10,
    rot: 0.14,
    scaleX: 1.2,
    scaleY: 1.15,
    skewX: 6,
    wdth: 100,
    wght: 750,
    z: 5,
  },
  // a — dorsal fin up + thick mid torso
  {
    char: "a",
    x: -20,
    y: -48,
    rot: -0.05,
    scaleX: 1.3,
    scaleY: 1.45,
    skewX: -2,
    wdth: 100,
    wght: 780,
    z: 4,
  },
  // n — front stubby land-leg
  {
    char: "n",
    x: -10,
    y: 52,
    rot: 0.1,
    scaleX: 1.05,
    scaleY: 1.08,
    skewX: 3,
    wdth: 92,
    wght: 700,
    z: 3,
  },
  // n — rear stubby land-leg
  {
    char: "n",
    x: -70,
    y: 46,
    rot: -0.08,
    scaleX: 1.0,
    scaleY: 1.05,
    skewX: -4,
    wdth: 90,
    wght: 700,
    z: 2,
  },
  // e — stubby tail on the left
  {
    char: "e",
    x: -125,
    y: -4,
    rot: 0.4,
    scaleX: 1.2,
    scaleY: 0.7,
    skewX: 12,
    wdth: 88,
    wght: 720,
    z: 1,
  },
];
