export type BetType =
  | 'artilheiro'
  | 'campeao'
  | 'finalistas'
  | 'goleada'
  | 'zebra';

export type BetPayload<T extends BetType> = T extends 'artilheiro'
  ? { player_id: string }
  : T extends 'campeao'
  ? { team_id: string }
  : T extends 'finalistas'
  ? { finalist_1: string; finalist_2: string }
  : T extends 'goleada'
  ? { home_team_id: string; away_team_id: string; home_goals: number; away_goals: number }
  : T extends 'zebra'
  ? { match_id: string; underdog_id: string }
  : never;

export type BetResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
};