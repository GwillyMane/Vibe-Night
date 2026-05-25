import type { BlockMaterial } from "./physics/collisions";

export const WORLD = {
  width: 800,
  height: 520,
  wallThickness: 40,
  /** Distance from bottom of canvas to ground surface (top of ground slab). */
  groundInset: 36,
} as const;

export function worldGroundY(): number {
  return WORLD.height - WORLD.groundInset;
}

export type StructureBodyType = "dynamic" | "static" | "kinematic";
export type TargetShape = "circle" | "box";

export type BlockRole =
  | "support"
  | "beam"
  | "shelf"
  | "cage"
  | "bridge"
  | "weakPoint"
  | "weight"
  | "decor";

export type IntendedClearMethod = "directHit" | "collapse" | "crush" | "fall" | "chainReaction" | "roll";

export interface BlockLevelDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  material: BlockMaterial;
  bodyType: StructureBodyType;
  density?: number;
  friction?: number;
  frictionStatic?: number;
  restitution?: number;
  breakable?: boolean;
  breakThreshold?: number;
  health?: number;
  renderStyle?: string;
  /** Authoring hint — not read by Matter.js. */
  role?: BlockRole;
}

export interface TargetLevelDef {
  id: string;
  x: number;
  y: number;
  shape: TargetShape;
  radius?: number;
  width?: number;
  height?: number;
  rotation?: number;
  targetSkin?: string;
  targetType?: string;
  density?: number;
  friction?: number;
  frictionStatic?: number;
  restitution?: number;
  clearImpactThreshold: number;
  clearCrushThreshold: number;
  clearIfFallsBelowY: number;
  clearJoltAngular?: number;
  supportedBy?: string[];
  supportHint?: string;
  intendedClearMethod?: IntendedClearMethod;
}

export interface PlatformLevelDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export type LevelDifficulty = "tutorial" | "easy" | "medium" | "hard" | "expert";

export type LevelChapter = "basics" | "collapse" | "materials" | "expert";

export interface PhysicsLevelDefinition {
  id: string;
  /** 1-based display order */
  number: number;
  shortName: string;
  name: string;
  description: string;
  theme: string;
  chapter: LevelChapter;
  difficulty: LevelDifficulty;
  availableShots: number;
  parShots: number;
  starThresholds: { twoStarsMin: number; threeStarsMin: number };
  slingRest: { x: number; y: number };
  projectileSpawn?: { x: number; y: number };
  blocks: BlockLevelDef[];
  targets: TargetLevelDef[];
  platforms?: PlatformLevelDef[];
  hint?: string;
}

export type ChallengeKind = "handcrafted" | "daily";

export interface ActiveChallenge {
  kind: ChallengeKind;
  /** Resolved handcrafted layout id `"1"`…`"20"`. */
  levelId: string;
  seed: string;
}
