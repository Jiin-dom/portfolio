"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import { ArrowUpRight, Grip } from "lucide-react";
import { CanvasItem } from "@/components/hero/CanvasItem";
import { projects, site, techStack, experience } from "@/lib/content";

const CANVAS = 2800;

export function FreeformCanvas() {
  const reduce = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const measure = () => {
      const el = frameRef.current;
      if (!el) return;
      setViewport({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const constraints = useMemo(() => {
    const left = Math.min(0, viewport.w - CANVAS);
    const top = Math.min(0, viewport.h - CANVAS);
    return { left, right: 0, top, bottom: 0 };
  }, [viewport]);

  useEffect(() => {
    x.set(Math.round((viewport.w - CANVAS) / 2));
    y.set(Math.round((viewport.h - CANVAS) / 2));
  }, [viewport, x, y]);

  const featured = projects.slice(0, 4);

  return (
    <section
      id="intro"
      ref={frameRef}
      className="relative h-[100dvh] overflow-hidden bg-[#efe6d8] text-ink"
      aria-label="Freeform canvas home"
    >
      <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--nav-h)+0.75rem)] z-30 flex justify-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-cream/85 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/70 backdrop-blur-sm">
          <Grip className="h-3.5 w-3.5" aria-hidden />
          Drag to move
        </p>
      </div>

      <a
        href="#features"
        className="pointer-events-auto absolute bottom-6 left-1/2 z-30 -translate-x-1/2 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-ink/55 transition-colors hover:text-ink"
      >
        Scroll for more
      </a>

      <motion.div
        className="absolute left-0 top-0 h-[2800px] w-[2800px] touch-none cursor-grab active:cursor-grabbing"
        style={{ x, y }}
        drag={!reduce}
        dragConstraints={constraints}
        dragElastic={0.04}
        dragMomentum
        dragTransition={{ power: 0.18, timeConstant: 200 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 40% 35%, #f7efe3 0%, #ebe0d0 55%, #e2d4c0 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(28 22 18 / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(28 22 18 / 0.04) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <CanvasItem style={{ left: 980, top: 1080 }} drag={false}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink/65">
            Dominique Paloma
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-[clamp(4.5rem,11vw,9.5rem)] font-semibold uppercase leading-[0.82] tracking-[-0.04em] text-ink">
            Jeanne
          </h1>
        </CanvasItem>

        <CanvasItem style={{ left: 1680, top: 1180 }}>
          <div className="max-w-[240px] rounded-md border border-ink/8 bg-cream/90 p-5 shadow-[0_20px_50px_rgb(28_22_18/0.12)] backdrop-blur-sm">
            <p className="text-sm leading-relaxed text-ink/80">
              Designed to ship interfaces that feel as solid as the systems behind them.
            </p>
          </div>
        </CanvasItem>

        <CanvasItem style={{ left: 720, top: 1480 }}>
          <div className="glass-dark max-w-[260px] rounded-md p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-cream">
              Full-stack · UI / UX
            </p>
            <hr className="dot-rule text-cream" />
            <p className="text-sm leading-relaxed text-cream/80">{site.tagline}</p>
          </div>
        </CanvasItem>

        {featured.map((project, i) => {
          const spots = [
            { left: 420, top: 720, rotate: -8 },
            { left: 1950, top: 780, rotate: 6 },
            { left: 380, top: 1780, rotate: 5 },
            { left: 1900, top: 1700, rotate: -7 },
          ][i]!;
          return (
            <CanvasItem
              key={project.slug}
              style={{ left: spots.left, top: spots.top, rotate: spots.rotate }}
            >
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block w-[240px] rounded-md border border-ink/8 bg-cream p-3 shadow-[0_24px_60px_rgb(28_22_18/0.14)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-desk">
                  <Image
                    src={project.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="240px"
                    draggable={false}
                  />
                </div>
                <div className="mt-3 flex items-start justify-between gap-2 px-0.5">
                  <div>
                    <p className="font-mono text-[0.58rem] uppercase tracking-wider text-ink/45">
                      0{i + 1}
                    </p>
                    <p className="text-sm font-semibold tracking-tight">{project.title}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink/40" aria-hidden />
                </div>
              </a>
            </CanvasItem>
          );
        })}

        <CanvasItem style={{ left: 1180, top: 1680, rotate: -3 }}>
          <div className="flex max-w-[320px] flex-wrap gap-2 rounded-md border border-ink/8 bg-cream/90 p-4 shadow-[0_16px_40px_rgb(28_22_18/0.1)]">
            {techStack.slice(0, 8).map((tech) => (
              <span
                key={tech.name}
                className="rounded-full border border-ink/10 bg-cream px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-ink/75"
              >
                {tech.name}
              </span>
            ))}
          </div>
        </CanvasItem>

        <CanvasItem style={{ left: 2100, top: 1240, rotate: 4 }}>
          <div className="w-[220px] rounded-md border border-ink/10 bg-[#f6f0e6] p-4 shadow-[0_16px_40px_rgb(28_22_18/0.1)]">
            <p className="font-mono text-[0.58rem] uppercase tracking-wider text-ink/45">Experience</p>
            <p className="mt-2 text-base font-semibold">{experience[0].title}</p>
            <p className="text-sm text-ink/65">{experience[0].place}</p>
            <p className="mt-1 font-mono text-[0.62rem] text-ink/45">{experience[0].year}</p>
          </div>
        </CanvasItem>

        <CanvasItem style={{ left: 980, top: 860, rotate: -2 }}>
          <a
            href={`mailto:${site.email}`}
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ink px-5 py-3 text-sm font-semibold text-cream shadow-[0_16px_40px_rgb(28_22_18/0.2)]"
          >
            {site.email}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </CanvasItem>

        <CanvasItem style={{ left: 1500, top: 920 }}>
          <div className="flex gap-2">
            {(
              [
                ["GitHub", site.links.github],
                ["LinkedIn", site.links.linkedin],
                ["YouTube", site.links.youtube],
              ] as const
            ).map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-ink/10 bg-cream px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-wide text-ink/75 shadow-sm transition-colors hover:border-ink/25 hover:text-ink"
              >
                {label}
              </a>
            ))}
          </div>
        </CanvasItem>

        <CanvasItem style={{ left: 2320, top: 980 }} drag={false}>
          <div className="h-28 w-28 rounded-full border-[10px] border-cork bg-[radial-gradient(circle_at_35%_30%,#c9a67a,#a87d52)] shadow-[0_18px_40px_rgb(28_22_18/0.2)]" />
        </CanvasItem>

        <CanvasItem style={{ left: 560, top: 1100, rotate: -12 }}>
          <div className="h-2 w-28 rounded-full bg-signal shadow-sm" />
        </CanvasItem>
      </motion.div>
    </section>
  );
}
