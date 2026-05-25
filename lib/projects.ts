export interface ProjectSummary {
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
