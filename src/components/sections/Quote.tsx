"use client";

import { Reveal } from "@/components/motion/Reveal";
import { quote } from "@/lib/content";

export function Quote() {
  return (
    <section className="section-pad py-24 md:py-36">
      <div className="section-inner">
        <Reveal>
          <p className="max-w-[22ch] text-[clamp(1.8rem,4.2vw,3.2rem)] font-bold leading-[1.15] tracking-[-0.03em] text-ink">
            <span className="text-accent">&ldquo;</span>
            {quote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
