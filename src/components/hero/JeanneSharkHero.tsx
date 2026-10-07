"use client";

import { useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/lib/content";
import { JEANNE_CHARS, JEFF_POSE } from "@/lib/jeanneSharkShape";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HERO_NAME = "Jeanne";

function subscribeClientReady() {
  return () => {};
}

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
  const ready = useSyncExternalStore(subscribeClientReady, () => true, () => false);
  const reducedMotion = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  if (!ready || reducedMotion) {
    return <StaticOpening />;
  }

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
  const flock = useRef({ x: 0, y: 0, rot: 0, bounce: 0 });
  const swimMixRef = useRef(0);
  const raf = useRef(0);
  const letterBases = useRef<string[]>(Array(6).fill(""));

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

      type Home = {
        x: number;
        y: number;
        rot: number;
        scaleX: number;
        scaleY: number;
        skewX: number;
        wdth: number;
        wght: number;
      };

      const homes: Home[] = letters.map(() => ({
        x: 0,
        y: 0,
        rot: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        wdth: 90,
        wght: 600,
      }));

      const layoutHome = () => {
        const anchors = measure.querySelectorAll<HTMLElement>("[data-measure-char]");
        const sr = stageRect();
        letters.forEach((el, i) => {
          const anchor = anchors[i];
          if (!anchor) return;
          const r = anchor.getBoundingClientRect();
          homes[i] = {
            x: r.left + r.width / 2 - sr.left,
            y: r.top + r.height / 2 - sr.top,
            rot: 0,
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            wdth: 90,
            wght: 600,
          };
          el.style.fontSize = getComputedStyle(anchor).fontSize;
        });
      };

      const applyProgress = (p: number) => {
        layoutHome();
        const sr = stageRect();
        const cx = sr.width * 0.58;
        const cy = sr.height * 0.38;
        // Compact formation so the chonk silhouette stays on-screen
        const spanX = Math.min(sr.width * 0.28, 300);
        const spanY = Math.min(sr.height * 0.2, 170);

        // Morph finishes early; remainder of pin is swim / chase
        const morph = Math.min(1, Math.max(0, p / 0.32));
        const eased = morph * morph * (3 - 2 * morph);
        swimMixRef.current = Math.min(1, Math.max(0, (p - 0.28) / 0.5));

        measure.style.opacity = String(Math.max(0, 1 - eased * 1.4));
        measure.style.visibility = eased > 0.95 ? "hidden" : "visible";

        letters.forEach((el, i) => {
          const home = homes[i]!;
          const pose = JEFF_POSE[i]!;

          const angle = (i / 6) * Math.PI * 2 + eased * Math.PI;
          const swirlR = (1 - eased) * Math.min(spanX, spanY) * 0.4;
          const swirlX = cx + Math.cos(angle) * swirlR;
          const swirlY = cy + Math.sin(angle) * swirlR * 0.65;

          const tx = cx + pose.x * spanX;
          const ty = cy - pose.y * spanY;

          const x =
            home.x +
            (swirlX - home.x) * Math.min(1, eased * 1.15) * 0.45 +
            (tx - home.x) * eased;
          const y =
            home.y +
            (swirlY - home.y) * Math.min(1, eased * 1.15) * 0.45 +
            (ty - home.y) * eased;

          const rot = home.rot + (pose.rot - home.rot) * eased;
          const scaleX = home.scaleX + (pose.scaleX - home.scaleX) * eased;
          const scaleY = home.scaleY + (pose.scaleY - home.scaleY) * eased;
          const skewX = home.skewX + (pose.skewX - home.skewX) * eased;
          const wdth = home.wdth + (pose.wdth - home.wdth) * eased;
          const wght = home.wght + (pose.wght - home.wght) * eased;

          el.style.zIndex = String(pose.z);
          el.style.opacity = "1";
          el.style.color = i === 0 || i === 2 ? "var(--ember)" : "var(--bone)";

          const base = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}rad) skewX(${skewX}deg) scale(${scaleX}, ${scaleY})`;
          letterBases.current[i] = base;
          el.style.transform = base;
          el.style.fontVariationSettings = `"opsz" 96, "wdth" ${wdth.toFixed(0)}, "wght" ${wght.toFixed(0)}`;
        });
      };

      const st = ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: "+=140%",
        pin: true,
        scrub: 0.55,
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

        if (mix > 0.05 && pointer.current.active) {
          const targetX = pointer.current.x - sr.width * 0.5;
          const targetY = pointer.current.y - sr.height * 0.4;
          flock.current.x += (targetX - flock.current.x) * 0.075;
          flock.current.y += (targetY - flock.current.y) * 0.075;
          const facing = Math.atan2(
            targetY - flock.current.y,
            targetX - flock.current.x,
          );
          flock.current.rot += (facing * 0.12 - flock.current.rot) * 0.09;
        } else {
          flock.current.x *= 0.9;
          flock.current.y *= 0.9;
          flock.current.rot *= 0.88;
        }

        const speed = Math.hypot(
          pointer.current.x - sr.width * 0.5 - flock.current.x,
          pointer.current.y - sr.height * 0.4 - flock.current.y,
        );
        const bounceTarget =
          mix > 0.1 && pointer.current.active
            ? Math.sin(performance.now() * 0.014) * Math.min(12, speed * 0.045)
            : 0;
        flock.current.bounce += (bounceTarget - flock.current.bounce) * 0.18;

        flockEl.style.transform = `translate3d(${flock.current.x * mix}px, ${flock.current.y * mix + flock.current.bounce}px, 0) rotate(${flock.current.rot * mix}rad)`;

        // Tail sway + opposite-phase stubby legs (Jeff waddle)
        const t = performance.now();
        letters.forEach((el, i) => {
          const base = letterBases.current[i];
          if (!base) return;
          let extra = "";
          if (i === 5 && mix > 0.15) {
            const w = Math.sin(t * 0.011) * 0.18 * mix;
            extra = ` rotate(${w}rad)`;
          } else if ((i === 3 || i === 4) && mix > 0.15) {
            const phase = Math.sin(t * 0.014 + (i === 3 ? 0 : Math.PI));
            extra = ` translateY(${phase * 6 * mix}px)`;
          }
          el.style.transform = base + extra;
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
            <div ref={flockRef} className="absolute inset-0 will-change-transform">
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
