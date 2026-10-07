/**
 * Six-letter Jeff-the-Land-Shark silhouette for "Jeanne".
 * Typographic SHARK-poster technique + Jeff proportions:
 * oversized head, wide grin, chonk torso, stubby land-legs, short tail.
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
 * Tight pack — snout on the right. Overlap like the SHARK poster so the
 * silhouette reads before individual glyphs.
 */
export const JEFF_POSE: LetterPose[] = [
  // J — head + grin (bottom curve = smile)
  {
    char: "J",
    x: 0.48,
    y: 0.04,
    rot: -0.2,
    scaleX: 1.35,
    scaleY: 1.55,
    skewX: -6,
    wdth: 100,
    wght: 800,
    z: 6,
  },
  // e — cheek / jaw mass tucked under the head
  {
    char: "e",
    x: 0.18,
    y: -0.08,
    rot: 0.12,
    scaleX: 1.2,
    scaleY: 1.15,
    skewX: 5,
    wdth: 100,
    wght: 750,
    z: 5,
  },
  // a — dorsal fin (peak) + chonk midsection, overlapping e and n
  {
    char: "a",
    x: -0.08,
    y: 0.22,
    rot: -0.06,
    scaleX: 1.25,
    scaleY: 1.4,
    skewX: -2,
    wdth: 100,
    wght: 780,
    z: 4,
  },
  // n — front stubby paw under the belly
  {
    char: "n",
    x: -0.05,
    y: -0.32,
    rot: 0.12,
    scaleX: 1.05,
    scaleY: 1.1,
    skewX: 3,
    wdth: 92,
    wght: 700,
    z: 3,
  },
  // n — rear stubby paw + haunch
  {
    char: "n",
    x: -0.32,
    y: -0.26,
    rot: -0.08,
    scaleX: 1.0,
    scaleY: 1.05,
    skewX: -4,
    wdth: 90,
    wght: 700,
    z: 2,
  },
  // e — stubby tail tucked left
  {
    char: "e",
    x: -0.55,
    y: 0.02,
    rot: 0.38,
    scaleX: 1.15,
    scaleY: 0.72,
    skewX: 10,
    wdth: 88,
    wght: 720,
    z: 1,
  },
];
