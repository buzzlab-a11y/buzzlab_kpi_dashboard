-- ============================================================
-- 2026-05-02: YouTube ACC稼働数の見直し
-- ============================================================
-- 背景:
--   YouTubeのACC稼働数を保守的なスケール（2〜3ACC）に見直し。
--   1ACCあたりの生産性向上を前提に、リスト目標・売上目標は据え置き。
--
-- 変更点:
--   monthly_targets.acc_count （6〜12月の8月分）
--   month_kpi.kpi_text         （6〜12月の表記をACC数に揃える）
--
-- 適用方法:
--   Supabase SQL Editor に貼り付けて実行
-- ============================================================

begin;

-- monthly_targets: ACC数を更新（lists / revenue は変更なし）
update monthly_targets set acc_count = 2 where channel = 'youtube' and month = '6月';
update monthly_targets set acc_count = 2 where channel = 'youtube' and month = '7月';
update monthly_targets set acc_count = 2 where channel = 'youtube' and month = '8月';
update monthly_targets set acc_count = 3 where channel = 'youtube' and month = '9月';
update monthly_targets set acc_count = 3 where channel = 'youtube' and month = '10月';
update monthly_targets set acc_count = 3 where channel = 'youtube' and month = '11月';
update monthly_targets set acc_count = 3 where channel = 'youtube' and month = '12月';

-- month_kpi: 表示テキストのACC表記を一致させる
update month_kpi set kpi_text = '2ACC稼働' || E'\n' || '160リスト目標'    where channel = 'youtube' and month = '6月';
update month_kpi set kpi_text = '2ACC稼働' || E'\n' || '520リスト目標'    where channel = 'youtube' and month = '7月';
update month_kpi set kpi_text = '2ACC稼働' || E'\n' || '920リスト目標'    where channel = 'youtube' and month = '8月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '1,320リスト目標' where channel = 'youtube' and month = '9月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '1,720リスト目標' where channel = 'youtube' and month = '10月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '2,120リスト目標' where channel = 'youtube' and month = '11月';
update month_kpi set kpi_text = '3ACC稼働' || E'\n' || '2,520リスト目標' where channel = 'youtube' and month = '12月';

-- 確認用クエリ（コミット前に目視確認）
-- select month, channel, acc_count, lists, revenue from monthly_targets
--   where channel = 'youtube' order by sort_order;
-- select month, channel, kpi_text from month_kpi
--   where channel = 'youtube' order by month;

commit;
