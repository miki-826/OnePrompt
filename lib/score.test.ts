import { describe, expect, it } from "vitest";
import { clampScores, fallbackTitle, rankFromTotal, totalFromScores } from "./score";

describe("rankFromTotal", () => {
  it("450以上はS", () => {
    expect(rankFromTotal(500)).toBe("S");
    expect(rankFromTotal(450)).toBe("S");
  });
  it("380〜449はA", () => {
    expect(rankFromTotal(449)).toBe("A");
    expect(rankFromTotal(380)).toBe("A");
  });
  it("300〜379はB", () => {
    expect(rankFromTotal(379)).toBe("B");
    expect(rankFromTotal(300)).toBe("B");
  });
  it("200〜299はC", () => {
    expect(rankFromTotal(299)).toBe("C");
    expect(rankFromTotal(200)).toBe("C");
  });
  it("199以下はD", () => {
    expect(rankFromTotal(199)).toBe("D");
    expect(rankFromTotal(0)).toBe("D");
  });
});

describe("totalFromScores", () => {
  it("5項目の合計を返す", () => {
    expect(
      totalFromScores({
        persuasiveness: 82,
        safety: 91,
        humor: 65,
        practicality: 88,
        prompt_skill: 79,
      })
    ).toBe(405);
  });
});

describe("clampScores", () => {
  it("0〜100に収め、数値以外は0にする", () => {
    const clamped = clampScores({
      persuasiveness: 120,
      safety: -5,
      humor: 50,
      practicality: Number.NaN,
      prompt_skill: 100,
    });
    expect(clamped).toEqual({
      persuasiveness: 100,
      safety: 0,
      humor: 50,
      practicality: 0,
      prompt_skill: 100,
    });
  });
});

describe("fallbackTitle", () => {
  it("総合SならAI支配者", () => {
    expect(
      fallbackTitle(
        { persuasiveness: 90, safety: 90, humor: 90, practicality: 90, prompt_skill: 90 },
        450
      )
    ).toBe("AI支配者");
  });
  it("プロンプト力90以上なら命令文の魔術師", () => {
    expect(
      fallbackTitle(
        { persuasiveness: 70, safety: 80, humor: 60, practicality: 70, prompt_skill: 95 },
        375
      )
    ).toBe("命令文の魔術師");
  });
  it("全体的に低いとAIに舐められし者", () => {
    expect(
      fallbackTitle(
        { persuasiveness: 30, safety: 40, humor: 20, practicality: 30, prompt_skill: 25 },
        145
      )
    ).toBe("AIに舐められし者");
  });
});
