"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PROMPT_MAX_LENGTH, TIME_LIMIT_SECONDS } from "@/lib/prompts";
import type { JudgeResult, RankingEntry, Topic } from "@/lib/types";

type Phase = "title" | "loadingTopic" | "input" | "answering" | "judging" | "result" | "ranking";

type Health = {
  openai: boolean;
  openaiError: string;
  model: string;
  supabase: boolean;
};

const SCORE_LABELS: { key: keyof JudgeResult["scores"]; label: string }[] = [
  { key: "persuasiveness", label: "説得力 (Persuasiveness)" },
  { key: "safety", label: "安全性 (Safety)" },
  { key: "humor", label: "面白さ (Humor)" },
  { key: "practicality", label: "実用性 (Utility)" },
  { key: "prompt_skill", label: "プロンプト力 (Prompt Skill)" },
];

const ANALYZING_MESSAGES = [
  "JUDGE AI ANALYZING...",
  "PROMPT POWER CHECK...",
  "HUMOR SCAN...",
  "SAFETY FILTER...",
];

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "EASY",
  normal: "NORMAL",
  hard: "HARD",
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>("title");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [judge, setJudge] = useState<JudgeResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [error, setError] = useState("");
  const [analyzingIdx, setAnalyzingIdx] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [saved, setSaved] = useState(false);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [rankingEnabled, setRankingEnabled] = useState(true);
  const submittingRef = useRef(false);
  const [health, setHealth] = useState<Health | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [bgmOn, setBgmOn] = useState(true);
  const [volume, setVolume] = useState(0.4);
  const volumeRef = useRef(volume);

  const ensureAudio = useCallback(() => {
    if (!bgmRef.current) {
      const audio = new Audio("/bgm.mp3");
      audio.loop = true;
      audio.volume = volumeRef.current;
      bgmRef.current = audio;
    }
    return bgmRef.current;
  }, []);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    volumeRef.current = v;
    if (bgmRef.current) bgmRef.current.volume = v;
  }, []);

  const playBgm = useCallback(() => {
    if (bgmOn) {
      ensureAudio().play().catch(() => {});
    }
  }, [bgmOn, ensureAudio]);

  const toggleBgm = useCallback(() => {
    const audio = ensureAudio();
    if (audio.paused) {
      audio.play().catch(() => {});
      setBgmOn(true);
    } else {
      audio.pause();
      setBgmOn(false);
    }
  }, [ensureAudio]);

  const startBattle = useCallback(async () => {
    playBgm();
    setError("");
    setPhase("loadingTopic");
    setUserPrompt("");
    setAiAnswer("");
    setJudge(null);
    setSaved(false);
    submittingRef.current = false;
    try {
      const res = await fetch("/api/topic", { method: "POST" });
      if (!res.ok) throw new Error();
      const data: Topic = await res.json();
      setTopic(data);
      setTimeLeft(TIME_LIMIT_SECONDS);
      setPhase("input");
    } catch {
      setError("お題の生成に失敗しました。もう一度お試しください。");
      setPhase("title");
    }
  }, [playBgm]);

  const submitPrompt = useCallback(async () => {
    if (!topic || submittingRef.current) return;
    const prompt = userPrompt.trim();
    if (!prompt) return;
    submittingRef.current = true;
    setError("");
    setPhase("answering");
    try {
      const answerRes = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, userPrompt: prompt }),
      });
      if (!answerRes.ok) throw new Error();
      const { aiAnswer: answer } = await answerRes.json();
      setAiAnswer(answer);
      setPhase("judging");
      const judgeRes = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, userPrompt: prompt, aiAnswer: answer }),
      });
      if (!judgeRes.ok) throw new Error();
      const judgeData: JudgeResult = await judgeRes.json();
      setJudge(judgeData);
      setPhase("result");
    } catch {
      setError("AIとの通信に失敗しました。もう一度お試しください。");
      setPhase("input");
      submittingRef.current = false;
    }
  }, [topic, userPrompt]);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth({ openai: false, openaiError: "接続確認に失敗しました", model: "-", supabase: false }));
  }, []);

  useEffect(() => {
    if (phase !== "input") return;
    if (timeLeft <= 0) {
      if (userPrompt.trim()) {
        submitPrompt();
      } else {
        setError("時間切れ。プロンプト未入力のため再挑戦してください。");
        setPhase("title");
      }
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft, userPrompt, submitPrompt]);

  useEffect(() => {
    if (phase !== "judging" && phase !== "answering") return;
    const id = setInterval(() => setAnalyzingIdx((i) => (i + 1) % ANALYZING_MESSAGES.length), 900);
    return () => clearInterval(id);
  }, [phase]);

  const saveResult = useCallback(async () => {
    if (!topic || !judge || saved) return;
    try {
      const res = await fetch("/api/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName || "NO NAME", topic, userPrompt, aiAnswer, judge }),
      });
      const data = await res.json();
      if (data.success) setSaved(true);
      else if (data.error) setError(data.error);
      else setError("ランキング保存はSupabase未設定のため利用できません。");
    } catch {
      setError("保存に失敗しました。");
    }
  }, [topic, judge, saved, playerName, userPrompt, aiAnswer]);

  const showRanking = useCallback(async () => {
    setPhase("ranking");
    try {
      const res = await fetch("/api/ranking");
      const data = await res.json();
      setRanking(data.entries ?? []);
      setRankingEnabled(data.enabled !== false);
    } catch {
      setRanking([]);
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8">
      <div className="panel fixed right-4 top-4 z-10 flex items-center gap-3 px-3 py-2">
        <button onClick={toggleBgm} aria-label="BGM切り替え" className="btn-ghost px-3 py-2 text-xs">
          {bgmOn ? "♪ BGM ON" : "♪ BGM OFF"}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => changeVolume(Number(e.target.value) / 100)}
          aria-label="音量"
          className="volume-slider w-24"
        />
        <span className="w-8 text-right text-xs tabular-nums text-[var(--text-dim)]">
          {Math.round(volume * 100)}
        </span>
      </div>
      {phase === "title" && (
        <TitleScreen onStart={startBattle} onRanking={showRanking} error={error} health={health} />
      )}
      {phase === "loadingTopic" && <LoadingScreen label="MISSION GENERATING..." />}
      {phase === "input" && topic && (
        <InputScreen
          topic={topic}
          userPrompt={userPrompt}
          setUserPrompt={setUserPrompt}
          timeLeft={timeLeft}
          onSubmit={submitPrompt}
          error={error}
        />
      )}
      {(phase === "answering" || phase === "judging") && (
        <LoadingScreen
          label={phase === "answering" ? "AI EXECUTING YOUR PROMPT..." : ANALYZING_MESSAGES[analyzingIdx]}
        />
      )}
      {phase === "result" && topic && judge && (
        <ResultScreen
          topic={topic}
          aiAnswer={aiAnswer}
          judge={judge}
          playerName={playerName}
          setPlayerName={setPlayerName}
          saved={saved}
          onSave={saveResult}
          onRetry={startBattle}
          onRanking={showRanking}
          error={error}
        />
      )}
      {phase === "ranking" && (
        <RankingScreen
          entries={ranking}
          enabled={rankingEnabled}
          onBack={() => setPhase("title")}
          onStart={startBattle}
        />
      )}
    </main>
  );
}

function TitleScreen({
  onStart,
  onRanking,
  error,
  health,
}: {
  onStart: () => void;
  onRanking: () => void;
  error: string;
  health: Health | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
      <div className="panel px-4 py-2 text-xs tracking-widest text-[var(--text-dim)]">
        システム起動 // バトルプロトコル_V1.0
      </div>
      <h1 className="neon-text animate-pulse-glow text-5xl font-extrabold tracking-tight sm:text-6xl">
        ONE PROMPT
      </h1>
      <p className="text-2xl font-bold">1回の命令で、AIを支配しろ。</p>
      <button onClick={onStart} className="btn-primary clip-corner px-16 py-5 text-xl">
        ▷ バトル開始
      </button>
      <button onClick={onRanking} className="btn-ghost px-8 py-3 text-sm">
        ランキングを見る
      </button>
      <div className="panel max-w-md p-5 text-sm">
        <p className="mb-2 text-[var(--pink)]">
          &gt; 1つのプロンプト / 1つの回答 / 1つの判定
        </p>
        <p className="font-body text-[var(--text-dim)]">
          使えるプロンプトは1回だけ。AIを操り、採点AIを黙らせろ。
        </p>
      </div>
      {error && <p className="text-sm text-[var(--pink)]">{error}</p>}
      <div className="panel px-4 py-2 text-xs tracking-widest">
        {health === null && <span className="text-[var(--text-dim)]">AI CORE: CHECKING...</span>}
        {health !== null && health.openai && (
          <span className="text-[var(--cyan)]">
            ● AI CORE: ONLINE // {health.model} // DB: {health.supabase ? "ONLINE" : "OFFLINE"}
          </span>
        )}
        {health !== null && !health.openai && (
          <span className="text-[var(--pink)]">
            ● AI CORE: OFFLINE — {health.openaiError}
          </span>
        )}
      </div>
    </div>
  );
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <p className="neon-text cursor-blink text-xl font-bold tracking-widest">{label}</p>
      <div className="w-64 overflow-hidden">
        <div className="analyzing-bar" />
      </div>
    </div>
  );
}

function InputScreen({
  topic,
  userPrompt,
  setUserPrompt,
  timeLeft,
  onSubmit,
  error,
}: {
  topic: Topic;
  userPrompt: string;
  setUserPrompt: (v: string) => void;
  timeLeft: number;
  onSubmit: () => void;
  error: string;
}) {
  const timeDanger = timeLeft <= 10;
  return (
    <div className="flex flex-col gap-5">
      <div className="panel flex items-center justify-between px-4 py-3">
        <span className="panel-label">データストリーム // 入力シーケンス_001</span>
        <span
          className={`text-lg font-bold tabular-nums ${timeDanger ? "text-[var(--pink)]" : "neon-text"}`}
        >
          00:{String(Math.max(timeLeft, 0)).padStart(2, "0")}
        </span>
      </div>

      <div className="panel p-5">
        <p className="panel-label mb-3 text-[var(--pink)]">◎ 現在のミッション [{DIFFICULTY_LABELS[topic.difficulty]}]</p>
        <p className="border-l-4 border-[var(--pink)] bg-[var(--panel-high)] p-4 text-xl font-bold">
          {topic.mission}
        </p>
        <ul className="mt-4 space-y-1 font-body text-sm text-[var(--text-dim)]">
          {topic.conditions.map((c, i) => (
            <li key={i}>・{c}</li>
          ))}
        </ul>
      </div>

      <div className="panel p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="panel-label">あなたのプロンプト</span>
          <span className="text-sm tabular-nums text-[var(--text-dim)]">
            {userPrompt.length} / {PROMPT_MAX_LENGTH}
          </span>
        </div>
        <textarea
          autoFocus
          value={userPrompt}
          maxLength={PROMPT_MAX_LENGTH}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="> AIに命令せよ..."
          className="terminal-input h-48 w-full resize-none p-4 text-base"
        />
      </div>

      <div className="border border-[var(--red)] bg-[rgba(203,1,73,0.1)] p-3 text-center text-sm text-[var(--pink)]">
        ⚠ 警告: 送信後の修正はできません。
      </div>
      {error && <p className="text-center text-sm text-[var(--pink)]">{error}</p>}

      <button
        onClick={onSubmit}
        disabled={!userPrompt.trim()}
        className="btn-primary clip-corner py-5 text-xl"
      >
        [ 命令を実行する ]
      </button>
    </div>
  );
}

function ResultScreen({
  topic,
  aiAnswer,
  judge,
  playerName,
  setPlayerName,
  saved,
  onSave,
  onRetry,
  onRanking,
  error,
}: {
  topic: Topic;
  aiAnswer: string;
  judge: JudgeResult;
  playerName: string;
  setPlayerName: (v: string) => void;
  saved: boolean;
  onSave: () => void;
  onRetry: () => void;
  onRanking: () => void;
  error: string;
}) {
  const isS = judge.rank === "S";
  return (
    <div className="flex flex-col gap-5">
      <div className="panel px-4 py-3 text-center">
        <span className="neon-text text-xl font-bold tracking-widest">バトル結果</span>
        <p className="mt-1 text-xs text-[var(--text-dim)]">データストリーム [安全な接続] — {topic.title}</p>
      </div>

      <div className={`panel flex flex-col items-center gap-2 p-8 ${isS ? "glow-gold" : "glow-cyan"}`}>
        <span className="panel-label">ランクステータス</span>
        <span
          className={`text-8xl font-extrabold ${isS ? "text-[var(--gold)]" : "neon-text"} animate-pulse-glow`}
        >
          {judge.rank}
        </span>
        <p className="text-lg font-bold">称号：{judge.title}</p>
        <p className="text-base">
          総合スコア： <span className="text-[var(--pink)] text-2xl font-bold">{judge.total}</span> / 500
        </p>
      </div>

      <div className="panel p-5">
        <p className="panel-label mb-3">AI出力プレビュー</p>
        <p className="terminal-input whitespace-pre-wrap p-4 font-body text-sm leading-relaxed">
          {aiAnswer}
        </p>
      </div>

      <div className="panel p-5">
        <p className="panel-label mb-4">メトリクス分析</p>
        <div className="space-y-4">
          {SCORE_LABELS.map(({ key, label }) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{label}</span>
                <span className="font-bold text-[var(--cyan)] tabular-nums">{judge.scores[key]}</span>
              </div>
              <div className="score-bar">
                <div className="score-bar-fill" style={{ width: `${judge.scores[key]}%` }} />
                <div className="score-bar-segments" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-5">
        <p className="panel-label mb-3 text-[var(--gold)]">判定コメント</p>
        <p className="font-body text-sm italic leading-relaxed">&quot;{judge.comment}&quot;</p>
        <div className="mt-4 space-y-2 font-body text-sm">
          <p>
            <span className="text-[var(--cyan)]">◎ GOOD:</span> {judge.good_point}
          </p>
          <p>
            <span className="text-[var(--pink)]">✕ BAD:</span> {judge.bad_point}
          </p>
        </div>
      </div>

      <div className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <input
          type="text"
          value={playerName}
          maxLength={20}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="プレイヤー名"
          className="terminal-input flex-1 px-4 py-3 text-sm"
        />
        <button onClick={onSave} disabled={saved} className="btn-primary px-6 py-3 text-sm">
          {saved ? "✓ 登録済み" : "ランキングに登録"}
        </button>
      </div>
      {error && <p className="text-center text-sm text-[var(--pink)]">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onRetry} className="btn-primary clip-corner flex-1 py-4 text-lg">
          ↻ 再挑戦
        </button>
        <button onClick={onRanking} className="btn-ghost flex-1 py-4 text-lg">
          ランキング
        </button>
      </div>
    </div>
  );
}

function RankingScreen({
  entries,
  enabled,
  onBack,
  onStart,
}: {
  entries: RankingEntry[];
  enabled: boolean;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="panel px-4 py-3 text-center">
        <span className="neon-text text-xl font-bold tracking-widest">本日の最強プロンプター</span>
      </div>
      <div className="panel p-5">
        {!enabled && (
          <p className="py-8 text-center font-body text-sm text-[var(--text-dim)]">
            ランキング機能はSupabase設定後に有効になります。
          </p>
        )}
        {enabled && entries.length === 0 && (
          <p className="py-8 text-center font-body text-sm text-[var(--text-dim)]">
            まだ記録がありません。最初の支配者になれ。
          </p>
        )}
        {entries.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dashed border-[var(--border)] text-left text-xs text-[var(--text-dim)]">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">名前</th>
                <th className="py-2 pr-2 text-right">スコア</th>
                <th className="py-2 pr-2 text-center">ランク</th>
                <th className="py-2">称号</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-b border-dashed border-[var(--border)]">
                  <td className={`py-3 pr-2 font-bold ${i === 0 ? "text-[var(--gold)]" : ""}`}>{i + 1}</td>
                  <td className="py-3 pr-2">{e.player_name}</td>
                  <td className="py-3 pr-2 text-right font-bold text-[var(--cyan)] tabular-nums">
                    {e.score_total}
                  </td>
                  <td className={`py-3 pr-2 text-center font-bold ${e.rank === "S" ? "text-[var(--gold)]" : ""}`}>
                    {e.rank}
                  </td>
                  <td className="py-3 font-body text-[var(--text-dim)]">{e.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={onStart} className="btn-primary clip-corner flex-1 py-4 text-lg">
          ▷ バトル開始
        </button>
        <button onClick={onBack} className="btn-ghost flex-1 py-4 text-lg">
          タイトルへ
        </button>
      </div>
    </div>
  );
}
