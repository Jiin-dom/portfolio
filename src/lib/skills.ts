import { projects, techStack } from "@/lib/content";

export type Skill = {
  name: string;
  icon: string;
  group: (typeof techStack)[number]["group"];
  /* indices into `projects` that use this skill */
  projects: readonly number[];
};

export const skills: readonly Skill[] = techStack.map((t) => {
  const names: readonly string[] = [t.name, ...(t.also ?? [])];
  return {
    name: t.name,
    icon: t.icon,
    group: t.group,
    projects: projects.flatMap((p, i) => (p.tools.some((tool) => names.includes(tool)) ? [i] : [])),
  };
});

export const skillGroups = [...new Set(skills.map((s) => s.group))];

/* the reverse lookup: which skills (fish) each project (book) uses */
export const projectSkills: readonly (readonly number[])[] = projects.map((_, i) =>
  skills.flatMap((s, k) => (s.projects.includes(i) ? [k] : [])),
);
