/*
 * One real freshwater species per skill, picked so the fish's colors echo the
 * tool's own branding. Plain data: the aquarium builds bodies, fins and skin
 * textures from it, and the field guide reads the names and swatches.
 */

export type Tail = "fork" | "fan" | "sword" | "veil" | "lyre";
export type Pattern = "plain" | "bars" | "stripe" | "neon" | "waves" | "slants";

export type Species = {
  common: string;
  /* body length in world units; depth and width are fractions of length */
  len: number;
  depth: number;
  width: number;
  tail: Tail;
  /* along-body start/end (0 nose, 1 tail) and height as a fraction of body depth */
  dorsal: [number, number, number];
  anal: [number, number, number];
  back: string;
  side: string;
  belly: string;
  fin: string;
  finAlpha: number;
  accent?: string;
  pattern: Pattern;
  /* thin-film shimmer, 0..1 */
  sheen: number;
  iris: string;
};

export const SPECIES: Record<string, Species> = {
  HTML: {
    common: "Red wag platy",
    len: 0.56, depth: 0.42, width: 0.2, tail: "fan",
    dorsal: [0.36, 0.62, 0.55], anal: [0.55, 0.68, 0.35],
    back: "#b8381a", side: "#ec6a2a", belly: "#f6b47c", fin: "#1f1714", finAlpha: 0.9,
    pattern: "plain", sheen: 0.25, iris: "#d8a640",
  },
  CSS: {
    common: "Dwarf gourami",
    len: 0.6, depth: 0.55, width: 0.16, tail: "fan",
    dorsal: [0.42, 0.78, 0.4], anal: [0.32, 0.86, 0.32],
    back: "#1e467f", side: "#3576d8", belly: "#9fc2f0", fin: "#3a6fc4", finAlpha: 0.7,
    accent: "#c83b30", pattern: "slants", sheen: 0.55, iris: "#e05a3a",
  },
  JavaScript: {
    common: "Electric yellow cichlid",
    len: 0.72, depth: 0.36, width: 0.2, tail: "fan",
    dorsal: [0.25, 0.8, 0.32], anal: [0.62, 0.82, 0.3],
    back: "#d6ac0c", side: "#f5d62a", belly: "#fff1a6", fin: "#f2d02a", finAlpha: 0.85,
    accent: "#141210", pattern: "plain", sheen: 0.15, iris: "#3a2a12",
  },
  React: {
    common: "Neon tetra",
    len: 0.44, depth: 0.3, width: 0.16, tail: "fork",
    dorsal: [0.42, 0.55, 0.5], anal: [0.6, 0.78, 0.35],
    back: "#56645f", side: "#a9b9b6", belly: "#e8eeee", fin: "#e4eeee", finAlpha: 0.35,
    accent: "#e2263a", pattern: "neon", sheen: 0.95, iris: "#5fd6ff",
  },
  Bootstrap: {
    common: "Betta",
    len: 0.6, depth: 0.34, width: 0.18, tail: "veil",
    dorsal: [0.45, 0.82, 1.3], anal: [0.42, 0.92, 1.2],
    back: "#3e2170", side: "#7350b4", belly: "#9a7ad2", fin: "#6a3cb0", finAlpha: 0.78,
    pattern: "plain", sheen: 0.7, iris: "#2a1a3a",
  },
  Java: {
    common: "Comet goldfish",
    len: 0.82, depth: 0.37, width: 0.22, tail: "fork",
    dorsal: [0.35, 0.68, 0.45], anal: [0.66, 0.78, 0.35],
    back: "#cc5a0c", side: "#f28a1e", belly: "#f8c46e", fin: "#f39a3a", finAlpha: 0.75,
    pattern: "plain", sheen: 0.35, iris: "#c88a2a",
  },
  Spring: {
    common: "Green tiger barb",
    len: 0.55, depth: 0.46, width: 0.18, tail: "fork",
    dorsal: [0.38, 0.58, 0.5], anal: [0.6, 0.74, 0.35],
    back: "#16301a", side: "#3c7638", belly: "#b8cf7c", fin: "#c9482a", finAlpha: 0.8,
    accent: "#10200f", pattern: "bars", sheen: 0.6, iris: "#d24a2a",
  },
  "Spring Boot": {
    common: "Green swordtail",
    len: 0.7, depth: 0.3, width: 0.17, tail: "sword",
    dorsal: [0.35, 0.6, 0.45], anal: [0.6, 0.74, 0.3],
    back: "#45622a", side: "#8cbb48", belly: "#e6efc0", fin: "#b9d47a", finAlpha: 0.6,
    accent: "#c7392a", pattern: "stripe", sheen: 0.4, iris: "#c7392a",
  },
  "REST API": {
    common: "Angelfish",
    len: 0.6, depth: 0.78, width: 0.11, tail: "lyre",
    dorsal: [0.3, 0.62, 0.95], anal: [0.32, 0.64, 0.95],
    back: "#8a8f8c", side: "#d8dbd4", belly: "#f1f1ea", fin: "#d8dbd4", finAlpha: 0.65,
    accent: "#1c1c1c", pattern: "bars", sheen: 0.45, iris: "#b8262a",
  },
  MySQL: {
    common: "Blue discus",
    len: 0.7, depth: 0.86, width: 0.12, tail: "fan",
    dorsal: [0.16, 0.86, 0.16], anal: [0.2, 0.86, 0.16],
    back: "#0a586c", side: "#18849a", belly: "#2aa0ad", fin: "#147486", finAlpha: 0.85,
    accent: "#f29111", pattern: "waves", sheen: 0.5, iris: "#d0402a",
  },
};

export const speciesOf = (skill: string): Species => SPECIES[skill] ?? SPECIES.HTML;
