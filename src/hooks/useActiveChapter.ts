"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { tankView, type ChapterId } from "@/lib/chapters";

const sectionIds: ChapterId[] = ["intro", "features", "product", "contact"];

/* true while the desk camera is at the aquarium */
export function useTankOpen() {
  return useSyncExternalStore(tankView.subscribe, tankView.get, () => false);
}

export function useActiveChapter() {
  const [active, setActive] = useState<ChapterId>("intro");

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActive(visible.target.id as ChapterId);
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.2, 0.45, 0.7, 1] },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return active;
}
