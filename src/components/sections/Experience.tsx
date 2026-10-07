"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RevealLine } from "@/components/type/RevealLine";
import { experience } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const Letterfield = dynamic(
  () =>
    import("@/components/three/Letterfield").then((m) => m.Letterfield),
  { ssr: false, loading: () => <div className="h-[min(42vw,22rem)] border border-[var(--line)] bg-panel" /> },
);

function ScrambleYear({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.textContent = text;
      return;
    }

    const glyphs = "0123456789—–- ";
    let frame = 0;
    let raf = 0;
    const frames = 28;

    const tick = () => {
      frame += 1;
      const progress = frame / frames;
      el.textContent = text
        .split("")
        .map((ch, i) => {
          if (ch === " " || progress > i / text.length + 0.2) return ch;
          return glyphs[Math.floor(Math.random() * glyphs.length)]!;
        })
        .join("");
      if (frame < frames) raf = requestAnimationFrame(tick);
      else el.textContent = text;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          frame = 0;
          raf = requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [text]);

  return (
    <span ref={ref} className="meta-type text-ember">
      {text}
    </span>
  );
}

export function Experience() {
  const entry = experience[0];

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="section-pad relative"
    >
      <p className="meta-type mb-10">01 — Experience</p>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
        <div>
          <RevealLine>
            <p className="mb-4">
              <ScrambleYear text={entry.year} />
            </p>
          </RevealLine>
          <RevealLine delay={0.08}>
            <h2 id="experience-heading" className="display-type-sm m-0 max-w-[12ch] text-bone">
              {entry.title}
            </h2>
          </RevealLine>
          <RevealLine delay={0.16}>
            <p className="title-type mt-6 m-0 text-ember">{entry.place}</p>
          </RevealLine>
          <RevealLine delay={0.24}>
            <p className="mt-8 max-w-[38ch] text-bone-soft">
              One role, set at display scale — no filler entries.
            </p>
          </RevealLine>
        </div>

        <Letterfield years={entry.year} label="Tenure as type" />
      </div>
    </section>
  );
}
