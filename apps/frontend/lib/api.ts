import { ProjectSummary, ProjectWorld } from "../types/project";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const parseJson = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request gagal diproses.");
  }

  return payload as T;
};

export const fetchProjects = async (): Promise<ProjectSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    cache: "no-store"
  });
  const payload = await parseJson<{ projects: ProjectSummary[] }>(response);
  return payload.projects;
};

export const fetchWorld = async (projectId: number): Promise<ProjectWorld> => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/world`, {
    cache: "no-store"
  });
  return parseJson<ProjectWorld>(response);
};

export const uploadProject = async (file: File, label?: string): Promise<ProjectSummary> => {
  const formData = new FormData();
  formData.append("repo", file);

  if (label?.trim()) {
    formData.append("label", label.trim());
  }

  const response = await fetch(`${API_BASE_URL}/api/projects/upload`, {
    method: "POST",
    body: formData
  });
  const payload = await parseJson<{ project: ProjectSummary }>(response);
  return payload.project;
};
