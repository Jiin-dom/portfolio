import { site } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="section-pad border-t border-[var(--line)] py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="meta-type m-0">{site.shortName}</p>
        <p className="meta-type m-0 normal-case tracking-normal text-bone-soft">
          Full-stack · UI / UX
        </p>
      </div>
    </footer>
  );
}
