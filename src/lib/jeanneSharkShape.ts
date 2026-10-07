/**
 * Six-letter Jeff land-shark for "Jeanne" (no repeats).
 * Typographic SHARK-poster idea + Jeff anatomy:
 * huge head, wide grin, chonk torso, two stubby land-legs, short tail.
 * Local px around flock origin; snout / grin on +x.
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

/** Extreme Jeff proportions — designed for ~4–5.5rem glyphs, heavy overlap. */
export const JEFF_POSE: LetterPose[] = [
  // J — massive head + grin (right)
  {
    char: "J",
    x: 52,
    y: -10,
    rot: -0.32,
    scaleX: 1.7,
    scaleY: 2.1,
    skewX: -10,
    wdth: 100,
    wght: 800,
    z: 6,
  },
  // e — lower jaw / smile mass fused under J
  {
    char: "e",
    x: 12,
    y: 22,
    rot: 0.22,
    scaleX: 1.35,
    scaleY: 1.25,
    skewX: 10,
    wdth: 100,
    wght: 780,
    z: 5,
  },
  // a — tall dorsal + thick torso overlapping head/jaw
  {
    char: "a",
    x: -22,
    y: -42,
    rot: -0.1,
    scaleX: 1.4,
    scaleY: 1.65,
    skewX: -5,
    wdth: 100,
    wght: 800,
    z: 4,
  },
  // n — front stubby paw
  {
    char: "n",
    x: -8,
    y: 48,
    rot: 0.15,
    scaleX: 1.15,
    scaleY: 1.2,
    skewX: 5,
    wdth: 95,
    wght: 740,
    z: 3,
  },
  // n — rear stubby paw
  {
    char: "n",
    x: -46,
    y: 42,
    rot: -0.12,
    scaleX: 1.1,
    scaleY: 1.15,
    skewX: -6,
    wdth: 92,
    wght: 740,
    z: 2,
  },
  // e — short land-shark tail
  {
    char: "e",
    x: -82,
    y: -6,
    rot: 0.55,
    scaleX: 1.3,
    scaleY: 0.58,
    skewX: 16,
    wdth: 90,
    wght: 760,
    z: 1,
  },
];
