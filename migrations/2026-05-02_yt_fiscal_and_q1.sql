-- ============================================================
-- 2026-05-02: YouTube を会計年度ソートに整え、1-3月の数値を投入
-- ============================================================
-- 背景:
--   YouTube の sort_order が暦年(1月=1, ..., 12月=12)になっており、
--   IG/Threads の会計年度ソート(4月=1, ..., 3月=12)とズレていた。
--   また YT 1-3月は 0 のままだった。
--
--   - YT sort_order を会計年度に揃える
--   - YT 1-3月 に IG/Threads と同じ 5:4:2 比率で 13.2M を配分
--     (1月=6M / 2月=4.8M / 3月=2.4M, list_price 15,000円)
--   - YT 4-12月 の lists/revenue を 0.67倍にスケールダウンして
--     12ヶ月合計を 40M (=4,000万) に保つ
--
--   結果: IG 1億 + YT 4,000万 + Threads 6,000万 = 2億 維持
--
-- 適用方法: Supabase SQL Editor に貼り付けて実行
-- ============================================================

begin;

-- ============================================================
-- 1. YT sort_order を会計年度ソートに更新
-- ============================================================
update monthly_targets set sort_order = 1  where channel = 'youtube' and month = '4月';
update monthly_targets set sort_order = 2  where channel = 'youtube' and month = '5月';
update monthly_targets set sort_order = 3  where channel = 'youtube' and month = '6月';
update monthly_targets set sort_order = 4  where channel = 'youtube' and month = '7月';
update monthly_targets set sort_order = 5  where channel = 'youtube' and month = '8月';
update monthly_targets set sort_order = 6  where channel = 'youtube' and month = '9月';
update monthly_targets set sort_order = 7  where channel = 'youtube' and month = '10月';
update monthly_targets set sort_order = 8  where channel = 'youtube' and month = '11月';
update monthly_targets set sort_order = 9  where channel = 'youtube' and month = '12月';
update monthly_targets set sort_order = 10 where channel = 'youtube' and month = '1月';
update monthly_targets set sort_order = 11 where channel = 'youtube' and month = '2月';
update monthly_targets set sort_order = 12 where channel = 'youtube' and month = '3月';

-- ============================================================
-- 2. YT 1-3月: 0→実数値に更新（IG/Threads と同じ 5:4:2 比率）
-- ============================================================
update monthly_targets set acc_count = 3, lists = 400, revenue = 6000000  where channel = 'youtube' and month = '1月';
update monthly_targets set acc_count = 3, lists = 320, revenue = 4800000  where channel = 'youtube' and month = '2月';
update monthly_targets set acc_count = 3, lists = 160, revenue = 2400000  where channel = 'youtube' and month = '3月';

-- ============================================================
-- 3. YT 4-12月: lists/revenue を 0.67倍にスケール
--    （revenue = lists × list_price 15,000 で整合）
-- ============================================================
update monthly_targets set lists = 7,   revenue = 105000   where channel = 'youtube' and month = '5月';
update monthly_targets set lists = 31,  revenue = 465000   where channel = 'youtube' and month = '6月';
update monthly_targets set lists = 100, revenue = 1500000  where channel = 'youtube' and month = '7月';
update monthly_targets set lists = 176, revenue = 2640000  where channel = 'youtube' and month = '8月';
update monthly_targets set lists = 253, revenue = 3795000  where channel = 'youtube' and month = '9月';
update monthly_targets set lists = 330, revenue = 4950000  where channel = 'youtube' and month = '10月';
update monthly_targets set lists = 407, revenue = 6105000  where channel = 'youtube' and month = '11月';
update monthly_targets set lists = 483, revenue = 7245000  where channel = 'youtube' and month = '12月';

-- ============================================================
-- 4. month_kpi: YT の kpi_text を新数値に更新 + 1-3月分を新規追加
-- ============================================================
update month_kpi set kpi_text = '2ACC稼働' || E'\n' || '7リスト目標'   where channel = 'youtube' and month = '5月';
update month_kpi set kpi_text = '2ACC稼働' || E'\n' || '31リスト目標'  where channel = 'youtube' and month = '6月';
update month_kpi set kpi_text = '2ACC稼働' || E'\n' || '100リスト目標' where channel = 'youtube' and month = '7月';
update month_kpi set kpi_text = '2ACC稼働' || E'\n' || '176リスト目標' where channel = 'youtube' and month = '8月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '253リスト目標' where channel = 'youtube' and month = '9月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '330リスト目標' where channel = 'youtube' and month = '10月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '407リスト目標' where channel = 'youtube' and month = '11月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '483リスト目標' where channel = 'youtube' and month = '12月';

insert into month_kpi (month, channel, kpi_text) values
  ('1月', 'youtube', '3ACC稼働' || E'\n' || '400リスト目標'),
  ('2月', 'youtube', '3ACC稼働' || E'\n' || '320リスト目標'),
  ('3月', 'youtube', '3ACC稼働' || E'\n' || '160リスト目標')
on conflict (month, channel) do update set kpi_text = excluded.kpi_text;

-- ============================================================
-- 確認用クエリ
-- ============================================================
-- select channel, sum(revenue) as total
-- from monthly_targets
-- group by channel
-- order by channel;
-- → instagram=100M, threads=60M, youtube=40M, total=200M (2億)

-- select month, sort_order, lists, revenue
-- from monthly_targets
-- where channel = 'youtube'
-- order by sort_order;
-- → 4月=1 から 3月=12 の会計年度順で並ぶこと

commit;
