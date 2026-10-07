"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/lib/content";
import { ease } from "@/lib/easings";

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      id="top"
      className="section-pad relative min-h-[100dvh] pb-10 pt-[calc(var(--nav-h)+0.75rem)]"
    >
      <div className="section-inner grid min-h-[calc(100dvh-var(--nav-h)-2.5rem)] gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="relative flex flex-col justify-center gap-7 py-2 lg:col-span-5 lg:py-6">
          <motion.h1
            className="display text-[clamp(3rem,8vw,5.75rem)] text-ink"
            initial={reduce ? false : { opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: ease.out }}
          >
            {site.name}
          </motion.h1>
          <motion.p
            className="max-w-[34ch] text-base leading-relaxed text-ink-soft md:text-lg"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduce ? 0 : 0.1, ease: ease.out }}
          >
            {site.tagline}
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-3"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: reduce ? 0 : 0.18, ease: ease.out }}
          >
            <a href="#work" className="btn btn-primary">
              View work
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
            <a href="#contact" className="btn btn-ghost">
              Contact
            </a>
          </motion.div>
        </div>

        <motion.div
          className="media-frame relative min-h-[52vh] overflow-hidden lg:col-span-7 lg:min-h-full"
          initial={reduce ? false : { opacity: 0, clipPath: "inset(10% 10% 10% 10%)" }}
          animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: 0.85, ease: ease.out }}
        >
          <Image
            src="/images/me2.png"
            alt="Portrait of Jeanne Dominique Paloma"
            fill
            priority
            className="object-cover object-[center_18%]"
            sizes="(max-width: 1024px) 100vw, 58vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgb(11_61_255_/_0.22),transparent_42%)]" />
        </motion.div>
      </div>
    </section>
  );
}
