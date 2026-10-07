import { site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-line bg-cream section-pad py-8 text-ink">
      <div className="section-inner flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.75rem] font-semibold tracking-[0.16em] uppercase">{site.shortName}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          <a href={`mailto:${site.email}`} className="hover:text-signal">
            {site.email}
          </a>
          <a href={site.links.github} target="_blank" rel="noopener noreferrer" className="hover:text-signal">
            GitHub
          </a>
          <a href={site.links.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-signal">
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
