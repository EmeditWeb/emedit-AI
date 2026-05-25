export interface MockProject {
  id: string;
  name: string;
  slug: string;
  ownedByCurrentUser: boolean;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidProjectName(name: string): boolean {
  return name.trim().length > 0 && slugify(name).length > 0;
}

export const mockProjects: MockProject[] = [
  {
    id: "p_1",
    name: "Acme Microservices",
    slug: "acme-microservices",
    ownedByCurrentUser: true,
  },
  {
    id: "p_2",
    name: "Data Pipeline Plan",
    slug: "data-pipeline-plan",
    ownedByCurrentUser: true,
  },
];

export const mockSharedProjects: MockProject[] = [
  {
    id: "p_s1",
    name: "Team Platform",
    slug: "team-platform",
    ownedByCurrentUser: false,
  },
];
