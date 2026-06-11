export type Difficulty = "easy" | "normal" | "hard";

export type Topic = {
  title: string;
  mission: string;
  conditions: string[];
  category: string;
  difficulty: Difficulty;
};

export type Scores = {
  persuasiveness: number;
  safety: number;
  humor: number;
  practicality: number;
  prompt_skill: number;
};

export type Rank = "S" | "A" | "B" | "C" | "D";

export type JudgeResult = {
  scores: Scores;
  total: number;
  rank: Rank;
  comment: string;
  good_point: string;
  bad_point: string;
  title: string;
};

export type RankingEntry = {
  player_name: string;
  topic_title: string;
  score_total: number;
  rank: string;
  title: string;
  created_at: string;
};
