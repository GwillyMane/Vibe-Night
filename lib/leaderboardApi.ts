export type LeaderboardApiRow = {
  rank: number;
  username: string;
  score: number;
  stars: number;
  shotsUsed: number;
  shotsTotal: number;
  levelId: string;
  mode: string;
  seed: string | null;
  createdAt: string;
};
