import { GVC_COLOR_COUNT } from "@/lib/assets/gvcLibraryFaces";



export const SHIFT_GAME_ID = "vibe-shift" as const;

export const SHIFT_LEVEL_ID = "shift";

export const PRODUCT_TITLE = "VIBE SHIFT";



export const GRID_ROWS = 6;
export const GRID_COLS = 6;

export const COLOR_COUNT = GVC_COLOR_COUNT;



export const CLASSIC_LEVEL_COUNT = 10;

/** Cumulative score required to complete each level (index 0 = level 1). */

export const CLASSIC_LEVEL_TARGETS = [600, 1400, 2400, 3600, 5000, 6600, 8400, 10400, 12800, 15500] as const;



export const DAILY_MOVE_BUDGET = 35;



export const POINTS_PER_CELL = 25;

export const CASCADE_MULT_STEP = 0.35;

export const MAX_CASCADE_MULT = 4;

export const LINE_BONUS_4 = 40;
export const LINE_BONUS_5 = 80;
export const SQUARE_BONUS_2 = 55;
export const SQUARE_BONUS_3 = 110;



export const BOARD_GEN_MAX_RETRIES = 8;

export const SHIFT_BOARD_SIZE = 640;



export type ShiftColorId = 0 | 1 | 2 | 3 | 4 | 5;

export type ShiftMode = "classic" | "daily";


