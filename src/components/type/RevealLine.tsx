"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type RevealLineProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function RevealLine({ children, className = "", delay = 0 }: RevealLineProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(el, { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" });
        return;
      }

      gsap.fromTo(
        el,
        { opacity: 0.15, y: 36, clipPath: "inset(0% 0% 100% 0%)" },
        {
          opacity: 1,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.9,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { dependencies: [delay] },
  );

  return (
    <div ref={ref} className={className} style={{ willChange: "transform, opacity, clip-path" }}>
      {children}
    </div>
  );
}
