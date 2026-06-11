import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ entries: [], enabled: false });
  }
  try {
    const { data, error } = await supabase
      .from("battles")
      .select("player_name, topic_title, score_total, rank, title, created_at")
      .order("score_total", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return NextResponse.json({ entries: data ?? [], enabled: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "ランキングの取得に失敗しました" }, { status: 500 });
  }
}
