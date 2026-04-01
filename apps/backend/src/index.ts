import express from "express";
import cors from "cors";
import { config } from "./config";
import { initializeDatabase, pool } from "./db";
import { ensureTempDirectories } from "./services/file-system";
import { projectsRouter } from "./routes/projects";

const startServer = async (): Promise<void> => {
  await ensureTempDirectories();
  await initializeDatabase();

  const app = express();

  app.use(
    cors({
      origin: config.frontendUrl
    })
  );
  app.use(express.json({ limit: "4mb" }));

  app.get("/api/health", async (_request, response, next) => {
    try {
      await pool.query("SELECT 1");
      response.json({
        status: "ok"
      });
    } catch (error) {
      next(error);
    }
  });

  app.use("/api/projects", projectsRouter);

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
    ) => {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan internal.";
      console.error(error);
      response.status(500).json({ error: message });
    }
  );

  app.listen(config.port, () => {
    console.log(`Backend berjalan di http://localhost:${config.port}`);
  });
};

startServer().catch((error) => {
  console.error("Gagal menyalakan server backend.", error);
  process.exit(1);
});
