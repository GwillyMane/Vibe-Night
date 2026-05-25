import badgeUrls from "../public/gvc-brand-badges.json";

type BadgeUrlMap = Record<string, string>;
const GVC_BADGE_URLS = badgeUrls as BadgeUrlMap;

/** Vibe Crashers — 10 unlockable badges */
export const ACHIEVEMENT_BADGE_FILENAME: Record<string, string> = {
  "first-launch": "full_send_maverick.webp",
  "first-clear": "checkmate.webp",
  "five-clear": "five_badges.webp",
  "combo-cleanse": "power_duo.webp",
  "daily-viber": "seas_the_day.webp",
  "three-star-vibe": "gold_member.webp",
  "one-shot-wonder": "one_of_one.webp",
  "ten-clear": "ten_badges.webp",
  "structure-breaker": "toy_bricks.webp",
  "full-tour": "the_completionist.webp",
};

/** Big Vibes — 10 unlockable badges */
export const MERGE_ACHIEVEMENT_BADGE_FILENAME: Record<string, string> = {
  "merge-first": "any_gvc.webp",
  "merge-combo-3": "gradient_high_five.webp",
  "merge-gold": "vibestr_pink_tier.webp",
  "merge-daily": "showtime.webp",
  "merge-vibefoot": "vibefoot_fan_club.webp",
  "merge-chill": "flow_state.webp",
  "merge-10k": "gamer.webp",
  "merge-candy": "electric_rings.webp",
  "merge-50k": "thirty_badges.webp",
  "merge-legend": "vibestr_cosmic_tier.webp",
};

/** Vibe Garden — 10 unlockable badges */
export const GARDEN_ACHIEVEMENT_BADGE_FILENAME: Record<string, string> = {
  "first-bloom": "plants.webp",
  "zen-cultivator": "robot_high_five.webp",
  "garden-chain-5": "gradient_hatrick.webp",
  "chain-10": "gradient_lover.webp",
  "corruption-survivor": "science_goggles.webp",
  "golden-ecosystem": "vibestr_gold_tier.webp",
  "master-gardener": "king.webp",
  "garden-score-10k": "unfathomable_vibes.webp",
  "perfect-stabilization": "cosmic_guardian.webp",
  "legendary-cascade": "elite_rainbow_ranger.webp",
};

/** Catch A Vibe — 10 unlockable badges */
export const CATCH_ACHIEVEMENT_BADGE_FILENAME: Record<string, string> = {
  "first-catch": "fur_the_win.webp",
  "zen-flow": "zoom_in_vibe_out.webp",
  "bad-dodger": "shadow_funk_division.webp",
  "perfect-wave": "surfer.webp",
  "bloom-frenzy": "sugar_rush.webp",
  "golden-cascade": "highkeymoments_1.webp",
  "catch-combo-15": "varsity_vibes.webp",
  "catch-score-5k": "vibetown_baller.webp",
  "combo-25": "hail_mary_heroes.webp",
  "legendary-catch": "fifty_badges.webp",
};

/** Vibe Shift — 10 unlockable badges */
export const SHIFT_ACHIEVEMENT_BADGE_FILENAME: Record<string, string> = {
  "first-shift": "rack_em_up.webp",
  "cascade-3": "full_throttle.webp",
  "level-5": "mountain_goat.webp",
  "classic-win": "captain.webp",
  "daily-5k": "high_noon_hustler.webp",
  "cascade-5": "funky_fresh.webp",
  "daily-regular": "yin_n_yang.webp",
  "classic-3k": "rainbow_boombox.webp",
  "clear-100": "patch_powerhouse.webp",
  "shift-legend": "vibestr_diamond_tier.webp",
};

/** Lucky Vibes — 10 unlockable badges */
export const LUCKY_ACHIEVEMENT_BADGE_FILENAME: Record<string, string> = {
  "first-pull": "jackpot_jester.webp",
  "first-way": "any_gvc.webp",
  "lucky-spins": "showtime.webp",
  "vibe-lock": "electric_rings.webp",
  "mult-10": "full_throttle.webp",
  "daily-regular": "seas_the_day.webp",
  "champion-hit": "captain.webp",
  "grand-vibe": "vibestr_cosmic_tier.webp",
  "daily-4k": "high_noon_hustler.webp",
  "lucky-legend": "fifty_badges.webp",
};

export function gvcBadgeUrl(filename: string): string | undefined {
  return GVC_BADGE_URLS[filename];
}

export function achievementRewardBadgeUrl(slug: string, gameId = "vibe-crashers"): string | undefined {
  const map = GAME_ACHIEVEMENT_MAPS[gameId] ?? ACHIEVEMENT_BADGE_FILENAME;
  const fn = map[slug];
  return fn ? GVC_BADGE_URLS[fn] : undefined;
}

const GAME_ACHIEVEMENT_MAPS: Record<string, Record<string, string>> = {
  "vibe-crashers": ACHIEVEMENT_BADGE_FILENAME,
  "vibe-merge": MERGE_ACHIEVEMENT_BADGE_FILENAME,
  "vibe-garden": GARDEN_ACHIEVEMENT_BADGE_FILENAME,
  "catch-a-vibe": CATCH_ACHIEVEMENT_BADGE_FILENAME,
  "vibe-shift": SHIFT_ACHIEVEMENT_BADGE_FILENAME,
  "lucky-vibes": LUCKY_ACHIEVEMENT_BADGE_FILENAME,
};

/** Resolve badge URL from namespaced key `gameId:slug`. */
export function rewardBadgeUrlForKey(key: string): string | undefined {
  const i = key.indexOf(":");
  if (i <= 0) return achievementRewardBadgeUrl(key);
  const gameId = key.slice(0, i);
  const slug = key.slice(i + 1);
  const map = GAME_ACHIEVEMENT_MAPS[gameId];
  const fn = map?.[slug];
  return fn ? GVC_BADGE_URLS[fn] : undefined;
}

export const REWARD_BADGE_FALLBACK_SRC = "/shaka.png";
