/**
 * Jeff-the-Land-Shark silhouette + Jeanne letter seats.
 * viewBox 0 0 400 220 — snout / grin faces RIGHT.
 */

/** Chonky land shark: big round head, grin notch, dorsal, two stubby legs, short tail. */
export const JEFF_PATH =
  "M 90 110 " +
  // tail
  "C 52 76 14 90 20 114 " +
  "C 14 138 56 146 90 120 " +
  // rear stubby leg
  "L 112 132 " +
  "L 104 174 " +
  "L 128 174 " +
  "L 134 136 " +
  // belly → front stubby leg
  "L 172 142 " +
  "L 166 178 " +
  "L 192 178 " +
  "L 196 144 " +
  // chin into oversized head with grin notch
  "L 236 152 " +
  "C 250 172 278 186 312 178 " +
  "C 348 168 378 140 380 108 " +
  "C 382 78 360 52 324 44 " +
  "C 292 38 266 48 250 68 " +
  // grin notch (wide smile indent)
  "C 262 78 278 86 292 84 " +
  "C 278 96 258 100 242 92 " +
  // forehead → dorsal
  "L 206 74 " +
  "L 172 22 " +
  "L 148 74 " +
  "L 118 82 " +
  "L 90 110 Z";

export const JEFF_LETTER_SEATS = [
  { char: "J", x: 316, y: 108, rot: -10, scale: 1.6 }, // head
  { char: "e", x: 250, y: 120, rot: 6, scale: 1.05 }, // jaw / cheek
  { char: "a", x: 170, y: 56, rot: -8, scale: 1.12 }, // dorsal
  { char: "n", x: 178, y: 152, rot: 2, scale: 0.95 }, // front leg
  { char: "n", x: 120, y: 146, rot: -4, scale: 0.9 }, // rear leg
  { char: "e", x: 54, y: 114, rot: 52, scale: 0.92 }, // tail
] as const;

export const JEFF_VIEWBOX = { w: 400, h: 220 } as const;
