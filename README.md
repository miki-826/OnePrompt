# ONE PROMPT BATTLE

**1回の命令で、AIを支配しろ。**

プレイヤーは1回だけプロンプトを書き、その1回の命令でAIからどれだけ良い回答を引き出せるかを競うミニゲームです。回答は採点AIが「説得力・安全性・面白さ・実用性・プロンプト力」の5項目で採点し、スコア・ランク・称号・毒舌コメントを返します。

## ゲームの流れ

1. バトル開始 → AIがお題をランダム生成
2. 60秒以内・300文字以内で1回だけプロンプトを書く
3. 回答AIがプロンプトに従って回答
4. 採点AIが5項目を採点（各100点、計500点）
5. ランク（S/A/B/C/D）・称号・コメントを表示
6. ランキングに登録して再挑戦

## 技術構成

- **Next.js (App Router) + TypeScript + Tailwind CSS v4**
- **OpenAI API (ChatGPT)** — お題生成 / 回答生成 / 採点
- **Supabase** — ランキング保存（未設定でもゲーム本体は動作）
- **Vercel** — デプロイ先

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local に OPENAI_API_KEY を設定
npm run dev
```

http://localhost:3000 で起動します。

### 環境変数

| 変数 | 必須 | 内容 |
| --- | --- | --- |
| `OPENAI_API_KEY` | ✅ | OpenAI APIキー |
| `OPENAI_MODEL` | - | 使用モデル（既定: `gpt-4o-mini`） |
| `NEXT_PUBLIC_SUPABASE_URL` | - | SupabaseプロジェクトURL（ランキング用） |
| `SUPABASE_SERVICE_ROLE_KEY` | - | Supabaseのservice roleキー（ランキング用） |

### Supabase（ランキング機能）

1. Supabaseでプロジェクトを作成
2. SQL Editorで [`supabase/schema.sql`](supabase/schema.sql) を実行
3. 上記の環境変数2つを設定

### Vercelデプロイ

リポジトリをVercelにインポートし、環境変数を設定するだけです。

## プロンプトの変更方法

**お題生成・回答生成・採点のプロンプトはすべて [`lib/prompts.ts`](lib/prompts.ts) に集約しています。**ゲームの調整はこのファイルだけ書き換えれば反映されます。

| 変更したいこと | 触る場所 |
| --- | --- |
| お題のカテゴリを増やす/減らす | `TOPIC_CATEGORIES` |
| お題生成の指示を変える | `buildTopicPrompt()` |
| 回答AIの挙動を変える | `buildAnswerSystemPrompt()` |
| 採点基準・厳しさを変える | `buildJudgePrompt()` |
| 採点コメントの口調（毒舌/通常/絶賛） | `JUDGE_TONE` |
| 称号リスト | `buildJudgePrompt()` 内のリストと `lib/score.ts` の `fallbackTitle()` |
| 文字数制限 / 制限時間 | `PROMPT_MAX_LENGTH` / `TIME_LIMIT_SECONDS` |
| ランク閾値（S/A/B/C/D） | `lib/score.ts` の `rankFromTotal()` |

## API構成

| エンドポイント | メソッド | 内容 |
| --- | --- | --- |
| `/api/topic` | POST | お題をランダム生成 |
| `/api/answer` | POST | プレイヤーのプロンプトから回答を生成 |
| `/api/judge` | POST | 回答を採点（スコア・ランク・称号・コメント） |
| `/api/result` | POST | 結果をSupabaseに保存 |
| `/api/ranking` | GET | スコア上位10件を取得 |

## テスト

```bash
npm test
```

スコア計算・ランク判定・称号フォールバックのロジックをVitestでテストしています。
