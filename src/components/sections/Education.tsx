"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { education } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Education() {
  const listRef = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const list = listRef.current;
      if (!list) return;
      const rows = list.querySelectorAll<HTMLElement>("[data-edu-row]");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(rows, { opacity: 1, y: 0 });
        return;
      }

      rows.forEach((row) => {
        const title = row.querySelector("[data-edu-title]");
        gsap.fromTo(
          row,
          { opacity: 0.25, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: row,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          },
        );

        if (title) {
          gsap.fromTo(
            title,
            { fontVariationSettings: '"opsz" 24, "wdth" 100, "wght" 400' },
            {
              fontVariationSettings: '"opsz" 48, "wdth" 88, "wght" 650',
              ease: "none",
              scrollTrigger: {
                trigger: row,
                start: "top 85%",
                end: "top 35%",
                scrub: true,
              },
            },
          );
        }
      });
    },
    { dependencies: [] },
  );

  return (
    <section
      id="education"
      aria-labelledby="education-heading"
      className="section-pad border-t border-[var(--line)]"
    >
      <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="meta-type mb-4">02 — Education</p>
          <h2 id="education-heading" className="title-type m-0 text-bone">
            Index
          </h2>
        </div>
        <p className="m-0 max-w-[32ch] text-bone-soft">
          A typographic shelf — years as labels, studies as end titles. Scroll pulls weight
          and width.
        </p>
      </div>

      <ul ref={listRef} className="m-0 list-none p-0">
        {education.map((item, i) => (
          <li
            key={`${item.title}-${item.year}`}
            data-edu-row
            className="group grid grid-cols-[5.5rem_1fr] gap-4 border-t border-[var(--line)] py-7 md:grid-cols-[7rem_1fr_auto] md:gap-8 md:py-9"
          >
            <span className="meta-type pt-2 text-ember">{item.year}</span>
            <div>
              <h3
                data-edu-title
                className="title-type m-0 text-bone transition-[font-variation-settings] duration-200"
              >
                {item.title}
              </h3>
              <p className="mt-2 m-0 text-bone-soft">{item.place}</p>
            </div>
            <span className="meta-type hidden pt-2 text-bone-soft md:block">
              {String(i + 1).padStart(2, "0")}
            </span>
          </li>
        ))}
        <li aria-hidden="true" className="border-t border-[var(--line)]" />
      </ul>
    </section>
  );
}
