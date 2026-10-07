"use client";

import Link from "next/link";
import { site } from "@/lib/content";

const links = [
  { href: "/#experience", label: "Experience" },
  { href: "/#education", label: "Education" },
  { href: "/#work", label: "Work" },
  { href: "/#contact", label: "Contact" },
] as const;

export function SiteNav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="section-pad flex items-start justify-between gap-6 py-5 md:py-6">
        <Link
          href="/"
          className="pointer-events-auto meta-type text-bone transition-colors duration-[var(--dur-ui)] ease-[var(--ease-out)] hover:text-ember"
        >
          {site.shortName}
        </Link>
        <nav aria-label="Primary" className="pointer-events-auto">
          <ul className="flex flex-wrap justify-end gap-x-5 gap-y-2 md:gap-x-7">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="meta-type text-bone-soft transition-colors duration-[var(--dur-ui)] ease-[var(--ease-out)] hover:text-ember"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={site.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="meta-type text-ember"
              >
                Resume
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
