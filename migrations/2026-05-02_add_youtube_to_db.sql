-- ============================================================
-- 2026-05-02: YouTube チャネルを本番DBに追加
-- ============================================================
-- 背景:
--   本番DB (mypmnrjttflfbnntcowe) には channel_configs に youtube が無く、
--   monthly_targets / month_kpi / weekly_task_defs にも youtube 行が存在しない。
--   そのためフロントが YouTube を表示しようとして cfg が undefined になり、
--   ダッシュボード全体が描画失敗する事象が発生していた。
--
--   このマイグレーションは YouTube を新規追加して
--   2億ターゲット (IG 5 : YT 2 : Threads 3) のリバランス計画値を投入する。
--
-- 適用方法: Supabase SQL Editor に貼り付けて実行
-- ============================================================

begin;

-- ============================================================
-- 1. channel_configs に youtube を追加
-- ============================================================
insert into channel_configs (id, name, manager, list_price, sort_order)
  values ('youtube', 'YouTube', 'ケンさん', 15000, 2)
  on conflict (id) do nothing;

-- ============================================================
-- 2. monthly_targets に youtube の12ヶ月分を追加
--    （IG/Threads の sort_order に合わせる: 1月=1, ..., 12月=12）
-- ============================================================
insert into monthly_targets (month, channel, acc_count, lists, revenue, sort_order)
values
  ('1月',  'youtube',  0,   0,    0,         1),
  ('2月',  'youtube',  0,   0,    0,         2),
  ('3月',  'youtube',  0,   0,    0,         3),
  ('4月',  'youtube',  1,   0,    0,         4),
  ('5月',  'youtube',  2,   11,   165000,    5),
  ('6月',  'youtube',  2,   46,   690000,    6),
  ('7月',  'youtube',  2,   149,  2235000,   7),
  ('8月',  'youtube',  2,   263,  3945000,   8),
  ('9月',  'youtube',  3,   378,  5670000,   9),
  ('10月', 'youtube',  3,   492,  7380000,   10),
  ('11月', 'youtube',  3,   607,  9105000,   11),
  ('12月', 'youtube',  3,   721,  10815000,  12)
on conflict (month, channel) do nothing;

-- ============================================================
-- 3. month_kpi に youtube のKPIテキストを追加
-- ============================================================
insert into month_kpi (month, channel, kpi_text) values
  ('4月',  'youtube', '台本4本作成' || E'\n' || '（投稿は5月〜）'),
  ('5月',  'youtube', '2ACC稼働'    || E'\n' || '11リスト目標'),
  ('6月',  'youtube', '2ACC稼働'    || E'\n' || '46リスト目標'),
  ('7月',  'youtube', '2ACC稼働'    || E'\n' || '149リスト目標'),
  ('8月',  'youtube', '2ACC稼働'    || E'\n' || '263リスト目標'),
  ('9月',  'youtube', '3ACC稼働'    || E'\n' || '378リスト目標'),
  ('10月', 'youtube', '3ACC稼働'    || E'\n' || '492リスト目標'),
  ('11月', 'youtube', '3ACC稼働'    || E'\n' || '607リスト目標'),
  ('12月', 'youtube', '3ACC稼働'    || E'\n' || '721リスト目標')
on conflict (month, channel) do nothing;

-- ============================================================
-- 4. weekly_task_defs に youtube の週次タスクを追加
-- ============================================================
insert into weekly_task_defs (channel, week_number, task_text) values
  ('youtube', 1, '台本作成（前半4本）' || E'\n' || '目標: 4本完了'),
  ('youtube', 2, '台本作成（後半4本）' || E'\n' || '目標: 計8本完了'),
  ('youtube', 3, '演者・編集者入稿'    || E'\n' || '目標: 8本入稿完了'),
  ('youtube', 4, '公開・リスト数確認'  || E'\n' || '翌月企画立案')
on conflict (channel, week_number) do nothing;

-- ============================================================
-- 5. 確認用クエリ（コミット前に目視したい場合はコメントアウトを外す）
-- ============================================================
-- select id, name, list_price from channel_configs order by sort_order;
-- select month, channel, acc_count, lists, revenue from monthly_targets where channel = 'youtube' order by sort_order;
-- select month, channel, kpi_text from month_kpi where channel = 'youtube' order by month;
-- select channel, week_number, task_text from weekly_task_defs where channel = 'youtube' order by week_number;

commit;
