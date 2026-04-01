import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { Router } from "express";
import multer from "multer";
import slugify from "slugify";
import { pool } from "../db";
import { config } from "../config";
import { createLayout } from "../services/layout-service";
import { ensureTempDirectories, removeDirectorySafely } from "../services/file-system";
import { parseRepository } from "../services/parser-service";

const upload = multer({
  dest: config.uploadDir,
  limits: {
    fileSize: 200 * 1024 * 1024
  }
});

const buildProjectSlug = (projectName: string): string => {
  const base = slugify(projectName, { lower: true, strict: true }) || "codebase";
  return `${base}-${Date.now().toString(36)}`;
};

interface ProjectRow {
  id: number;
  name: string;
  slug: string;
  sourceFilename: string;
  status: string;
  totalFiles: number;
  totalFunctions: number;
  totalLoc: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const mapProjectRow = (row: ProjectRow): ProjectRow => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  sourceFilename: row.sourceFilename,
  status: row.status,
  totalFiles: row.totalFiles,
  totalFunctions: row.totalFunctions,
  totalLoc: row.totalLoc,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

export const projectsRouter = Router();

projectsRouter.get("/", async (_request, response, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        name,
        slug,
        source_filename AS "sourceFilename",
        status,
        total_files AS "totalFiles",
        total_functions AS "totalFunctions",
        total_loc AS "totalLoc",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM projects
      ORDER BY created_at DESC
    `);

    response.json({
      projects: rows.map(mapProjectRow)
    });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get("/:id/world", async (request, response, next) => {
  try {
    const { rows: projectRows } = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        source_filename AS "sourceFilename",
        status,
        total_files AS "totalFiles",
        total_functions AS "totalFunctions",
        total_loc AS "totalLoc",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM projects
      WHERE id = $1
      `,
      [request.params.id]
    );

    if (projectRows.length === 0) {
      response.status(404).json({ error: "Project tidak ditemukan." });
      return;
    }

    const project = mapProjectRow(projectRows[0]);
    const { rows: fileRows } = await pool.query(
      `
      SELECT
        id,
        project_id AS "projectId",
        path,
        name,
        extension,
        language,
        loc,
        building_height AS "buildingHeight",
        building_width AS "buildingWidth",
        building_depth AS "buildingDepth",
        position_x AS "positionX",
        position_z AS "positionZ",
        metrics
      FROM code_files
      WHERE project_id = $1
      ORDER BY loc DESC, path ASC
      `,
      [project.id]
    );
    const { rows: roomRows } = await pool.query(
      `
      SELECT
        id,
        file_id AS "fileId",
        name,
        kind,
        start_line AS "startLine",
        end_line AS "endLine",
        complexity,
        room_width AS "roomWidth",
        room_depth AS "roomDepth",
        room_height AS "roomHeight",
        offset_x AS "offsetX",
        offset_y AS "offsetY",
        offset_z AS "offsetZ"
      FROM code_functions
      WHERE file_id IN (
        SELECT id FROM code_files WHERE project_id = $1
      )
      ORDER BY file_id ASC, start_line ASC
      `,
      [project.id]
    );

    const roomsByFile = new Map<number, unknown[]>();

    for (const room of roomRows) {
      const fileId = Number(room.fileId);
      const currentRooms = roomsByFile.get(fileId) ?? [];
      currentRooms.push(room);
      roomsByFile.set(fileId, currentRooms);
    }

    response.json({
      project,
      stats: {
        totalFiles: project.totalFiles,
        totalFunctions: project.totalFunctions,
        totalLoc: project.totalLoc
      },
      buildings: fileRows.map((file) => ({
        ...file,
        rooms: roomsByFile.get(Number(file.id)) ?? []
      }))
    });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post("/upload", upload.single("repo"), async (request, response, next) => {
  if (!request.file) {
    response.status(400).json({ error: "File repo wajib diunggah." });
    return;
  }

  const fileExtension = path.extname(request.file.originalname).toLowerCase();

  if (fileExtension !== ".zip") {
    await fs.rm(request.file.path, { force: true });
    response.status(400).json({ error: "MVP ini menerima upload repo berbentuk file .zip." });
    return;
  }

  await ensureTempDirectories();

  const requestedLabel = typeof request.body.label === "string" ? request.body.label.trim() : "";
  const extractTarget = path.join(
    config.extractDir,
    `${Date.now().toString(36)}-${path.parse(request.file.originalname).name}`
  );

  try {
    const zip = new AdmZip(request.file.path);
    zip.extractAllTo(extractTarget, true);

    const parsedProject = await parseRepository(
      extractTarget,
      request.file.originalname,
      requestedLabel
    );

    if (parsedProject.files.length === 0) {
      response.status(422).json({
        error:
          "Repo berhasil diekstrak, tetapi tidak ada file teks/kode yang cocok untuk divisualkan."
      });
      return;
    }

    const laidOutFiles = createLayout(parsedProject.files);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const projectInsert = await client.query(
        `
        INSERT INTO projects (
          name,
          slug,
          source_filename,
          status,
          total_files,
          total_functions,
          total_loc,
          updated_at
        )
        VALUES ($1, $2, $3, 'ready', $4, $5, $6, NOW())
        RETURNING
          id,
          name,
          slug,
          source_filename AS "sourceFilename",
          status,
          total_files AS "totalFiles",
          total_functions AS "totalFunctions",
          total_loc AS "totalLoc",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        `,
        [
          parsedProject.name,
          buildProjectSlug(parsedProject.name),
          parsedProject.sourceFilename,
          parsedProject.stats.totalFiles,
          parsedProject.stats.totalFunctions,
          parsedProject.stats.totalLoc
        ]
      );

      const project = mapProjectRow(projectInsert.rows[0]);

      for (const file of laidOutFiles) {
        const fileInsert = await client.query(
          `
          INSERT INTO code_files (
            project_id,
            path,
            name,
            extension,
            language,
            loc,
            building_height,
            building_width,
            building_depth,
            position_x,
            position_z,
            metrics
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
          RETURNING id
          `,
          [
            project.id,
            file.path,
            file.name,
            file.extension,
            file.language,
            file.loc,
            file.buildingHeight,
            file.buildingWidth,
            file.buildingDepth,
            file.positionX,
            file.positionZ,
            JSON.stringify(file.metrics)
          ]
        );

        const fileId = Number(fileInsert.rows[0].id);

        for (const room of file.rooms) {
          await client.query(
            `
            INSERT INTO code_functions (
              file_id,
              name,
              kind,
              start_line,
              end_line,
              complexity,
              room_width,
              room_depth,
              room_height,
              offset_x,
              offset_y,
              offset_z
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `,
            [
              fileId,
              room.name,
              room.kind,
              room.startLine,
              room.endLine,
              room.complexity,
              room.roomWidth,
              room.roomDepth,
              room.roomHeight,
              room.offsetX,
              room.offsetY,
              room.offsetZ
            ]
          );
        }
      }

      await client.query("COMMIT");

      response.status(201).json({
        project
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  } finally {
    await fs.rm(request.file.path, { force: true });
    await removeDirectorySafely(extractTarget);
  }
});
