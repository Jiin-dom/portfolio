"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { site } from "@/lib/content";
import { ease } from "@/lib/easings";

export function IntroChapter() {
  const reduce = useReducedMotion();

  return (
    <section id="intro" className="relative min-h-[100dvh] overflow-hidden bg-desk text-cream">
      <Image
        src="/images/hero-desk-moody.jpg"
        alt=""
        fill
        priority
        className="object-cover object-[55%_42%] brightness-[0.92] contrast-[1.05]"
        sizes="100vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgb(20_14_10/0.55)_0%,rgb(20_14_10/0.22)_34%,transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-ink/20" />

      <div className="section-pad relative z-10 mx-auto flex min-h-[100dvh] max-w-[var(--max)] flex-col pb-8 pt-[calc(var(--nav-h)+0.75rem)]">
        <div className="relative grid flex-1 grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <motion.p
              className="hero-kicker"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: ease.out }}
            >
              Dominique Paloma
            </motion.p>
            <motion.h1
              className="hero-wordmark mt-1"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: reduce ? 0 : 0.04, ease: ease.out }}
            >
              Jeanne
            </motion.h1>
          </div>

          <motion.p
            className="hero-body mt-8 max-w-[28ch] lg:col-span-4 lg:mt-[7.5rem] lg:justify-self-end"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: reduce ? 0 : 0.12, ease: ease.out }}
          >
            Designed to ship interfaces that feel as solid as the systems behind them. Jeanne makes
            the full stack feel considered.
          </motion.p>
        </div>

        <motion.aside
          className="glass-dark mt-auto max-w-[22rem] rounded-[2px] p-4 md:p-5"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: reduce ? 0 : 0.18, ease: ease.out }}
        >
          <p className="text-[0.72rem] font-semibold uppercase leading-snug tracking-[0.06em] text-cream">
            Full-stack developer with a strong focus on UI and UX.
          </p>
          <hr className="dot-rule text-cream" />
          <p className="text-[0.82rem] leading-relaxed text-cream/80">{site.tagline}</p>
        </motion.aside>
      </div>

      <a
        href="#features"
        className="side-tab pointer-events-auto absolute right-0 top-1/2 z-20 -translate-y-1/2"
      >
        JD-1 Model
      </a>

      <a
        href="#features"
        className="scroll-hint absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-cream/85"
      >
        <span>Scroll to continue</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </a>
    </section>
  );
}
