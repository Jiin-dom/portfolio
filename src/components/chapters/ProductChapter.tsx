"use client";

import Image from "next/image";
import { useState, startTransition } from "react";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/lib/content";

const featured = projects.slice(0, 3);

export function ProductChapter() {
  const [active, setActive] = useState(0);
  const current = featured[active] ?? featured[0];

  return (
    <section id="product" className="relative overflow-hidden bg-cream-soft text-ink">
      <div className="section-pad section-inner py-24 md:py-28">
        <h2 className="display max-w-[14ch] text-[clamp(2.2rem,5.5vw,4rem)] uppercase">
          People hire for craft like this
        </h2>

        <div className="relative mx-auto mt-16 flex max-w-3xl flex-col items-center">
          <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-full border-[14px] border-cork bg-cork shadow-[0_40px_100px_var(--shadow)]">
            <div className="absolute inset-[8%] overflow-hidden rounded-full bg-desk">
              <Image
                src={current.image}
                alt={`${current.title} preview`}
                fill
                className="object-cover"
                sizes="(max-width: 480px) 75vw, 420px"
              />
            </div>
          </div>
        </div>

        <div className="mt-14">
          <div className="flex flex-wrap gap-2 border-b border-line pb-4">
            {featured.map((project, i) => (
              <button
                key={project.slug}
                type="button"
                className={`btn !min-h-10 !px-4 !text-[0.65rem] ${
                  active === i ? "btn-ink" : "btn-ghost-ink"
                }`}
                onClick={() => startTransition(() => setActive(i))}
                aria-pressed={active === i}
              >
                {project.title}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-3xl font-semibold tracking-tight">{current.title}</h3>
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-ink-soft">
              {current.description}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {current.tools.map((tool) => (
                <li
                  key={tool}
                  className="rounded-full border border-line bg-cream px-3 py-1 text-xs font-medium"
                >
                  {tool}
                </li>
              ))}
            </ul>
            <a
              href={current.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ink mt-8 w-fit"
            >
              Source code
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>

        <div className="mt-20 border-t border-line pt-12">
          <p className="mono-label text-ink-soft">All selected work</p>
          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {projects.map((project, i) => (
              <li key={project.slug}>
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass-light flex gap-4 rounded-md p-3 transition-transform hover:-translate-y-0.5"
                >
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-sm bg-desk">
                    <Image
                      src={project.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <p className="font-mono text-[0.6rem] uppercase tracking-wider text-ink-soft">
                      0{i + 1}
                    </p>
                    <p className="truncate font-semibold tracking-tight">{project.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                      {project.description}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="mt-1 h-4 w-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal"
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
