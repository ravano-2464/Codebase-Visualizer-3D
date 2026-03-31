"use client";

import { ProjectWorld } from "../types/project";

interface ProjectStatsProps {
  world: ProjectWorld | null;
  isLoading: boolean;
}

export function ProjectStats({ world, isLoading }: ProjectStatsProps) {
  const stats = world?.stats;

  return (
    <section className="panel rounded-[28px] p-5">
      <p className="theme-kicker font-mono text-xs uppercase tracking-[0.24em]">Telemetry</p>
      <h2 className="theme-heading mt-2 text-xl font-semibold">Metrik dunia aktif</h2>

      {isLoading ? (
        <p className="theme-copy mt-4 text-sm">Menyusun ulang lanskap kode...</p>
      ) : null}

      {!world && !isLoading ? (
        <p className="theme-copy mt-4 text-sm">
          Pilih project untuk melihat statistik kota kodenya.
        </p>
      ) : null}

      {stats ? (
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="theme-surface-card rounded-2xl p-4">
            <div className="theme-kicker font-mono text-xs uppercase tracking-[0.2em]">
              Buildings
            </div>
            <div className="theme-heading mt-3 text-3xl font-semibold">{stats.totalFiles}</div>
          </div>
          <div className="theme-surface-card rounded-2xl p-4">
            <div className="theme-kicker font-mono text-xs uppercase tracking-[0.2em]">
              Rooms
            </div>
            <div className="theme-heading mt-3 text-3xl font-semibold">{stats.totalFunctions}</div>
          </div>
          <div className="theme-surface-card rounded-2xl p-4">
            <div className="theme-kicker font-mono text-xs uppercase tracking-[0.2em]">
              LOC
            </div>
            <div className="theme-heading mt-3 text-3xl font-semibold">{stats.totalLoc}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
