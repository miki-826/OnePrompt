import OpenAI from "openai";
import { DEFAULT_MODEL } from "./prompts";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY が設定されていません");
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function chatCompletion(args: {
  system?: string;
  user: string;
  json?: boolean;
  temperature?: number;
}): Promise<string> {
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const messages: { role: "system" | "user"; content: string }[] = [];
  if (args.system) messages.push({ role: "system", content: args.system });
  messages.push({ role: "user", content: args.user });

  const res = await getClient().chat.completions.create({
    model,
    messages,
    temperature: args.temperature ?? 0.9,
    ...(args.json ? { response_format: { type: "json_object" as const } } : {}),
  });
  return res.choices[0]?.message?.content ?? "";
}
