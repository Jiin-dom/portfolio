"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Briefcase, Fish, Flashlight, LayoutGrid, Moon, MousePointer2, Shuffle, Sun, X } from "lucide-react";
import { experience, projects, site } from "@/lib/content";
import { projectSkills, skillGroups, skills } from "@/lib/skills";
import { speciesOf } from "@/components/hero/desk/species";
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

const NONE: readonly number[] = [];

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
  const [load, setLoad] = useState(8);
  const [showLoader, setShowLoader] = useState(true);
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
  const [viewBeforeTank, setViewBeforeTank] = useState<ViewName>("top");
  const tankTrigger = useRef<HTMLButtonElement>(null);
  /* a book in hand calls its fish to the front glass */
  const handProject = openProject ?? hoverProject;
  const featuredSkills = useMemo(() => (handProject === null ? NONE : projectSkills[handProject]), [handProject]);
  const [experienceState, setExperienceState] = useState<"closed" | "extracting" | "open" | "returning">("closed");
  const [experienceOrigin, setExperienceOrigin] = useState({ x: 0, y: 0 });
  const experienceScreen = useRef<HTMLElement>(null);
  const experienceTrigger = useRef<HTMLButtonElement>(null);
  const focusReturn = useRef<HTMLElement | null>(null);

  const experienceActive = experienceState !== "closed";
  const experienceExtracting = experienceState === "extracting" || experienceState === "open";

  const openExperience = useCallback((origin?: { x: number; y: number }) => {
    const active = document.activeElement;
    focusReturn.current = active instanceof HTMLElement && active !== document.body ? active : experienceTrigger.current;
    const bounds = root.current?.getBoundingClientRect();
    setExperienceOrigin({
      x: origin && bounds ? origin.x - bounds.left : (bounds?.width ?? 0) / 2,
      y: origin && bounds ? origin.y - bounds.top : (bounds?.height ?? 0) / 2,
    });
    setOpenProject(null);
    setExperienceState("extracting");
  }, []);

  const experienceExtracted = useCallback(() => {
    setExperienceState((state) => state === "extracting" ? "open" : state);
  }, []);

  const experienceReturned = useCallback(() => {
    setExperienceState((state) => state === "returning" ? "closed" : state);
  }, []);

  const closeExperience = useCallback(() => {
    setExperienceState((state) => state === "closed" || state === "returning" ? state : "returning");
  }, []);

  useEffect(() => {
    if (!experienceActive) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeExperience();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      focusReturn.current?.focus();
    };
  }, [experienceActive, closeExperience]);

  useEffect(() => {
    if (experienceState !== "open") return;
    experienceScreen.current?.querySelector<HTMLElement>("button, a[href]")?.focus();
  }, [experienceState]);

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
    if (view !== "tank") setViewBeforeTank(view);
    setView("tank");
  }, [closeExperience, view]);

  const closeTank = useCallback(() => {
    setActiveSkill(null);
    setHoverSkill(null);
    setView(viewBeforeTank);
    tankTrigger.current?.focus();
  }, [viewBeforeTank]);

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

  /* the Skills nav link, and a #skills deep link, fly straight to the tank */
  useEffect(() => {
    const go = () => {
      root.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      openTank();
    };
    window.addEventListener("desk:skills", go);
    return () => window.removeEventListener("desk:skills", go);
  }, [openTank, reduce]);

  useEffect(() => {
    if (ready && window.location.hash === "#skills") window.dispatchEvent(new Event("desk:skills"));
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

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => setShowLoader(false), 700);
    return () => window.clearTimeout(t);
  }, [ready]);
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
          experienceActive={experienceActive}
          experienceExtracting={experienceExtracting}
          onOpenExperience={openExperience}
          onExperienceExtracted={experienceExtracted}
          onExperienceReturned={experienceReturned}
          onCloseExperience={closeExperience}
          onHoverProject={setHoverProject}
          skills={skills}
          activeSkill={activeSkill}
          featuredSkills={featuredSkills}
          labelledSkill={hoverSkill ?? activeSkill}
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

      {showLoader ? (
        <div className="desk-loader" data-lenis-prevent data-ready={ready ? "" : undefined} aria-busy={!ready} aria-live="polite">
          <p className="desk-loader__kicker">{site.shortName}</p>
          <p className="desk-loader__mark">The desk</p>
          <div className="desk-loader__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(load)} aria-label="Loading the desk">
            <span style={{ width: `${ready ? 100 : load}%` }} />
          </div>
        </div>
      ) : null}

      {/* ── Type + UI, layered over the desk like print on a photo ── */}
      <div className="desk-ui pointer-events-none absolute inset-0 z-20" data-reading={reading || experienceActive || tankOpen ? "" : undefined}>
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

        {/* desktop: each child is placed on its own; phones stack them into one bottom dock */}
        <div className="desk-dock">
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
            <hr className="dot-rule" />
            <p className="desk-card__body">
              Everything on this desk moves. Drag it, hold + scroll to rotate, double-click to turn.
            </p>
            <div className="desk-card__actions pointer-events-auto mt-4 flex flex-wrap justify-end gap-2">
              <a href="#features" className="desk-chip desk-chip--explore">
                <ArrowDown aria-hidden /> Explore
              </a>
              <button type="button" className="desk-chip" onClick={() => send("tidy")}>
                <LayoutGrid aria-hidden /> Tidy
              </button>
              <button ref={experienceTrigger} type="button" className="desk-chip" onClick={(event) => openExperience({ x: event.clientX, y: event.clientY })}>
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

      {(experienceState === "open" || experienceState === "returning") && (
        <section
          ref={experienceScreen}
          className="desk-experience"
          data-state={experienceState}
          style={{ "--paper-origin-x": `${experienceOrigin.x}px`, "--paper-origin-y": `${experienceOrigin.y}px` } as CSSProperties}
          aria-labelledby="desk-experience-title"
        >
          <div className="desk-experience__head">
            <p className="desk-reader__count">Work record · {String(experience.length).padStart(2, "0")}</p>
            <button type="button" className="desk-chip" onClick={closeExperience}>
              <ArrowLeft aria-hidden /> Back to desk
            </button>
          </div>
          <div className="desk-experience__content">
            <h2 id="desk-experience-title" className="desk-experience__title">Experience</h2>
            <ol className="desk-experience__list">
              {experience.map((item) => (
                <li key={`${item.title}-${item.year}`} className="desk-experience__entry">
                  <p className="desk-experience__date">{item.year}</p>
                  <h3>{item.title}</h3>
                  <p className="desk-experience__place">{item.place}</p>
                </li>
              ))}
            </ol>
            <a className="desk-chip desk-experience__resume" href={site.resume} target="_blank" rel="noopener noreferrer">
              Résumé <ArrowUpRight aria-hidden />
            </a>
          </div>
        </section>
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
  return (
    <section className="desk-tank desk-glass" data-hidden={hidden ? "" : undefined} aria-labelledby="desk-tank-title" data-lenis-prevent>
      <div className="desk-tank__head">
        <p className="desk-tank__kicker">Field guide · {String(skills.length).padStart(2, "0")} species</p>
        <button type="button" className="desk-chip" onClick={onClose}>
          <ArrowLeft aria-hidden /> Desk
        </button>
      </div>
      <h2 id="desk-tank-title" className="desk-tank__title">The stack, alive</h2>
      <p className="desk-tank__lede">Each fish is a tool I build with. Pick one to see the projects it swims through.</p>

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
                    aria-expanded={open}
                    data-hover={hovered === i ? "" : undefined}
                    onClick={() => onSelect(open ? null : i)}
                    onPointerEnter={() => onHover(i)}
                    onPointerLeave={() => onHover(null)}
                    onFocus={() => onHover(i)}
                    onBlur={() => onHover(null)}
                  >
                    <span className="desk-tank__swatch" style={{ "--fish": sp.side, "--fin": sp.fin } as CSSProperties} aria-hidden />
                    <Image src={s.icon} alt="" width={22} height={22} className="desk-tank__icon" />
                    <span className="desk-tank__name">
                      {s.name}
                      <span className="desk-tank__species">{sp.common}</span>
                    </span>
                    <span className="desk-tank__uses" aria-label={`Used in ${n} of ${projects.length} projects`}>
                      {projects.map((_, k) => (
                        <span key={k} data-on={k < n ? "" : undefined} />
                      ))}
                    </span>
                  </button>
                  {open && (
                    <div className="desk-tank__detail">
                      {n === 0 ? (
                        <p>No project on the shelf uses it yet.</p>
                      ) : (
                        <>
                          <p>
                            Swims through {n} of {projects.length} projects:
                          </p>
                          <ul>
                            {s.projects.map((p) => (
                              <li key={p}>
                                <button type="button" className="desk-tank__project" onClick={() => onOpenProject(p)}>
                                  {projects[p].title} <ArrowUpRight aria-hidden />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
