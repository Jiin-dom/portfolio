"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { site } from "@/lib/content";
import { ease } from "@/lib/easings";

const links = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="btn btn-ghost !min-h-10 !px-4 !py-2 text-xs"
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
            className="fixed inset-0 z-40 bg-mist/96 pt-[calc(var(--nav-h)+1.25rem)] backdrop-blur-md"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: ease.out }}
          >
            <nav className="section-pad flex flex-col gap-1" aria-label="Mobile">
              {links.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="border-b border-line py-5 text-3xl font-bold tracking-tight"
                  onClick={() => setOpen(false)}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: i * 0.04, ease: ease.out }}
                >
                  {link.label}
                </motion.a>
              ))}
              <a
                href={site.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-6 w-fit"
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
