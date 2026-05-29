import type { ProfileTitleDef } from "../catalog";
import { buildGameTitles } from "./buildGameTitles";
import { META_TITLES } from "./metaTitles";

export { buildGameTitles } from "./buildGameTitles";
export { GAME_TITLE_LABELS, gameTitleId, gameTitleLabel } from "./gameTitleLabels";
export { META_TITLES } from "./metaTitles";

/** Maps deprecated profile title ids to new catalog ids. */
export const LEGACY_TITLE_MIGRATIONS: Record<string, string> = {
  "bloom-keeper": "garden-golden-ecosystem",
  "chaos-catcher": "catch-legendary-catch",
  "golden-stacker": "merge-merge-legend",
  "garden-guardian": "garden-master-gardener",
  "crash-architect": "crashers-full-tour",
  "combo-hunter": "combo-hunter",
  "flow-survivor": "flow-survivor",
  "legendary-viber": "legendary-viber",
  "arcade-architect": "arcade-architect",
};

const DEFAULT_TITLE: ProfileTitleDef = {
  id: "vibe-night-regular",
  label: "Vibe Night Regular",
  rarity: "common",
  category: "meta",
  defaultOwned: true,
  unlockRule: "default",
};

export const PROFILE_TITLES: ProfileTitleDef[] = [
  DEFAULT_TITLE,
  ...buildGameTitles(),
  ...META_TITLES,
];

export function resolveTitleId(id: string): string {
  return LEGACY_TITLE_MIGRATIONS[id] ?? id;
}

export function titleByIdResolved(id: string): ProfileTitleDef | undefined {
  const resolved = resolveTitleId(id);
  return PROFILE_TITLES.find((t) => t.id === resolved);
}
