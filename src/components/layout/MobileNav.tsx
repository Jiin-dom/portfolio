"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { site } from "@/lib/content";
import { chapters, type ChapterId } from "@/lib/chapters";
import { ease } from "@/lib/easings";

type Props = {
  active: ChapterId;
  dark?: boolean;
};

export function MobileNav({ active, dark }: Props) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div>
      <button
        type="button"
        className={`btn !min-h-9 !px-3 !py-2 !text-[0.62rem] ${
          dark ? "btn-ghost-ink" : "btn-ghost-cream"
        }`}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            className="glass-dark fixed inset-x-4 top-[calc(var(--nav-h)+0.5rem)] z-40 rounded-md p-6"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: ease.out }}
          >
            <nav className="flex flex-col gap-5" aria-label="Mobile chapters">
              {chapters.map((link, i) => (
                <motion.a
                  key={link.id}
                  href={link.href}
                  className="chapter-link text-sm tracking-[0.12em]"
                  aria-current={active === link.id ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04, ease: ease.out }}
                >
                  {link.label}
                </motion.a>
              ))}
              <a
                href={site.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-cream mt-2 w-fit"
                onClick={() => setOpen(false)}
              >
                Resume
              </a>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
