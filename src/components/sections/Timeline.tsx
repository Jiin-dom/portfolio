"use client";

import { Reveal } from "@/components/motion/Reveal";
import { education, experience } from "@/lib/content";

export function Timeline() {
  return (
    <section className="section-pad py-24 md:py-32" aria-label="Education and experience">
      <div className="section-inner space-y-16">
        <Reveal>
          <h2 className="display text-[clamp(2.2rem,5vw,3.6rem)]">Path so far</h2>
        </Reveal>

        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <p className="mono-label mb-6">Education</p>
            <ol className="relative space-y-0 border-l border-line pl-6">
              {education.map((item, i) => (
                <Reveal key={`${item.title}-${item.year}`} delay={i * 0.04}>
                  <li className="relative pb-8 last:pb-0">
                    <span className="absolute -left-[1.9rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                    <p className="text-sm font-semibold text-accent">{item.year}</p>
                    <h3 className="mt-1 text-xl font-bold tracking-tight">{item.title}</h3>
                    <p className="mt-1 text-ink-soft">{item.place}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>

          <div>
            <p className="mono-label mb-6">Experience</p>
            <ol className="relative border-l border-line pl-6">
              {experience.map((item, i) => (
                <Reveal key={`${item.title}-${item.year}`} delay={i * 0.04}>
                  <li className="relative pb-8 last:pb-0">
                    <span className="absolute -left-[1.9rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                    <p className="text-sm font-semibold text-accent">{item.year}</p>
                    <h3 className="mt-1 text-xl font-bold tracking-tight">{item.title}</h3>
                    <p className="mt-1 text-ink-soft">{item.place}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
