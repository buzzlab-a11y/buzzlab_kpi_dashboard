-- ============================================================
-- BuzzLab KPI Dashboard — Supabase スキーマ
-- Supabase Dashboard の SQL Editor で実行してください
-- ============================================================

-- kpi_data テーブル（ユーザーごとに1行）
create table if not exists kpi_data (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  input_data  jsonb not null default '{}',
  line_phases jsonb not null default '{}',
  task_data   jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

-- updated_at を自動更新するトリガー
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger kpi_data_updated_at
  before update on kpi_data
  for each row execute function update_updated_at();

-- Row Level Security（自分のデータのみ操作可能）
alter table kpi_data enable row level security;

create policy "Users can read their own data"
  on kpi_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on kpi_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on kpi_data for update
  using (auth.uid() = user_id);
