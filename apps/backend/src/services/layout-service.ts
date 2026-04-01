import { LaidOutFile, LaidOutRoom, ParsedFile, ParsedRoom } from "../types";

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const layoutRooms = (
  functions: ParsedRoom[],
  buildingWidth: number,
  buildingDepth: number,
  preferredHeight: number
): { rooms: LaidOutRoom[]; requiredHeight: number } => {
  if (functions.length === 0) {
    return { rooms: [], requiredHeight: preferredHeight };
  }

  const usableWidth = Math.max(2.2, buildingWidth - 1.2);
  const usableDepth = Math.max(2.2, buildingDepth - 1.2);
  const columns = Math.max(1, Math.floor(usableWidth / 1.45));
  const rows = Math.max(1, Math.floor(usableDepth / 1.45));
  const perFloor = Math.max(1, columns * rows);
  const levels = Math.ceil(functions.length / perFloor);
  const requiredHeight = Math.max(preferredHeight, levels * 1.5 + 3.2);
  const cellWidth = usableWidth / columns;
  const cellDepth = usableDepth / rows;

  const rooms = functions.map((room, index) => {
    const floor = Math.floor(index / perFloor);
    const slot = index % perFloor;
    const row = Math.floor(slot / columns);
    const column = slot % columns;
    const roomWidth = clamp(0.78 + room.size * 0.03, 0.78, cellWidth - 0.14);
    const roomDepth = clamp(0.78 + room.complexity * 0.05, 0.78, cellDepth - 0.14);
    const roomHeight = clamp(0.68 + room.complexity * 0.08, 0.7, 1.35);

    return {
      ...room,
      roomWidth,
      roomDepth,
      roomHeight,
      offsetX: -usableWidth / 2 + cellWidth * (column + 0.5),
      offsetY: 0.9 + floor * 1.35,
      offsetZ: -usableDepth / 2 + cellDepth * (row + 0.5)
    };
  });

  return { rooms, requiredHeight };
};

export const createLayout = (files: ParsedFile[]): LaidOutFile[] => {
  const sortedFiles = [...files].sort((left, right) => {
    if (right.loc !== left.loc) {
      return right.loc - left.loc;
    }

    return left.path.localeCompare(right.path);
  });

  const columns = Math.max(1, Math.ceil(Math.sqrt(sortedFiles.length)));
  const rowCount = Math.max(1, Math.ceil(sortedFiles.length / columns));

  return sortedFiles.map((file, index) => {
    const baseWidth = clamp(3.6 + Math.min(file.functions.length, 12) * 0.22, 3.6, 7.4);
    const baseDepth = clamp(3.6 + Math.min(file.metrics.densityScore, 14) * 0.18, 3.6, 7.8);
    const preferredHeight = clamp(4.2 + file.loc * 0.08 + file.functions.length * 0.45, 4.2, 32);
    const { rooms, requiredHeight } = layoutRooms(
      file.functions,
      baseWidth,
      baseDepth,
      preferredHeight
    );
    const row = Math.floor(index / columns);
    const column = index % columns;
    const gap = 12;
    const xOffset = (columns - 1) / 2;
    const zOffset = (rowCount - 1) / 2;

    return {
      ...file,
      buildingWidth: baseWidth,
      buildingDepth: baseDepth,
      buildingHeight: requiredHeight,
      positionX: (column - xOffset) * gap,
      positionZ: (row - zOffset) * gap,
      rooms
    };
  });
};
