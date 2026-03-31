"use client";

import { ProjectSummary } from "../types/project";

interface ProjectListProps {
  projects: ProjectSummary[];
  activeProjectId: number | null;
  isLoading: boolean;
  onSelect: (projectId: number) => void;
}

export function ProjectList({
  projects,
  activeProjectId,
  isLoading,
  onSelect
}: ProjectListProps) {
  return (
    <section className="panel rounded-[28px] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="theme-kicker font-mono text-xs uppercase tracking-[0.24em]">
            Project Worlds
          </p>
          <h2 className="theme-heading mt-2 text-xl font-semibold">Riwayat hasil visualisasi</h2>
        </div>
        <div className="theme-kicker font-mono text-xs">{projects.length} project</div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="theme-empty-panel theme-copy rounded-2xl px-4 py-5 text-sm">
            Mengambil daftar project...
          </div>
        ) : null}

        {!isLoading && projects.length === 0 ? (
          <div className="theme-empty-panel theme-copy rounded-2xl px-4 py-5 text-sm">
            Belum ada project. Upload repo pertama untuk membentuk dunia 3D.
          </div>
        ) : null}

        {projects.map((project) => {
          const isActive = project.id === activeProjectId;

          return (
            <button
              key={project.id}
              className={`theme-surface-card theme-surface-card--hover w-full rounded-[22px] px-4 py-4 text-left ${
                isActive
                  ? "theme-project-card--active"
                  : ""
              }`}
              onClick={() => onSelect(project.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="theme-heading text-base font-semibold">{project.name}</div>
                  <div className="theme-copy mt-1 text-sm">{project.sourceFilename}</div>
                </div>
                <div className="theme-kicker font-mono text-[11px] uppercase tracking-[0.18em]">
                  #{project.id}
                </div>
              </div>
              <div className="theme-copy mt-4 flex flex-wrap gap-2 text-xs">
                <span className="theme-tag rounded-full px-3 py-1">{project.totalFiles} file</span>
                <span className="theme-tag rounded-full px-3 py-1">
                  {project.totalFunctions} fungsi
                </span>
                <span className="theme-tag rounded-full px-3 py-1">{project.totalLoc} LOC</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
