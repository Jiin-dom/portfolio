"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Flashlight, LayoutGrid, Moon, MousePointer2, Shuffle, Sun, X } from "lucide-react";
import { projects, site } from "@/lib/content";
import { deskItemMap } from "@/components/hero/desk/items";
import type { DeskCommand } from "@/components/hero/desk/DeskCanvas";
import type { ViewName } from "@/components/hero/desk/world";

const VIEWS: { id: ViewName; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "front", label: "Front" },
  { id: "angle", label: "Angle" },
];

const DeskCanvas = dynamic(() => import("@/components/hero/desk/DeskCanvas").then((m) => m.DeskCanvas), {
  ssr: false,
});

const loadBooth = () => import("@/components/photobooth/Photobooth").then((m) => m.Photobooth);
const Photobooth = dynamic(loadBooth, { ssr: false });

/* time for the desk Instax to flash and feed its print before the booth opens */
const EJECT_MS = 1100;

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeDark(onChange: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/* Night follows the system theme until the visitor flips the lamp themselves. */
function useNight() {
  const systemDark = useSyncExternalStore(
    subscribeDark,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );
  const [override, setOverride] = useState<boolean | null>(null);
  const night = override ?? systemDark;
  return [night, () => setOverride(!night)] as const;
}

export function DeskHero() {
  const reduce = useReducedMotion() ?? false;
  const root = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);
  const [ready, setReady] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [command, setCommand] = useState<DeskCommand | null>(null);
  const [view, setView] = useState<ViewName>("top");
  const [night, toggleNight] = useNight();
  const [flashWanted, setFlashWanted] = useState(false);
  /* the flashlight only works after dark; turning the lights on puts it down */
  const flashOn = night && flashWanted;
  const toggleFlash = useCallback(() => {
    if (night) setFlashWanted((v) => !v);
    else setFocusId("flashlight");
  }, [night]);

  const [printing, setPrinting] = useState(false);
  const [boothOpen, setBoothOpen] = useState(false);
  const openBooth = useCallback(() => setPrinting(true), []);
  const closeBooth = useCallback(() => {
    setBoothOpen(false);
    setPrinting(false);
  }, []);

  useEffect(() => {
    if (!printing || boothOpen) return;
    const t = window.setTimeout(() => setBoothOpen(true), reduce ? 0 : EJECT_MS);
    return () => window.clearTimeout(t);
  }, [printing, boothOpen, reduce]);

  useEffect(() => {
    if (!night || boothOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      if (e.key === "f" || e.key === "F") setFlashWanted((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [night, boothOpen]);

  useEffect(() => {
    if (focusId === "instax") void loadBooth();
  }, [focusId]);

  const [openProject, setOpenProject] = useState<number | null>(null);
  const [hoverProject, setHoverProject] = useState<number | null>(null);

  useEffect(() => {
    if (openProject === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenProject(null);
      if (e.key === "ArrowRight") setOpenProject((i) => (i === null ? i : (i + 1) % projects.length));
      if (e.key === "ArrowLeft") setOpenProject((i) => (i === null ? i : (i + projects.length - 1) % projects.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openProject]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const send = (type: DeskCommand["type"]) => setCommand((c) => ({ type, n: (c?.n ?? 0) + 1 }));
  const focus =
    hoverProject !== null
      ? { label: projects[hoverProject].title, note: "From the project shelf — click to open the case file.", href: undefined }
      : focusId
        ? deskItemMap[focusId]
        : null;
  const reading = openProject !== null ? projects[openProject] : null;

  return (
    <section id="intro" ref={root} data-night={night ? "" : undefined} className="desk-hero relative h-[100svh] min-h-[600px] overflow-hidden" aria-label="Intro — an interactive desk">
      {/* ── 3D desk ── */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} aria-hidden>
        <DeskCanvas
          active={inView && !boothOpen}
          reduced={reduce}
          command={command}
          view={view}
          night={night}
          onToggleNight={toggleNight}
          flashOn={flashOn}
          onToggleFlash={toggleFlash}
          projects={projects}
          openProject={openProject}
          onOpenProject={setOpenProject}
          onHoverProject={setHoverProject}
          onFocusItem={setFocusId}
          onReady={onReady}
          printing={printing}
          onOpenBooth={openBooth}
        />
      </div>
      <div className="desk-vignette pointer-events-none absolute inset-0" aria-hidden />

      {/* ── Type + UI, layered over the desk like print on a photo ── */}
      <div className="desk-ui pointer-events-none absolute inset-0 z-20" data-reading={reading ? "" : undefined}>
        <header className="desk-title">
          <p className="desk-kicker">Designs interfaces. Ships systems.</p>
          <h1 className="desk-wordmark">
            Jeanne
            <span className="desk-wordmark__script">Dominique Paloma</span>
            <span className="sr-only"> — {site.role}</span>
          </h1>
        </header>

        <div className="desk-lede">
          <p>
            <mark>I design</mark> and ship interfaces that feel as solid as the systems behind them.
          </p>
          <a href={`mailto:${site.email}`} className="pointer-events-auto btn btn-cream">
            Say hello <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        <aside className="desk-glass desk-card">
          <p className="desk-card__head">
            Full-stack developer
            <br />
            with a strong focus
            <br />
            on UI and UX.
          </p>
          <hr className="dot-rule" />
          <p className="desk-card__body">
            Everything on this desk moves. Drag it, hold + scroll to rotate, double-click to turn.
          </p>
          <div className="pointer-events-auto mt-4 flex justify-end gap-2">
            <button type="button" className="desk-chip" onClick={() => send("tidy")}>
              <LayoutGrid aria-hidden /> Tidy
            </button>
            <button type="button" className="desk-chip" onClick={() => send("scatter")}>
              <Shuffle aria-hidden /> Scatter
            </button>
          </div>
        </aside>

        <div className="desk-glass desk-caption" aria-live="polite" data-show={focus ? "" : undefined}>
          {focus && (
            <>
              <p className="desk-caption__eyebrow">On the desk</p>
              <p className="desk-caption__title">{focus.label}</p>
              <p className="desk-caption__note">{focus.note}</p>
              {focus.href && (
                <a className="pointer-events-auto desk-caption__link" href={focus.href}>
                  Write to me <ArrowUpRight aria-hidden />
                </a>
              )}
            </>
          )}
        </div>

        <a href={site.resume} target="_blank" rel="noopener noreferrer" className="pointer-events-auto desk-side-tab">
          <span aria-hidden>●</span> Résumé ↗
        </a>

        <div className="pointer-events-auto desk-views" role="group" aria-label="Camera angle">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
          <button type="button" className="desk-views__mode" aria-pressed={night} onClick={toggleNight} aria-label={night ? "Switch to day" : "Switch to night"}>
            {night ? <Sun aria-hidden /> : <Moon aria-hidden />}
          </button>
          {night && (
            <button type="button" className="desk-views__mode" aria-pressed={flashOn} onClick={toggleFlash} aria-label={flashOn ? "Put the flashlight down" : "Pick up the flashlight"} title="Flashlight (F)">
              <Flashlight aria-hidden />
            </button>
          )}
        </div>

        <p className="desk-scroll">
          <span className="desk-scroll__icon">
            <MousePointer2 aria-hidden />
          </span>
          Scroll to zoom
        </p>
      </div>

      {reading && openProject !== null && (
        <div className="desk-reader desk-glass" role="dialog" aria-label={`${reading.title} — case file`}>
          <p className="desk-reader__count">
            Project {String(openProject + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </p>
          <p className="desk-reader__title">{reading.title}</p>
          <div className="desk-reader__actions">
            <button type="button" className="desk-chip" aria-label="Previous project" onClick={() => setOpenProject((openProject + projects.length - 1) % projects.length)}>
              <ArrowLeft aria-hidden />
            </button>
            <button type="button" className="desk-chip" aria-label="Next project" onClick={() => setOpenProject((openProject + 1) % projects.length)}>
              <ArrowRight aria-hidden />
            </button>
            <a className="desk-chip" href={reading.href} target="_blank" rel="noopener noreferrer">
              GitHub <ArrowUpRight aria-hidden />
            </a>
            <button type="button" className="desk-chip" onClick={() => setOpenProject(null)}>
              <X aria-hidden /> Close
            </button>
          </div>
        </div>
      )}

      {boothOpen && <Photobooth onClose={closeBooth} />}
    </section>
  );
}
