"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

export function Projects() {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    if (window.matchMedia("(max-width: 1023px)").matches) return;

    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section id="work" ref={wrap} className="relative overflow-hidden bg-ink text-mist">
      <div className="section-pad section-inner py-16 md:absolute md:inset-x-0 md:top-0 md:z-10 md:py-10">
        <h2 className="display text-[clamp(2.4rem,6vw,4.5rem)] text-mist">Selected work</h2>
      </div>

      <div
        ref={track}
        className="flex w-max flex-col gap-8 px-[var(--page-pad)] pb-20 pt-4 md:h-[100dvh] md:flex-row md:items-center md:gap-10 md:pb-0 md:pt-24"
      >
        {projects.map((project) => (
          <article
            key={project.slug}
            className="w-[min(88vw,420px)] shrink-0 md:w-[min(70vw,640px)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-white/5">
              <Image
                src={project.image}
                alt={`${project.title} screenshot`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 88vw, 640px"
              />
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{project.title}</h3>
              <p className="max-w-[48ch] text-sm leading-relaxed text-mist/70 md:text-base">
                {project.description}
              </p>
              <ul className="flex flex-wrap gap-2">
                {project.tools.slice(0, 5).map((tool) => (
                  <li
                    key={tool}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs text-mist/75"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-mist transition-colors duration-160 ease-[var(--ease-out)] hover:text-[var(--accent)]"
              >
                Source code
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
