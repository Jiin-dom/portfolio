"use client";

import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/lib/content";

const channels = [
  { label: "GitHub", href: site.links.github },
  { label: "LinkedIn", href: site.links.linkedin },
  { label: "Facebook", href: site.links.facebook },
  { label: "YouTube", href: site.links.youtube },
] as const;

export function ContactChapter() {
  return (
    <section id="contact" className="relative overflow-hidden bg-cream text-ink">
      <div className="section-pad section-inner py-28 md:py-36">
        <Reveal>
          <h2 className="display max-w-[18ch] text-[clamp(2rem,5.5vw,4.25rem)]">
            We caught your attention with craft. If this portfolio lands, imagine what we can ship for
            your product.
          </h2>
        </Reveal>

        <Reveal delay={0.06}>
          <a
            href={`mailto:${site.email}`}
            className="mt-12 block break-all text-[clamp(1.2rem,3.2vw,2.4rem)] font-semibold tracking-tight text-mat transition-opacity hover:opacity-75"
          >
            {site.email}
          </a>
        </Reveal>

        <div className="mt-16 grid gap-10 border-t border-line pt-10 lg:grid-cols-[1.2fr_auto] lg:items-end">
          <Reveal delay={0.08}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {channels.map((channel) => (
                <li key={channel.label}>
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-md border border-line bg-cream-soft px-5 py-4 transition-colors hover:border-mat/40"
                  >
                    <span className="text-lg font-semibold tracking-tight">{channel.label}</span>
                    <ArrowUpRight
                      className="h-5 w-5 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-signal"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.12} className="flex flex-col gap-4">
            <div>
              <p className="mono-label text-ink-soft">Phone</p>
              <a
                href={`tel:${site.phone.replace(/\s+/g, "")}`}
                className="mt-2 block text-xl font-semibold tracking-tight hover:text-signal"
              >
                {site.phone}
              </a>
            </div>
            <a
              href={site.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ink w-fit"
            >
              Open resume
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
