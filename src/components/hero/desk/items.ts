import { site } from "@/lib/content";

export type DeskItem = {
  id: string;
  label: string;
  href?: string;
  /* footprint (x, z) and height in world units */
  w: number;
  d: number;
  h: number;
  /* heavy items slide along the desk instead of lifting, and carry what sits on them */
  heavy?: boolean;
  /* resting layout: fractions of the visible desk, -1..1 */
  fx: number;
  fz: number;
  rot: number;
  /* portrait override */
  m?: { fx: number; fz: number };
};

/* Order matters: earlier items rest underneath later ones. */
export const deskItems: DeskItem[] = [
  { id: "mat", label: "Cutting mat", w: 7.6, d: 5.2, h: 0.06, heavy: true, fx: 0.4, fz: 0.04, rot: -0.04, m: { fx: 0.15, fz: 0.0 } },
  { id: "experience", label: "Work folder", w: 1.55, d: 2.3, h: 0.12, fx: -0.07, fz: 0.05, rot: -0.12, m: { fx: 0.0, fz: 0.02 } },
  { id: "tablet", label: "iPad", w: 3.0, d: 2.2, h: 0.09, fx: 0.72, fz: -0.02, rot: 0.1, m: { fx: 0.5, fz: -0.42 } },
  { id: "note", label: "Sticky note", w: 1.2, d: 1.2, h: 0.013, fx: 0.22, fz: -0.66, rot: 0.06, m: { fx: -0.55, fz: -0.5 } },
  { id: "phone", label: "Nothing Phone", w: 0.96, d: 1.98, h: 0.13, fx: 0.5, fz: 0.52, rot: -0.25, m: { fx: 0.6, fz: 0.36 } },
  { id: "pencil", label: "Apple Pencil", w: 1.95, d: 0.1, h: 0.09, fx: 0.84, fz: 0.05, rot: -1.0, m: { fx: 0.75, fz: -0.72 } },
  { id: "polaroid-me", label: site.name, w: 1.5, d: 1.82, h: 0.026, fx: -0.66, fz: -0.22, rot: 0.14, m: { fx: -0.6, fz: -0.28 } },
  { id: "polaroid-sunset", label: "Polaroid", w: 1.5, d: 1.82, h: 0.026, fx: -0.9, fz: 0.78, rot: -0.22, m: { fx: -0.75, fz: 0.3 } },
  { id: "pen", label: "Fountain pen", w: 2.4, d: 0.16, h: 0.16, fx: -0.38, fz: 0.72, rot: 0.95, m: { fx: -0.25, fz: 0.72 } },
  /* ruler first so the rangefinder sits on it, not the other way around */
  { id: "ruler", label: "Steel ruler", w: 3.4, d: 0.34, h: 0.025, fx: -0.12, fz: 0.68, rot: 0.22, m: { fx: -0.6, fz: 0.6 } },
  { id: "camera", label: "Rangefinder", w: 2.4, d: 1.5, h: 1.3, fx: -0.12, fz: 0.68, rot: 0.22, m: { fx: -0.6, fz: 0.6 } },
  { id: "mouse", label: "Mouse", w: 0.62, d: 1.0, h: 0.31, fx: 1.02, fz: -0.18, rot: 0.25, m: { fx: 0.9, fz: 0.7 } },
  { id: "card", label: "Business card", href: `mailto:${site.email}`, w: 1.75, d: 1.0, h: 0.017, fx: -0.62, fz: 0.3, rot: -0.1, m: { fx: -0.6, fz: -0.72 } },
  { id: "clip-a", label: "Paper clip", w: 0.8, d: 0.2, h: 0.022, fx: -1.0, fz: -0.85, rot: 0.6, m: { fx: 0.05, fz: -0.82 } },
  { id: "clip-b", label: "Paper clip", w: 0.8, d: 0.2, h: 0.022, fx: -0.86, fz: -0.72, rot: 2.1, m: { fx: 0.22, fz: -0.74 } },
];

/* the flashlight is not a desk body, but it rests in a layout slot like one */
export const flashlightSlot = { fx: 0.74, fz: 0.92, m: { fx: 0.35, fz: 0.84 } };

export const deskItemMap = {
  ...Object.fromEntries(deskItems.map((i) => [i.id, i])),
  lamp: { id: "lamp", label: "Desk lamp" },
  flashlight: { id: "flashlight", label: "Flashlight" },
  instax: { id: "instax", label: "Instax Mini" },
} as Record<string, Pick<DeskItem, "id" | "label" | "href">>;
