export const chapters = [{ id: "intro", href: "#intro", label: "Home" }] as const;

/*
 * Not page sections: each sends the desk somewhere. About me opens the
 * Experience folder, Skills flies to the aquarium, Projects to the book shelf,
 * Contact to the pinboard on the wall.
 */
export type DeskSpot = "about" | "skills" | "projects" | "contact";
export const deskLinks: readonly { spot: DeskSpot; href: string; label: string }[] = [
  { spot: "about", href: "#about", label: "About me" },
  { spot: "skills", href: "#skills", label: "Skills" },
  { spot: "projects", href: "#projects", label: "Projects" },
  { spot: "contact", href: "#contact", label: "Contact" },
];

/* home: the link scrolls to the top, and the desk puts away whatever is open */
export const goHome = () => {
  window.dispatchEvent(new Event("desk:home"));
};

export const goToSpot = (spot: DeskSpot, e: { preventDefault(): void }) => {
  e.preventDefault();
  window.dispatchEvent(new Event(`desk:${spot}`));
};

/* where the desk is showing right now, so the nav can mark that link as current */
let current: DeskSpot | null = null;
const spotListeners = new Set<() => void>();
export const deskSpot = {
  get: () => current,
  set(spot: DeskSpot | null) {
    if (spot === current) return;
    current = spot;
    spotListeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    spotListeners.add(listener);
    return () => {
      spotListeners.delete(listener);
    };
  },
};

/* "contact" is the hidden contact section; it stays observable so it can come back */
export type ChapterId = (typeof chapters)[number]["id"] | "contact";

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
