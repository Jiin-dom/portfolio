"use client";

import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Camera, Check, Download, ImageUp, RotateCcw, Trash2, X } from "lucide-react";
import {
  BORDERS,
  EMOJI_FONT,
  FORMATS,
  STICKERS,
  borderCss,
  layoutFor,
  renderPrint,
  type Format,
  type PrintSpec,
  type Shot,
  type Sticker,
} from "./print";

type Stage = "shoot" | "print" | "edit";

const STAGES: { id: Stage; label: string }[] = [
  { id: "shoot", label: "Shoot" },
  { id: "print", label: "Print" },
  { id: "edit", label: "Decorate" },
];

const STICKER_SIZE: Record<Format, number> = { polaroid: 0.17, strip: 0.2, photo: 0.1 };

/* print width as a fraction of the camera body, so every format fits the slot */
const FEED_WIDTH: Record<Format, number> = { polaroid: 0.62, strip: 0.44, photo: 0.86 };

/* eject delay + feed duration of the print animation */
const EJECT_DONE_MS = 3000;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function cssVar(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function hasCamera() {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

function captureVideo(v: HTMLVideoElement): Shot {
  const c = document.createElement("canvas");
  c.width = v.videoWidth;
  c.height = v.videoHeight;
  const ctx = c.getContext("2d");
  /* mirrored, so the print matches what the visitor saw in the viewfinder */
  ctx?.translate(c.width, 0);
  ctx?.scale(-1, 1);
  ctx?.drawImage(v, 0, 0);
  return c;
}

async function fileToShot(file: File): Promise<Shot> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* lands somewhere inside a random frame, slightly askew, like it was slapped on */
function dropSticker(id: number, glyph: string, format: Format): Sticker {
  const L = layoutFor(format);
  const f = L.frames[Math.floor(Math.random() * L.frames.length)];
  return {
    id,
    glyph,
    x: clamp((f.x + f.w * (0.2 + Math.random() * 0.6)) / L.w, 0.05, 0.95),
    y: clamp((f.y + f.h * (0.2 + Math.random() * 0.6)) / L.h, 0.05, 0.95),
    size: STICKER_SIZE[format],
    rot: (Math.random() - 0.5) * 0.6,
  };
}

function PrintCanvas({ spec, className }: { spec: PrintSpec; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) renderPrint(ref.current, spec, 2);
  }, [spec]);
  return <canvas ref={ref} className={className} />;
}

/* ── Shoot ── */

function ShootStage({ format, onFormat, onShots, reduced }: { format: Format; onFormat: (f: Format) => void; onShots: (s: Shot[]) => void; reduced: boolean }) {
  const frame = layoutFor(format).frames[0];
  const need = FORMATS.find((f) => f.id === format)?.shots ?? 1;
  const video = useRef<HTMLVideoElement>(null);
  const alive = useRef(true);
  const [cam, setCam] = useState<"starting" | "live" | "blocked">(() => (hasCamera() ? "starting" : "blocked"));
  const [count, setCount] = useState<number | null>(null);
  const [taken, setTaken] = useState(0);
  const [busy, setBusy] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [uploadError, setUploadError] = useState(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hasCamera()) return;
    let stream: MediaStream | null = null;
    let live = true;
    const stop = (s: MediaStream) => s.getTracks().forEach((t) => t.stop());
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then((s) => {
        if (!live) return stop(s);
        stream = s;
        const v = video.current;
        if (v) {
          v.srcObject = s;
          v.play().catch(() => {});
        }
        setCam("live");
      })
      .catch(() => {
        if (live) setCam("blocked");
      });
    return () => {
      live = false;
      if (stream) stop(stream);
    };
  }, []);

  const shoot = async () => {
    const v = video.current;
    if (!v || busy || cam !== "live") return;
    setBusy(true);
    const out: Shot[] = [];
    for (let i = 0; i < need; i++) {
      for (let c = 3; c > 0; c--) {
        setCount(c);
        await wait(650);
        if (!alive.current) return;
      }
      setCount(null);
      out.push(captureVideo(v));
      setTaken(i + 1);
      setFlashKey((k) => k + 1);
      await wait(i < need - 1 ? 700 : 450);
      if (!alive.current) return;
    }
    onShots(out);
  };

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, need);
    e.target.value = "";
    if (!files.length) return;
    try {
      onShots(await Promise.all(files.map(fileToShot)));
    } catch {
      setUploadError(true);
    }
  };

  return (
    <div className="booth-shoot">
      <div className="booth-finder" style={{ "--ar": frame.w / frame.h } as CSSProperties}>
        <video ref={video} className="booth-finder__video" playsInline muted autoPlay data-live={cam === "live" ? "" : undefined} />
        {cam !== "live" && (
          <div className="booth-finder__msg">
            {cam === "starting" ? (
              <p>Waking up the camera…</p>
            ) : (
              <>
                <p>No camera here — or it’s blocked.</p>
                <p className="booth-finder__sub">Allow camera access in the address bar, or upload a photo instead.</p>
              </>
            )}
          </div>
        )}
        <AnimatePresence>
          {count !== null && (
            <motion.span
              key={count}
              className="booth-finder__count"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              aria-live="assertive"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
        {flashKey > 0 && <span key={flashKey} className="booth-finder__flash" aria-hidden />}
        {need > 1 && (
          <div className="booth-finder__dots" aria-label={`${taken} of ${need} shots taken`}>
            {Array.from({ length: need }, (_, i) => (
              <span key={i} data-on={i < taken ? "" : undefined} />
            ))}
          </div>
        )}
        <span className="booth-finder__corners" aria-hidden />
      </div>

      <div className="booth-shoot__controls">
        <div className="booth-seg" role="group" aria-label="Print format">
          {FORMATS.map((f) => (
            <button key={f.id} type="button" aria-pressed={format === f.id} disabled={busy} onClick={() => onFormat(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="booth-hint">{FORMATS.find((f) => f.id === format)?.note}</p>

        <div className="booth-shoot__row">
          <label className="desk-chip booth-upload" data-disabled={busy ? "" : undefined}>
            <ImageUp aria-hidden /> Upload
            <input type="file" accept="image/*" multiple={need > 1} disabled={busy} onChange={onFiles} className="sr-only" />
          </label>
          <button type="button" className="booth-shutter" onClick={shoot} disabled={busy || cam !== "live"} aria-label={need > 1 ? "Take four photos" : "Take photo"}>
            <Camera aria-hidden />
          </button>
          <span className="booth-shoot__spacer" aria-hidden />
        </div>
        {uploadError && <p className="booth-hint booth-hint--warn">That file couldn’t be read. Try a JPG or PNG.</p>}
      </div>
    </div>
  );
}

/* ── Print ── */

function PrintStage({ spec, reduced, onDone }: { spec: PrintSpec; reduced: boolean; onDone: () => void }) {
  const L = layoutFor(spec.format);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOut(true), reduced ? 300 : EJECT_DONE_MS);
    return () => clearTimeout(t);
  }, [reduced]);

  return (
    <div className="booth-printer" data-format={spec.format} style={{ "--feed-w": FEED_WIDTH[spec.format], "--print-ar": `${L.w} / ${L.h}` } as CSSProperties}>
      <div className="booth-printer__feed">
        <motion.div
          className="booth-printer__print"
          initial={{ y: reduced ? "0%" : "102%" }}
          animate={{ y: reduced ? "0%" : ["102%", "74%", "72%", "28%", "0%"] }}
          transition={reduced ? { duration: 0 } : { duration: 2.6, times: [0, 0.3, 0.4, 0.86, 1], ease: "easeInOut", delay: 0.35 }}
        >
          <PrintCanvas spec={spec} className="booth-print-canvas" />
          {L.frames.map((r, i) => (
            <motion.span
              key={i}
              className="booth-develop"
              style={{ left: `${(r.x / L.w) * 100}%`, top: `${(r.y / L.h) * 100}%`, width: `${(r.w / L.w) * 100}%`, height: `${(r.h / L.h) * 100}%` }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.4 : 3.4, delay: reduced ? 0 : 1.4 + i * 0.15, ease: "easeIn" }}
            />
          ))}
        </motion.div>
      </div>

      <div className="booth-cam" aria-hidden>
        <span className="booth-cam__slot" />
        <span className="booth-cam__finder" />
        <span className="booth-cam__flash" />
        <span className="booth-cam__lens" />
        <span className="booth-cam__button" />
        <span className="booth-cam__label">photobooth</span>
      </div>

      <div className="booth-printer__foot" aria-live="polite">
        {out ? (
          <motion.button
            type="button"
            className="btn btn-cream"
            onClick={onDone}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            autoFocus
          >
            Decorate it
          </motion.button>
        ) : (
          <p className="booth-hint">Printing… don’t shake it.</p>
        )}
      </div>
    </div>
  );
}

/* ── Decorate ── */

type StickerProps = {
  s: Sticker;
  card: RefObject<HTMLDivElement | null>;
  cardW: number;
  selected: boolean;
  onSelect: () => void;
  onPatch: (p: Partial<Sticker>) => void;
  onRemove: () => void;
};

function StickerView({ s, card, cardW, selected, onSelect, onPatch, onRemove }: StickerProps) {
  const drag = (e: ReactPointerEvent<HTMLElement>, mode: "move" | "spin") => {
    const el = card.current;
    if (!el || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    const r = el.getBoundingClientRect();
    const cx = r.left + s.x * r.width;
    const cy = r.top + s.y * r.height;
    const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
    const d0 = Math.max(1, Math.hypot(e.clientX - cx, e.clientY - cy));
    const px = e.clientX;
    const py = e.clientY;
    const start = s;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      if (mode === "move") {
        onPatch({ x: clamp(start.x + (ev.clientX - px) / r.width, 0, 1), y: clamp(start.y + (ev.clientY - py) / r.height, 0, 1) });
      } else {
        const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
        const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
        onPatch({ rot: start.rot + a - a0, size: clamp((start.size * d) / d0, 0.04, 0.9) });
      }
    };
    const end = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", end);
      target.removeEventListener("pointercancel", end);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", end);
    target.addEventListener("pointercancel", end);
  };

  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    switch (e.key) {
      case "ArrowLeft":
        onPatch({ x: clamp(s.x - step, 0, 1) });
        break;
      case "ArrowRight":
        onPatch({ x: clamp(s.x + step, 0, 1) });
        break;
      case "ArrowUp":
        onPatch({ y: clamp(s.y - step, 0, 1) });
        break;
      case "ArrowDown":
        onPatch({ y: clamp(s.y + step, 0, 1) });
        break;
      case "r":
      case "R":
        onPatch({ rot: s.rot + ((e.shiftKey ? -1 : 1) * Math.PI) / 12 });
        break;
      case "+":
      case "=":
        onPatch({ size: clamp(s.size * 1.1, 0.04, 0.9) });
        break;
      case "-":
        onPatch({ size: clamp(s.size / 1.1, 0.04, 0.9) });
        break;
      case "Delete":
      case "Backspace":
        onRemove();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${s.glyph} sticker. Arrow keys move it, R rotates, plus and minus resize, Delete removes.`}
      aria-pressed={selected}
      className="booth-sticker"
      data-selected={selected ? "" : undefined}
      style={{
        left: `${s.x * 100}%`,
        top: `${s.y * 100}%`,
        fontSize: s.size * cardW,
        fontFamily: EMOJI_FONT,
        transform: `translate(-50%, -50%) rotate(${s.rot}rad)`,
      }}
      onPointerDown={(e) => drag(e, "move")}
      onFocus={onSelect}
      onKeyDown={onKey}
    >
      <span aria-hidden>{s.glyph}</span>
      {selected && (
        <>
          <button
            type="button"
            tabIndex={-1}
            className="booth-sticker__remove"
            aria-label="Remove sticker"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
          >
            <X aria-hidden />
          </button>
          <span className="booth-sticker__spin" onPointerDown={(e) => drag(e, "spin")} aria-hidden />
        </>
      )}
    </div>
  );
}

type EditProps = {
  spec: PrintSpec;
  borderId: string;
  onBorder: (id: string) => void;
  caption: string;
  onCaption: (c: string) => void;
  onRetake: () => void;
  reduced: boolean;
};

function EditStage({ spec, borderId, onBorder, caption, onCaption, onRetake, reduced }: EditProps) {
  const L = layoutFor(spec.format);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const k = Math.min(width / L.w, height / L.h);
      setBox({ w: L.w * k, h: L.h * k });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [L.w, L.h]);

  const patch = useCallback((id: number, p: Partial<Sticker>) => setStickers((list) => list.map((s) => (s.id === id ? { ...s, ...p } : s))), []);
  const remove = useCallback((id: number) => {
    setStickers((list) => list.filter((s) => s.id !== id));
    setSelected(null);
  }, []);

  const add = (glyph: string) => {
    const sticker = dropSticker(nextId.current++, glyph, spec.format);
    setStickers((list) => [...list, sticker]);
    setSelected(sticker.id);
  };

  const save = async () => {
    setSelected(null);
    await document.fonts?.load(`italic 64px ${spec.serif}`).catch(() => {});
    const c = document.createElement("canvas");
    renderPrint(c, spec, 2, stickers);
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `photobooth-${spec.format}-${Date.now()}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    }, "image/png");
  };

  return (
    <div className="booth-edit">
      <div ref={stageRef} className="booth-edit__stage">
        {box && (
          <motion.div
            ref={cardRef}
            className="booth-card"
            style={{ width: box.w, height: box.h }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, rotate: -2, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            onPointerDown={() => setSelected(null)}
          >
            <PrintCanvas spec={spec} className="booth-print-canvas" />
            {stickers.map((s) => (
              <StickerView
                key={s.id}
                s={s}
                card={cardRef}
                cardW={box.w}
                selected={selected === s.id}
                onSelect={() => setSelected(s.id)}
                onPatch={(p) => patch(s.id, p)}
                onRemove={() => remove(s.id)}
              />
            ))}
          </motion.div>
        )}
      </div>

      <div className="booth-panel">
        <section>
          <h3 className="booth-label">Border</h3>
          <div className="booth-swatches" role="group" aria-label="Border">
            {BORDERS.map((b) => (
              <button
                key={b.id}
                type="button"
                className="booth-swatch"
                style={{ background: borderCss(b) }}
                aria-pressed={borderId === b.id}
                aria-label={b.label}
                title={b.label}
                onClick={() => onBorder(b.id)}
              />
            ))}
          </div>
        </section>

        {L.caption && (
          <section>
            <label className="booth-label" htmlFor="booth-caption">
              Caption
            </label>
            <input
              id="booth-caption"
              className="booth-input"
              value={caption}
              maxLength={24}
              placeholder="write something sweet"
              autoComplete="off"
              onChange={(e) => onCaption(e.target.value)}
            />
          </section>
        )}

        <section>
          <div className="booth-label-row">
            <h3 className="booth-label">Stickers</h3>
            {stickers.length > 0 && (
              <button type="button" className="booth-text-btn" onClick={() => {
                  setStickers([]);
                  setSelected(null);
                }}
              >
                <Trash2 aria-hidden /> Clear
              </button>
            )}
          </div>
          <div className="booth-stickers">
            {STICKERS.map((g) => (
              <button key={g} type="button" onClick={() => add(g)} aria-label={`Add ${g} sticker`} style={{ fontFamily: EMOJI_FONT }}>
                {g}
              </button>
            ))}
          </div>
          <p className="booth-hint">Drag to place. Pull the corner dot to resize and spin.</p>
        </section>

        <div className="booth-panel__actions">
          <button type="button" className="btn btn-ghost-cream" onClick={onRetake}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Retake
          </button>
          <button type="button" className="btn btn-cream" onClick={save}>
            {saved ? <Check className="h-4 w-4" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
            {saved ? "Saved" : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Booth ── */

export function Photobooth({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion() ?? false;
  const [stage, setStage] = useState<Stage>("shoot");
  const [format, setFormat] = useState<Format>("polaroid");
  const [shots, setShots] = useState<Shot[]>([]);
  const [borderId, setBorderId] = useState(BORDERS[0].id);
  const [caption, setCaption] = useState("");
  const [fonts] = useState(() => ({ serif: cssVar("--font-serif", "Georgia, serif"), mono: cssVar("--font-mono", "monospace") }));
  const [date] = useState(() => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", "."));
  const dialog = useRef<HTMLDivElement>(null);

  const border = BORDERS.find((b) => b.id === borderId) ?? BORDERS[0];
  const spec = useMemo<PrintSpec>(() => ({ format, border, shots, caption, date, ...fonts }), [format, border, shots, caption, date, fonts]);

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const onShots = useCallback((s: Shot[]) => {
    setShots(s);
    setStage("print");
  }, []);

  const retake = () => {
    setShots([]);
    setStage("shoot");
  };

  const fade = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

  return createPortal(
    <motion.div
      ref={dialog}
      className="booth"
      role="dialog"
      aria-modal="true"
      aria-label="Photobooth"
      tabIndex={-1}
      data-lenis-prevent
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <header className="booth-head">
        <div>
          <p className="booth-eyebrow">Instax Mini · Photobooth</p>
          <ol className="booth-steps">
            {STAGES.map((s) => (
              <li key={s.id} aria-current={stage === s.id ? "step" : undefined}>
                {s.label}
              </li>
            ))}
          </ol>
        </div>
        <button type="button" className="desk-chip" onClick={onClose}>
          <X aria-hidden /> Close
        </button>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={stage} className="booth-body" {...fade} transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}>
          {stage === "shoot" && <ShootStage format={format} onFormat={setFormat} onShots={onShots} reduced={reduced} />}
          {stage === "print" && <PrintStage spec={spec} reduced={reduced} onDone={() => setStage("edit")} />}
          {stage === "edit" && (
            <EditStage spec={spec} borderId={borderId} onBorder={setBorderId} caption={caption} onCaption={setCaption} onRetake={retake} reduced={reduced} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>,
    document.body,
  );
}
