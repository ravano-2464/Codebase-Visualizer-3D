import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".github",
  ".idea",
  ".next",
  ".nuxt",
  ".turbo",
  ".vscode",
  "__MACOSX",
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
  "venv",
  ".venv"
]);

const TEXT_EXTENSIONS = new Set([
  ".astro",
  ".bash",
  ".c",
  ".cc",
  ".cfg",
  ".conf",
  ".cpp",
  ".cs",
  ".css",
  ".cts",
  ".cjs",
  ".go",
  ".graphql",
  ".h",
  ".hpp",
  ".html",
  ".java",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".php",
  ".ps1",
  ".py",
  ".rb",
  ".rs",
  ".scss",
  ".sh",
  ".sql",
  ".svg",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml"
]);

const TEXT_FILENAMES = new Set([
  ".env",
  ".env.example",
  ".gitignore",
  "Dockerfile",
  "Makefile",
  "README",
  "README.md"
]);

export const ensureTempDirectories = async (): Promise<void> => {
  await fs.mkdir(config.uploadDir, { recursive: true });
  await fs.mkdir(config.extractDir, { recursive: true });
};

export const removeDirectorySafely = async (targetPath: string): Promise<void> => {
  if (!targetPath.startsWith(config.extractDir)) {
    return;
  }

  await fs.rm(targetPath, { recursive: true, force: true });
};

const isTextLikeFile = (filename: string): boolean => {
  const extension = path.extname(filename).toLowerCase();
  return TEXT_EXTENSIONS.has(extension) || TEXT_FILENAMES.has(filename);
};

export const resolveRepositoryRoot = async (extractedRoot: string): Promise<string> => {
  const entries = await fs.readdir(extractedRoot, { withFileTypes: true });
  const visibleEntries = entries.filter((entry) => entry.name !== "__MACOSX");

  if (visibleEntries.length === 1 && visibleEntries[0]?.isDirectory()) {
    return path.join(extractedRoot, visibleEntries[0].name);
  }

  return extractedRoot;
};

export const collectCandidateFiles = async (rootDirectory: string): Promise<string[]> => {
  const files: string[] = [];

  const walk = async (currentDirectory: string): Promise<void> => {
    const entries = await fs.readdir(currentDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }

      const fullPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          await walk(fullPath);
        }

        continue;
      }

      if (entry.isFile() && isTextLikeFile(entry.name)) {
        files.push(fullPath);
      }
    }
  };

  await walk(rootDirectory);

  return files;
};
