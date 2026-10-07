import { site } from "@/lib/content";

const outbound = [
  { label: "GitHub", href: site.links.github },
  { label: "LinkedIn", href: site.links.linkedin },
  { label: "Resume", href: site.resume },
  { label: "YouTube", href: site.links.youtube },
] as const;

export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="section-pad border-t border-[var(--line)]"
    >
      <p className="meta-type mb-6">04 — Contact</p>
      <h2 id="contact-heading" className="sr-only">
        Contact
      </h2>

      <a
        href={`mailto:${site.email}`}
        className="display-type-sm magnetic-link break-all text-bone no-underline"
      >
        {site.email}
      </a>

      <ul className="mt-12 flex list-none flex-wrap gap-x-8 gap-y-4 p-0">
        {outbound.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="magnetic-link meta-type text-bone-soft no-underline"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
