"use client";

import { PressureText } from "@/components/type/PressureText";
import { site } from "@/lib/content";

export function Opening() {
  return (
    <section
      id="top"
      aria-labelledby="opening-name"
      className="section-pad relative flex min-h-[100dvh] flex-col justify-end pb-16 pt-28 md:pb-24 md:pt-32"
    >
      <p className="meta-type mb-6 max-w-[20rem] text-ember">Portfolio / 2026</p>

      <PressureText
        text={site.name}
        as="h1"
        className="display-type mb-8 max-w-[18ch] text-bone"
      />

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

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[var(--line)]"
      />
    </section>
  );
}
