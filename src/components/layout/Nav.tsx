"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { site } from "@/lib/content";
import { MobileNav } from "./MobileNav";

const links = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-200 ease-[var(--ease-out)] ${
        scrolled
          ? "bg-mist/80 shadow-[0_1px_0_var(--line)] backdrop-blur-md"
          : "bg-transparent"
      }`}
      style={{ height: "var(--nav-h)" }}
    >
      <div className="section-pad mx-auto flex h-full max-w-[var(--max)] items-center justify-between gap-6">
        <a
          href="#top"
          className="relative z-50 flex items-center gap-3"
          aria-label={`${site.shortName} home`}
        >
          <Image
            src="/images/jplogo.png"
            alt=""
            width={34}
            height={34}
            className="h-8 w-8 object-contain mix-blend-multiply"
            priority
          />
          <span className="text-sm font-bold tracking-tight">{site.shortName}</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="nav-link text-sm font-medium text-ink-soft">
              {link.label}
            </a>
          ))}
          <a
            href={site.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost !min-h-10 !px-4 !py-2 text-xs"
          >
            Resume
          </a>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
