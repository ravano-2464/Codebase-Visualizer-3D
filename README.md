# 🏙️ Codebase Visualizer 3D

> Upload a `.zip` repository, transform its structure into a 3D world, and explore files as buildings and functions as rooms.

Codebase Visualizer 3D is an MVP designed to help developers understand a codebase visually. Instead of reading a flat folder structure, this app translates a repository into a 3D city: files become buildings, functions become rooms, and code metrics shape scale, density, and spatial layout.

## 🧰 Full Tech Stack Used In This Project

![Next.js](https://img.shields.io/badge/Next.js-16.2.1-111111?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.4-149ECA?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.2-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.183.2-111111?style=for-the-badge&logo=threedotjs&logoColor=white)
![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-9.5.0-1F6FEB?style=for-the-badge&logo=react&logoColor=white)
![Drei](https://img.shields.io/badge/Drei-10.7.7-0F172A?style=for-the-badge&logo=storybook&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2.1-222222?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Babel Parser](https://img.shields.io/badge/Babel_Parser-AST_Flow-F9DC3E?style=for-the-badge&logo=babel&logoColor=111111)
![Multer](https://img.shields.io/badge/Multer-Uploads-7C3AED?style=for-the-badge)
![AdmZip](https://img.shields.io/badge/AdmZip-Archive_Extraction-F97316?style=for-the-badge)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=for-the-badge)
![Dotenv](https://img.shields.io/badge/Dotenv-Config-ECD53F?style=for-the-badge&logo=dotenv&logoColor=111111)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-Database_Setup-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![npm Workspaces](https://img.shields.io/badge/npm_Workspaces-Monorepo-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![Concurrently](https://img.shields.io/badge/Concurrently-Parallel_Dev-9333EA?style=for-the-badge)
![ESLint](https://img.shields.io/badge/ESLint-9.39.4-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-3.8.1-F7B93E?style=for-the-badge&logo=prettier&logoColor=111111)

## ✨ Why This Project Is Interesting

- It helps developers onboard into large codebases through visual exploration.
- It makes file size, structure, and function density easier to understand at a glance.
- It creates a strong foundation for future features such as dependency maps, complexity heatmaps, and code health visualization.
- It works well as an internal engineering tool, a developer-experience product prototype, or a technical showcase project.

## 🎯 Core Mapping Concept

- `1 file = 1 building`
- `1 function / method = 1 room`
- `LOC + function count = building height and volume`
- `function complexity = room size`
- `file extension / language = building color`

With this mapping, the skyline itself becomes a fast visual signal for where the codebase is large, dense, or potentially complex.

## 🧱 Architecture Overview

```text
User
  |
  v
Frontend (Next.js + React + React Three Fiber)
  |
  v
Backend API (Node.js + Express)
  |
  +--> Upload .zip repository
  +--> Extract archive
  +--> Parse files and functions
  +--> Generate 3D layout metadata
  |
  v
PostgreSQL
  |
  v
Frontend fetches world data and renders the 3D city
```

## 🧭 Current MVP Features

- Upload a repository in `.zip` format
- Parse source code and text files that are relevant for visualization
- Detect functions and methods from multiple languages
- Store project metadata in PostgreSQL
- Browse previously uploaded projects
- Inspect building and room details
- Render an interactive 3D world with orbit controls
- Show project stats such as total files, total functions, and total LOC

## 🔄 End-to-End Flow

1. A user uploads a repository as a `.zip` file.
2. The backend stores the uploaded file in a temporary directory.
3. The archive is extracted into a temporary workspace.
4. The parser scans relevant source and text files.
5. Each file is analyzed and assigned lightweight metrics.
6. Functions and methods are converted into room data.
7. The layout engine computes building positions and room placement.
8. Project, file, and function metadata are saved to PostgreSQL.
9. The frontend fetches the world data and renders it in a 3D scene.

## 🧠 Parsing Strategy

### 🌳 JavaScript / TypeScript

JavaScript and TypeScript parsing currently uses Babel AST tools for higher accuracy.

Detected node types include:

- function declarations
- arrow functions
- function expressions
- class methods
- private methods
- object methods

### 🔎 Other Languages

The following languages are currently supported through lightweight regex heuristics:

- Python
- Go
- Rust
- PHP
- Ruby
- Java
- C#
- C / C++

### 📝 Text-Like Files That Still Become Buildings

Even without detected functions, these files can still appear as shell buildings:

- Markdown
- JSON
- YAML
- SQL
- HTML / CSS
- other text-like files that pass the parser filters

### 🚫 Files And Directories That Are Ignored

- directories such as `node_modules`, `.git`, `dist`, `build`, `coverage`, and `.next`
- binary files
- files that exceed the lightweight parser limits

## 🧮 How The 3D World Is Generated

- Building height is based on a combination of `LOC` and function count.
- Building width and depth are influenced by function count and density score.
- Rooms are arranged in internal grid layers inside each building.
- Larger or denser files naturally become more dominant in the skyline.
- Building color is derived from file extension so file categories are easier to identify.

## 🗂️ Project Structure

```text
📦 Codebase Visualizer 3D
├── 📁 apps
│   ├── 📁 backend
│   │   ├── 📁 src
│   │   │   ├── 📁 routes
│   │   │   │   └── 📄 projects.ts
│   │   │   ├── 📁 services
│   │   │   │   ├── 📄 file-system.ts
│   │   │   │   ├── 📄 layout-service.ts
│   │   │   │   └── 📄 parser-service.ts
│   │   │   ├── 📄 config.ts
│   │   │   ├── 📄 db.ts
│   │   │   ├── 📄 index.ts
│   │   │   └── 📄 types.ts
│   │   ├── 📄 eslint.config.mjs
│   │   ├── ⚙️ package.json
│   │   └── ⚙️ tsconfig.json
│   └── 📁 frontend
│       ├── 📁 app
│       │   ├── 🎨 globals.css
│       │   ├── 📄 layout.tsx
│       │   └── 📄 page.tsx
│       ├── 📁 components
│       │   ├── 📄 codebase-visualizer-app.tsx
│       │   ├── 📄 custom-scroll-shell.tsx
│       │   ├── 📄 floating-page-scrollbar.tsx
│       │   ├── 📄 project-details.tsx
│       │   ├── 📄 project-list.tsx
│       │   ├── 📄 project-stats.tsx
│       │   ├── 📄 upload-card.tsx
│       │   └── 📄 world-canvas.tsx
│       ├── 📁 lib
│       │   ├── 📄 api.ts
│       │   └── 📄 utils.ts
│       ├── 📁 public
│       │   └── 📁 images
│       │       └── 🖼️ Icon.webp
│       ├── 📁 types
│       │   └── 📄 project.ts
│       ├── ⚙️ .env.example
│       ├── 📄 eslint.config.mjs
│       ├── 📄 next-env.d.ts
│       ├── 📄 next.config.ts
│       ├── ⚙️ package.json
│       ├── 📄 postcss.config.mjs
│       └── ⚙️ tsconfig.json
├── 📁 db
│   └── 📄 schema.sql
├── 📁 public
│   └── 📁 images
│       └── 🖼️ Icon.webp
├── ⚙️ .gitignore
├── ⚙️ .prettierignore
├── ⚙️ .prettierrc.json
├── 📝 README.md
├── ⚙️ docker-compose.yml
└── ⚙️ package.json
```

## 📁 Important Directories

- `apps/frontend`
  Contains the upload UI, project list, inspector, stats, and 3D renderer.
- `apps/backend`
  Contains the upload API, extraction flow, parser logic, layout generation, and persistence logic.
- `db/schema.sql`
  Contains the reference PostgreSQL schema for manual setup or inspection.

## ⚙️ Prerequisites

- Node.js
- npm
- PostgreSQL

`docker compose` is optional, but recommended for getting PostgreSQL running quickly.

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Prepare environment files

PowerShell:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/frontend/.env.example apps/frontend/.env.local
```

### 3. Start PostgreSQL

If you use Docker:

```bash
docker compose up -d
```

If you use a local PostgreSQL installation, make sure the following values exist:

- database: `codebase_visualizer`
- user: `postgres`
- password: `FerariF12`

You can change these values in your `.env` files if needed.

### 4. Start the app

```bash
npm run dev
```

### 5. Open the app

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## 🔑 Environment Variables

### 🛠️ Backend `.env`

| Variable       | Default                                                              | Description                      |
| -------------- | -------------------------------------------------------------------- | -------------------------------- |
| `PORT`         | `4000`                                                               | Express server port              |
| `DATABASE_URL` | `postgresql://postgres:FerariF12@localhost:5432/codebase_visualizer` | PostgreSQL connection string     |
| `FRONTEND_URL` | `http://localhost:3000`                                              | Allowed frontend origin for CORS |
| `UPLOAD_DIR`   | `./tmp/uploads`                                                      | Temporary upload directory       |
| `EXTRACT_DIR`  | `./tmp/extracted`                                                    | Temporary extraction directory   |

### 🖥️ Frontend `.env.local`

| Variable              | Default                 | Description          |
| --------------------- | ----------------------- | -------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API base URL |

## 🗃️ Database Model

This project currently uses three main entities:

- `projects`
  Stores project-level metadata for each uploaded repository.
- `code_files`
  Stores file-level building data.
- `code_functions`
  Stores function-level room data.

The SQL schema is available in [`db/schema.sql`](db/schema.sql).

Notes:

- The backend also initializes tables automatically on startup.
- The SQL file is still included for reference and manual provisioning.

## 🔌 API Endpoints

### ❤️ `GET /api/health`

Checks backend and database availability.

### 📚 `GET /api/projects`

Returns the list of uploaded projects.

### 🌍 `GET /api/projects/:id/world`

Returns the full world payload for a project, including:

- project metadata
- project stats
- buildings
- rooms for each building

### ⬆️ `POST /api/projects/upload`

Uploads a repository as `multipart/form-data`.

Expected fields:

- `repo`: repository ZIP file
- `label`: optional custom project name

## 🧪 Development Commands

### 🟣 Root workspace

```bash
npm run dev
npm run lint
npm run format
npm run format:check
npm run build
npm run typecheck
```

### 🔵 Frontend only

```bash
npm run dev -w apps/frontend
npm run lint -w apps/frontend
npm run build -w apps/frontend
npm run typecheck -w apps/frontend
```

### 🟢 Backend only

```bash
npm run dev -w apps/backend
npm run lint -w apps/backend
npm run build -w apps/backend
npm run typecheck -w apps/backend
```

## 🖼️ Current UI Experience

- a landing dashboard that introduces the visualization concept
- a ZIP upload card for repository ingestion
- project history browsing
- live project stats
- building inspector with room details
- a 3D canvas with orbit controls, ground grid, hover feedback, and building highlights

## ⚠️ Current MVP Limitations

- Only `.zip` repository uploads are supported right now.
- JavaScript and TypeScript have the most accurate parsing at the moment.
- Other languages still rely on regex heuristics and are less accurate than AST-based parsing.
- There is no authentication or multi-user isolation yet.
- There is no background job queue for large repositories.
- There is no dependency graph or file relationship visualization yet.
- Commit history, ownership, and test coverage overlays are not implemented yet.

## 🛣️ Suggested Roadmap

- Add local folder upload or Git URL ingestion
- Add a worker queue so large repository parsing does not block the main request cycle
- Improve deep parsing for Python, Java, Go, and Rust
- Add minimap, search, and extension or folder filters
- Add complexity heatmaps and dependency edges between buildings
- Add collaborative exploration features for engineering teams

## 🤝 Good Future Directions

This project can grow into:

- an internal engineering portal
- a visual architecture explorer
- a developer onboarding tool
- a code health observability dashboard
- an interactive technical demo or portfolio project

## 📌 Project Status

This project is currently in a working MVP stage focused on:

- repository upload
- basic codebase parsing
- metadata persistence
- interactive 3D visualization

If you want to continue building on top of it, the highest-leverage next steps are usually:

1. more accurate parsers
2. upload progress and parsing progress feedback
3. dependency visualization
4. direct Git repository support
