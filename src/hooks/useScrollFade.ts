"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * For lists that scroll with their scrollbar hidden: reports which edges still
 * have more beyond them, so the `.scroll-fade` mask can fade only those edges.
 */
export function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.scrollTop > 2;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    setEdges((e) => (e.top === top && e.bottom === bottom ? e : { top, bottom }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    /* rows opening, closing, or swapping change the height without a scroll event */
    const ro = new ResizeObserver(measure);
    const watch = () => {
      ro.disconnect();
      ro.observe(el);
      Array.from(el.children).forEach((c) => ro.observe(c));
      measure();
    };
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [measure]);

  return {
    ref,
    onScroll: measure,
    fade: {
      "data-fade-top": edges.top ? "" : undefined,
      "data-fade-bottom": edges.bottom ? "" : undefined,
    },
    more: edges.bottom,
  };
}
