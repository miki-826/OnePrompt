import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { JudgeResult, Topic } from "@/lib/types";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, reason: "supabase未設定" });
  }
  try {
    const body = await req.json();
    const topic: Topic = body.topic;
    const judge: JudgeResult = body.judge;
    const playerName = String(body.playerName ?? "NO NAME").slice(0, 20) || "NO NAME";
    const { error } = await supabase.from("battles").insert({
      player_name: playerName,
      topic_title: topic.title,
      mission: topic.mission,
      user_prompt: String(body.userPrompt ?? ""),
      ai_answer: String(body.aiAnswer ?? ""),
      score_total: judge.total,
      rank: judge.rank,
      title: judge.title,
      judge_comment: judge.comment,
    });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("result save failed:", e);
    const detail = e instanceof Error ? e.message : JSON.stringify(e);
    return NextResponse.json({ error: `保存に失敗しました: ${detail}` }, { status: 500 });
  }
}
