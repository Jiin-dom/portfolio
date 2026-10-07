/**
 * Six-letter Jeff-the-Land-Shark silhouette for "Jeanne".
 * Same idea as typographic SHARK posters: warp each glyph into anatomy.
 * Jeff traits: oversized head, wide grin, chonk torso, stubby land-legs, short tail.
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
 * Packed left→right silhouette (snout on the right, chasing the cursor).
 * Letters overlap tightly so they read as one body first, letters second.
 */
export const JEFF_POSE: LetterPose[] = [
  // J — huge head + grin (hook of J = smile line)
  {
    char: "J",
    x: 0.55,
    y: 0.05,
    rot: -0.22,
    scaleX: 1.7,
    scaleY: 2.05,
    skewX: -8,
    wdth: 100,
    wght: 800,
    z: 6,
  },
  // e — fills cheek / lower jaw mass under the head
  {
    char: "e",
    x: 0.22,
    y: -0.06,
    rot: 0.1,
    scaleX: 1.45,
    scaleY: 1.35,
    skewX: 6,
    wdth: 100,
    wght: 750,
    z: 5,
  },
  // a — dorsal fin from the apex + thick mid-body
  {
    char: "a",
    x: -0.05,
    y: 0.28,
    rot: -0.04,
    scaleX: 1.5,
    scaleY: 1.7,
    skewX: -3,
    wdth: 100,
    wght: 780,
    z: 4,
  },
  // n — front stubby land-leg (legs of n = paws)
  {
    char: "n",
    x: -0.02,
    y: -0.34,
    rot: 0.15,
    scaleX: 1.2,
    scaleY: 1.25,
    skewX: 4,
    wdth: 92,
    wght: 700,
    z: 3,
  },
  // n — rear stubby land-leg + haunch
  {
    char: "n",
    x: -0.32,
    y: -0.28,
    rot: -0.1,
    scaleX: 1.15,
    scaleY: 1.2,
    skewX: -5,
    wdth: 90,
    wght: 700,
    z: 2,
  },
  // e — stubby puppy tail
  {
    char: "e",
    x: -0.62,
    y: 0.0,
    rot: 0.42,
    scaleX: 1.35,
    scaleY: 0.78,
    skewX: 12,
    wdth: 88,
    wght: 720,
    z: 1,
  },
];
