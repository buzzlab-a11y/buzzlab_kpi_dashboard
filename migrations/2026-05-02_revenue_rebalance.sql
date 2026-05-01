-- ============================================================
-- 2026-05-02: JV削除 + 年間2億ターゲットに合わせてリバランス
-- ============================================================
-- 背景:
--   年間目標を2億に確定。JVチャネルは削除し、IG/YT/Threadsの3チャネルで構成。
--   配分比率: IG 5 : YT 2 : Threads 3 = 1億 / 4,000万 / 6,000万
--   ACC数は据え置き（前回更新後の値を維持）。月次プロファイルを保ったままlists/revenueをスケール。
--
-- 変更点:
--   1) channel_configs / monthly_targets / month_kpi / weekly_task_defs から 'jv' 行を削除
--   2) monthly_targets の IG/YT/Threads の lists / revenue を新比率に更新
--   3) month_kpi の IG/YT/Threads の kpi_text を新数値に更新
--
-- 適用方法: Supabase SQL Editor に貼り付けて実行
-- ============================================================

begin;

-- ============================================================
-- 1. JV削除
-- ============================================================
delete from weekly_task_defs where channel = 'jv';
delete from month_kpi        where channel = 'jv';
delete from monthly_targets  where channel = 'jv';
delete from channel_configs  where id      = 'jv';

-- ============================================================
-- 2. monthly_targets: IG / YT / Threads を新数値に更新
--    （ACCは据え置き、lists / revenue のみ変更）
-- ============================================================

-- YouTube ACC（保守的なスケールに見直し: 朝に作った別マイグレーションと同内容を冪等に再適用）
update monthly_targets set acc_count = 2 where channel = 'youtube' and month = '6月';
update monthly_targets set acc_count = 2 where channel = 'youtube' and month = '7月';
update monthly_targets set acc_count = 2 where channel = 'youtube' and month = '8月';
update monthly_targets set acc_count = 3 where channel = 'youtube' and month = '9月';
update monthly_targets set acc_count = 3 where channel = 'youtube' and month = '10月';
update monthly_targets set acc_count = 3 where channel = 'youtube' and month = '11月';
update monthly_targets set acc_count = 3 where channel = 'youtube' and month = '12月';

-- Instagram（年間 1億 / list_price ¥10,000）
update monthly_targets set lists = 125,  revenue = 1250000   where channel = 'instagram' and month = '5月';
update monthly_targets set lists = 373,  revenue = 3730000   where channel = 'instagram' and month = '6月';
update monthly_targets set lists = 719,  revenue = 7190000   where channel = 'instagram' and month = '7月';
update monthly_targets set lists = 1065, revenue = 10650000  where channel = 'instagram' and month = '8月';
update monthly_targets set lists = 1411, revenue = 14110000  where channel = 'instagram' and month = '9月';
update monthly_targets set lists = 1757, revenue = 17570000  where channel = 'instagram' and month = '10月';
update monthly_targets set lists = 2102, revenue = 21020000  where channel = 'instagram' and month = '11月';
update monthly_targets set lists = 2448, revenue = 24480000  where channel = 'instagram' and month = '12月';

-- YouTube（年間 4,000万 / list_price ¥15,000）
update monthly_targets set lists = 11,   revenue = 165000    where channel = 'youtube' and month = '5月';
update monthly_targets set lists = 46,   revenue = 690000    where channel = 'youtube' and month = '6月';
update monthly_targets set lists = 149,  revenue = 2235000   where channel = 'youtube' and month = '7月';
update monthly_targets set lists = 263,  revenue = 3945000   where channel = 'youtube' and month = '8月';
update monthly_targets set lists = 378,  revenue = 5670000   where channel = 'youtube' and month = '9月';
update monthly_targets set lists = 492,  revenue = 7380000   where channel = 'youtube' and month = '10月';
update monthly_targets set lists = 607,  revenue = 9105000   where channel = 'youtube' and month = '11月';
update monthly_targets set lists = 721,  revenue = 10815000  where channel = 'youtube' and month = '12月';

-- Threads（年間 6,000万 / list_price ¥5,000）
update monthly_targets set lists = 274,  revenue = 1370000   where channel = 'threads' and month = '7月';
update monthly_targets set lists = 822,  revenue = 4110000   where channel = 'threads' and month = '8月';
update monthly_targets set lists = 1584, revenue = 7920000   where channel = 'threads' and month = '9月';
update monthly_targets set lists = 2345, revenue = 11725000  where channel = 'threads' and month = '10月';
update monthly_targets set lists = 3107, revenue = 15535000  where channel = 'threads' and month = '11月';
update monthly_targets set lists = 3868, revenue = 19340000  where channel = 'threads' and month = '12月';

-- ============================================================
-- 3. month_kpi: kpi_text を新数値に揃える
-- ============================================================

-- Instagram
update month_kpi set kpi_text = '10ACC稼働' || E'\n' || '125リスト目標'    where channel = 'instagram' and month = '5月';
update month_kpi set kpi_text = '15ACC稼働' || E'\n' || '373リスト目標'    where channel = 'instagram' and month = '6月';
update month_kpi set kpi_text = '20ACC稼働' || E'\n' || '719リスト目標'    where channel = 'instagram' and month = '7月';
update month_kpi set kpi_text = '25ACC稼働' || E'\n' || '1,065リスト目標' where channel = 'instagram' and month = '8月';
update month_kpi set kpi_text = '30ACC稼働' || E'\n' || '1,411リスト目標' where channel = 'instagram' and month = '9月';
update month_kpi set kpi_text = '35ACC稼働' || E'\n' || '1,757リスト目標' where channel = 'instagram' and month = '10月';
update month_kpi set kpi_text = '40ACC稼働' || E'\n' || '2,102リスト目標' where channel = 'instagram' and month = '11月';
update month_kpi set kpi_text = '45ACC稼働' || E'\n' || '2,448リスト目標' where channel = 'instagram' and month = '12月';

-- YouTube
update month_kpi set kpi_text = '2ACC稼働' || E'\n' || '11リスト目標'   where channel = 'youtube' and month = '5月';
update month_kpi set kpi_text = '2ACC稼働' || E'\n' || '46リスト目標'   where channel = 'youtube' and month = '6月';
update month_kpi set kpi_text = '2ACC稼働' || E'\n' || '149リスト目標'  where channel = 'youtube' and month = '7月';
update month_kpi set kpi_text = '2ACC稼働' || E'\n' || '263リスト目標'  where channel = 'youtube' and month = '8月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '378リスト目標'  where channel = 'youtube' and month = '9月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '492リスト目標'  where channel = 'youtube' and month = '10月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '607リスト目標'  where channel = 'youtube' and month = '11月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '721リスト目標'  where channel = 'youtube' and month = '12月';

-- Threads
update month_kpi set kpi_text = '10ACC稼働' || E'\n' || '274リスト目標'    where channel = 'threads' and month = '7月';
update month_kpi set kpi_text = '15ACC稼働' || E'\n' || '822リスト目標'    where channel = 'threads' and month = '8月';
update month_kpi set kpi_text = '20ACC稼働' || E'\n' || '1,584リスト目標' where channel = 'threads' and month = '9月';
update month_kpi set kpi_text = '25ACC稼働' || E'\n' || '2,345リスト目標' where channel = 'threads' and month = '10月';
update month_kpi set kpi_text = '30ACC稼働' || E'\n' || '3,107リスト目標' where channel = 'threads' and month = '11月';
update month_kpi set kpi_text = '35ACC稼働' || E'\n' || '3,868リスト目標' where channel = 'threads' and month = '12月';

-- ============================================================
-- 4. 確認用クエリ（コミット前に目視確認したい場合はコメントアウトを外す）
-- ============================================================
-- select month, channel, acc_count, lists, revenue from monthly_targets order by sort_order, channel;
-- select month, channel, kpi_text from month_kpi order by month, channel;
-- select id from channel_configs order by sort_order;

commit;
