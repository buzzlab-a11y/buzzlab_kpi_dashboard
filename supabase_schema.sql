-- ============================================================
-- BuzzLab KPI Dashboard — 完全スキーマ
-- ログイン不要・全データをDBで管理
-- Supabase SQL Editor で一括実行してください
-- ============================================================

-- 既存テーブル削除（再セットアップ用）
drop table if exists kpi_data cascade;
drop table if exists channel_configs cascade;
drop table if exists monthly_targets cascade;
drop table if exists month_kpi cascade;
drop table if exists line_phase_defs cascade;
drop table if exists weekly_task_defs cascade;

-- ============================================================
-- 1. チャンネル設定（名前・担当者・リスト単価）
-- ============================================================
create table channel_configs (
  id         text primary key,   -- 'instagram' | 'youtube' | 'threads' | 'jv' | 'line'
  name       text    not null,
  manager    text,
  list_price integer not null default 0,
  sort_order integer not null default 0
);

insert into channel_configs (id, name, manager, list_price, sort_order) values
  ('instagram', 'Instagram', 'レオさん',         10000, 1),
  ('youtube',   'YouTube',   'ケンさん',          15000, 2),
  ('threads',   'Threads',   'ケンさん（6月〜）',  5000, 3),
  ('jv',        'JV',        '自分',             20000, 4),
  ('line',      'LINE',      '亮平さん',           3000, 5);

-- ============================================================
-- 2. 月次目標（チャンネルごとのリスト数・売上目標）
-- ============================================================
create table monthly_targets (
  month      text    not null,
  channel    text    not null references channel_configs(id),
  acc_count  integer not null default 0,  -- ACC稼働数
  lists      integer not null default 0,  -- リスト目標数
  revenue    bigint  not null default 0,  -- 売上目標（円）
  sort_order integer not null default 0,  -- 月の並び順
  primary key (month, channel)
);

insert into monthly_targets (month, channel, acc_count, lists, revenue, sort_order) values
  -- 4月
  ('4月',  'instagram',  5, 0,    0,         1),
  ('4月',  'youtube',    1, 0,    0,         1),
  ('4月',  'threads',    0, 0,    0,         1),
  ('4月',  'jv',         0, 0,    0,         1),
  -- 5月
  ('5月',  'instagram', 10, 180,  1800000,   2),
  ('5月',  'youtube',    2, 40,   600000,    2),
  ('5月',  'threads',    0, 0,    0,         2),
  ('5月',  'jv',         0, 100,  2000000,   2),
  -- 6月
  ('6月',  'instagram', 15, 540,  5400000,   3),
  ('6月',  'youtube',    3, 160,  2400000,   3),
  ('6月',  'threads',    5, 0,    0,         3),
  ('6月',  'jv',         0, 100,  2000000,   3),
  -- 7月
  ('7月',  'instagram', 20, 1040, 10400000,  4),
  ('7月',  'youtube',    4, 520,  7800000,   4),
  ('7月',  'threads',   10, 180,  900000,    4),
  ('7月',  'jv',         0, 100,  2000000,   4),
  -- 8月
  ('8月',  'instagram', 25, 1540, 15400000,  5),
  ('8月',  'youtube',    5, 920,  13800000,  5),
  ('8月',  'threads',   15, 540,  2700000,   5),
  ('8月',  'jv',         0, 100,  2000000,   5),
  -- 9月
  ('9月',  'instagram', 30, 2040, 20400000,  6),
  ('9月',  'youtube',    6, 1320, 19800000,  6),
  ('9月',  'threads',   20, 1040, 5200000,   6),
  ('9月',  'jv',         0, 100,  2000000,   6),
  -- 10月
  ('10月', 'instagram', 35, 2540, 25400000,  7),
  ('10月', 'youtube',    7, 1720, 25800000,  7),
  ('10月', 'threads',   25, 1540, 7700000,   7),
  ('10月', 'jv',         0, 100,  2000000,   7),
  -- 11月
  ('11月', 'instagram', 40, 3040, 30400000,  8),
  ('11月', 'youtube',    8, 2120, 31800000,  8),
  ('11月', 'threads',   30, 2040, 10200000,  8),
  ('11月', 'jv',         0, 100,  2000000,   8),
  -- 12月
  ('12月', 'instagram', 45, 3540, 35400000,  9),
  ('12月', 'youtube',    9, 2520, 37800000,  9),
  ('12月', 'threads',   35, 2540, 12700000,  9),
  ('12月', 'jv',         0, 100,  2000000,   9);

-- ============================================================
-- 3. 月間KPI目標テキスト
-- ============================================================
create table month_kpi (
  month    text not null,
  channel  text not null references channel_configs(id),
  kpi_text text,
  primary key (month, channel)
);

insert into month_kpi (month, channel, kpi_text) values
  ('4月',  'instagram', '5ACC準備完了\n（投稿は5月〜）'),
  ('4月',  'youtube',   '台本4本作成\n（投稿は5月〜）'),
  ('4月',  'threads',   '準備中\n（6月〜開始）'),
  ('4月',  'jv',        'JV準備'),
  ('4月',  'line',      'ローンチ準備完了\n5月配信開始'),
  ('5月',  'instagram', '10ACC稼働\n180リスト目標'),
  ('5月',  'youtube',   '2ACC稼働\n40リスト目標'),
  ('5月',  'threads',   '準備中'),
  ('5月',  'jv',        '100リスト\n¥2,000,000'),
  ('5月',  'line',      '第1回ローンチ配信'),
  ('6月',  'instagram', '15ACC稼働\n540リスト目標'),
  ('6月',  'youtube',   '3ACC稼働\n160リスト目標'),
  ('6月',  'threads',   '5ACC稼働\n0リスト目標'),
  ('6月',  'jv',        '100リスト\n¥2,000,000'),
  ('6月',  'line',      '成約率・リスト単価改善'),
  ('7月',  'instagram', '20ACC稼働\n1,040リスト目標'),
  ('7月',  'youtube',   '4ACC稼働\n520リスト目標'),
  ('7月',  'threads',   '10ACC稼働\n180リスト目標'),
  ('7月',  'jv',        '100リスト\n¥2,000,000'),
  ('7月',  'line',      'VIPアップセル開始'),
  ('8月',  'instagram', '25ACC稼働\n1,540リスト目標'),
  ('8月',  'youtube',   '5ACC稼働\n920リスト目標'),
  ('8月',  'threads',   '15ACC稼働\n540リスト目標'),
  ('8月',  'jv',        '100リスト\n¥2,000,000'),
  ('8月',  'line',      '成約率3%目標'),
  ('9月',  'instagram', '30ACC稼働\n2,040リスト目標'),
  ('9月',  'youtube',   '6ACC稼働\n1,320リスト目標'),
  ('9月',  'threads',   '20ACC稼働\n1,040リスト目標'),
  ('9月',  'jv',        '100リスト\n¥2,000,000'),
  ('9月',  'line',      'LINEスタッフ採用検討'),
  ('10月', 'instagram', '35ACC稼働\n2,540リスト目標'),
  ('10月', 'youtube',   '7ACC稼働\n1,720リスト目標'),
  ('10月', 'threads',   '25ACC稼働\n1,540リスト目標'),
  ('10月', 'jv',        '100リスト\n¥2,000,000'),
  ('10月', 'line',      '✅ 2億達成確定月'),
  ('11月', 'instagram', '40ACC稼働\n3,040リスト目標'),
  ('11月', 'youtube',   '8ACC稼働\n2,120リスト目標'),
  ('11月', 'threads',   '30ACC稼働\n2,040リスト目標'),
  ('11月', 'jv',        '100リスト\n¥2,000,000'),
  ('11月', 'line',      '来期計画立案'),
  ('12月', 'instagram', '45ACC稼働\n3,540リスト目標'),
  ('12月', 'youtube',   '9ACC稼働\n2,520リスト目標'),
  ('12月', 'threads',   '35ACC稼働\n2,540リスト目標'),
  ('12月', 'jv',        '100リスト\n¥2,000,000'),
  ('12月', 'line',      '年間総括');

-- ============================================================
-- 4. LINEローンチフェーズ定義
-- ============================================================
create table line_phase_defs (
  phase            text primary key,
  deadline         text,
  task_description text,
  sort_order       integer not null default 0
);

insert into line_phase_defs (phase, deadline, task_description, sort_order) values
  ('準備①',    '4月 第2週まで', '保有リスト数の確認・セグメント分け（属性・温度感別）',                   1),
  ('準備②',    '4月 第3週まで', 'ローンチ用LINEシナリオ作成（配信文章・ステップ設計）',                   2),
  ('準備③',    '4月 第3週まで', 'オファー設計（何をいくらで売るか・特典設計）',                           3),
  ('準備④',    '4月 第4週',     'テスト配信（一部リストに先行送信・反応確認）',                           4),
  ('本配信①',  '5月 第1週',     '第1回ローンチ配信開始（全リストへ送信）',                               5),
  ('本配信②',  '5月 第2〜3週',  'フォロー配信・個別相談対応・成約フォロー',                              6),
  ('振り返り', '5月 第4週',     '成約数・リスト単価の集計・改善点の洗い出し',                             7),
  ('第2回準備', '6月 第1〜2週', '第2回ローンチに向けたオファー改善・シナリオ更新',                        8),
  ('第2回配信', '6月 第3週〜',  '第2回ローンチ配信・フォロー',                                          9);

-- ============================================================
-- 5. 週次タスク定義（チャンネル×週）
-- ============================================================
create table weekly_task_defs (
  channel     text    not null references channel_configs(id),
  week_number integer not null check (week_number between 1 and 4),
  task_text   text,
  primary key (channel, week_number)
);

insert into weekly_task_defs (channel, week_number, task_text) values
  ('instagram', 1, '演者スカウト・面談\n目標: 5名確保'),
  ('instagram', 2, '素材撮影完了\n目標: 5名分（80本）'),
  ('instagram', 3, '編集入稿・完了\n目標: 12本完了'),
  ('instagram', 4, 'エルグラム設定\nハイライト・投稿準備完了'),
  ('youtube',   1, '台本作成（前半4本）\n目標: 4本完了'),
  ('youtube',   2, '台本作成（後半4本）\n目標: 計8本完了'),
  ('youtube',   3, '演者・編集者入稿\n目標: 8本入稿完了'),
  ('youtube',   4, '公開・リスト数確認\n翌月企画立案'),
  ('threads',   1, '10ACC開設・AI投稿設定\n目標: 10ACC開設'),
  ('threads',   2, '生き残りACC確認\nAI投稿稼働確認'),
  ('threads',   3, 'リスト獲得数チェック\n既存ACC改善'),
  ('threads',   4, '月間まとめ\n翌月ACC準備'),
  ('jv',        1, 'JVパートナー候補リサーチ\n既存パートナー関係構築'),
  ('jv',        2, 'JVオファー・交渉\nコラボ企画準備'),
  ('jv',        3, 'JVライブ・コラボ実施\nリスト獲得確認'),
  ('jv',        4, 'JV結果分析\n翌月パートナー確保'),
  ('line',      1, 'リスト確認・セグメント分け\n配信文章作成'),
  ('line',      2, 'オファー設計\nテスト配信（一部）'),
  ('line',      3, '本配信①\n成約フォロー'),
  ('line',      4, 'フォロー配信\n成約数・リスト単価集計');

-- ============================================================
-- 6. ユーザー入力データ（ログイン不要・チーム共有の1行）
-- ============================================================
create table kpi_data (
  id                  text        primary key,
  input_data          jsonb       not null default '{}',
  line_phases_status  jsonb       not null default '{}',
  task_data           jsonb       not null default '{}',
  updated_at          timestamptz not null default now()
);

-- updated_at 自動更新トリガー
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

-- チームの初期行を作成（1行だけ）
insert into kpi_data (id) values ('main') on conflict do nothing;

-- ============================================================
-- 7. アクセス権限（ログイン不要なのでanonに全権限を付与）
-- ============================================================
grant usage on schema public to anon;
grant select on channel_configs   to anon;
grant select on monthly_targets   to anon;
grant select on month_kpi         to anon;
grant select on line_phase_defs   to anon;
grant select on weekly_task_defs  to anon;
grant select, insert, update on kpi_data to anon;
