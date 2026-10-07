import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/lib/content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project" };
  return {
    title: `${project.title} · JD Paloma`,
    description: project.description,
  };
}

export default async function WorkDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <article className="section-pad pb-24 pt-28 md:pt-36">
      <p className="meta-type mb-6">
        <Link href="/#work" className="text-bone-soft no-underline hover:text-ember">
          Work
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ember">{project.title}</span>
      </p>

      <h1
        className="display-type-sm m-0 max-w-[16ch] text-bone"
        style={{ viewTransitionName: `project-title-${project.slug}` }}
      >
        {project.title}
      </h1>

      <p className="mt-8 max-w-[52ch] text-lg text-bone-soft md:text-xl">
        {project.description}
      </p>

      <div className="mt-10 overflow-hidden border border-[var(--line)] bg-panel">
        <Image
          src={project.image}
          alt={`Screenshot of ${project.title}`}
          width={1400}
          height={900}
          className="h-auto w-full object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
        />
      </div>

      <div className="mt-12 grid gap-10 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <h2 className="meta-type mb-4 text-bone">Tools</h2>
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
            {project.tools.map((tool) => (
              <li key={tool} className="meta-type normal-case tracking-normal text-bone-soft">
                {tool}
              </li>
            ))}
          </ul>
        </div>
        <a
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          className="magnetic-link meta-type text-ember no-underline"
        >
          Source code
        </a>
      </div>

      <nav aria-label="Project pagination" className="mt-20 border-t border-[var(--line)] pt-8">
        <Link href="/#work" className="magnetic-link meta-type text-bone no-underline">
          Back to work
        </Link>
      </nav>
    </article>
  );
}
