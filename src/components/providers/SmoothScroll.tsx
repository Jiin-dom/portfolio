"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add("lenis", "lenis-smooth");

    const syncLock = () => {
      if (document.documentElement.classList.contains("desk-loading")) lenis.stop();
      else lenis.start();
    };
    syncLock();
    const mo = new MutationObserver(syncLock);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      mo.disconnect();
      gsap.ticker.remove(ticker);
      lenis.destroy();
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    };
  }, []);

  return <>{children}</>;
}
