"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/lib/content";
import { charForSlot, SHARK_BODY } from "@/lib/jeanneSharkShape";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HERO_NAME = "Jeanne";
const LETTER_COUNT = SHARK_BODY.length;

type LetterEl = HTMLSpanElement;

function getReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeReduced() {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fn = () => {};
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
}

export function JeanneSharkHero() {
  const reducedMotion = useSyncExternalStore(subscribeReduced, getReducedMotion, () => false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(LetterEl | null)[]>([]);
  const pointer = useRef({ x: 0, y: 0, active: false });
  const swim = useRef({ x: 0, y: 0, rot: 0 });
  const raf = useRef(0);
  const swimMixRef = useRef(0);

  const slots = useMemo(
    () =>
      Array.from({ length: LETTER_COUNT }, (_, i) => ({
        char: charForSlot(i),
      })),
    [],
  );

  useGSAP(
    () => {
      const pin = pinRef.current;
      const stage = stageRef.current;
      const measure = measureRef.current;
      if (!pin || !stage || !measure) return;

      const letters = letterRefs.current.filter(Boolean) as LetterEl[];
      if (letters.length !== LETTER_COUNT) return;

      if (reducedMotion) return;

      const stageRect = () => stage.getBoundingClientRect();

      const layoutHome = () => {
        const anchors = measure.querySelectorAll<HTMLElement>("[data-measure-char]");
        letters.forEach((el, i) => {
          if (i < HERO_NAME.length) {
            const anchor = anchors[i];
            if (!anchor) return;
            const r = anchor.getBoundingClientRect();
            const sr = stageRect();
            el.dataset.baseX = String(r.left + r.width / 2 - sr.left);
            el.dataset.baseY = String(r.top + r.height / 2 - sr.top);
          } else {
            const anchor = anchors[2] ?? anchors[0];
            if (!anchor) return;
            const r = anchor.getBoundingClientRect();
            const sr = stageRect();
            el.dataset.baseX = String(r.left + r.width / 2 - sr.left);
            el.dataset.baseY = String(r.top + r.height / 2 - sr.top);
          }
          el.dataset.baseRot = "0";
          el.dataset.baseScale = i < HERO_NAME.length ? "1" : "0.35";
        });
      };

      const setTransform = (
        el: LetterEl,
        x: number,
        y: number,
        rot: number,
        scale: number,
      ) => {
        const base = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}rad) scale(${scale})`;
        el.dataset.baseTransform = base;
        const mix = swimMixRef.current;
        const tailBoost = Number(el.dataset.tailBoost || 0);
        const wiggle =
          Math.sin(Date.now() * 0.004 + Number(el.dataset.wigglePhase || 0)) *
          0.05 *
          mix *
          tailBoost;
        el.style.transform = `${base} translate(${swim.current.x * mix}px, ${swim.current.y * mix}px) rotate(${swim.current.rot * mix + wiggle}rad)`;
      };

      const applyProgress = (p: number) => {
        layoutHome();
        const sr = stageRect();
        const cx = sr.width * 0.54;
        const cy = sr.height * 0.38;
        const spanX = Math.min(sr.width * 0.44, 540);
        const spanY = Math.min(sr.height * 0.3, 300);

        const morph = Math.min(1, Math.max(0, p / 0.58));
        swimMixRef.current = Math.min(1, Math.max(0, (p - 0.42) / 0.58));

        letters.forEach((el, i) => {
          const homeX = Number(el.dataset.baseX || 0);
          const homeY = Number(el.dataset.baseY || 0);
          const homeRot = Number(el.dataset.baseRot || 0);
          const homeScale = Number(el.dataset.baseScale || 1);

          const target = SHARK_BODY[i]!;
          const tx = cx + target.x * spanX;
          const ty = cy - target.y * spanY;

          const eased = morph * morph * (3 - 2 * morph);
          const angle = (i / letters.length) * Math.PI * 2;
          const swirlX = cx + Math.cos(angle + eased * 2) * spanX * 0.14 * (1 - eased);
          const swirlY = cy + Math.sin(angle + eased * 2) * spanY * 0.14 * (1 - eased);

          let x = homeX + (swirlX - homeX) * eased * 0.45;
          let y = homeY + (swirlY - homeY) * eased * 0.45;
          x += (tx - x) * eased;
          y += (ty - y) * eased;

          const rot = homeRot + (target.rot - homeRot) * eased;
          const scale = homeScale + (target.scale - homeScale) * eased;

          const opacity =
            i < HERO_NAME.length ? 1 : Math.min(1, Math.max(0, (eased - 0.12) * 1.35));

          el.style.opacity = String(opacity);
          el.dataset.tailBoost = String(i >= LETTER_COUNT - 10 ? 1.4 : 0.35);
          el.dataset.wigglePhase = String(i * 0.4);

          setTransform(el, x, y, rot, scale);
        });
      };

      const st = ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: "+=130%",
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        onUpdate: (self) => applyProgress(self.progress),
      });

      layoutHome();
      applyProgress(0);

      const ro = new ResizeObserver(() => applyProgress(st.progress));
      ro.observe(measure);

      const tick = () => {
        const mix = swimMixRef.current;
        if (mix > 0.05 && pointer.current.active) {
          const sr = stageRect();
          const targetX = pointer.current.x - sr.width * 0.52;
          const targetY = pointer.current.y - sr.height * 0.48;
          swim.current.x += (targetX - swim.current.x) * 0.065;
          swim.current.y += (targetY - swim.current.y) * 0.065;
          swim.current.rot += (targetX * 0.0001 - swim.current.rot) * 0.09;
        } else {
          swim.current.x *= 0.9;
          swim.current.y *= 0.9;
          swim.current.rot *= 0.88;
        }

        letters.forEach((el) => {
          const base = el.dataset.baseTransform;
          if (!base) return;
          const tailBoost = Number(el.dataset.tailBoost || 0);
          const wiggle =
            Math.sin(Date.now() * 0.004 + Number(el.dataset.wigglePhase || 0)) *
            0.05 *
            mix *
            tailBoost;
          el.style.transform = `${base} translate(${swim.current.x * mix}px, ${swim.current.y * mix}px) rotate(${swim.current.rot * mix + wiggle}rad)`;
        });

        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);

      const onMove = (e: PointerEvent) => {
        const sr = stageRect();
        pointer.current.x = e.clientX - sr.left;
        pointer.current.y = e.clientY - sr.top;
        pointer.current.active = true;
      };
      const onLeave = () => {
        pointer.current.active = false;
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("blur", onLeave);

      return () => {
        cancelAnimationFrame(raf.current);
        ro.disconnect();
        st.kill();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("blur", onLeave);
      };
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  if (reducedMotion) {
    return (
      <div className="section-pad flex min-h-[100dvh] flex-col justify-end pb-16 pt-28 md:pb-24 md:pt-32">
        <p className="meta-type mb-6 max-w-[20rem] text-ember">Portfolio / 2026</p>
        <h1 id="opening-name" className="display-type mb-2 max-w-[14ch] text-bone">
          Jeanne
        </h1>
        <p className="title-type m-0 mb-8 text-bone-soft">Dominique Paloma</p>
        <p className="m-0 max-w-[36ch] text-lg text-bone-soft md:text-xl">{site.role}</p>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      <div ref={pinRef} className="relative h-[220vh]">
        <div className="sticky top-0 flex min-h-[100dvh] flex-col justify-end overflow-hidden pb-16 pt-28 md:pb-24 md:pt-32">
          <p className="meta-type relative z-20 mb-6 max-w-[20rem] text-ember">
            Portfolio / 2026
          </p>

          <div className="relative z-20 mb-6 min-h-[clamp(4rem,14vw,9rem)]">
            <h1 id="opening-name" className="sr-only">
              {site.name}
            </h1>
            <div
              ref={measureRef}
              className="display-type pointer-events-none inline-block text-bone opacity-0"
              aria-hidden="true"
            >
              {HERO_NAME.split("").map((c, i) => (
                <span key={`m-${c}-${i}`} data-measure-char className="inline-block">
                  {c}
                </span>
              ))}
            </div>
            <p className="title-type relative z-10 mt-2 m-0 text-bone-soft" aria-hidden="true">
              Dominique Paloma
            </p>
          </div>

          <div ref={stageRef} className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
            {slots.map((slot, i) => (
              <span
                key={`${slot.char}-${i}`}
                ref={(el) => {
                  letterRefs.current[i] = el;
                }}
                className="absolute left-0 top-0 select-none font-semibold text-bone will-change-transform"
                style={{
                  fontSize: "clamp(2.75rem, 9vw, 6.5rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.05em",
                  fontVariationSettings: '"opsz" 96, "wdth" 92, "wght" 700',
                  color: i % 5 === 0 ? "var(--ember)" : undefined,
                }}
              >
                {slot.char}
              </span>
            ))}
          </div>

          <div className="relative z-20 mt-auto flex max-w-3xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p id="opening-role" className="m-0 max-w-[36ch] text-lg text-bone-soft md:text-xl">
              {site.role}
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <a href="#experience" className="magnetic-link meta-type text-bone">
                Experience
              </a>
              <a href="#work" className="magnetic-link meta-type text-bone">
                Selected work
              </a>
              <a href="#contact" className="magnetic-link meta-type text-ember">
                Contact
              </a>
            </div>
          </div>

          <p className="meta-type relative z-20 mt-8 text-bone-soft">
            Scroll — Jeanne swirls into a land shark
          </p>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-[var(--line)]"
          />
        </div>
      </div>
    </div>
  );
}
