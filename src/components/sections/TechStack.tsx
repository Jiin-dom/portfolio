"use client";

import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { techStack } from "@/lib/content";

export function TechStack() {
  return (
    <section className="section-pad py-24 md:py-32" aria-label="Tech stack">
      <div className="section-inner">
        <Reveal>
          <h2 className="display max-w-[14ch] text-[clamp(2.4rem,5.5vw,4rem)]">
            Tools across the stack
          </h2>
        </Reveal>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
          {techStack.map((item, i) => (
            <Reveal key={item.name} delay={i * 0.03}>
              <li className="flex flex-col gap-4 rounded-[1rem] border border-line bg-mist/80 p-4 transition-transform duration-200 ease-[var(--ease-out)] md:p-5">
                <Image
                  src={item.icon}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
                <span className="text-sm font-semibold tracking-tight">{item.name}</span>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
