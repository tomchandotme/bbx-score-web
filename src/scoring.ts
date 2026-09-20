export type Player = "red" | "blue";
export type FinishId = "spin" | "burst" | "over" | "xtreme";

export type Finish = {
  id: FinishId;
  label: string;
  hasbro: string;
  points: number;
  detail: string;
};

export const FINISHES: readonly Finish[] = [
  {
    id: "spin",
    label: "Spin",
    hasbro: "Survivor",
    points: 1,
    detail:
      "Opponent's Bey stops spinning in the battle zone first (rotation speed in its original direction becomes zero).",
  },
  {
    id: "burst",
    label: "Burst",
    hasbro: "Burst",
    points: 2,
    detail:
      "Parts of the opponent's Bey (blade, ratchet, or bit) detach and separate before yours.",
  },
  {
    id: "over",
    label: "Over",
    hasbro: "Knock Out",
    points: 2,
    detail:
      "Opponent's Bey fully enters the Over / knockout pocket and cannot return to the battle zone.",
  },
  {
    id: "xtreme",
    label: "Xtreme",
    hasbro: "Extreme",
    points: 3,
    detail:
      "Opponent's Bey fully enters the Xtreme zone and cannot return to the battle zone.",
  },
];

export const FINISH_BY_ID: Record<FinishId, Finish> = Object.fromEntries(
  FINISHES.map((finish) => [finish.id, finish]),
) as Record<FinishId, Finish>;

export const DEFAULT_WIN_SCORE = 4;
export const WIN_SCORE_OPTIONS = [4, 5, 7, 10] as const;
export type WinScore = (typeof WIN_SCORE_OPTIONS)[number];

export const WIN_SCORE_HINT: Record<WinScore, string> = {
  4: "Official 1v1 and 3-on-3",
  5: "3-blader 5-point battle",
  7: "Longer exhibition match",
  10: "Some Hasbro round-robin brackets",
};

export type ScoreSnapshot = {
  red: number;
  blue: number;
  last: null | { player: Player; finish: FinishId };
};

export const INITIAL_SCORE: ScoreSnapshot = { red: 0, blue: 0, last: null };

export function isWinScore(value: number): value is WinScore {
  return (WIN_SCORE_OPTIONS as readonly number[]).includes(value);
}

export function applyFinish(
  state: ScoreSnapshot,
  player: Player,
  finish: FinishId,
  winScore: number,
): ScoreSnapshot | null {
  if (state.red >= winScore || state.blue >= winScore) return null;

  return {
    red: player === "red" ? state.red + FINISH_BY_ID[finish].points : state.red,
    blue:
      player === "blue" ? state.blue + FINISH_BY_ID[finish].points : state.blue,
    last: { player, finish },
  };
}

export function winnerOf(
  state: ScoreSnapshot,
  winScore: number,
): Player | null {
  if (state.red >= winScore) return "red";
  if (state.blue >= winScore) return "blue";
  return null;
}
