"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Briefcase, ChevronDown, Fish, Flashlight, LayoutGrid, Moon, MousePointer2, Shuffle, Sun, X } from "lucide-react";
import { projects, site } from "@/lib/content";
import { projectSkills, skillGroups, skills } from "@/lib/skills";
import { speciesOf } from "@/components/hero/desk/species";
import { PAPER, type SheetOrigin } from "@/components/hero/desk/experience";
import { WorkRecord } from "@/components/hero/WorkRecord";
import { useScrollFade } from "@/hooks/useScrollFade";
import { deskSpot } from "@/lib/chapters";
import { deskItemMap } from "@/components/hero/desk/items";
import type { DeskCommand, PaperBridge, PrintBridge } from "@/components/hero/desk/DeskCanvas";
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

/* the loader's print: a shake once developed, then it drifts down onto its polaroid on the desk */
const SHAKE_MS = 480;
const FLY_MS = 2800;
const SWINGS = 2.5;

/*
 * A leaf's fall from the window centre to (x, y): it swings side to side,
 * leaning into each swing and lifting a little at either end, and the swings
 * die out as it settles at the polaroid's angle and size.
 */
function leafFall(x: number, y: number, angle: number, scale: number): Keyframe[] {
  const sway = Math.min(140, window.innerWidth * 0.1);
  const from = (-4 * Math.PI) / 180;
  return Array.from({ length: 61 }, (_, i) => {
    const t = i / 60;
    const p = t * t * (3 - 2 * t);
    const calm = (1 - t) ** 1.5;
    const swing = Math.sin(t * Math.PI * 2 * SWINGS);
    const lean = Math.cos(t * Math.PI * 2 * SWINGS);
    const tx = x * p + sway * swing * calm;
    const ty = y * p - 18 * Math.abs(swing) * calm;
    const rot = from + (angle - from) * p + 0.32 * lean * calm;
    return {
      transform: `perspective(900px) translate(${tx}px, ${ty}px) rotate(${rot}rad) rotateY(${28 * swing * calm}deg) rotateX(${12 * lean * calm}deg) scale(${1 + (scale - 1) * p})`,
    };
  });
}
/* once down, the print fades off the real polaroid, letting the type above the desk show back through */
const SETTLE_MS = 600;
type PrintPhase = "developing" | "flying" | "settling" | "landed";

const NONE: readonly number[] = [];

/* The desk opens in daylight whatever the system theme; the lamp switches it to night. */
function useNight() {
  const [night, setNight] = useState(false);
  return [night, () => setNight((n) => !n)] as const;
}

export function DeskHero() {
  const reduce = useReducedMotion() ?? false;
  const root = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);
  const [ready, setReady] = useState(false);
  const [load, setLoad] = useState(8);
  const [print, setPrint] = useState<PrintPhase>("developing");
  const printCard = useRef<HTMLDivElement>(null);
  const printBridge = useRef<PrintBridge | null>(null);
  const onPrintBridge = useCallback((bridge: PrintBridge | null) => {
    printBridge.current = bridge;
  }, []);
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
  const [activeSkill, setActiveSkill] = useState<number | null>(null);
  const [hoverSkill, setHoverSkill] = useState<number | null>(null);
  /* the aquarium on the L return has its own close-up view; the field guide lives there */
  const tankOpen = view === "tank";
  /* so does the project shelf: a face-on look at the book spines */
  const shelfOpen = view === "shelf";
  /* the desk view to go back to from either close-up */
  const [viewBefore, setViewBefore] = useState<ViewName>("top");
  const tankTrigger = useRef<HTMLButtonElement>(null);
  /* a book in hand calls its fish to the front glass */
  const handProject = openProject ?? hoverProject;
  const featuredSkills = useMemo(() => (handProject === null ? NONE : projectSkills[handProject]), [handProject]);
  /*
   * The work record: the folder's cover swings open (3D) and the page lifts off
   * from exactly where its sheet sits on screen (HTML), so only one sheet ever moves.
   */
  const [sheet, setSheet] = useState<"closed" | "open" | "closing">("closed");
  const [sheetOrigin, setSheetOrigin] = useState<SheetOrigin | null>(null);
  const paperBridge = useRef<PaperBridge | null>(null);
  const onPaperBridge = useCallback((bridge: PaperBridge | null) => {
    paperBridge.current = bridge;
  }, []);
  const experienceTrigger = useRef<HTMLButtonElement>(null);
  const focusReturn = useRef<HTMLElement | null>(null);
  const experienceOpen = sheet !== "closed";
  const experienceActive = experienceOpen;

  const openExperience = useCallback(() => {
    const active = document.activeElement;
    /* hand focus back only to whatever had it; a click on the 3D folder had none */
    focusReturn.current = active instanceof HTMLElement && active !== document.body ? active : null;
    setOpenProject(null);
    setSheetOrigin(paperBridge.current?.origin() ?? null);
    setSheet((s) => (s === "closed" ? "open" : s));
  }, []);

  const closeExperience = useCallback(() => {
    setSheet((s) => (s === "open" && !reduce ? "closing" : "closed"));
  }, [reduce]);

  const experienceExited = useCallback(() => setSheet((s) => (s === "closing" ? "closed" : s)), []);

  useEffect(() => {
    if (!experienceOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeExperience();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      focusReturn.current?.focus({ preventScroll: true });
    };
  }, [experienceOpen, closeExperience]);

  /* the hero's size, to place the page exactly where the 3D sheet lands */
  const [hero, setHero] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setHero({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const sheetRects = useMemo(() => {
    /* an A4 page: 80% of the height, or 90% of the width on tall screens, nudged up a little */
    const ratio = PAPER.h / PAPER.w;
    const h = Math.min(0.8 * hero.h, 0.9 * hero.w * ratio);
    const w = h / ratio;
    const landed = { top: hero.h / 2 - h / 2 - 0.05 * h, left: (hero.w - w) / 2, width: w, height: h };
    /* phones unfold the page to nearly full screen; an A4 at phone width is too small to read */
    const phone = hero.w < 768;
    const reading = phone ? { top: 72, left: 12, width: hero.w - 24, height: hero.h - 84 } : landed;
    return { landed, reading };
  }, [hero]);


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

  const openTank = useCallback(() => {
    closeExperience();
    setOpenProject(null);
    setFocusId(null);
    if (!tankOpen && !shelfOpen) setViewBefore(view);
    setView("tank");
  }, [closeExperience, view, tankOpen, shelfOpen]);

  const openShelf = useCallback(() => {
    closeExperience();
    setOpenProject(null);
    setFocusId(null);
    setActiveSkill(null);
    setHoverSkill(null);
    if (!tankOpen && !shelfOpen) setViewBefore(view);
    setView("shelf");
  }, [closeExperience, view, tankOpen, shelfOpen]);

  const closeShelf = useCallback(() => setView(viewBefore), [viewBefore]);

  useEffect(() => {
    deskSpot.set(experienceOpen ? "about" : tankOpen ? "skills" : shelfOpen ? "projects" : null);
    return () => deskSpot.set(null);
  }, [experienceOpen, tankOpen, shelfOpen]);

  /* the zoom hint has done its job once the visitor has zoomed */
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el || zoomed || !ready) return;
    /* on window, in capture, beside the canvas's own zoom listener (it stops propagation) */
    const onWheel = (e: WheelEvent) => {
      if (window.scrollY <= 4 && el.contains(e.target as Node)) setZoomed(true);
    };
    window.addEventListener("wheel", onWheel, { capture: true, passive: true });
    return () => window.removeEventListener("wheel", onWheel, { capture: true });
  }, [zoomed, ready]);

  const closeTank = useCallback(() => {
    setActiveSkill(null);
    setHoverSkill(null);
    setView(viewBefore);
    tankTrigger.current?.focus();
  }, [viewBefore]);

  useEffect(() => {
    if (!tankOpen || openProject !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (activeSkill !== null) setActiveSkill(null);
      else closeTank();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tankOpen, openProject, activeSkill, closeTank]);

  useEffect(() => {
    if (!shelfOpen || openProject !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeShelf();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shelfOpen, openProject, closeShelf]);

  /* the Skills and Projects nav links, and their deep links, fly straight to the tank or the shelf */
  useEffect(() => {
    const toTop = () => root.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    const skills = () => {
      toTop();
      openTank();
    };
    const shelf = () => {
      toTop();
      openShelf();
    };
    window.addEventListener("desk:skills", skills);
    window.addEventListener("desk:projects", shelf);
    return () => {
      window.removeEventListener("desk:skills", skills);
      window.removeEventListener("desk:projects", shelf);
    };
  }, [openTank, openShelf, reduce]);

  /*
   * About me opens the Experience folder. From a close-up the camera comes
   * back to the desk first, so the page lifts off a sheet that is on screen.
   */
  const [aboutPending, setAboutPending] = useState(false);
  useEffect(() => {
    const about = () => {
      root.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      setOpenProject(null);
      if (tankOpen || shelfOpen) {
        setActiveSkill(null);
        setHoverSkill(null);
        setView(viewBefore);
        setAboutPending(true);
      } else openExperience();
    };
    window.addEventListener("desk:about", about);
    return () => window.removeEventListener("desk:about", about);
  }, [openExperience, tankOpen, shelfOpen, viewBefore, reduce]);

  useEffect(() => {
    if (!aboutPending) return;
    const t = window.setTimeout(() => {
      setAboutPending(false);
      openExperience();
    }, reduce ? 0 : 900);
    return () => window.clearTimeout(t);
  }, [aboutPending, openExperience, reduce]);

  /* Home (nav or logo) puts everything away and returns to the desk */
  useEffect(() => {
    const home = () => {
      closeExperience();
      setOpenProject(null);
      setFocusId(null);
      setActiveSkill(null);
      setHoverSkill(null);
      setAboutPending(false);
      if (tankOpen || shelfOpen) setView(viewBefore);
    };
    window.addEventListener("desk:home", home);
    return () => window.removeEventListener("desk:home", home);
  }, [closeExperience, tankOpen, shelfOpen, viewBefore]);

  useEffect(() => {
    if (!ready) return;
    const spot = { "#about": "about", "#skills": "skills", "#projects": "projects" }[window.location.hash];
    if (spot) window.dispatchEvent(new Event(`desk:${spot}`));
  }, [ready]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onProgress = useCallback((p: number) => setLoad((n) => Math.max(n, p)), []);

  useEffect(() => {
    if (ready) return;
    document.documentElement.classList.add("desk-loading");
    return () => document.documentElement.classList.remove("desk-loading");
  }, [ready]);

  const land = useCallback(() => {
    printBridge.current?.release();
    setPrint((p) => (p === "landed" ? p : "settling"));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (reduce) {
      printBridge.current?.release();
      const t = window.setTimeout(() => setPrint("landed"), 600);
      return () => window.clearTimeout(t);
    }
    let fall: Animation | undefined;
    const t = window.setTimeout(() => {
      /* drift from the centre of the window to the polaroid's resting place on the desk */
      const to = printBridge.current?.origin();
      const card = printCard.current;
      const box = root.current?.getBoundingClientRect();
      if (!to || !card || !box) return land();
      const x = box.left + to.cx - window.innerWidth / 2;
      const y = box.top + to.cy - window.innerHeight / 2;
      fall = card.animate(leafFall(x, y, to.angle, to.width / card.offsetWidth), { duration: FLY_MS, fill: "forwards" });
      fall.finished.then(land, () => {});
      setPrint("flying");
    }, SHAKE_MS);
    return () => {
      window.clearTimeout(t);
      fall?.cancel();
    };
  }, [ready, reduce, land]);

  /* the fall finishing is the cue to land; this only covers one that never reports back */
  useEffect(() => {
    if (print !== "flying") return;
    const t = window.setTimeout(land, FLY_MS + 400);
    return () => window.clearTimeout(t);
  }, [print, land]);

  useEffect(() => {
    if (print !== "settling") return;
    const t = window.setTimeout(() => setPrint("landed"), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [print]);
  const send = (type: DeskCommand["type"]) => setCommand((c) => ({ type, n: (c?.n ?? 0) + 1 }));
  const focus =
    hoverProject !== null
      ? { label: projects[hoverProject].title, href: undefined }
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
          experienceOpen={experienceOpen}
          onOpenExperience={openExperience}
          onCloseExperience={closeExperience}
          onPaperBridge={onPaperBridge}
          onPrintBridge={onPrintBridge}
          onHoverProject={setHoverProject}
          skills={skills}
          activeSkill={activeSkill}
          featuredSkills={featuredSkills}
          labelledSkill={reading ? null : (hoverSkill ?? activeSkill)}
          onSelectSkill={setActiveSkill}
          onHoverSkill={setHoverSkill}
          onFocusItem={setFocusId}
          onReady={onReady}
          onProgress={onProgress}
          printing={printing}
          onOpenBooth={openBooth}
        />
      </div>
      <div className="desk-vignette pointer-events-none absolute inset-0" aria-hidden />

      {print !== "landed" ? (
        <div className="desk-loader" data-lenis-prevent data-ready={ready ? "" : undefined} data-print={print} data-reduced={reduce ? "" : undefined} aria-busy={!ready}>
          <p className="desk-loader__kicker">{site.shortName}</p>
          <p className="desk-loader__mark">The desk</p>
          {/* the Instax print from the desk, developing as the scene loads */}
          <div
            ref={printCard}
            className="desk-print"
            data-phase={ready && print === "developing" && !reduce ? "shaking" : print}
            style={{ "--dev": ready ? 1 : load / 100 } as CSSProperties}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={ready ? 100 : Math.round(load)}
            aria-label="Developing the desk"
          >
            <div className="desk-print__photo">
              <Image src="/images/me2.png" alt="" fill preload unoptimized />
            </div>
            <p className="desk-print__caption">{ready ? "it's me, JD" : "developing…"}</p>
            <p className="desk-print__tag">{ready ? "’26" : `${Math.round(load)}%`}</p>
          </div>
        </div>
      ) : null}

      {/* ── Type + UI, layered over the desk like print on a photo ── */}
      <div className="desk-ui pointer-events-none absolute inset-0 z-20" data-reading={reading || experienceActive || tankOpen || shelfOpen ? "" : undefined}>
        <header className="desk-title">
          <h1 className="desk-wordmark">
            Jeanne
            <span className="desk-wordmark__script">Dominique Paloma</span>
            <span className="sr-only"> — {site.role}</span>
          </h1>
        </header>

        <div className="desk-lede desk-glass">
          <p>
            <mark>I design</mark> and ship interfaces that feel as solid as the systems behind them.
          </p>
          <a href={`mailto:${site.email}`} className="pointer-events-auto btn btn-cream">
            Say hello <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        {/* desktop: each child is placed on its own; phones stack them into one bottom dock */}
        <div className="desk-dock">
          <div className="desk-glass desk-caption" aria-live="polite" data-show={focus ? "" : undefined}>
            {focus && (
              <>
                <p className="desk-caption__title">{focus.label}</p>
                {focus.href && (
                  <a className="pointer-events-auto desk-caption__link" href={focus.href}>
                    Write to me <ArrowUpRight aria-hidden />
                  </a>
                )}
              </>
            )}
          </div>

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

          <aside className="desk-glass desk-card">
            <p className="desk-card__head">
              Full-stack developer <br /> with a strong focus <br /> on UI and UX.
            </p>
            <div className="desk-card__actions pointer-events-auto mt-4 flex flex-wrap justify-end gap-2">
              <a href="#contact" className="desk-chip desk-chip--explore">
                <ArrowDown aria-hidden /> Explore
              </a>
              <button type="button" className="desk-chip" onClick={() => send("tidy")}>
                <LayoutGrid aria-hidden /> Tidy
              </button>
              <button ref={experienceTrigger} type="button" className="desk-chip" onClick={openExperience}>
                <Briefcase aria-hidden /> Experience
              </button>
              <button ref={tankTrigger} type="button" className="desk-chip" onClick={openTank}>
                <Fish aria-hidden /> Skills
              </button>
              <button type="button" className="desk-chip" onClick={() => send("scatter")}>
                <Shuffle aria-hidden /> Scatter
              </button>
            </div>
          </aside>
        </div>

        <a href={site.resume} target="_blank" rel="noopener noreferrer" className="pointer-events-auto desk-side-tab">
          <span aria-hidden>●</span> Résumé ↗
        </a>

        <p className="desk-scroll" data-done={zoomed ? "" : undefined}>
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

      {shelfOpen && !reading && (
        <div className="desk-reader desk-glass" role="group" aria-label="Project shelf">
          <p className="desk-reader__count">
            Projects {String(projects.length).padStart(2, "0")}
          </p>
          <p className="desk-reader__title">Pick a book off the shelf</p>
          <div className="desk-reader__actions">
            {projects.map((p, i) => (
              <button key={p.slug} type="button" className="desk-chip" aria-label={`Open ${p.title}`} onClick={() => setOpenProject(i)}>
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
            <button type="button" className="desk-chip" onClick={closeShelf}>
              <ArrowLeft aria-hidden /> Desk
            </button>
          </div>
        </div>
      )}

      {(sheet === "open" || sheet === "closing") && (
        <WorkRecord
          origin={sheetOrigin}
          landed={sheetRects.landed}
          reading={sheetRects.reading}
          closing={sheet === "closing"}
          reduced={reduce}
          onOut={(out) => paperBridge.current?.setOut(out)}
          onClose={closeExperience}
          onExited={experienceExited}
        />
      )}

      {tankOpen && (
        <FieldGuide
          active={activeSkill}
          hovered={hoverSkill}
          hidden={reading !== null}
          onSelect={setActiveSkill}
          onHover={setHoverSkill}
          onOpenProject={setOpenProject}
          onClose={closeTank}
        />
      )}

      {boothOpen && <Photobooth onClose={closeBooth} />}
    </section>
  );
}

/*
 * The field guide: every skill at a glance, grouped by layer, beside the tank.
 * Rows and fish point at each other: hovering either tags the fish, picking a
 * row brings that fish to the front glass and lists the projects it swims through.
 */
function FieldGuide({
  active,
  hovered,
  hidden,
  onSelect,
  onHover,
  onOpenProject,
  onClose,
}: {
  active: number | null;
  hovered: number | null;
  hidden: boolean;
  onSelect: (i: number | null) => void;
  onHover: (i: number | null) => void;
  onOpenProject: (i: number) => void;
  onClose: () => void;
}) {
  /* no scrollbar: the list fades out at whichever edge still has more to show */
  const { ref: listRef, onScroll, fade, more } = useScrollFade<HTMLDivElement>();

  return (
    <section className="desk-tank desk-glass" data-hidden={hidden ? "" : undefined} aria-labelledby="desk-tank-title">
      <div className="desk-tank__head">
        <h2 id="desk-tank-title" className="desk-tank__title">Skills</h2>
        <button type="button" className="desk-chip" onClick={onClose}>
          <ArrowLeft aria-hidden /> Desk
        </button>
      </div>

      <div
        ref={listRef}
        className="desk-tank__scroll scroll-fade"
        {...fade}
        onScroll={onScroll}
        data-lenis-prevent
      >
        {skillGroups.map((group) => (
          <div key={group} className="desk-tank__group">
            <h3 className="desk-tank__group-name">{group}</h3>
            <ul className="desk-tank__list">
              {skills.map((s, i) => {
                if (s.group !== group) return null;
                const sp = speciesOf(s.name);
                const open = active === i;
                const n = s.projects.length;
                return (
                  <li key={s.name} data-open={open ? "" : undefined}>
                    <button
                      type="button"
                      className="desk-tank__row"
                      aria-expanded={n > 0 ? open : undefined}
                      data-hover={hovered === i ? "" : undefined}
                      onClick={() => onSelect(open ? null : i)}
                      onPointerEnter={() => onHover(i)}
                      onPointerLeave={() => onHover(null)}
                      onFocus={() => onHover(i)}
                      onBlur={() => onHover(null)}
                    >
                      <span className="desk-tank__swatch" style={{ "--fish": sp.side, "--fin": sp.fin } as CSSProperties} aria-hidden />
                      <Image src={s.icon} alt="" width={22} height={22} className="desk-tank__icon" />
                      <span className="desk-tank__name">{s.name}</span>
                      <span className="desk-tank__uses" aria-label={`Used in ${n} of ${projects.length} projects`}>
                        {projects.map((_, k) => (
                          <span key={k} data-on={k < n ? "" : undefined} />
                        ))}
                      </span>
                    </button>
                    {open && n > 0 && (
                      <ul className="desk-tank__detail">
                        {s.projects.map((p) => (
                          <li key={p}>
                            <button type="button" className="desk-tank__project" onClick={() => onOpenProject(p)}>
                              {projects[p].title} <ArrowUpRight aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {more && <ChevronDown className="desk-tank__more" aria-hidden />}
    </section>
  );
}
