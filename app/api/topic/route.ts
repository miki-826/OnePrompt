import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/openai";
import { buildTopicPrompt, TOPIC_CATEGORIES } from "@/lib/prompts";
import type { Topic } from "@/lib/types";

export const maxDuration = 30;

const DIFFICULTIES = ["easy", "normal", "hard"] as const;

export async function POST(): Promise<NextResponse> {
  try {
    const category = TOPIC_CATEGORIES[Math.floor(Math.random() * TOPIC_CATEGORIES.length)];
    const difficulty = DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];
    const raw = await chatCompletion({
      user: buildTopicPrompt(category, difficulty),
      json: true,
      temperature: 1.1,
    });
    const parsed = JSON.parse(raw);
    const topic: Topic = {
      title: String(parsed.title ?? "無題のミッション"),
      mission: String(parsed.mission ?? ""),
      conditions: Array.isArray(parsed.conditions) ? parsed.conditions.map(String) : [],
      category: String(parsed.category ?? category),
      difficulty: DIFFICULTIES.includes(parsed.difficulty) ? parsed.difficulty : difficulty,
    };
    if (!topic.mission) throw new Error("お題の生成に失敗しました");
    return NextResponse.json(topic);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "お題の生成に失敗しました" }, { status: 500 });
  }
}
