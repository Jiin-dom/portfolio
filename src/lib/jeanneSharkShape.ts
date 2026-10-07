/**
 * Six-letter Jeff land-shark for "Jeanne" (no repeats).
 * Packed like a typographic SHARK poster — silhouette first, letters second.
 * Jeff: huge head, wide grin, chonk torso, stubby land-legs, short tail.
 * Local px offsets around flock origin; snout faces +x (right).
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

/**
 * Heavy overlap — designed for ~clamp(3.25rem, 7vw, 5.5rem) glyphs.
 * Centers are intentionally close so warped letters fuse into one body.
 */
export const JEFF_POSE: LetterPose[] = [
  // J — big head + grin (rightmost)
  {
    char: "J",
    x: 58,
    y: -6,
    rot: -0.28,
    scaleX: 1.55,
    scaleY: 1.85,
    skewX: -8,
    wdth: 100,
    wght: 800,
    z: 6,
  },
  // e — jaw / cheek fused into the head
  {
    char: "e",
    x: 18,
    y: 14,
    rot: 0.18,
    scaleX: 1.25,
    scaleY: 1.2,
    skewX: 8,
    wdth: 100,
    wght: 760,
    z: 5,
  },
  // a — dorsal fin peak + chonk mid-body overlapping e
  {
    char: "a",
    x: -18,
    y: -36,
    rot: -0.08,
    scaleX: 1.35,
    scaleY: 1.55,
    skewX: -4,
    wdth: 100,
    wght: 800,
    z: 4,
  },
  // n — front stubby land-leg under belly
  {
    char: "n",
    x: -12,
    y: 38,
    rot: 0.12,
    scaleX: 1.1,
    scaleY: 1.15,
    skewX: 4,
    wdth: 95,
    wght: 720,
    z: 3,
  },
  // n — rear stubby land-leg overlapping front
  {
    char: "n",
    x: -48,
    y: 32,
    rot: -0.1,
    scaleX: 1.05,
    scaleY: 1.1,
    skewX: -5,
    wdth: 92,
    wght: 720,
    z: 2,
  },
  // e — stubby tail tucked into haunch
  {
    char: "e",
    x: -78,
    y: -2,
    rot: 0.48,
    scaleX: 1.25,
    scaleY: 0.65,
    skewX: 14,
    wdth: 90,
    wght: 740,
    z: 1,
  },
];
