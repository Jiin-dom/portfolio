export const chapters = [
  { id: "intro", href: "#intro", label: "Intro" },
  { id: "features", href: "#features", label: "Features" },
  { id: "product", href: "#product", label: "Product" },
  { id: "contact", href: "#contact", label: "Contact" },
] as const;

/* not a page section: it flies the desk camera to the aquarium on the L return */
export const skillsLink = { href: "#skills", label: "Skills" } as const;

export const openSkills = (e: { preventDefault(): void }) => {
  e.preventDefault();
  window.dispatchEvent(new Event("desk:skills"));
};

/* whether the desk camera is at the aquarium, so the nav can mark Skills as current */
let tankOpen = false;
const tankListeners = new Set<() => void>();
export const tankView = {
  get: () => tankOpen,
  set(open: boolean) {
    if (open === tankOpen) return;
    tankOpen = open;
    tankListeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    tankListeners.add(listener);
    return () => {
      tankListeners.delete(listener);
    };
  },
};

export type ChapterId = (typeof chapters)[number]["id"];

export const featurePanels = [
  {
    title: "Interfaces that elevate",
    body: "Layout, type, and motion engineered so the product feels considered before a single API call lands.",
  },
  {
    title: "Full-stack stability",
    body: "React surfaces wired to Spring Boot services and MySQL — one coherent stack, one owner through ship.",
  },
  {
    title: "Shipped end to end",
    body: "Auth, payments, OAuth, and admin flows built to stay maintainable after launch — not just demo-ready.",
  },
] as const;
