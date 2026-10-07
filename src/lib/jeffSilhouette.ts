/**
 * Jeff-the-Land-Shark silhouette + Jeanne letter seats.
 * viewBox 0 0 560 320 — snout / grin faces RIGHT.
 *
 * Shape-first: filled path alone must read as Jeff
 * (chonky round head, wide smile, swept dorsal, stubby legs, short tail).
 */

/** Outer body + grin hole. Use fillRule="evenodd". */
export const JEFF_PATH =
  // start at back of torso, clockwise
  "M 156 152 " +
  // swept dorsal
  "L 178 152 " +
  "L 164 36 " +
  "L 226 150 " +
  // thick neck → oversized round head
  "L 248 138 " +
  "C 266 72 334 36 404 48 " +
  "C 478 62 526 122 518 182 " +
  "C 510 244 448 286 372 280 " +
  "C 322 276 282 250 262 218 " +
  // chin → FRONT stubby leg
  "L 278 206 " +
  "L 284 262 " +
  "L 242 262 " +
  "L 238 202 " +
  // thick belly → REAR stubby leg
  "L 200 196 " +
  "L 206 256 " +
  "L 164 256 " +
  "L 160 190 " +
  // thick torso into crescent tail (no skinny stalk)
  "L 148 178 " +
  "C 118 162 78 154 40 170 " +
  "C 78 192 120 196 152 186 " +
  "L 156 152 Z " +
  // grin hole — wide Jeff crescent
  "M 338 180 " +
  "C 378 156 440 152 492 174 " +
  "C 468 214 416 234 362 226 " +
  "C 340 222 324 198 338 180 Z";

export const JEFF_LETTER_SEATS = [
  { char: "J", x: 400, y: 134, rot: -6, scale: 1.4 },
  { char: "e", x: 308, y: 154, rot: 6, scale: 0.85 },
  { char: "a", x: 184, y: 116, rot: -10, scale: 0.78 },
  { char: "n", x: 260, y: 232, rot: 0, scale: 0.68 },
  { char: "n", x: 184, y: 226, rot: -2, scale: 0.66 },
  { char: "e", x: 88, y: 172, rot: 36, scale: 0.74 },
] as const;

export const JEFF_VIEWBOX = { w: 560, h: 320 } as const;

export const JEFF_FILL_RULE = "evenodd" as const;
