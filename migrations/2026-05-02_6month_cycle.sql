-- ============================================================
-- 2026-05-02: 6ヶ月周期サイクル戦略への移行
-- ============================================================
-- 戦略:
--   2サイクル / 6ヶ月毎 / 12ヶ月合計 2億 を維持
--   - Cycle 1 (Apr-Sep): Apr-May=0 (準備2ヶ月) → Jun-Sep 線形ランプ 1:2:3:4
--     → 9月ピーク 4,000万 / Cycle 1合計 1億
--   - Cycle 2 (Oct-Mar): Oct=ドロップ (≈Sepの25%) → Nov 底 → Dec-Mar 線形ランプ
--     → Cycle 2 全体で 1億
--
-- チャネル配分: IG 50% / YT 20% / Threads 30%
--   IG = 1億, YT = 4,000万, Threads = 6,000万
--
-- 適用方法: Supabase SQL Editor に貼り付けて実行
-- ============================================================

begin;

-- ============================================================
-- 1. Instagram (list_price 10,000) — 12ヶ月分更新
-- ============================================================
update monthly_targets set lists = 0,    revenue = 0           where channel = 'instagram' and month = '4月';
update monthly_targets set lists = 0,    revenue = 0           where channel = 'instagram' and month = '5月';
update monthly_targets set lists = 500,  revenue = 5000000    where channel = 'instagram' and month = '6月';
update monthly_targets set lists = 1000, revenue = 10000000   where channel = 'instagram' and month = '7月';
update monthly_targets set lists = 1500, revenue = 15000000   where channel = 'instagram' and month = '8月';
update monthly_targets set lists = 2000, revenue = 20000000   where channel = 'instagram' and month = '9月';
update monthly_targets set lists = 500,  revenue = 5000000    where channel = 'instagram' and month = '10月';
update monthly_targets set lists = 300,  revenue = 3000000    where channel = 'instagram' and month = '11月';
update monthly_targets set lists = 600,  revenue = 6000000    where channel = 'instagram' and month = '12月';
update monthly_targets set lists = 900,  revenue = 9000000    where channel = 'instagram' and month = '1月';
update monthly_targets set lists = 1200, revenue = 12000000   where channel = 'instagram' and month = '2月';
update monthly_targets set lists = 1500, revenue = 15000000   where channel = 'instagram' and month = '3月';

-- ============================================================
-- 2. YouTube (list_price 15,000) — 12ヶ月分更新
-- ============================================================
update monthly_targets set lists = 0,   revenue = 0          where channel = 'youtube' and month = '4月';
update monthly_targets set lists = 0,   revenue = 0          where channel = 'youtube' and month = '5月';
update monthly_targets set lists = 133, revenue = 1995000    where channel = 'youtube' and month = '6月';
update monthly_targets set lists = 267, revenue = 4005000    where channel = 'youtube' and month = '7月';
update monthly_targets set lists = 400, revenue = 6000000    where channel = 'youtube' and month = '8月';
update monthly_targets set lists = 533, revenue = 7995000    where channel = 'youtube' and month = '9月';
update monthly_targets set lists = 133, revenue = 1995000    where channel = 'youtube' and month = '10月';
update monthly_targets set lists = 80,  revenue = 1200000    where channel = 'youtube' and month = '11月';
update monthly_targets set lists = 160, revenue = 2400000    where channel = 'youtube' and month = '12月';
update monthly_targets set lists = 240, revenue = 3600000    where channel = 'youtube' and month = '1月';
update monthly_targets set lists = 320, revenue = 4800000    where channel = 'youtube' and month = '2月';
update monthly_targets set lists = 400, revenue = 6000000    where channel = 'youtube' and month = '3月';

-- ============================================================
-- 3. Threads (list_price 8,000) — 12ヶ月分更新
-- ============================================================
update monthly_targets set lists = 0,    revenue = 0          where channel = 'threads' and month = '4月';
update monthly_targets set lists = 0,    revenue = 0          where channel = 'threads' and month = '5月';
update monthly_targets set lists = 375,  revenue = 3000000   where channel = 'threads' and month = '6月';
update monthly_targets set lists = 750,  revenue = 6000000   where channel = 'threads' and month = '7月';
update monthly_targets set lists = 1125, revenue = 9000000   where channel = 'threads' and month = '8月';
update monthly_targets set lists = 1500, revenue = 12000000  where channel = 'threads' and month = '9月';
update monthly_targets set lists = 375,  revenue = 3000000   where channel = 'threads' and month = '10月';
update monthly_targets set lists = 225,  revenue = 1800000   where channel = 'threads' and month = '11月';
update monthly_targets set lists = 450,  revenue = 3600000   where channel = 'threads' and month = '12月';
update monthly_targets set lists = 675,  revenue = 5400000   where channel = 'threads' and month = '1月';
update monthly_targets set lists = 900,  revenue = 7200000   where channel = 'threads' and month = '2月';
update monthly_targets set lists = 1125, revenue = 9000000   where channel = 'threads' and month = '3月';

-- ============================================================
-- 4. month_kpi: kpi_text を新数値・サイクル位置に合わせて更新
--    ACC稼働数は既存DBの値を維持。表記は月の状態に応じて変更
-- ============================================================

-- Instagram
update month_kpi set kpi_text = '5ACC準備'  || E'\n' || '（C1助走）'         where channel = 'instagram' and month = '4月';
update month_kpi set kpi_text = '5ACC準備'  || E'\n' || '（6月から始動）'    where channel = 'instagram' and month = '5月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '500リスト目標'      where channel = 'instagram' and month = '6月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '1,000リスト目標'    where channel = 'instagram' and month = '7月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '1,500リスト目標'    where channel = 'instagram' and month = '8月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '2,000リスト目標 (C1ピーク)'  where channel = 'instagram' and month = '9月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '500リスト (C2ドロップ)'      where channel = 'instagram' and month = '10月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '300リスト (C2底)'           where channel = 'instagram' and month = '11月';
update month_kpi set kpi_text = '5ACC稼働'  || E'\n' || '600リスト目標'      where channel = 'instagram' and month = '12月';
update month_kpi set kpi_text = '15ACC稼働' || E'\n' || '900リスト目標'      where channel = 'instagram' and month = '1月';
update month_kpi set kpi_text = '15ACC稼働' || E'\n' || '1,200リスト目標'    where channel = 'instagram' and month = '2月';
update month_kpi set kpi_text = '15ACC稼働' || E'\n' || '1,500リスト目標 (C2ピーク)'   where channel = 'instagram' and month = '3月';

-- YouTube
update month_kpi set kpi_text = '1ACC準備'  || E'\n' || '（C1助走）'         where channel = 'youtube' and month = '4月';
update month_kpi set kpi_text = '2ACC準備'  || E'\n' || '（6月から投稿）'    where channel = 'youtube' and month = '5月';
update month_kpi set kpi_text = '2ACC稼働'  || E'\n' || '133リスト目標'      where channel = 'youtube' and month = '6月';
update month_kpi set kpi_text = '2ACC稼働'  || E'\n' || '267リスト目標'      where channel = 'youtube' and month = '7月';
update month_kpi set kpi_text = '2ACC稼働'  || E'\n' || '400リスト目標'      where channel = 'youtube' and month = '8月';
update month_kpi set kpi_text = '2ACC稼働'  || E'\n' || '533リスト目標 (C1ピーク)'    where channel = 'youtube' and month = '9月';
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '133リスト (C2ドロップ)'      where channel = 'youtube' and month = '10月';
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '80リスト (C2底)'            where channel = 'youtube' and month = '11月';
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '160リスト目標'      where channel = 'youtube' and month = '12月';
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '240リスト目標'      where channel = 'youtube' and month = '1月';
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '320リスト目標'      where channel = 'youtube' and month = '2月';
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '400リスト目標 (C2ピーク)'    where channel = 'youtube' and month = '3月';

-- Threads
update month_kpi set kpi_text = '3ACC準備'  || E'\n' || '（C1助走）'         where channel = 'threads' and month = '4月';
update month_kpi set kpi_text = '3ACC準備'  || E'\n' || '（6月から投稿）'    where channel = 'threads' and month = '5月';
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '375リスト目標'      where channel = 'threads' and month = '6月';
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '750リスト目標'      where channel = 'threads' and month = '7月';
update month_kpi set kpi_text = '3ACC稼働'  || E'\n' || '1,125リスト目標'    where channel = 'threads' and month = '8月';
update month_kpi set kpi_text = '6ACC稼働'  || E'\n' || '1,500リスト目標 (C1ピーク)'  where channel = 'threads' and month = '9月';
update month_kpi set kpi_text = '6ACC稼働'  || E'\n' || '375リスト (C2ドロップ)'      where channel = 'threads' and month = '10月';
update month_kpi set kpi_text = '6ACC稼働'  || E'\n' || '225リスト (C2底)'           where channel = 'threads' and month = '11月';
update month_kpi set kpi_text = '6ACC稼働'  || E'\n' || '450リスト目標'      where channel = 'threads' and month = '12月';
update month_kpi set kpi_text = '10ACC稼働' || E'\n' || '675リスト目標'      where channel = 'threads' and month = '1月';
update month_kpi set kpi_text = '10ACC稼働' || E'\n' || '900リスト目標'      where channel = 'threads' and month = '2月';
update month_kpi set kpi_text = '10ACC稼働' || E'\n' || '1,125リスト目標 (C2ピーク)'   where channel = 'threads' and month = '3月';

-- ============================================================
-- 確認用クエリ
-- ============================================================
-- select channel, sum(revenue) as total
-- from monthly_targets
-- group by channel
-- order by channel;
-- → instagram=100M, threads=60M, youtube≈40M, total=200M (2億)

-- select month, sort_order,
--   sum(revenue) as total_month,
--   sum(case when channel='instagram' then revenue else 0 end) as ig,
--   sum(case when channel='youtube'   then revenue else 0 end) as yt,
--   sum(case when channel='threads'   then revenue else 0 end) as th
-- from monthly_targets
-- group by month, sort_order
-- order by sort_order;

commit;
