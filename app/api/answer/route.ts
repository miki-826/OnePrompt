import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/openai";
import { buildAnswerSystemPrompt, PROMPT_MAX_LENGTH } from "@/lib/prompts";
import type { Topic } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const topic: Topic = body.topic;
    const userPrompt: string = String(body.userPrompt ?? "").slice(0, PROMPT_MAX_LENGTH);
    if (!topic?.mission || !userPrompt.trim()) {
      return NextResponse.json({ error: "入力が不正です" }, { status: 400 });
    }
    const aiAnswer = await chatCompletion({
      system: buildAnswerSystemPrompt(topic),
      user: userPrompt,
      temperature: 0.9,
    });
    return NextResponse.json({ aiAnswer });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "回答の生成に失敗しました" }, { status: 500 });
  }
}
