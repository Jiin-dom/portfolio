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

export function Contact() {
  return (
    <section id="contact" className="section-pad py-28 md:py-40">
      <div className="section-inner">
        <Reveal>
          <h2 className="display max-w-[12ch] text-[clamp(2.8rem,8vw,6rem)]">
            Start a conversation.
          </h2>
        </Reveal>

        <Reveal delay={0.06}>
          <a
            href={`mailto:${site.email}`}
            className="mt-10 block break-all text-[clamp(1.4rem,4vw,2.75rem)] font-bold tracking-tight text-accent transition-opacity duration-160 ease-[var(--ease-out)] hover:opacity-80"
          >
            {site.email}
          </a>
        </Reveal>

        <div className="mt-14 grid gap-10 border-t border-line pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <Reveal delay={0.08}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {channels.map((channel) => (
                <li key={channel.label}>
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-[1rem] border border-line bg-mist/70 px-5 py-4 transition-colors duration-160 ease-[var(--ease-out)] hover:border-accent/40"
                  >
                    <span className="text-lg font-bold tracking-tight">{channel.label}</span>
                    <ArrowUpRight
                      className="h-5 w-5 text-ink-soft transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.12} className="flex flex-col gap-4">
            <div>
              <p className="mono-label">Phone</p>
              <a
                href={`tel:${site.phone.replace(/\s+/g, "")}`}
                className="mt-2 block text-xl font-bold tracking-tight hover:text-accent"
              >
                {site.phone}
              </a>
            </div>
            <a href={site.resume} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-fit">
              Open resume
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
