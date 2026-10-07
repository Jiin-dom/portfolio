"use client";

import { useEffect, useRef } from "react";

type PressureTextProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  /** Base width axis (75–100 for Bricolage) */
  baseWidth?: number;
  baseWeight?: number;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PressureText({
  text,
  as: Tag = "h1",
  className = "",
  baseWidth = 90,
  baseWeight = 600,
}: PressureTextProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const chars = Array.from(root.querySelectorAll<HTMLElement>("[data-char]"));
    const isTouch = window.matchMedia("(hover: none)").matches;
    let raf = 0;
    let lastY = window.scrollY;
    let velocity = 0;

    const reset = () => {
      chars.forEach((el) => {
        el.style.fontVariationSettings = `"opsz" 96, "wdth" ${baseWidth}, "wght" ${baseWeight}`;
        el.style.transform = "translateY(0)";
      });
    };

    const applyFromPoint = (x: number, y: number) => {
      chars.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(x - cx, y - cy);
        const radius = Math.max(window.innerWidth * 0.22, 160);
        const t = Math.max(0, 1 - dist / radius);
        const eased = t * t * (3 - 2 * t);
        const wdth = baseWidth + eased * (100 - baseWidth);
        const wght = baseWeight + eased * (800 - baseWeight);
        const lift = eased * -6;
        el.style.fontVariationSettings = `"opsz" 96, "wdth" ${wdth.toFixed(1)}, "wght" ${wght.toFixed(0)}`;
        el.style.transform = `translateY(${lift.toFixed(2)}px)`;
      });
    };

    const onPointer = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => applyFromPoint(e.clientX, e.clientY));
    };

    const onScroll = () => {
      const y = window.scrollY;
      velocity = Math.min(1, Math.abs(y - lastY) / 40);
      lastY = y;
      const boost = velocity * 40;
      chars.forEach((el, i) => {
        const phase = (i / Math.max(chars.length - 1, 1)) * Math.PI;
        const wdth = baseWidth + Math.sin(phase) * boost * 0.35;
        const wght = baseWeight + velocity * 120;
        el.style.fontVariationSettings = `"opsz" 96, "wdth" ${wdth.toFixed(1)}, "wght" ${wght.toFixed(0)}`;
      });
    };

    if (isTouch) {
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
      root.addEventListener("pointerleave", reset);
    }

    reset();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      root.removeEventListener("pointerleave", reset);
    };
  }, [baseWidth, baseWeight, text]);

  const words = text.split(" ");

  return (
    <Tag
      ref={(node) => {
        rootRef.current = node;
      }}
      className={className}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span key={`${word}-${wi}`} className="inline-block whitespace-nowrap" aria-hidden="true">
          {Array.from(word).map((char, ci) => (
            <span key={`${wi}-${ci}`} data-char className="pressure-char" aria-hidden="true">
              {char}
            </span>
          ))}
          {wi < words.length - 1 ? <span aria-hidden="true">&nbsp;</span> : null}
        </span>
      ))}
    </Tag>
  );
}
