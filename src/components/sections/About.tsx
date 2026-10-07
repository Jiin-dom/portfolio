"use client";

import dynamic from "next/dynamic";
import { Reveal } from "@/components/motion/Reveal";
import { capabilities } from "@/lib/content";

const RibbonScene = dynamic(
  () => import("@/components/hero/RibbonScene").then((m) => m.RibbonScene),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-paper-deep" /> },
);

export function About() {
  return (
    <section id="about" className="section-pad py-24 md:py-32">
      <div className="section-inner grid items-stretch gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <h2 className="display max-w-[16ch] text-[clamp(2.4rem,5.5vw,4.2rem)]">
            Full-stack craft with a sharp eye for interface quality.
          </h2>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-soft">
            I build product surfaces end to end - from React frontends to Spring Boot services and
            MySQL data - where the experience feels as considered as the architecture.
          </p>
          <ul className="mt-10 flex flex-wrap gap-2">
            {capabilities.map((item) => (
              <li
                key={item}
                className="rounded-full border border-line bg-mist/70 px-4 py-2 text-sm font-semibold tracking-tight"
              >
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08} className="relative min-h-[280px] overflow-hidden rounded-[var(--radius-media)] bg-ink lg:col-span-5">
          <RibbonScene />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
            <p className="max-w-[18ch] text-lg font-bold tracking-tight text-mist">
              Systems that move with intent.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
