"use client";

import { site } from "@/lib/content";
import { chapters } from "@/lib/chapters";
import { useActiveChapter } from "@/hooks/useActiveChapter";
import { MobileNav } from "./MobileNav";

export function Nav() {
  const active = useActiveChapter();
  const darkText = active === "product" || active === "contact";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[60]" style={{ height: "var(--nav-h)" }}>
      <div className="section-pad mx-auto flex h-full max-w-[var(--max)] items-center justify-between gap-6">
        <a
          href="#intro"
          className={`pointer-events-auto text-[0.8rem] font-semibold tracking-[0.18em] uppercase transition-colors ${
            darkText ? "text-ink" : "text-cream"
          }`}
          aria-label={`${site.shortName} home`}
        >
          {site.shortName.replace(" ", "\u00A0")}
        </a>

        <nav className="pointer-events-auto hidden items-center gap-9 md:flex" aria-label="Chapters">
          {chapters.map((chapter) => (
            <a
              key={chapter.id}
              href={chapter.href}
              className={`chapter-link ${darkText ? "chapter-link-dark" : ""}`}
              aria-current={active === chapter.id ? "page" : undefined}
            >
              {chapter.label}
            </a>
          ))}
        </nav>

        <div className="pointer-events-auto md:hidden">
          <MobileNav active={active} dark={darkText} />
        </div>
      </div>
    </header>
  );
}
