/**
 * Jeanne → Jeff: ONLY J-e-a-n-n-e (no repeats, no fill body).
 * Unit space; +X = snout faces RIGHT.
 *
 *   e — HEAD (largest, right)
 *   J — jaw under head
 *   a — dorsal fin (up)
 *   n — front stubby land-leg
 *   n — rear stubby land-leg
 *   e — TAIL crescent (left, rotated)
 */

export type LetterPose = {
  char: string;
  x: number;
  y: number;
  z: number;
  rot: number;
  rotY: number;
  scale: number;
};

export const JEANNE_HOME: readonly LetterPose[] = [
  { char: "J", x: -1.85, y: 0.35, z: 0, rot: 0, rotY: 0, scale: 1 },
  { char: "e", x: -1.0, y: 0.35, z: 0, rot: 0, rotY: 0, scale: 1 },
  { char: "a", x: -0.2, y: 0.35, z: 0, rot: 0, rotY: 0, scale: 1 },
  { char: "n", x: 0.55, y: 0.35, z: 0, rot: 0, rotY: 0, scale: 1 },
  { char: "n", x: 1.25, y: 0.35, z: 0, rot: 0, rotY: 0, scale: 1 },
  { char: "e", x: 1.95, y: 0.35, z: 0, rot: 0, rotY: 0, scale: 1 },
] as const;

/** Packed Jeff — letters overlap enough to read as one land-shark mass. */
export const JEFF_LETTER_POSE: readonly LetterPose[] = [
  { char: "J", x: 0.28, y: -0.08, z: 0.12, rot: 16, rotY: -14, scale: 2.05 },
  { char: "e", x: 1.2, y: 0.16, z: 0.28, rot: -12, rotY: 18, scale: 2.95 },
  { char: "a", x: -0.12, y: 0.98, z: 0.08, rot: -28, rotY: -8, scale: 1.8 },
  { char: "n", x: 0.22, y: -0.92, z: -0.04, rot: 2, rotY: 6, scale: 1.35 },
  { char: "n", x: -0.58, y: -0.86, z: -0.06, rot: -8, rotY: -6, scale: 1.3 },
  { char: "e", x: -1.5, y: 0.02, z: 0.04, rot: 96, rotY: 10, scale: 1.55 },
] as const;

export const JEFF_CHARS = ["J", "e", "a", "n", "n", "e"] as const;

export const BRICOLAGE_FONT_URL = "/fonts/BricolageGrotesque.ttf";
