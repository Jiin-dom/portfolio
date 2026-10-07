export const chapters = [
  { id: "intro", href: "#intro", label: "Intro" },
  { id: "features", href: "#features", label: "Features" },
  { id: "product", href: "#product", label: "Product" },
  { id: "contact", href: "#contact", label: "Contact" },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];

export const featurePanels = [
  {
    kicker: "Rise above mediocrity",
    title: "Interfaces that elevate",
    body: "Layout, type, and motion engineered so the product feels considered before a single API call lands.",
    aside: "Δh ≈ craft",
  },
  {
    kicker: "Handles extremes with ease",
    title: "Full-stack stability",
    body: "React surfaces wired to Spring Boot services and MySQL — one coherent stack, one owner through ship.",
    aside: "React · Spring · MySQL",
  },
  {
    kicker: "Precision grip, zero drama",
    title: "Shipped end to end",
    body: "Auth, payments, OAuth, and admin flows built to stay maintainable after launch — not just demo-ready.",
    aside: "JWT · PayPal · OAuth",
  },
] as const;
