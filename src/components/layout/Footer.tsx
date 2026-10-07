import { site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="section-pad border-t border-line py-8">
      <div className="section-inner flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold tracking-tight">{site.shortName}</p>
        <p className="text-sm text-ink-soft">Full-stack developer with a UI / UX focus</p>
      </div>
    </footer>
  );
}
