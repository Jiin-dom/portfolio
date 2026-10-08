import { site } from "@/lib/content";

export type DeskItem = {
  id: string;
  label: string;
  note: string;
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
  { id: "mat", label: "Cutting mat", note: "Self-healing, A2. Where every layout gets measured twice and cut once.", w: 7.6, d: 5.2, h: 0.06, heavy: true, fx: 0.4, fz: 0.04, rot: -0.04, m: { fx: 0.15, fz: 0.0 } },
  { id: "coaster", label: "Cork coaster", note: "A nod to Oryzo — the most sophisticated coaster on the internet.", w: 1.56, d: 1.56, h: 0.15, fx: 0.0, fz: 0.06, rot: 0, m: { fx: 0.05, fz: 0.0 } },
  { id: "tablet", label: "iPad", note: "Where the layouts get tested at real size.", w: 3.0, d: 2.2, h: 0.09, fx: 0.72, fz: -0.02, rot: 0.1, m: { fx: 0.5, fz: -0.42 } },
  { id: "note", label: "Sticky note", note: "Everything on this desk moves. Try it.", w: 1.2, d: 1.2, h: 0.013, fx: 0.22, fz: -0.66, rot: 0.06, m: { fx: -0.55, fz: -0.5 } },
  { id: "phone", label: "Nothing Phone", note: "Face down. Glyphs on, notifications off.", w: 0.96, d: 1.98, h: 0.13, fx: 0.5, fz: 0.52, rot: -0.25, m: { fx: 0.6, fz: 0.36 } },
  { id: "pencil", label: "Apple Pencil", note: "Sketch first. Code second.", w: 1.95, d: 0.1, h: 0.09, fx: 0.84, fz: 0.05, rot: -1.0, m: { fx: 0.75, fz: -0.72 } },
  { id: "polaroid-me", label: site.name, note: site.role, w: 1.5, d: 1.82, h: 0.026, fx: -0.66, fz: -0.22, rot: 0.14, m: { fx: -0.6, fz: -0.28 } },
  { id: "polaroid-sunset", label: "Polaroid", note: "Golden hour, shot on film.", w: 1.5, d: 1.82, h: 0.026, fx: -0.9, fz: 0.78, rot: -0.22, m: { fx: -0.75, fz: 0.3 } },
  { id: "pen", label: "Fountain pen", note: "For the notes that never become tickets.", w: 2.4, d: 0.16, h: 0.16, fx: -0.38, fz: 0.72, rot: 0.95, m: { fx: -0.25, fz: 0.72 } },
  { id: "camera", label: "Rangefinder", note: "Analog, on purpose.", w: 2.4, d: 1.5, h: 1.3, fx: -0.12, fz: 0.68, rot: 0.22, m: { fx: -0.6, fz: 0.6 } },
  { id: "instax", label: "Instax Mini", note: "Click it to open the photobooth. Prints come out the top.", w: 1.5, d: 1.1, h: 1.75, fx: -0.3, fz: -0.5, rot: -0.28, m: { fx: -0.12, fz: -0.45 } },
  { id: "mouse", label: "Mouse", note: "Pointer events, handled.", w: 0.62, d: 1.0, h: 0.31, fx: 1.02, fz: -0.18, rot: 0.25, m: { fx: 0.9, fz: 0.7 } },
  { id: "knife", label: "Utility knife", note: "Cut scope, not corners.", w: 2.4, d: 0.42, h: 0.17, fx: 0.74, fz: 0.92, rot: 0.32, m: { fx: 0.35, fz: 0.84 } },
  { id: "ruler", label: "Steel ruler", note: "Spacing is a system, not a vibe.", w: 3.4, d: 0.34, h: 0.025, fx: 0.16, fz: 0.9, rot: -0.03, m: { fx: 0.1, fz: 0.55 } },
  { id: "card", label: "Business card", note: site.email, href: `mailto:${site.email}`, w: 1.75, d: 1.0, h: 0.017, fx: -0.62, fz: 0.3, rot: -0.1, m: { fx: -0.6, fz: -0.72 } },
  { id: "clip-a", label: "Paper clip", note: "Holds things together. Like good architecture.", w: 0.8, d: 0.2, h: 0.022, fx: -1.0, fz: -0.85, rot: 0.6, m: { fx: 0.05, fz: -0.82 } },
  { id: "clip-b", label: "Paper clip", note: "Holds things together. Like good architecture.", w: 0.8, d: 0.2, h: 0.022, fx: -0.86, fz: -0.72, rot: 2.1, m: { fx: 0.22, fz: -0.74 } },
];

export const deskItemMap = {
  ...Object.fromEntries(deskItems.map((i) => [i.id, i])),
  lamp: { id: "lamp", label: "Desk lamp", note: "Click to switch it on. Late-night mode." },
  flashlight: { id: "flashlight", label: "Flashlight", note: "Best after dark — pick it up and point it anywhere." },
} as Record<string, Pick<DeskItem, "id" | "label" | "note" | "href">>;
