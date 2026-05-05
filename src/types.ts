export type MatchFormat = 5 | 10 | 15 | 20 | number;
export type MatchMode = "full" | "single";
export type WicketType = "Bowled" | "Caught" | "LBW" | "RunOut" | "Stumped" | "HitWicket" | "RetiredHurt";

export interface Player {
  id: string;
  name: string;
}

export interface Ball {
  over: number;
  ballNumber: number; // 1 to 6
  runsBase: number; // Runs off the bat or extras base
  isWide: boolean;
  isNoBall: boolean;
  isBye: boolean;
  isLegBye: boolean;
  isWicket: boolean;
  wicketType?: WicketType;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  isLegal: boolean; // Counts towards the over
  freeHit: boolean; // Was this ball a free hit?
}

export interface BatsmanStats {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  outType?: WicketType;
  outBowlerId?: string;
}

export interface BowlerStats {
  id: string;
  name: string;
  balls: number; // Legal balls bowled
  runs: number;
  wickets: number;
  maidens: number;
}

export interface Innings {
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  totalBalls: number; // Legal balls
  oversCompleted: number;
  extras: {
    wide: number;
    noBall: number;
    bye: number;
    legBye: number;
  };
  balls: Ball[];
  batsmen: Record<string, BatsmanStats>;
  bowlers: Record<string, BowlerStats>;
  currentStrikerId: string | null;
  currentNonStrikerId: string | null;
  currentBowlerId: string | null;
  isComplete: boolean;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  color?: string;
  logoDataUrl?: string; // Base64 encoding of image
}

export interface Match {
  id: string;
  date: string; // ISO
  teamA: Team;
  teamB: Team;
  overs: MatchFormat;
  mode: MatchMode;
  toss: { winnerTeamId: string; choice: "bat" | "bowl" };
  innings: Innings[];
  currentInningsIndex: number;
  isComplete: boolean;
  result?: { winnerId?: string; isDraw?: boolean; margin?: number; marginType?: "runs" | "wickets" };
}
