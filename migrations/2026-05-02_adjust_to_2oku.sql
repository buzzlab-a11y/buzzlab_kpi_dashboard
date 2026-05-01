-- ============================================================
-- 2026-05-02: 12ヶ月合計 = 2億 になるよう IG/Threads の4-12月を調整
-- ============================================================
-- 背景:
--   1-3月（次会計年度の頭）の数値が IG/Threads に入力済みで、
--   合計が 2.61億 になっていた。
--   12ヶ月累計 = 2億 を維持するため、4-12月の数値だけスケールダウン。
--
--   配分目標 (12ヶ月):
--     IG     1億   = 1-3月 33M + 4-12月 67M   (現 100M → 67M, scale 0.67)
--     YT     0.4億 = 1-3月  0M + 4-12月 40M   (変更なし)
--     Threads 0.6億 = 1-3月 22M + 4-12月 38M   (現 66M → 38M, scale 0.5758)
--
-- 適用方法: Supabase SQL Editor に貼り付けて実行
-- ============================================================

begin;

-- ============================================================
-- Instagram 4-12月: lists / revenue を 0.67倍にスケール
-- （revenue = lists × list_price 10,000 で整合）
-- ============================================================
update monthly_targets set lists = 84,   revenue = 840000    where channel = 'instagram' and month = '5月';
update monthly_targets set lists = 250,  revenue = 2500000   where channel = 'instagram' and month = '6月';
update monthly_targets set lists = 482,  revenue = 4820000   where channel = 'instagram' and month = '7月';
update monthly_targets set lists = 714,  revenue = 7140000   where channel = 'instagram' and month = '8月';
update monthly_targets set lists = 946,  revenue = 9460000   where channel = 'instagram' and month = '9月';
update monthly_targets set lists = 1177, revenue = 11770000  where channel = 'instagram' and month = '10月';
update monthly_targets set lists = 1407, revenue = 14070000  where channel = 'instagram' and month = '11月';
update monthly_targets set lists = 1640, revenue = 16400000  where channel = 'instagram' and month = '12月';

-- ============================================================
-- Threads 4-12月: lists / revenue を 0.5758倍にスケール
-- ============================================================
update monthly_targets set lists = 432,  revenue = 3455000   where channel = 'threads' and month = '6月';
update monthly_targets set lists = 158,  revenue = 790000    where channel = 'threads' and month = '7月';
update monthly_targets set lists = 473,  revenue = 2365000   where channel = 'threads' and month = '8月';
update monthly_targets set lists = 912,  revenue = 4560000   where channel = 'threads' and month = '9月';
update monthly_targets set lists = 1350, revenue = 6750000   where channel = 'threads' and month = '10月';
update monthly_targets set lists = 1789, revenue = 8945000   where channel = 'threads' and month = '11月';
update monthly_targets set lists = 2227, revenue = 11135000  where channel = 'threads' and month = '12月';

-- ============================================================
-- month_kpi: kpi_text の数値表記を新しい lists 値に合わせて更新
-- （ACC稼働数は既存DBの値を維持。表記は実態に合わせて適宜調整可）
-- ============================================================

-- Instagram
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '84リスト目標'    where channel = 'instagram' and month = '5月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '250リスト目標'   where channel = 'instagram' and month = '6月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '482リスト目標'   where channel = 'instagram' and month = '7月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '714リスト目標'   where channel = 'instagram' and month = '8月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '946リスト目標'   where channel = 'instagram' and month = '9月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '1,177リスト目標' where channel = 'instagram' and month = '10月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '1,407リスト目標' where channel = 'instagram' and month = '11月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '1,640リスト目標' where channel = 'instagram' and month = '12月';

-- Threads
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '432リスト目標'   where channel = 'threads' and month = '6月';
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '158リスト目標'   where channel = 'threads' and month = '7月';
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '473リスト目標'   where channel = 'threads' and month = '8月';
update month_kpi set kpi_text = '6ACC稼働'  || E'\n' || '912リスト目標'   where channel = 'threads' and month = '9月';
update month_kpi set kpi_text = '6ACC稼働'  || E'\n' || '1,350リスト目標' where channel = 'threads' and month = '10月';
update month_kpi set kpi_text = '10ACC稼働' || E'\n' || '1,789リスト目標' where channel = 'threads' and month = '11月';
update month_kpi set kpi_text = '10ACC稼働' || E'\n' || '2,227リスト目標' where channel = 'threads' and month = '12月';

-- ============================================================
-- 確認用クエリ
-- ============================================================
-- select channel, sum(revenue) as total
-- from monthly_targets
-- group by channel
-- order by channel;
-- → instagram=100M, threads=60M, youtube=40M, total=200M (2億)

commit;
