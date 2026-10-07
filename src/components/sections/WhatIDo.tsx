"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import { capabilities } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

export function WhatIDo() {
  const root = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !root.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".practice-card");
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cards[cards.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.94,
          opacity: 0.45,
          ease: "none",
          scrollTrigger: {
            trigger: cards[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={root} className="relative" aria-label="Practice">
      {capabilities.map((item) => (
        <div
          key={item}
          className="practice-card sticky top-0 flex min-h-[100dvh] items-center justify-center bg-paper px-[var(--page-pad)]"
        >
          <div className="section-inner w-full rounded-[var(--radius-media)] border border-line bg-mist px-6 py-16 shadow-[0_30px_80px_var(--shadow)] md:px-16 md:py-24">
            <p className="display text-center text-[clamp(3.5rem,14vw,9rem)] text-ink">{item}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
