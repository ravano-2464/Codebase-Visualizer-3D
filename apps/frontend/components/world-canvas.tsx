"use client";

import { Canvas } from "@react-three/fiber";
import { Grid, Html, OrbitControls } from "@react-three/drei";
import { useState } from "react";
import { BuildingNode, ProjectWorld } from "../types/project";
import type { ThemeMode } from "./codebase-visualizer-app";

interface WorldCanvasProps {
  world: ProjectWorld | null;
  selectedBuildingId: number | null;
  onSelectBuilding: (buildingId: number | null) => void;
  theme: ThemeMode;
}

const BUILDING_COLORS: Record<string, string> = {
  ".css": "#7df9d6",
  ".go": "#7cc7ff",
  ".java": "#ffb766",
  ".js": "#ffd166",
  ".json": "#ff9f6e",
  ".md": "#f7a6c4",
  ".php": "#b39dff",
  ".py": "#75b8ff",
  ".rs": "#ffa97d",
  ".sql": "#8ff0b5",
  ".ts": "#64d2ff",
  ".tsx": "#34e1bf"
};

const getBuildingColor = (building: BuildingNode): string => {
  return BUILDING_COLORS[building.extension] ?? "#90d6ff";
};

const WORLD_PALETTE: Record<
  ThemeMode,
  {
    background: string;
    fog: string;
    floor: string;
    gridCell: string;
    gridSection: string;
    primaryLight: string;
    accentLight: string;
    roomColor: string;
    roomEmissive: string;
    roomSelectedColor: string;
    roomSelectedEmissive: string;
  }
> = {
  dark: {
    background: "#04131f",
    fog: "#04131f",
    floor: "#081722",
    gridCell: "#173447",
    gridSection: "#2dd4bf",
    primaryLight: "#f4fdff",
    accentLight: "#7df9d6",
    roomColor: "#d8fbff",
    roomEmissive: "#7df9d6",
    roomSelectedColor: "#fff2bf",
    roomSelectedEmissive: "#ffb766"
  },
  light: {
    background: "#eef7fb",
    fog: "#eef7fb",
    floor: "#ddebf2",
    gridCell: "#8fb6c7",
    gridSection: "#1695cb",
    primaryLight: "#ffffff",
    accentLight: "#8fdfff",
    roomColor: "#8ad4ff",
    roomEmissive: "#3fb9ea",
    roomSelectedColor: "#ffd59a",
    roomSelectedEmissive: "#d98b37"
  }
};

function BuildingMesh({
  building,
  isSelected,
  onSelect,
  theme
}: {
  building: BuildingNode;
  isSelected: boolean;
  onSelect: (buildingId: number) => void;
  theme: ThemeMode;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const color = getBuildingColor(building);
  const palette = WORLD_PALETTE[theme];

  return (
    <group position={[building.positionX, building.buildingHeight / 2, building.positionZ]}>
      <mesh
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelect(building.id);
        }}
        onPointerOut={() => {
          setIsHovered(false);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setIsHovered(true);
        }}
      >
        <boxGeometry args={[building.buildingWidth, building.buildingHeight, building.buildingDepth]} />
        <meshStandardMaterial
          color={color}
          metalness={0.08}
          opacity={isSelected ? 0.38 : 0.26}
          roughness={0.2}
          transparent
        />
      </mesh>

      <mesh position={[0, 0.04 - building.buildingHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[building.buildingWidth + 0.6, 0.08, building.buildingDepth + 0.6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} />
      </mesh>

      {building.rooms.map((room) => (
        <mesh
          key={room.id}
          castShadow
          position={[room.offsetX, room.offsetY, room.offsetZ]}
          receiveShadow
        >
          <boxGeometry args={[room.roomWidth, room.roomHeight, room.roomDepth]} />
          <meshStandardMaterial
            color={isSelected ? palette.roomSelectedColor : palette.roomColor}
            emissive={isSelected ? palette.roomSelectedEmissive : palette.roomEmissive}
            emissiveIntensity={isSelected ? 0.44 : 0.2}
            metalness={0.12}
            roughness={0.3}
          />
        </mesh>
      ))}

      {isHovered || isSelected ? (
        <Html center distanceFactor={18} position={[0, building.buildingHeight / 2 + 1.2, 0]}>
          <div className="theme-world-tooltip rounded-2xl px-3 py-2 text-center backdrop-blur-md">
            <div className="theme-heading text-sm font-semibold">{building.name}</div>
            <div className="theme-kicker mt-1 font-mono text-[11px] uppercase tracking-[0.16em]">
              {building.rooms.length} room • {building.loc} loc
            </div>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

export function WorldCanvas({
  world,
  selectedBuildingId,
  onSelectBuilding,
  theme
}: WorldCanvasProps) {
  const palette = WORLD_PALETTE[theme];

  return (
    <Canvas
      camera={{ fov: 52, position: [24, 18, 24] }}
      className="h-full w-full"
      gl={{ antialias: true }}
      onPointerMissed={() => onSelectBuilding(null)}
      style={{ height: "100%", width: "100%" }}
      shadows
    >
      <color args={[palette.background]} attach="background" />
      <fog args={[palette.fog, 30, 120]} attach="fog" />
      <ambientLight intensity={0.8} />
      <directionalLight
        castShadow
        color={palette.primaryLight}
        intensity={2.2}
        position={[20, 24, 12]}
      />
      <directionalLight color={palette.accentLight} intensity={1.1} position={[-16, 10, -20]} />

      <mesh position={[0, -0.02, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[280, 280]} />
        <meshStandardMaterial color={palette.floor} roughness={1} />
      </mesh>

      <Grid
        args={[240, 240]}
        cellColor={palette.gridCell}
        cellSize={2}
        fadeDistance={120}
        fadeStrength={1}
        infiniteGrid
        position={[0, 0.02, 0]}
        sectionColor={palette.gridSection}
        sectionSize={12}
      />

      {world?.buildings.map((building) => (
        <BuildingMesh
          key={building.id}
          building={building}
          isSelected={selectedBuildingId === building.id}
          onSelect={onSelectBuilding}
          theme={theme}
        />
      ))}

      <OrbitControls
        enableDamping
        enablePan
        maxDistance={90}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={14}
      />
    </Canvas>
  );
}
