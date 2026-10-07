/** Normalized 2D targets for a stocky land-shark silhouette (Jess-inspired: big head, dorsal fin, thick tail). */

export type SharkGlyph = {
  /** -1..1, right is snout */
  x: number;
  /** -1..1, up is positive */
  y: number;
  /** radians */
  rot: number;
  /** 0..1 scale multiplier */
  scale: number;
};

/** Cycle "Jeanne" for every body slot. */
export const JEANNE_CYCLE = ["J", "e", "a", "n", "n", "e"] as const;

export const SHARK_BODY: SharkGlyph[] = [
  // Snout & grin (land-shark bulldog head)
  { x: 0.72, y: 0.02, rot: -0.08, scale: 1.15 },
  { x: 0.78, y: -0.06, rot: 0.12, scale: 1.05 },
  { x: 0.68, y: 0.1, rot: -0.2, scale: 1.1 },
  { x: 0.58, y: 0.14, rot: -0.35, scale: 1.0 },
  { x: 0.62, y: -0.12, rot: 0.25, scale: 0.95 },
  { x: 0.52, y: -0.04, rot: 0.05, scale: 1.0 },
  // Cheek / jaw bulk
  { x: 0.48, y: 0.18, rot: -0.5, scale: 0.92 },
  { x: 0.44, y: -0.18, rot: 0.45, scale: 0.9 },
  { x: 0.38, y: 0.08, rot: -0.15, scale: 1.05 },
  { x: 0.34, y: -0.08, rot: 0.18, scale: 1.0 },
  // Torso (wide, grounded)
  { x: 0.22, y: 0.12, rot: -0.25, scale: 0.98 },
  { x: 0.18, y: -0.1, rot: 0.22, scale: 0.98 },
  { x: 0.08, y: 0.14, rot: -0.18, scale: 0.95 },
  { x: 0.04, y: -0.12, rot: 0.2, scale: 0.95 },
  { x: -0.06, y: 0.1, rot: -0.12, scale: 0.93 },
  { x: -0.1, y: -0.08, rot: 0.14, scale: 0.93 },
  { x: -0.18, y: 0.06, rot: -0.08, scale: 0.9 },
  { x: -0.22, y: -0.04, rot: 0.1, scale: 0.9 },
  // Dorsal fin
  { x: 0.02, y: 0.38, rot: 0.55, scale: 1.05 },
  { x: -0.04, y: 0.48, rot: 0.75, scale: 1.1 },
  { x: -0.08, y: 0.42, rot: 0.65, scale: 1.0 },
  { x: 0.06, y: 0.32, rot: 0.45, scale: 0.95 },
  // Pectoral / stub “land” fins
  { x: 0.12, y: -0.28, rot: 0.85, scale: 0.88 },
  { x: 0.0, y: -0.32, rot: 1.0, scale: 0.86 },
  { x: -0.14, y: -0.26, rot: 0.7, scale: 0.85 },
  // Tail taper
  { x: -0.32, y: 0.04, rot: 0.05, scale: 0.88 },
  { x: -0.38, y: -0.02, rot: 0.12, scale: 0.85 },
  { x: -0.46, y: 0.06, rot: -0.15, scale: 0.82 },
  { x: -0.52, y: -0.04, rot: 0.2, scale: 0.8 },
  { x: -0.58, y: 0.02, rot: 0.08, scale: 0.78 },
  { x: -0.64, y: -0.06, rot: 0.25, scale: 0.75 },
  // Tail crescent
  { x: -0.7, y: 0.14, rot: -0.55, scale: 0.85 },
  { x: -0.74, y: -0.12, rot: 0.6, scale: 0.85 },
  { x: -0.68, y: 0.22, rot: -0.75, scale: 0.8 },
  { x: -0.72, y: -0.2, rot: 0.8, scale: 0.8 },
  // Spine highlight
  { x: 0.28, y: 0.22, rot: -0.4, scale: 0.9 },
  { x: 0.1, y: 0.24, rot: -0.35, scale: 0.88 },
  { x: -0.08, y: 0.2, rot: -0.28, scale: 0.86 },
  { x: -0.26, y: 0.14, rot: -0.2, scale: 0.84 },
  { x: -0.42, y: 0.08, rot: -0.12, scale: 0.82 },
];

export function charForSlot(i: number): string {
  return JEANNE_CYCLE[i % JEANNE_CYCLE.length]!;
}
