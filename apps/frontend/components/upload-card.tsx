"use client";

import { FormEvent } from "react";

interface UploadCardProps {
  label: string;
  selectedFileName: string;
  isUploading: boolean;
  errorMessage: string | null;
  onLabelChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function UploadCard({
  label,
  selectedFileName,
  isUploading,
  errorMessage,
  onLabelChange,
  onFileChange,
  onSubmit
}: UploadCardProps) {
  return (
    <section className="panel panel-strong rounded-[28px] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="theme-kicker font-mono text-xs uppercase tracking-[0.28em]">
            Repo Intake
          </p>
          <h2 className="theme-heading mt-2 text-2xl font-semibold">Upload repo jadi kota 3D</h2>
        </div>
        <div className="theme-pill-accent rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em]">
          Zip only
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="theme-copy mb-2 block text-sm">Nama dunia</span>
          <input
            className="theme-input w-full rounded-2xl px-4 py-3 outline-none"
            placeholder="Misalnya: Dashboard Monorepo"
            value={label}
            onChange={(event) => onLabelChange(event.target.value)}
          />
        </label>

        <label className="theme-dropzone block cursor-pointer rounded-[24px] px-4 py-5">
          <span className="theme-kicker font-mono text-xs uppercase tracking-[0.24em]">
            Klik untuk pilih file .zip
          </span>
          <p className="theme-copy mt-2 text-sm">
            Kompres repo kamu ke `.zip`, lalu upload di sini untuk diparse.
          </p>
          <p className="mt-3 text-sm" style={{ color: "var(--accent)" }}>
            {selectedFileName || "Belum ada file dipilih"}
          </p>
          <input
            className="hidden"
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
        </label>

        {errorMessage ? (
          <div className="theme-error rounded-2xl px-4 py-3 text-sm">
            {errorMessage}
          </div>
        ) : null}

        <button
          className="theme-primary-button w-full rounded-2xl px-4 py-3 font-semibold transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isUploading}
          type="submit"
        >
          {isUploading ? "Mengubah repo jadi kota..." : "Generate dunia 3D"}
        </button>
      </form>
    </section>
  );
}
