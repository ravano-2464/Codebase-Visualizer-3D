"use client";

import { CustomScrollShell } from "./custom-scroll-shell";
import { BuildingNode, ProjectWorld } from "../types/project";

interface ProjectDetailsProps {
  world: ProjectWorld | null;
  selectedBuilding: BuildingNode | null;
}

export function ProjectDetails({ world, selectedBuilding }: ProjectDetailsProps) {
  return (
    <section className="panel rounded-[28px] p-5">
      <p className="theme-kicker font-mono text-xs uppercase tracking-[0.24em]">Inspector</p>
      <h2 className="theme-heading mt-2 text-xl font-semibold">Detail gedung dan ruangan</h2>

      {!world ? (
        <p className="theme-copy mt-4 text-sm">
          Setelah project dipilih, klik gedung di canvas untuk melihat detail file dan fungsinya.
        </p>
      ) : null}

      {world && !selectedBuilding ? (
        <div className="theme-dashed-panel theme-copy mt-5 rounded-[22px] px-4 py-5 text-sm">
          Dunia <span className="theme-heading">{world.project.name}</span> siap dijelajahi. Pilih satu
          building untuk membuka room list-nya.
        </div>
      ) : null}

      {selectedBuilding ? (
        <div className="mt-5 space-y-4">
          <div className="theme-highlight-panel rounded-[22px] p-4">
            <div className="theme-heading text-lg font-semibold">{selectedBuilding.name}</div>
            <div className="theme-copy mt-1 text-sm">{selectedBuilding.path}</div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="theme-tag rounded-full px-3 py-1">
                {selectedBuilding.language}
              </span>
              <span className="theme-tag rounded-full px-3 py-1">
                {selectedBuilding.loc} LOC
              </span>
              <span className="theme-tag rounded-full px-3 py-1">
                {selectedBuilding.rooms.length} room
              </span>
            </div>
          </div>

          <div className="theme-surface-card rounded-[22px] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="theme-kicker font-mono text-xs uppercase tracking-[0.2em]">
                Rooms
              </div>
              <div className="theme-copy text-xs">
                kepadatan {selectedBuilding.metrics.densityScore}
              </div>
            </div>

            <CustomScrollShell className="max-h-64" viewportClassName="max-h-64 space-y-2 pr-7">
              {selectedBuilding.rooms.length === 0 ? (
                <p className="theme-copy text-sm">
                  File ini belum punya fungsi yang terdeteksi, jadi bangunannya berupa shell kosong.
                </p>
              ) : null}

              {selectedBuilding.rooms.map((room) => (
                <div
                  key={room.id}
                  className="theme-surface-card rounded-2xl px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="theme-heading text-sm font-semibold">{room.name}</div>
                    <div className="theme-kicker font-mono text-[11px] uppercase tracking-[0.18em]">
                      {room.kind}
                    </div>
                  </div>
                  <div className="theme-copy mt-2 text-xs">
                    baris {room.startLine}-{room.endLine} • complexity {room.complexity}
                  </div>
                </div>
              ))}
            </CustomScrollShell>
          </div>
        </div>
      ) : null}
    </section>
  );
}
