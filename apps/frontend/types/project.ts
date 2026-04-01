export interface RoomNode {
  id: number;
  fileId: number;
  name: string;
  kind: string;
  startLine: number;
  endLine: number;
  complexity: number;
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
}

export interface BuildingNode {
  id: number;
  projectId: number;
  path: string;
  name: string;
  extension: string;
  language: string;
  loc: number;
  buildingHeight: number;
  buildingWidth: number;
  buildingDepth: number;
  positionX: number;
  positionZ: number;
  metrics: {
    functionCount: number;
    commentLines: number;
    branchingSignals: number;
    densityScore: number;
  };
  rooms: RoomNode[];
}

export interface ProjectSummary {
  id: number;
  name: string;
  slug: string;
  sourceFilename: string;
  status: string;
  totalFiles: number;
  totalFunctions: number;
  totalLoc: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWorld {
  project: ProjectSummary;
  stats: {
    totalFiles: number;
    totalFunctions: number;
    totalLoc: number;
  };
  buildings: BuildingNode[];
}
