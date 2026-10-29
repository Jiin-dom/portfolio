"use client";

import { Fragment } from "react";
import { site } from "@/lib/content";
import { chapters, goHome, openSkills, skillsLink } from "@/lib/chapters";
import { useActiveChapter, useTankOpen } from "@/hooks/useActiveChapter";
import { MobileNav } from "./MobileNav";

export function Nav() {
  const active = useActiveChapter();
  const tank = useTankOpen();
  const darkText = active === "product" || active === "contact";

  return (
    <header
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] transition-colors duration-300 ${
        darkText ? "bg-cream/85 backdrop-blur-md" : "bg-transparent"
      }`}
      style={{ height: "var(--nav-h)" }}
    >
      {/* full width, hugging the screen edges like the hero type, not the centred content column */}
      <div className="flex h-full items-center justify-between gap-6 px-[var(--page-pad)]">
        <a
          href="#intro"
          onClick={goHome}
          className={`pointer-events-auto text-[0.8rem] font-semibold tracking-[0.18em] uppercase transition-colors ${
            darkText ? "text-ink" : "text-cream"
          }`}
          aria-label={`${site.shortName} home`}
        >
          {site.shortName.replace(" ", "\u00A0")}
        </a>

        <nav className="pointer-events-auto hidden items-center gap-9 md:flex" aria-label="Chapters">
          {chapters.map((chapter, i) => (
            <Fragment key={chapter.id}>
              <a
                href={chapter.href}
                className={`chapter-link ${darkText ? "chapter-link-dark" : ""}`}
                aria-current={active === chapter.id && !(tank && chapter.id === "intro") ? "page" : undefined}
                onClick={chapter.id === "intro" ? goHome : undefined}
              >
                {chapter.label}
              </a>
              {i === 0 && (
                <a
                  href={skillsLink.href}
                  className={`chapter-link ${darkText ? "chapter-link-dark" : ""}`}
                  aria-current={tank ? "page" : undefined}
                  onClick={openSkills}
                >
                  {skillsLink.label}
                </a>
              )}
            </Fragment>
          ))}
        </nav>

        <div className="pointer-events-auto md:hidden">
          <MobileNav active={active} dark={darkText} />
        </div>
      </div>
    </header>
  );
}
