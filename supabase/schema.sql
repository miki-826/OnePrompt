-- ONE PROMPT BATTLE: バトル結果テーブル
create table if not exists battles (
  id uuid primary key default gen_random_uuid(),
  player_name text not null default 'NO NAME',
  topic_title text not null,
  mission text not null,
  user_prompt text not null,
  ai_answer text not null,
  score_total int not null,
  rank text not null,
  title text not null,
  judge_comment text not null,
  created_at timestamptz not null default now()
);

create index if not exists battles_score_idx on battles (score_total desc, created_at desc);

-- サーバー側はservice roleキーで書き込むためRLSは有効化のみ（外部からの直接アクセスを遮断）
alter table battles enable row level security;
