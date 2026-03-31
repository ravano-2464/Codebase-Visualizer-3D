"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { fetchProjects, fetchWorld, uploadProject } from "../lib/api";
import { cn } from "../lib/utils";
import { BuildingNode, ProjectSummary, ProjectWorld } from "../types/project";
import { ProjectDetails } from "./project-details";
import { ProjectList } from "./project-list";
import { ProjectStats } from "./project-stats";
import { UploadCard } from "./upload-card";

const THEME_STORAGE_KEY = "cv3d-theme";

export type ThemeMode = "light" | "dark";

const WorldCanvas = dynamic(
  () => import("./world-canvas").then((module) => module.WorldCanvas),
  {
    loading: () => (
      <div className="theme-soft flex h-full min-h-[620px] items-center justify-center text-sm">
        Menyiapkan viewport 3D...
      </div>
    ),
    ssr: false
  }
);

export function CodebaseVisualizerApp() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [world, setWorld] = useState<ProjectWorld | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [projectLabel, setProjectLabel] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isWorldLoading, setIsWorldLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [theme, setTheme] = useState<ThemeMode | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const rootTheme = document.documentElement.dataset.theme;
    const resolvedTheme: ThemeMode = rootTheme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = resolvedTheme;
    setTheme(resolvedTheme);
  }, []);

  useEffect(() => {
    if (!theme) {
      return;
    }

    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setIsLoadingProjects(true);

      try {
        const loadedProjects = await fetchProjects();

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setProjects(loadedProjects);
          setSelectedProjectId((current) => current ?? loadedProjects[0]?.id ?? null);
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Gagal memuat project.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProjects(false);
        }
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [startTransition]);

  useEffect(() => {
    if (!selectedProjectId) {
      setWorld(null);
      return;
    }

    let cancelled = false;

    const loadWorld = async () => {
      setIsWorldLoading(true);
      setSelectedBuildingId(null);

      try {
        const payload = await fetchWorld(selectedProjectId);

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setWorld(payload);
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Gagal memuat dunia 3D.");
        }
      } finally {
        if (!cancelled) {
          setIsWorldLoading(false);
        }
      }
    };

    void loadWorld();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, startTransition]);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Pilih file .zip repo terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const createdProject = await uploadProject(selectedFile, projectLabel);
      const refreshedProjects = await fetchProjects();

      startTransition(() => {
        setProjects(refreshedProjects);
        setSelectedProjectId(createdProject.id);
        setSelectedBuildingId(null);
        setProjectLabel("");
        setSelectedFile(null);
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload repo gagal.");
    } finally {
      setIsUploading(false);
    }
  };

  const selectedBuilding: BuildingNode | null =
    world?.buildings.find((building) => building.id === selectedBuildingId) ?? null;
  const resolvedTheme = theme ?? "dark";

  return (
    <main className="min-h-screen px-4 py-5 lg:px-6 lg:py-6">
      <div className="mx-auto max-w-[1680px]">
        <header className="panel panel-strong mb-6 rounded-[34px] p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="theme-kicker font-mono text-xs uppercase tracking-[0.32em]">
                Codebase Visualizer 3D
              </p>
              <h1 className="theme-heading mt-3 max-w-4xl text-4xl font-semibold leading-tight lg:text-6xl">
                Upload repo lalu ubah struktur kode jadi dunia 3D yang bisa dijelajahi.
              </h1>
              <p className="theme-copy mt-4 max-w-2xl text-base leading-7 lg:text-lg">
                Setiap file divisualkan sebagai gedung, setiap fungsi menjadi room, dan seluruh
                codebase tersusun seperti kota modular dengan statistik yang bisa dibaca cepat.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="theme-toggle">
                  {(["light", "dark"] as ThemeMode[]).map((mode) => (
                    <button
                      key={mode}
                      className={cn("theme-toggle-option font-mono text-xs uppercase tracking-[0.18em]", resolvedTheme === mode && "is-active")}
                      onClick={() => setTheme(mode)}
                      type="button"
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="theme-surface-card rounded-[24px] p-4">
                  <div className="theme-kicker font-mono text-xs uppercase tracking-[0.2em]">
                    Mode
                  </div>
                  <div className="theme-heading mt-3 text-lg font-semibold">Repo zip upload</div>
                </div>
                <div className="theme-surface-card rounded-[24px] p-4">
                  <div className="theme-kicker font-mono text-xs uppercase tracking-[0.2em]">
                    Backend
                  </div>
                  <div className="theme-heading mt-3 text-lg font-semibold">Express + PostgreSQL</div>
                </div>
                <div className="theme-surface-card rounded-[24px] p-4">
                  <div className="theme-kicker font-mono text-xs uppercase tracking-[0.2em]">
                    Renderer
                  </div>
                  <div className="theme-heading mt-3 text-lg font-semibold">React Three Fiber</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
          <div className="space-y-6">
            <UploadCard
              errorMessage={errorMessage}
              isUploading={isUploading}
              label={projectLabel}
              onFileChange={(file) => {
                setSelectedFile(file);
                if (errorMessage) {
                  setErrorMessage(null);
                }
              }}
              onLabelChange={setProjectLabel}
              onSubmit={handleUpload}
              selectedFileName={selectedFile?.name ?? ""}
            />

            <ProjectList
              activeProjectId={selectedProjectId}
              isLoading={isLoadingProjects}
              onSelect={(projectId) => {
                setErrorMessage(null);
                setSelectedProjectId(projectId);
              }}
              projects={projects}
            />

            <ProjectDetails selectedBuilding={selectedBuilding} world={world} />
          </div>

          <div className="space-y-6">
            <ProjectStats isLoading={isWorldLoading || isPending} world={world} />

            <section className="panel panel-strong relative h-[560px] overflow-hidden rounded-[34px] md:h-[680px] xl:h-[calc(100vh-220px)] xl:min-h-[720px]">
              <div className="theme-scene-halo pointer-events-none absolute inset-x-0 top-0 h-40" />

              <div className="pointer-events-none absolute left-5 top-5 z-10 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-3">
                <div className="theme-overlay-chip rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] backdrop-blur-xl">
                  {world ? world.project.name : "No active world"}
                </div>
                <div className="theme-overlay-chip rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] backdrop-blur-xl">
                  {world?.buildings.length ?? 0} buildings rendered
                </div>
              </div>

              {(isWorldLoading || isPending) && world ? (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-5">
                  <div className="theme-overlay-chip rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] backdrop-blur-xl">
                    Menyusun ulang skyline...
                  </div>
                </div>
              ) : null}

              {!world ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
                  <div className="theme-world-empty max-w-xl rounded-[30px] px-8 py-7 text-center shadow-2xl backdrop-blur-xl">
                    <div className="theme-kicker font-mono text-xs uppercase tracking-[0.28em]">
                      Standby
                    </div>
                    <div className="theme-heading mt-4 text-2xl font-semibold leading-tight">
                      Upload repo atau pilih project untuk membangun dunia 3D.
                    </div>
                    <p className="theme-copy mt-3 text-sm leading-6">
                      Setelah project aktif, skyline file dan room fungsi akan langsung mengisi
                      viewport ini secara penuh.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="absolute inset-0">
                <WorldCanvas
                  onSelectBuilding={setSelectedBuildingId}
                  selectedBuildingId={selectedBuildingId}
                  theme={resolvedTheme}
                  world={world}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
