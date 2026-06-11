import { NextResponse } from "next/server";
import OpenAI from "openai";
import { DEFAULT_MODEL } from "@/lib/prompts";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(): Promise<NextResponse> {
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  let openaiOk = false;
  let openaiError = "";
  if (!process.env.OPENAI_API_KEY) {
    openaiError = "OPENAI_API_KEY が未設定です";
  } else {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      await client.models.retrieve(model);
      openaiOk = true;
    } catch (e) {
      openaiError = e instanceof Error ? e.message : "OpenAI APIへの接続に失敗しました";
    }
  }
  return NextResponse.json({
    openai: openaiOk,
    openaiError,
    model,
    supabase: getSupabase() !== null,
  });
}
