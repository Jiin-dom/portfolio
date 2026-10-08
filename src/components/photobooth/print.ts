/*
 * Print geometry and the canvas renderer. Units are "print pixels" at 1x;
 * the editor and the saved PNG both draw through renderPrint so what you
 * arrange on screen is exactly what gets saved.
 */

export type Format = "polaroid" | "strip" | "photo";

export type Rect = { x: number; y: number; w: number; h: number };

export type Layout = { w: number; h: number; frames: Rect[]; caption: Rect | null };

export type Border = {
  id: string;
  label: string;
  base: string;
  ink: string;
  pattern?: { kind: "gingham" | "dots"; color: string };
};

export type Sticker = {
  id: number;
  glyph: string;
  /* center, as fractions of the print */
  x: number;
  y: number;
  /* glyph size as a fraction of print width */
  size: number;
  rot: number;
};

export type Shot = HTMLCanvasElement;

export const FORMATS: { id: Format; label: string; note: string; shots: number }[] = [
  { id: "polaroid", label: "Instax", note: "One shot in a mini frame", shots: 1 },
  { id: "strip", label: "Strip", note: "Four shots, photobooth style", shots: 4 },
  { id: "photo", label: "Photo", note: "One shot, thin border", shots: 1 },
];

export function layoutFor(format: Format): Layout {
  if (format === "polaroid") {
    /* instax mini: 54 × 86 mm card, 46 × 62 mm image */
    return { w: 540, h: 860, frames: [{ x: 40, y: 40, w: 460, h: 620 }], caption: { x: 40, y: 660, w: 460, h: 200 } };
  }
  if (format === "strip") {
    const m = 36;
    const gap = 22;
    const fw = 600 - m * 2;
    const fh = Math.round(fw * 0.75);
    const frames = Array.from({ length: 4 }, (_, i) => ({ x: m, y: m + i * (fh + gap), w: fw, h: fh }));
    const end = m + 4 * fh + 3 * gap;
    return { w: 600, h: end + 190, frames, caption: { x: m, y: end, w: fw, h: 190 } };
  }
  return { w: 1080, h: 830, frames: [{ x: 40, y: 40, w: 1000, h: 750 }], caption: null };
}

export const BORDERS: Border[] = [
  { id: "cream", label: "Cream", base: "#f6f1e7", ink: "#2a2420" },
  { id: "ink", label: "Ink", base: "#1d1a17", ink: "#f6f1e7" },
  { id: "blush", label: "Blush", base: "#f2c4cc", ink: "#5b2b34" },
  { id: "sky", label: "Sky", base: "#bcd5ea", ink: "#203a52" },
  { id: "mint", label: "Mint", base: "#c6e2cf", ink: "#1f4430" },
  { id: "butter", label: "Butter", base: "#f3dc8f", ink: "#4d3b0c" },
  { id: "gingham", label: "Gingham", base: "#fbf1f2", ink: "#7a2d3c", pattern: { kind: "gingham", color: "rgb(222 104 128 / 0.32)" } },
  { id: "dots", label: "Dots", base: "#e85d2c", ink: "#fff3e6", pattern: { kind: "dots", color: "rgb(255 243 230 / 0.75)" } },
];

/* CSS twin of the canvas pattern, for swatches */
export function borderCss(b: Border): string {
  if (b.pattern?.kind === "gingham") {
    const c = b.pattern.color;
    return `repeating-linear-gradient(0deg, ${c} 0 5px, transparent 5px 10px), repeating-linear-gradient(90deg, ${c} 0 5px, transparent 5px 10px), ${b.base}`;
  }
  if (b.pattern?.kind === "dots") {
    return `radial-gradient(${b.pattern.color} 2px, transparent 2.5px) 0 0 / 9px 9px, ${b.base}`;
  }
  return b.base;
}

export const STICKERS = ["✨", "💖", "🌸", "⭐", "🦋", "🍒", "🌈", "☁️", "🔥", "😎", "🎀", "🍓", "🌻", "💫", "📸", "🐻", "🍀", "💌"];

export const EMOJI_FONT = `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;

function drawCover(ctx: CanvasRenderingContext2D, src: Shot, r: Rect) {
  const sw = src.width;
  const sh = src.height;
  const k = Math.max(r.w / sw, r.h / sh);
  const cw = r.w / k;
  const ch = r.h / k;
  ctx.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, r.x, r.y, r.w, r.h);
}

function drawPattern(ctx: CanvasRenderingContext2D, b: Border, w: number, h: number) {
  if (!b.pattern) return;
  ctx.fillStyle = b.pattern.color;
  if (b.pattern.kind === "gingham") {
    const cell = 22;
    for (let x = 0; x < w; x += cell * 2) ctx.fillRect(x, 0, cell, h);
    for (let y = 0; y < h; y += cell * 2) ctx.fillRect(0, y, w, cell);
    return;
  }
  const step = 30;
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export type PrintSpec = {
  format: Format;
  border: Border;
  shots: Shot[];
  caption: string;
  date: string;
  serif: string;
  mono: string;
};

export function renderPrint(canvas: HTMLCanvasElement, spec: PrintSpec, scale: number, stickers: Sticker[] = []) {
  const L = layoutFor(spec.format);
  canvas.width = Math.round(L.w * scale);
  canvas.height = Math.round(L.h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  ctx.fillStyle = spec.border.base;
  ctx.fillRect(0, 0, L.w, L.h);
  drawPattern(ctx, spec.border, L.w, L.h);

  L.frames.forEach((r, i) => {
    const shot = spec.shots[i % Math.max(1, spec.shots.length)];
    ctx.fillStyle = "#2b2725";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    if (shot) drawCover(ctx, shot, r);
    /* a hairline inner edge, like the lip of a real print */
    ctx.strokeStyle = "rgb(0 0 0 / 0.12)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x + 0.75, r.y + 0.75, r.w - 1.5, r.h - 1.5);
  });

  if (L.caption) {
    const c = L.caption;
    ctx.fillStyle = spec.border.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = spec.caption.trim();
    if (spec.format === "strip") {
      if (text) {
        ctx.font = `italic 64px ${spec.serif}`;
        ctx.fillText(text, c.x + c.w / 2, c.y + c.h * 0.42, c.w);
      }
      ctx.font = `500 20px ${spec.mono}`;
      ctx.globalAlpha = 0.7;
      ctx.fillText(spec.date, c.x + c.w / 2, c.y + c.h * (text ? 0.76 : 0.5), c.w);
      ctx.globalAlpha = 1;
    } else if (text) {
      ctx.font = `italic 72px ${spec.serif}`;
      ctx.fillText(text, c.x + c.w / 2, c.y + c.h / 2, c.w);
    }
  }

  for (const s of stickers) {
    ctx.save();
    ctx.translate(s.x * L.w, s.y * L.h);
    ctx.rotate(s.rot);
    ctx.font = `${s.size * L.w}px ${EMOJI_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s.glyph, 0, 0);
    ctx.restore();
  }
}
