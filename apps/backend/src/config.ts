import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const resolveAppPath = (rawValue: string | undefined, fallback: string): string => {
  return path.resolve(process.cwd(), rawValue ?? fallback);
};

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:FerariF12@localhost:5432/codebase_visualizer",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  uploadDir: resolveAppPath(process.env.UPLOAD_DIR, "tmp/uploads"),
  extractDir: resolveAppPath(process.env.EXTRACT_DIR, "tmp/extracted")
};
