"use client";

import dynamic from "next/dynamic";
import { useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { site } from "@/lib/content";
import {
  JEANNE_HOME,
  JEFF_LETTER_POSE,
  type LetterPose,
} from "@/lib/jeffLetterPose";
import type { SharkDrive } from "@/components/hero/JeffLetterShark3D";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HERO_NAME = "Jeanne";
const CHARS = HERO_NAME.split("");

const JeffLetterShark3D = dynamic(
  () =>
    import("@/components/hero/JeffLetterShark3D").then((m) => m.JeffLetterShark3D),
  { ssr: false },
);

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

function canUseWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
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
  const webgl = useSyncExternalStore(
    () => () => {},
    canUseWebGL,
    () => false,
  );

  if (!ready || reducedMotion) return <StaticOpening />;
  return <JeanneSharkStage use3D={webgl} />;
}

function poseToStyle(pose: LetterPose, unit: number) {
  return {
    transform: `translate(${pose.x * unit}px, ${-pose.y * unit}px) rotate(${pose.rot}deg) scale(${pose.scale})`,
  };
}

function JeanneSharkStage({ use3D }: { use3D: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const drive = useRef<SharkDrive>({
    morph: 0,
    pointer: { x: 0, y: 0, active: false },
    swim: 0,
  });

  useGSAP(
    () => {
      const pin = pinRef.current;
      const stage = stageRef.current;
      const measure = measureRef.current;
      if (!pin || !stage || !measure) return;

      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const easeInOut = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const applyProgress = (p: number) => {
        const morphT = Math.min(1, Math.max(0, p / 0.32));
        const morph = easeInOut(morphT);
        drive.current.morph = morph;
        drive.current.swim = Math.min(1, Math.max(0, (p - 0.28) / 0.45));

        const fade = easeOut(Math.min(1, morph * 1.4));
        measure.style.opacity = String(Math.max(0, 1 - fade));
        measure.style.visibility = fade > 0.92 ? "hidden" : "visible";
        const sub = measure.parentElement?.querySelector<HTMLElement>("[data-measure-sub]");
        if (sub) {
          sub.style.opacity = String(Math.max(0, 1 - fade));
          sub.style.visibility = fade > 0.92 ? "hidden" : "visible";
        }
        if (canvasHostRef.current) {
          const show = Math.min(1, Math.max(0, (morph - 0.08) / 0.22));
          canvasHostRef.current.style.opacity = String(show);
          canvasHostRef.current.style.visibility = show < 0.02 ? "hidden" : "visible";
        }

        // DOM fallback letters (also used under 3D as progressive enhancement base)
        if (!use3D) {
          const unit = Math.min(stage.getBoundingClientRect().width, 900) * 0.11;
          letterRefs.current.forEach((el, i) => {
            if (!el) return;
            const home = JEANNE_HOME[i]!;
            const shark = JEFF_LETTER_POSE[i]!;
            const pose: LetterPose = {
              char: home.char,
              x: home.x + (shark.x - home.x) * morph,
              y: home.y + (shark.y - home.y) * morph,
              z: 0,
              rot: home.rot + (shark.rot - home.rot) * morph,
              rotY: 0,
              scale: home.scale + (shark.scale - home.scale) * morph,
            };
            Object.assign(el.style, {
              ...poseToStyle(pose, unit),
              fontSize: `${Math.max(28, unit * 0.95)}px`,
              opacity: "1",
              color: "var(--bone)",
            });
          });
        }
      };

      const st = ScrollTrigger.create({
        trigger: pin,
        start: "top top",
        end: "+=150%",
        pin: true,
        scrub: 0.55,
        anticipatePin: 1,
        onUpdate: (self) => applyProgress(self.progress),
      });

      applyProgress(0);

      const onMove = (e: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        // NDC-ish → scene units
        drive.current.pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 5.5;
        drive.current.pointer.y = -((e.clientY - r.top) / r.height - 0.5) * 3.2;
        drive.current.pointer.active = true;
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("blur", () => {
        drive.current.pointer.active = false;
      });

      return () => {
        st.kill();
        window.removeEventListener("pointermove", onMove);
      };
    },
    { scope: rootRef, dependencies: [use3D] },
  );

  return (
    <div ref={rootRef}>
      <div ref={pinRef} className="relative h-[230vh]">
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
              {CHARS.map((c, i) => (
                <span key={`m-${c}-${i}`} className="inline-block">
                  {c}
                </span>
              ))}
            </div>
            <p
              data-measure-sub
              className="title-type relative z-10 mt-2 m-0 text-bone-soft"
              aria-hidden="true"
            >
              Dominique Paloma
            </p>
          </div>

          <div
            ref={stageRef}
            className="pointer-events-none absolute inset-0 z-30"
            aria-hidden="true"
          >
            {use3D ? (
              <div
                ref={canvasHostRef}
                className="absolute inset-0"
                style={{ opacity: 0, visibility: "hidden" }}
              >
                <JeffLetterShark3D drive={drive} active />
              </div>
            ) : (
              <div
                ref={fallbackRef}
                className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2"
                style={{ filter: "url(#jeff-goo)" }}
              >
                {CHARS.map((char, i) => (
                  <span
                    key={`${char}-${i}`}
                    ref={(el) => {
                      letterRefs.current[i] = el;
                    }}
                    className="absolute left-0 top-0 origin-center select-none font-semibold leading-none text-bone will-change-transform"
                    style={{
                      letterSpacing: "-0.06em",
                      fontVariationSettings: '"opsz" 96, "wdth" 95, "wght" 800',
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Gooey filter for DOM fallback — fuses letters into one silhouette mass */}
          <svg width="0" height="0" className="absolute" aria-hidden="true">
            <defs>
              <filter id="jeff-goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
                  result="goo"
                />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
              </filter>
            </defs>
          </svg>

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
        </div>
      </div>
    </div>
  );
}
