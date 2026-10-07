"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import { DeskScene } from "@/components/scene/DeskScene";
import { featurePanels } from "@/lib/chapters";
import { techStack } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

export function FeaturesChapter() {
  const root = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !root.current) return;

    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray<HTMLElement>(".feature-step");
      steps.forEach((step, i) => {
        if (i === steps.length - 1) return;
        ScrollTrigger.create({
          trigger: step,
          start: "top top",
          endTrigger: steps[steps.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(step.querySelector(".feature-glass"), {
          opacity: 0.2,
          y: -28,
          ease: "none",
          scrollTrigger: {
            trigger: steps[i + 1],
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
    <section id="features" ref={root} className="relative bg-desk text-cream" aria-label="Features">
      <div className="sticky top-0 z-0 h-[100dvh] -mb-[100dvh]">
        <DeskScene mode="features" />
        <div className="absolute inset-0 bg-ink/40" />
      </div>

      <div className="relative z-10">
        <div className="section-pad flex min-h-[80vh] items-end pb-16 pt-28">
          <div className="section-inner max-w-3xl">
            <h2 className="display text-[clamp(2.6rem,8vw,5.5rem)] text-cream">
              isn&apos;t just a portfolio.
            </h2>
            <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-cream/80">
              It&apos;s the result of shipping real product surfaces — from React frontends to Spring
              Boot services — where experience and architecture move together.
            </p>
          </div>
        </div>

        {featurePanels.map((panel, index) => (
          <div
            key={panel.title}
            className="feature-step sticky top-0 flex min-h-[100dvh] items-stretch section-pad py-16"
          >
            <div className="feature-glass glass-dark flex w-full max-w-md flex-col justify-between rounded-sm p-7 md:p-9">
              <div>
                <p className="mono-label text-cream">{panel.kicker}</p>
                <hr className="dot-rule text-cream" />
                <p className="text-sm leading-relaxed text-cream/80">{panel.body}</p>
              </div>
              <div className="mt-10">
                <h3 className="display text-[clamp(1.7rem,3.5vw,2.6rem)] uppercase text-cream">
                  {panel.title}
                </h3>
                <p className="mt-4 font-mono text-xs tracking-wide text-cream/60">{panel.aside}</p>
                {index === 1 ? (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {techStack.slice(0, 6).map((tech) => (
                      <li
                        key={tech.name}
                        className="rounded-full border border-cream/20 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-cream/80"
                      >
                        {tech.name}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
