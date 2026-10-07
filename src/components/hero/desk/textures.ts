import * as THREE from "three";
import { site } from "@/lib/content";

type Fonts = { display: string; serif: string; mono: string };
type Ctx = CanvasRenderingContext2D;

const INK = "#1c1612";
const PAPER = "#f6f2ea";

function readFonts(): Fonts {
  const s = getComputedStyle(document.documentElement);
  const pick = (v: string, fallback: string) => s.getPropertyValue(v).trim() || fallback;
  return {
    display: pick("--font-display", "sans-serif"),
    serif: pick("--font-serif", "serif"),
    mono: pick("--font-mono", "monospace"),
  };
}

async function loadFonts(f: Fonts) {
  try {
    await Promise.all([
      document.fonts.load(`800 64px ${f.display}`),
      document.fonts.load(`italic 64px ${f.serif}`),
      document.fonts.load(`500 32px ${f.mono}`),
    ]);
  } catch {
    /* canvas falls back to system fonts */
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = encodeURI(src);
  });
}

function surface(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function drawCover(ctx: Ctx, img: HTMLImageElement, dx: number, dy: number, dw: number, dh: number, focusY = 0.5) {
  const cw = img.naturalWidth;
  const ch = img.naturalHeight;
  const scale = Math.max(dw / cw, dh / ch);
  const sw = dw / scale;
  const sh = dh / scale;
  ctx.drawImage(img, (cw - sw) / 2, (ch - sh) * focusY, sw, sh, dx, dy, dw, dh);
}

function speckle(ctx: Ctx, w: number, h: number, count: number, colors: string[], maxR = 1.6) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.25 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * maxR + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* Self-healing cutting mat: cm grid, ruler numerals on two edges, angle guides */
function matTexture(f: Fonts, w: number, d: number) {
  const W = 2048;
  const H = Math.round((W * d) / w);
  const { c, ctx } = surface(W, H);
  ctx.fillStyle = "#3d6a4c";
  ctx.fillRect(0, 0, W, H);
  /* mottled rubber */
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 120 + Math.random() * 380;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, Math.random() > 0.5 ? "rgba(90,140,105,0.22)" : "rgba(20,50,32,0.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  speckle(ctx, W, H, 3200, ["#ffffff", "#0d2416"], 1.1);

  const m = 78;
  const cols = 30;
  const cell = (W - m * 2) / cols;
  const rows = Math.floor((H - m * 2) / cell);
  ctx.strokeStyle = "#f3efe2";
  ctx.fillStyle = "#f3efe2";
  for (let i = 0; i <= cols; i++) {
    const major = i % 5 === 0;
    ctx.globalAlpha = major ? 0.6 : 0.32;
    ctx.lineWidth = major ? 2.6 : 1.4;
    const x = m + i * cell;
    ctx.beginPath();
    ctx.moveTo(x, m);
    ctx.lineTo(x, m + rows * cell);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.font = `500 22px ${f.mono}`;
    ctx.textAlign = "center";
    ctx.fillText(String(i * 10), x, m + rows * cell + 40);
  }
  for (let j = 0; j <= rows; j++) {
    const major = j % 5 === 0;
    ctx.globalAlpha = major ? 0.6 : 0.32;
    ctx.lineWidth = major ? 2.6 : 1.4;
    const y = m + j * cell;
    ctx.beginPath();
    ctx.moveTo(m, y);
    ctx.lineTo(m + cols * cell, y);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.save();
    ctx.translate(m - 30, m + rows * cell - j * cell);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `500 22px ${f.mono}`;
    ctx.textAlign = "center";
    ctx.fillText(String(j * 10), 0, 8);
    ctx.restore();
  }
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(m, m + rows * cell);
  ctx.lineTo(m + rows * cell, m);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  return toTexture(c);
}

function polaroidTexture(f: Fonts, paint: (ctx: Ctx, x: number, y: number, s: number) => void, caption: string, tag: string) {
  const { c, ctx } = surface(600, 728);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, 600, 728);
  speckle(ctx, 600, 728, 500, ["#d9d1c3"], 0.9);
  ctx.save();
  ctx.beginPath();
  ctx.rect(34, 34, 532, 532);
  ctx.clip();
  paint(ctx, 34, 34, 532);
  /* film warmth, grain, vignette */
  ctx.fillStyle = "rgba(255,190,130,0.1)";
  ctx.fillRect(34, 34, 532, 532);
  speckle(ctx, 600, 600, 1800, ["rgba(255,255,255,0.5)", "rgba(0,0,0,0.5)"], 0.8);
  const v = ctx.createRadialGradient(300, 300, 160, 300, 300, 420);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(30,15,5,0.35)");
  ctx.fillStyle = v;
  ctx.fillRect(34, 34, 532, 532);
  ctx.restore();

  ctx.fillStyle = "#2a2420";
  ctx.font = `italic 50px ${f.serif}`;
  ctx.textAlign = "left";
  ctx.fillText(caption, 42, 650);
  ctx.font = `500 16px ${f.mono}`;
  ctx.globalAlpha = 0.55;
  ctx.textAlign = "right";
  ctx.fillText(tag, 558, 650);
  ctx.globalAlpha = 1;
  return toTexture(c);
}

function paintPortrait(img: HTMLImageElement) {
  return (ctx: Ctx, x: number, y: number, s: number) => {
    const g = ctx.createLinearGradient(x, y, x, y + s);
    g.addColorStop(0, "#d9c3a2");
    g.addColorStop(1, "#b89770");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, s, s);
    drawCover(ctx, img, x, y, s, s, 0.12);
  };
}

function paintSunset(ctx: Ctx, x: number, y: number, s: number) {
  const sky = ctx.createLinearGradient(0, y, 0, y + s * 0.62);
  sky.addColorStop(0, "#5c6f8e");
  sky.addColorStop(0.55, "#e7a27a");
  sky.addColorStop(1, "#f6cf8f");
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, s, s * 0.62);
  ctx.fillStyle = "#fde3b0";
  ctx.beginPath();
  ctx.arc(x + s * 0.62, y + s * 0.6, s * 0.08, 0, Math.PI * 2);
  ctx.fill();
  const sea = ctx.createLinearGradient(0, y + s * 0.62, 0, y + s);
  sea.addColorStop(0, "#c98a6a");
  sea.addColorStop(1, "#2f3d4f");
  ctx.fillStyle = sea;
  ctx.fillRect(x, y + s * 0.62, s, s * 0.38);
  ctx.fillStyle = "rgba(255,226,170,0.55)";
  for (let i = 0; i < 26; i++) {
    const yy = y + s * 0.64 + i * 7;
    const ww = s * (0.18 - i * 0.005) * (0.6 + Math.random() * 0.6);
    ctx.fillRect(x + s * 0.62 - ww / 2 + (Math.random() - 0.5) * 12, yy, ww, 2);
  }
}

/* iPad lock screen: abstract wallpaper + clock; the night version is dimmer and later */
function tabletTexture(f: Fonts, night = false) {
  const W = 1180;
  const H = 820;
  const { c, ctx } = surface(W, H);
  ctx.fillStyle = "#050506";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 34);
  ctx.clip();
  ctx.fillStyle = "#1d1410";
  ctx.fillRect(0, 0, W, H);
  const blobs: [number, number, number, string][] = night
    ? [
        [0.25, 0.35, 520, "rgba(48,62,140,0.8)"],
        [0.78, 0.7, 560, "rgba(26,40,72,0.9)"],
        [0.62, 0.18, 360, "rgba(150,110,200,0.35)"],
        [0.15, 0.85, 420, "rgba(232,140,70,0.28)"],
      ]
    : [
        [0.25, 0.3, 520, "rgba(232,93,44,0.85)"],
        [0.75, 0.7, 560, "rgba(61,106,76,0.9)"],
        [0.6, 0.15, 380, "rgba(242,200,120,0.7)"],
        [0.15, 0.85, 420, "rgba(120,60,90,0.6)"],
      ];
  for (const [bx, by, r, col] of blobs) {
    const g = ctx.createRadialGradient(bx * W, by * H, 0, bx * W, by * H, r);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = night ? "rgba(0,0,8,0.45)" : "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, W, H);
  if (night) {
    /* a few stars */
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.5})`;
      ctx.fillRect(Math.random() * W, Math.random() * H * 0.7, 2, 2);
    }
  }
  ctx.fillStyle = night ? "rgba(214,222,255,0.85)" : "rgba(255,248,236,0.92)";
  ctx.textAlign = "center";
  ctx.font = `500 30px ${f.display}`;
  ctx.fillText("Wednesday, 7 October", W / 2, 150);
  ctx.font = `700 190px ${f.display}`;
  ctx.fillText(night ? "11:47" : "9:41", W / 2, 330);
  if (night) {
    ctx.font = `500 26px ${f.display}`;
    ctx.fillText("☾  Sleep focus on", W / 2, 400);
  }
  ctx.fillStyle = "rgba(255,248,236,0.7)";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 110, H - 30, 220, 8, 4);
  ctx.fill();
  /* glass sheen */
  const s = ctx.createLinearGradient(0, 0, W, H);
  s.addColorStop(0, "rgba(255,255,255,0.12)");
  s.addColorStop(0.4, "rgba(255,255,255,0)");
  ctx.fillStyle = s;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  return toTexture(c);
}

/* Nothing Phone, face down: transparent white back with Glyph light strips */
function nothingBackTexture(f: Fonts) {
  const W = 480;
  const H = 1000;
  const { c, ctx } = surface(W, H);
  ctx.fillStyle = "#26272a";
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 70);
  ctx.fill();

  /* visible internals under the clear back */
  ctx.strokeStyle = "rgba(200,200,200,0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, 330);
  ctx.strokeRect(70, 660, W - 140, 240);
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.moveTo(60 + i * 26, 690);
    ctx.lineTo(60 + i * 26, 880);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(200,200,200,0.4)";
  for (const [sx, sy] of [[58, 58], [W - 58, 58], [58, 352], [W - 58, 352], [90, 920], [W - 90, 920]]) {
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  const glyph = (draw: () => void) => {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 14;
    ctx.lineCap = "round";
    ctx.lineWidth = 16;
    draw();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "rgba(90,90,90,0.8)";
    ctx.lineCap = "round";
    ctx.lineWidth = 20;
    ctx.globalCompositeOperation = "destination-over";
    draw();
    ctx.restore();
  };
  /* camera ring */
  glyph(() => {
    ctx.beginPath();
    ctx.arc(150, 170, 92, Math.PI * 0.15, Math.PI * 1.85);
    ctx.stroke();
  });
  /* diagonal slash */
  glyph(() => {
    ctx.beginPath();
    ctx.moveTo(330, 90);
    ctx.lineTo(410, 220);
    ctx.stroke();
  });
  /* charging ring, split in segments */
  for (let i = 0; i < 4; i++) {
    glyph(() => {
      ctx.beginPath();
      ctx.arc(W / 2, 520, 150, i * (Math.PI / 2) + 0.12, (i + 1) * (Math.PI / 2) - 0.12);
      ctx.stroke();
    });
  }
  /* exclamation strip */
  glyph(() => {
    ctx.beginPath();
    ctx.moveTo(W / 2, 760);
    ctx.lineTo(W / 2, 880);
    ctx.stroke();
  });
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(W / 2, 920, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(230,230,230,0.6)";
  ctx.font = `500 24px ${f.mono}`;
  ctx.textAlign = "center";
  ctx.fillText("nothing", W / 2, 990 - 30);
  return toTexture(c);
}

function cardTexture(f: Fonts) {
  const { c, ctx } = surface(1050, 600);
  ctx.fillStyle = "#f2ece1";
  ctx.fillRect(0, 0, 1050, 600);
  speckle(ctx, 1050, 600, 900, ["#cfc5b4"], 0.9);
  ctx.fillStyle = INK;
  ctx.font = `800 132px ${f.display}`;
  ctx.textAlign = "left";
  ctx.fillText("JEANNE", 64, 190);
  ctx.fillStyle = "#2f5a40";
  ctx.font = `italic 74px ${f.serif}`;
  ctx.fillText("Dominique Paloma", 70, 276);
  ctx.fillStyle = INK;
  ctx.font = `500 24px ${f.mono}`;
  ctx.globalAlpha = 0.7;
  ctx.fillText("FULL-STACK DEVELOPER — UI / UX", 70, 470);
  ctx.fillText(site.email.toUpperCase(), 70, 520);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#e85d2c";
  ctx.beginPath();
  ctx.arc(960, 110, 22, 0, Math.PI * 2);
  ctx.fill();
  return toTexture(c);
}

function noteTexture(f: Fonts) {
  const { c, ctx } = surface(600, 600);
  ctx.fillStyle = "#f2d468";
  ctx.fillRect(0, 0, 600, 600);
  const g = ctx.createLinearGradient(0, 0, 0, 120);
  g.addColorStop(0, "rgba(120,90,10,0.16)");
  g.addColorStop(1, "rgba(120,90,10,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 600, 120);
  ctx.fillStyle = "#2b2310";
  ctx.font = `italic 88px ${f.serif}`;
  ctx.textAlign = "left";
  ["hello —", "drag me", "anywhere."].forEach((line, i) => ctx.fillText(line, 52, 220 + i * 100));
  ctx.font = `500 20px ${f.mono}`;
  ctx.globalAlpha = 0.6;
  ctx.fillText("NOTE Nº 01", 54, 120);
  ctx.globalAlpha = 1;
  return toTexture(c);
}

function rulerTexture(f: Fonts) {
  const W = 2048;
  const H = 200;
  const { c, ctx } = surface(W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#e7e8ea");
  g.addColorStop(0.5, "#c9cbcf");
  g.addColorStop(1, "#dcdde0");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
    ctx.fillRect(0, Math.random() * H, W, 1);
  }
  const m = 40;
  const step = (W - m * 2) / 300;
  ctx.fillStyle = INK;
  for (let i = 0; i <= 300; i++) {
    const len = i % 10 === 0 ? 70 : i % 5 === 0 ? 46 : 26;
    ctx.fillRect(m + i * step, 0, i % 10 === 0 ? 2.4 : 1.6, len);
    if (i % 10 === 0) {
      ctx.font = `500 24px ${f.mono}`;
      ctx.textAlign = "center";
      ctx.fillText(String(i / 10), m + i * step, 104);
    }
  }
  ctx.font = `500 20px ${f.mono}`;
  ctx.textAlign = "left";
  ctx.globalAlpha = 0.6;
  ctx.fillText("STAINLESS · 300 MM · JD", m, H - 26);
  ctx.globalAlpha = 1;
  return toTexture(c);
}

function corkTexture() {
  const { c, ctx } = surface(512, 512);
  ctx.fillStyle = "#c08a55";
  ctx.fillRect(0, 0, 512, 512);
  speckle(ctx, 512, 512, 6200, ["#8a5a30", "#dcae78", "#6f4626", "#d29a5e"], 2.2);
  ctx.strokeStyle = "rgba(60,30,10,0.25)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 196, 0, Math.PI * 2);
  ctx.stroke();
  return toTexture(c);
}

export type DeskTextures = Awaited<ReturnType<typeof buildTextures>>;

export async function buildTextures() {
  const f = readFonts();
  const [me] = await Promise.all([loadImage("/images/me2.png"), loadFonts(f)]);

  return {
    mat: matTexture(f, 7.6, 5.2),
    polaroidMe: polaroidTexture(f, paintPortrait(me), "it's me, JD", "’26"),
    polaroidSunset: polaroidTexture(f, paintSunset, "golden hour", "Nº 12"),
    tablet: tabletTexture(f),
    tabletNight: tabletTexture(f, true),
    nothing: nothingBackTexture(f),
    card: cardTexture(f),
    note: noteTexture(f),
    ruler: rulerTexture(f),
    cork: corkTexture(),
  };
}

/* ── Project books on the desk shelf ── */

export const BOOK_COLORS = ["#2f5a40", "#9c3d22", "#e7dcc6", "#1f2d44", "#b8862f"] as const;

function inkFor(bg: string) {
  return bg === "#e7dcc6" ? INK : "#f6ecdb";
}

function wrapLines(ctx: Ctx, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function clothTexture(ctx: Ctx, w: number, h: number, bg: string) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = "#000";
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.fillStyle = "#fff";
  for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1, h);
  ctx.globalAlpha = 1;
  speckle(ctx, w, h, Math.round((w * h) / 400), ["rgba(0,0,0,0.5)", "rgba(255,255,255,0.4)"], 0.8);
}

export type BookProject = {
  title: string;
  description: string;
  tools: readonly string[];
  href: string;
  image: string;
};

export type BookTextures = Awaited<ReturnType<typeof buildBookTextures>>;

export async function buildBookTextures(projects: readonly BookProject[]) {
  const f = readFonts();
  await loadFonts(f);
  const images = await Promise.all(projects.map((p) => loadImage(p.image).catch(() => null)));

  const paperEdge = (() => {
    const { c, ctx } = surface(256, 256);
    ctx.fillStyle = "#efe6d2";
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 2) {
      ctx.fillStyle = `rgba(120,100,70,${0.05 + Math.random() * 0.12})`;
      ctx.fillRect(0, y, 256, 1);
    }
    return toTexture(c);
  })();

  const books = projects.map((p, i) => {
    const bg = BOOK_COLORS[i % BOOK_COLORS.length];
    const ink = inkFor(bg);
    const num = String(i + 1).padStart(2, "0");

    /* spine: title reads top-to-bottom */
    const spine = (() => {
      const { c, ctx } = surface(160, 900);
      clothTexture(ctx, 160, 900, bg);
      ctx.fillStyle = ink;
      ctx.save();
      ctx.translate(80, 60);
      ctx.rotate(Math.PI / 2);
      ctx.font = `italic 64px ${f.serif}`;
      ctx.textBaseline = "middle";
      ctx.fillText(p.title, 0, 0, 640);
      ctx.restore();
      ctx.font = `500 26px ${f.mono}`;
      ctx.textAlign = "center";
      ctx.fillText(num, 80, 820);
      ctx.fillRect(30, 770, 100, 2);
      return toTexture(c);
    })();

    const cover = (() => {
      const { c, ctx } = surface(600, 900);
      clothTexture(ctx, 600, 900, bg);
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 36, 528, 828);
      ctx.globalAlpha = 1;
      ctx.fillStyle = ink;
      ctx.font = `500 22px ${f.mono}`;
      ctx.fillText(`PROJECT Nº ${num}`, 70, 110);
      ctx.font = `italic 78px ${f.serif}`;
      wrapLines(ctx, p.title, 460).forEach((l, k) => ctx.fillText(l, 70, 380 + k * 82));
      ctx.font = `800 40px ${f.display}`;
      ctx.fillText("JD", 70, 810);
      return toTexture(c);
    })();

    /* inside front cover: a taped print of the screenshot */
    const left = (() => {
      const { c, ctx } = surface(800, 1200);
      ctx.fillStyle = "#f3ecdc";
      ctx.fillRect(0, 0, 800, 1200);
      speckle(ctx, 800, 1200, 1400, ["#d8ccb2"], 0.9);
      const img = images[i];
      ctx.save();
      ctx.translate(400, 520);
      ctx.rotate(-0.03);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(60,40,20,0.25)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillRect(-330, -230, 660, 460);
      ctx.shadowColor = "transparent";
      if (img) drawCover(ctx, img, -310, -210, 620, 420);
      ctx.fillStyle = "rgba(240,225,180,0.75)";
      ctx.rotate(0.6);
      ctx.fillRect(-370, -80, 140, 40);
      ctx.rotate(-1.2);
      ctx.fillRect(250, 260, 140, 40);
      ctx.restore();
      ctx.fillStyle = "#3a3026";
      ctx.font = `italic 40px ${f.serif}`;
      ctx.fillText(`fig. ${num} — ${p.title}`, 80, 880);
      ctx.font = `500 20px ${f.mono}`;
      ctx.globalAlpha = 0.55;
      ctx.fillText("SCREENSHOT · BUILD AS SHIPPED", 80, 930);
      ctx.globalAlpha = 1;
      return toTexture(c);
    })();

    /* right-hand page: the case file */
    const right = (() => {
      const { c, ctx } = surface(800, 1200);
      ctx.fillStyle = "#f6f0e2";
      ctx.fillRect(0, 0, 800, 1200);
      speckle(ctx, 800, 1200, 1400, ["#d8ccb2"], 0.9);
      const g = ctx.createLinearGradient(0, 0, 70, 0);
      g.addColorStop(0, "rgba(90,70,40,0.22)");
      g.addColorStop(1, "rgba(90,70,40,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 70, 1200);

      ctx.fillStyle = "#3a3026";
      ctx.font = `500 20px ${f.mono}`;
      ctx.globalAlpha = 0.6;
      ctx.fillText(`PROJECT Nº ${num}`, 90, 110);
      ctx.globalAlpha = 1;
      ctx.fillStyle = INK;
      ctx.font = `italic 76px ${f.serif}`;
      let y = 200;
      for (const l of wrapLines(ctx, p.title, 620)) {
        ctx.fillText(l, 90, y);
        y += 78;
      }
      ctx.fillRect(90, y - 20, 620, 2);
      y += 50;
      ctx.font = `400 30px ${f.display}`;
      for (const l of wrapLines(ctx, p.description, 620)) {
        ctx.fillText(l, 90, y);
        y += 44;
      }
      y += 40;
      ctx.font = `500 20px ${f.mono}`;
      ctx.globalAlpha = 0.6;
      ctx.fillText("BUILT WITH", 90, y);
      ctx.globalAlpha = 1;
      y += 44;
      ctx.font = `500 24px ${f.mono}`;
      for (const t of p.tools) {
        ctx.strokeRect(92, y - 18, 18, 18);
        ctx.fillText("×", 94, y - 2);
        ctx.fillText(t.toUpperCase(), 128, y);
        y += 38;
      }
      /* stamp */
      ctx.save();
      ctx.translate(600, 1060);
      ctx.rotate(-0.18);
      ctx.strokeStyle = "rgba(196,58,32,0.85)";
      ctx.fillStyle = "rgba(196,58,32,0.85)";
      ctx.lineWidth = 5;
      ctx.strokeRect(-120, -42, 240, 84);
      ctx.font = `800 46px ${f.display}`;
      ctx.textAlign = "center";
      ctx.fillText("SHIPPED", 0, 16);
      ctx.restore();
      return toTexture(c);
    })();

    return { spine, cover, left, right, color: bg };
  });

  return { books, paperEdge };
}

/* Pegboard tile: cream board with dark rounded slots */
export function pegboardTexture() {
  const { c, ctx } = surface(512, 512);
  ctx.fillStyle = "#e9e1d0";
  ctx.fillRect(0, 0, 512, 512);
  speckle(ctx, 512, 512, 900, ["#cfc4ae", "#f6efe2"], 1);
  const slot = (x: number, y: number) => {
    ctx.fillStyle = "#5a4634";
    ctx.beginPath();
    ctx.roundRect(x - 9, y - 34, 18, 68, 9);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 9, y - 33, 18, 68, 9);
    ctx.stroke();
  };
  /* staggered rows; odd rows straddle the tile edge so the repeat is seamless */
  for (let row = 0; row < 4; row++) {
    const odd = row % 2 === 1;
    for (let col = 0; col <= (odd ? 4 : 3); col++) slot(odd ? col * 128 : 64 + col * 128, 64 + row * 128);
  }
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
