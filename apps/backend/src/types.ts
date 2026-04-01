export interface ParsedRoom {
  name: string;
  kind: string;
  startLine: number;
  endLine: number;
  size: number;
  complexity: number;
}

export interface ParsedFileMetrics {
  functionCount: number;
  commentLines: number;
  branchingSignals: number;
  densityScore: number;
}

export interface ParsedFile {
  path: string;
  name: string;
  extension: string;
  language: string;
  loc: number;
  metrics: ParsedFileMetrics;
  functions: ParsedRoom[];
}

export interface ParsedProject {
  name: string;
  sourceFilename: string;
  files: ParsedFile[];
  stats: {
    totalFiles: number;
    totalFunctions: number;
    totalLoc: number;
  };
}

export interface LaidOutRoom extends ParsedRoom {
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
}

export interface LaidOutFile extends Omit<ParsedFile, "functions"> {
  buildingHeight: number;
  buildingWidth: number;
  buildingDepth: number;
  positionX: number;
  positionZ: number;
  rooms: LaidOutRoom[];
}
