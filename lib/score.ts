import type { Rank, Scores } from "./types";

export function rankFromTotal(total: number): Rank {
  if (total >= 450) return "S";
  if (total >= 380) return "A";
  if (total >= 300) return "B";
  if (total >= 200) return "C";
  return "D";
}

export function totalFromScores(scores: Scores): number {
  return (
    scores.persuasiveness +
    scores.safety +
    scores.humor +
    scores.practicality +
    scores.prompt_skill
  );
}

function clamp(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function clampScores(raw: Record<keyof Scores, unknown>): Scores {
  return {
    persuasiveness: clamp(raw.persuasiveness),
    safety: clamp(raw.safety),
    humor: clamp(raw.humor),
    practicality: clamp(raw.practicality),
    prompt_skill: clamp(raw.prompt_skill),
  };
}

export function fallbackTitle(scores: Scores, total: number): string {
  if (rankFromTotal(total) === "S") return "AI支配者";
  if (scores.prompt_skill >= 90) return "命令文の魔術師";
  if (scores.humor >= 90) return "大喜利プロンプター";
  if (scores.safety >= 95) return "コンプラ守護神";
  if (scores.practicality >= 90) return "現場の即戦力";
  if (scores.persuasiveness >= 90) return "交渉の鬼";
  if (scores.humor >= 80 && scores.practicality < 50) return "ネタ全振り職人";
  if (total < 200) return "AIに舐められし者";
  if (scores.safety < 50) return "炎上予備軍";
  if (scores.prompt_skill < 50) return "ふわっと命令マン";
  return "見習いプロンプター";
}
