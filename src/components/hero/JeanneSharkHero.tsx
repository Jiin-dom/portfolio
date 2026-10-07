"use client";

import { useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/lib/content";
import { JEANNE_CHARS, JEFF_POSE } from "@/lib/jeanneSharkShape";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HERO_NAME = "Jeanne";

function StaticOpening() {
  return (
    <div className="section-pad flex min-h-[100dvh] flex-col justify-end pb-16 pt-28 md:pb-24 md:pt-32">
      <p className="meta-type mb-6 max-w-[20rem] text-ember">Portfolio / 2026</p>
      <h1 id="opening-name" className="display-type mb-2 max-w-[14ch] text-bone">
        Jeanne
      </h1>
      <p className="title-type m-0 mb-8 text-bone-soft">Dominique Paloma</p>
      <div className="flex max-w-3xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
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
    </div>
  );
}

export function JeanneSharkHero() {
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const reducedMotion = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  if (!ready || reducedMotion) return <StaticOpening />;
  return <JeanneSharkStage />;
}

function JeanneSharkStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const flockRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pointer = useRef({ x: 0, y: 0, active: false });
  const flockPos = useRef({ x: 0, y: 0, rot: 0, bounce: 0 });
  const restPos = useRef({ x: 0, y: 0 });
  const morphRef = useRef(0);
  const swimMixRef = useRef(0);
  const raf = useRef(0);
  const homeCache = useRef<{ x: number; y: number; size: string }[]>(
    Array.from({ length: 6 }, () => ({ x: 0, y: 0, size: "4rem" })),
  );

  useGSAP(
    () => {
      const pin = pinRef.current;
      const stage = stageRef.current;
      const measure = measureRef.current;
      const flockEl = flockRef.current;
      if (!pin || !stage || !measure || !flockEl) return;

      const letters = letterRefs.current.filter(Boolean) as HTMLSpanElement[];
      if (letters.length !== 6) return;

      const stageRect = () => stage.getBoundingClientRect();

      const layoutHome = () => {
        const anchors = measure.querySelectorAll<HTMLElement>("[data-measure-char]");
        const sr = stageRect();
        letters.forEach((el, i) => {
          const anchor = anchors[i];
          if (!anchor) return;
          const r = anchor.getBoundingClientRect();
          homeCache.current[i] = {
            x: r.left + r.width / 2 - sr.left,
            y: r.top + r.height / 2 - sr.top,
            size: getComputedStyle(anchor).fontSize,
          };
          el.style.fontSize = homeCache.current[i]!.size;
        });
        // Rest flock center = midpoint of the name
        const first = homeCache.current[0]!;
        const last = homeCache.current[5]!;
        restPos.current = {
          x: (first.x + last.x) / 2,
          y: (first.y + last.y) / 2,
        };
        if (flockPos.current.x === 0 && flockPos.current.y === 0) {
          flockPos.current.x = restPos.current.x;
          flockPos.current.y = restPos.current.y;
        }
      };

      const setLetterLocal = (
        el: HTMLSpanElement,
        lx: number,
        ly: number,
        rot: number,
        scaleX: number,
        scaleY: number,
        skewX: number,
        wdth: number,
        wght: number,
      ) => {
        el.style.transform = `translate(${lx}px, ${ly}px) translate(-50%, -50%) rotate(${rot}rad) skewX(${skewX}deg) scale(${scaleX}, ${scaleY})`;
        el.style.fontVariationSettings = `"opsz" 96, "wdth" ${wdth.toFixed(0)}, "wght" ${wght.toFixed(0)}`;
      };

      const applyProgress = (p: number) => {
        layoutHome();
        const morph = Math.min(1, Math.max(0, p / 0.3));
        const eased = morph * morph * (3 - 2 * morph);
        morphRef.current = eased;
        swimMixRef.current = Math.min(1, Math.max(0, (p - 0.25) / 0.45));

        measure.style.opacity = String(Math.max(0, 1 - eased * 1.5));
        measure.style.visibility = eased > 0.92 ? "hidden" : "visible";

        // While morphing, flock stays at name rest; after, chase takes over
        if (eased < 0.98) {
          flockPos.current.x += (restPos.current.x - flockPos.current.x) * 0.2;
          flockPos.current.y += (restPos.current.y - flockPos.current.y) * 0.2;
        }

        const sharkSize = "clamp(3.25rem, 7vw, 5.5rem)";

        letters.forEach((el, i) => {
          const home = homeCache.current[i]!;
          const pose = JEFF_POSE[i]!;

          el.style.fontSize = eased > 0.45 ? sharkSize : home.size;

          // Home is relative to flock origin (so flock translate places the word)
          const homeLocalX = home.x - flockPos.current.x;
          const homeLocalY = home.y - flockPos.current.y;

          // Mid swirl in flock-local space
          const angle = (i / 6) * Math.PI * 2 + eased * 1.5;
          const swirlR = (1 - eased) * 70;
          const swirlX = Math.cos(angle) * swirlR;
          const swirlY = Math.sin(angle) * swirlR * 0.6;

          const lx =
            homeLocalX * (1 - eased) +
            swirlX * eased * (1 - eased) * 2 +
            pose.x * eased;
          const ly =
            homeLocalY * (1 - eased) +
            swirlY * eased * (1 - eased) * 2 +
            pose.y * eased;

          const rot = pose.rot * eased;
          const scaleX = 1 + (pose.scaleX - 1) * eased;
          const scaleY = 1 + (pose.scaleY - 1) * eased;
          const skewX = pose.skewX * eased;
          const wdth = 90 + (pose.wdth - 90) * eased;
          const wght = 600 + (pose.wght - 600) * eased;

          el.style.zIndex = String(pose.z);
          // One fill when morphed so letters fuse into a silhouette (like SHARK posters)
          el.style.color =
            eased > 0.55
              ? "var(--bone)"
              : i === 0 || i === 2
                ? "var(--ember)"
                : "var(--bone)";
          setLetterLocal(el, lx, ly, rot, scaleX, scaleY, skewX, wdth, wght);
        });

        flockEl.style.transform = `translate3d(${flockPos.current.x}px, ${flockPos.current.y}px, 0)`;
      };

      const st = ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: "+=140%",
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
        const sr = stageRect();
        const pad = 140;
        const minX = pad;
        const maxX = sr.width - pad;
        const minY = pad;
        const maxY = sr.height - pad;

        if (mix > 0.05 && pointer.current.active) {
          const tx = Math.min(maxX, Math.max(minX, pointer.current.x));
          const ty = Math.min(maxY, Math.max(minY, pointer.current.y));
          flockPos.current.x += (tx - flockPos.current.x) * 0.08;
          flockPos.current.y += (ty - flockPos.current.y) * 0.08;

          const dx = tx - flockPos.current.x;
          const dy = ty - flockPos.current.y;
          const facing = Math.atan2(dy, dx);
          flockPos.current.rot += (facing * 0.18 - flockPos.current.rot) * 0.1;

          const speed = Math.hypot(dx, dy);
          const bounceTarget = Math.sin(performance.now() * 0.015) * Math.min(14, speed * 0.08);
          flockPos.current.bounce += (bounceTarget - flockPos.current.bounce) * 0.2;
        } else if (mix <= 0.05) {
          flockPos.current.x += (restPos.current.x - flockPos.current.x) * 0.1;
          flockPos.current.y += (restPos.current.y - flockPos.current.y) * 0.1;
          flockPos.current.rot *= 0.85;
          flockPos.current.bounce *= 0.85;
        } else {
          flockPos.current.rot *= 0.9;
          flockPos.current.bounce *= 0.85;
        }

        flockEl.style.transform = `translate3d(${flockPos.current.x}px, ${flockPos.current.y + flockPos.current.bounce * mix}px, 0) rotate(${flockPos.current.rot * mix}rad)`;

        // Waddle legs + wag tail on top of settled pose
        if (morphRef.current > 0.85 && mix > 0.1) {
          const t = performance.now();
          letters.forEach((el, i) => {
            const pose = JEFF_POSE[i]!;
            const lx = pose.x;
            let ly = pose.y;
            let rot = pose.rot;
            if (i === 5) {
              rot += Math.sin(t * 0.012) * 0.2 * mix;
            } else if (i === 3 || i === 4) {
              ly += Math.sin(t * 0.015 + (i === 3 ? 0 : Math.PI)) * 7 * mix;
            }
            setLetterLocal(
              el,
              lx,
              ly,
              rot,
              pose.scaleX,
              pose.scaleY,
              pose.skewX,
              pose.wdth,
              pose.wght,
            );
          });
        }

        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);

      const onMove = (e: PointerEvent) => {
        const sr = stageRect();
        pointer.current.x = e.clientX - sr.left;
        pointer.current.y = e.clientY - sr.top;
        pointer.current.active = true;
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("blur", () => {
        pointer.current.active = false;
      });

      return () => {
        cancelAnimationFrame(raf.current);
        ro.disconnect();
        st.kill();
        window.removeEventListener("pointermove", onMove);
      };
    },
    { scope: rootRef },
  );

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
              className="display-type pointer-events-none inline-block text-bone"
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
            {/* Flock origin at 0,0 — letters use local offsets; flock translates to follow cursor */}
            <div ref={flockRef} className="absolute left-0 top-0 will-change-transform">
              {JEANNE_CHARS.map((char, i) => (
                <span
                  key={`${char}-${i}`}
                  ref={(el) => {
                    letterRefs.current[i] = el;
                  }}
                  className="absolute left-0 top-0 select-none font-semibold leading-none text-bone will-change-transform"
                  style={{
                    letterSpacing: "-0.06em",
                    fontVariationSettings: '"opsz" 96, "wdth" 90, "wght" 600',
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
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
            Scroll — Jeanne becomes a land shark
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
