"use client";

import { ArrowUpRight, ChevronDown, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { education, experience, site } from "@/lib/content";
import type { SheetOrigin } from "@/components/hero/desk/experience";
import { useScrollFade } from "@/hooks/useScrollFade";

/*
 * The work record, as a real page. It starts exactly over the folder's sheet
 * on screen (same spot, size and angle), lifts to reading size, and on close
 * flies back into the folder. Only this one sheet ever moves, so there is no
 * hand-over to see; the type stays sharp and readable at any size or time of day.
 */

export type SheetRect = { top: number; left: number; width: number; height: number };

/* one continuous page: Experience, then Education below it */
const SECTIONS = [
  { id: "experience", label: "Experience", count: experience.length },
  { id: "education", label: "Education", count: education.length },
] as const;
type Section = (typeof SECTIONS)[number]["id"];

const pad = (n: number) => String(n).padStart(2, "0");

const OPEN_MS = 760;
const CLOSE_MS = 520;
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_IN = "cubic-bezier(0.55, 0, 0.75, 0.2)";

/* the transform that puts a page laid out at `rect` over the folder's sheet */
function fromFolder(origin: SheetOrigin, rect: SheetRect) {
  const dx = origin.cx - (rect.left + rect.width / 2);
  const dy = origin.cy - (rect.top + rect.height / 2);
  return `translate(${dx}px, ${dy}px) rotate(${origin.angle}rad) scale(${origin.width / rect.width}, ${origin.height / rect.height})`;
}

type Props = {
  /* the folder's sheet on screen; null falls back to a plain fade */
  origin: SheetOrigin | null;
  /* the A4 page it lifts to, and where to read it (larger on phones) */
  landed: SheetRect;
  reading: SheetRect;
  closing: boolean;
  reduced: boolean;
  /* hides the folder's own sheet while this page is out */
  onOut: (out: boolean) => void;
  onClose: () => void;
  onExited: () => void;
};

export function WorkRecord({ origin, landed, reading, closing, reduced, onOut, onClose, onExited }: Props) {
  const [section, setSection] = useState<Section>("experience");
  const [settled, setSettled] = useState(false);
  const page = useRef<HTMLDivElement>(null);
  const { ref: bodyRef, onScroll, fade, more } = useScrollFade<HTMLDivElement>();

  /* lift off: swap with the folder's sheet before the first paint, then fly up */
  useLayoutEffect(() => {
    const el = page.current;
    if (!el) return;
    onOut(true);
    const start = origin
      ? [{ transform: fromFolder(origin, landed), boxShadow: "0 2px 6px rgb(12 6 2 / 0.25)" }]
      : [{ opacity: 0, transform: "scale(0.96)" }];
    const flight = el.animate([...start, { transform: "none", boxShadow: "0 30px 80px rgb(12 6 2 / 0.45)", opacity: 1 }], {
      duration: reduced ? 0 : OPEN_MS,
      /* the cover swings open first */
      delay: reduced ? 0 : 140,
      easing: EASE_OUT,
      fill: "backwards",
    });
    flight.onfinish = () => setSettled(true);
    /* focus the page itself: keyboard users tab on from here, and no tab wears a stray ring */
    el.focus({ preventScroll: true });
    return () => flight.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on lift-off
  }, []);

  /* put it back: fold down to the A4 page, then fly into the folder */
  useLayoutEffect(() => {
    const el = page.current;
    if (!closing || !el) return;
    const shrink = settled && (reading.width !== landed.width || reading.height !== landed.height);
    setSettled(false);
    const end = origin ? [{ transform: fromFolder(origin, landed), boxShadow: "0 2px 6px rgb(12 6 2 / 0.25)" }] : [{ opacity: 0 }];
    const back = el.animate([{ transform: "none" }, ...end], {
      duration: reduced ? 0 : CLOSE_MS,
      delay: reduced || !shrink ? 0 : 300,
      easing: EASE_IN,
      fill: "forwards",
    });
    /* show the folder's sheet again, and only drop this page once that frame has drawn */
    back.onfinish = () => {
      onOut(false);
      requestAnimationFrame(() => requestAnimationFrame(onExited));
    };
    return () => back.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, when closing starts
  }, [closing]);

  /* the tabs follow the reading: once Education reaches the upper part of the page, it takes over */
  const sections = useRef<Record<Section, HTMLElement | null>>({ experience: null, education: null });
  const spy = () => {
    onScroll();
    const body = bodyRef.current;
    const edu = sections.current.education;
    if (!body || !edu) return;
    const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 4;
    const reached = edu.offsetTop - body.scrollTop <= body.clientHeight * 0.45;
    setSection(atEnd || reached ? "education" : "experience");
  };

  /* and a tab click scrolls to its section */
  const jump = (id: Section) => {
    const body = bodyRef.current;
    const el = sections.current[id];
    if (!body || !el) return;
    body.scrollTo({ top: id === "experience" ? 0 : el.offsetTop - 4, behavior: reduced ? "auto" : "smooth" });
    setSection(id);
  };

  const rect = settled ? reading : landed;

  return (
    <>
    <div className="desk-sheet-backdrop" data-closing={closing ? "" : undefined} onClick={onClose} aria-hidden />
    <div ref={page} className="desk-sheet" style={rect as CSSProperties} role="dialog" aria-label="Work record" tabIndex={-1}>
      <div className="desk-sheet__head">
        <p className="desk-sheet__kicker">{site.shortName} · Work record</p>
        <button type="button" className="desk-sheet__close" aria-label="Put the record back" onClick={onClose}>
          <X aria-hidden />
        </button>
      </div>

      {/* folder tabs, kept in step with the scroll */}
      <nav className="desk-sheet__tabs" aria-label="Record sections">
        {SECTIONS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-current={section === t.id ? "true" : undefined}
            onClick={() => jump(t.id)}
          >
            {t.label} <span>{pad(t.count)}</span>
          </button>
        ))}
      </nav>

      <div ref={bodyRef} onScroll={spy} {...fade} className="desk-sheet__body scroll-fade" tabIndex={0} data-lenis-prevent>
        <section
          ref={(el) => {
            sections.current.experience = el;
          }}
          aria-labelledby="desk-sheet-experience"
        >
          <div className="desk-sheet__title-row">
            <h2 id="desk-sheet-experience">Experience</h2>
            <span className="desk-sheet__stamp" aria-hidden>
              On file
            </span>
          </div>
          <ol className="desk-sheet__roles">
            {experience.map((role, i) => (
              <li key={`${role.title}-${role.year}`}>
                <span className="desk-sheet__index">{pad(i + 1)}</span>
                <span className="desk-sheet__role-main">
                  <span className="desk-sheet__dates">{role.year}</span>
                  <span className="desk-sheet__role-title">{role.title}</span>
                  <span className="desk-sheet__place">{role.place}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section
          ref={(el) => {
            sections.current.education = el;
          }}
          className="desk-sheet__section"
          aria-labelledby="desk-sheet-education"
        >
          <div className="desk-sheet__title-row">
            <h2 id="desk-sheet-education">Education</h2>
          </div>
          <ol className="desk-sheet__schools">
            {education.map((item) => (
              <li key={`${item.title}-${item.place}`}>
                <span className="desk-sheet__dates">{item.year}</span>
                <span className="desk-sheet__school-title">{item.title}</span>
                <span className="desk-sheet__place">{item.place}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      {more && <ChevronDown className="desk-sheet__more" aria-hidden />}

      <div className="desk-sheet__foot">
        <a href={`mailto:${site.email}`}>{site.email}</a>
        <a className="desk-sheet__resume" href={site.resume} target="_blank" rel="noopener noreferrer">
          Résumé <ArrowUpRight aria-hidden />
        </a>
      </div>
    </div>
    </>
  );
}
