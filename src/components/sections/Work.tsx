"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { projects } from "@/lib/content";

export function Work() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="section-pad relative border-t border-[var(--line)]"
    >
      <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="meta-type mb-4">03 — Work</p>
          <h2 id="work-heading" className="title-type m-0 text-bone">
            Selected projects
          </h2>
        </div>
        <p className="m-0 max-w-[34ch] text-bone-soft">
          Titles lead. Previews surface on hover or focus — never a uniform card grid.
        </p>
      </div>

      <ul className="relative m-0 list-none p-0">
        {projects.map((project, i) => {
          const isActive = active === project.slug;
          return (
            <li
              key={project.slug}
              className="relative border-t border-[var(--line)]"
              onMouseEnter={() => setActive(project.slug)}
              onMouseLeave={() => setActive(null)}
            >
              <Link
                href={`/work/${project.slug}`}
                className="group relative flex flex-col gap-3 py-8 no-underline outline-offset-4 md:flex-row md:items-baseline md:justify-between md:gap-10 md:py-10"
                onFocus={() => setActive(project.slug)}
                onBlur={() => setActive(null)}
              >
                <span className="meta-type text-bone-soft">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className="display-type-sm m-0 flex-1 text-bone transition-colors duration-[var(--dur-ui)] ease-[var(--ease-out)] group-hover:text-ember group-focus-visible:text-ember"
                  style={{ viewTransitionName: `project-title-${project.slug}` }}
                >
                  {project.title}
                </h3>
                <span className="meta-type text-bone-soft md:w-40 md:text-right">
                  {project.tools.slice(0, 2).join(" · ")}
                </span>
              </Link>

              <div
                className="pointer-events-none absolute right-0 top-1/2 z-10 hidden w-[min(42vw,22rem)] -translate-y-1/2 overflow-hidden border border-[var(--line)] bg-panel md:block"
                style={{
                  opacity: isActive ? 1 : 0,
                  clipPath: isActive
                    ? "inset(0% 0% 0% 0%)"
                    : "inset(0% 0% 0% 100%)",
                  transform: `translateY(-50%) translateX(${isActive ? "0" : "1.25rem"})`,
                  transition:
                    "opacity 280ms var(--ease-out), clip-path 420ms var(--ease-out), transform 420ms var(--ease-out)",
                }}
                aria-hidden="true"
              >
                <Image
                  src={project.image}
                  alt=""
                  width={720}
                  height={480}
                  className="h-auto w-full object-cover"
                  sizes="360px"
                />
              </div>
            </li>
          );
        })}
        <li aria-hidden="true" className="border-t border-[var(--line)]" />
      </ul>
    </section>
  );
}
