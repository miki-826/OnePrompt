import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/openai";
import { buildJudgePrompt } from "@/lib/prompts";
import { clampScores, fallbackTitle, rankFromTotal, totalFromScores } from "@/lib/score";
import type { JudgeResult, Topic } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const topic: Topic = body.topic;
    const userPrompt: string = String(body.userPrompt ?? "");
    const aiAnswer: string = String(body.aiAnswer ?? "");
    if (!topic?.mission || !userPrompt.trim() || !aiAnswer.trim()) {
      return NextResponse.json({ error: "入力が不正です" }, { status: 400 });
    }
    const raw = await chatCompletion({
      user: buildJudgePrompt({ topic, userPrompt, aiAnswer }),
      json: true,
      temperature: 0.85,
    });
    const parsed = JSON.parse(raw);
    const scores = clampScores(parsed.scores ?? {});
    const total = totalFromScores(scores);
    const result: JudgeResult = {
      scores,
      total,
      rank: rankFromTotal(total),
      comment: String(parsed.comment ?? ""),
      good_point: String(parsed.good_point ?? ""),
      bad_point: String(parsed.bad_point ?? ""),
      title: String(parsed.title || fallbackTitle(scores, total)),
    };
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "採点に失敗しました" }, { status: 500 });
  }
}
