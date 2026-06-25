import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// 営業・個別面談の集計ビュー（PIIなし）を取得する軽量フック。
// 生テーブル sales_meetings は anon 非公開のため、集計ビュー(sales_summary_*)のみ参照。
export function useSalesMeetings() {
  const [monthly, setMonthly]     = useState([]);
  const [byCloser, setByCloser]   = useState([]);
  const [bySource, setBySource]   = useState([]);
  const [byChannel, setByChannel] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [m, c, s, ch] = await Promise.all([
        supabase.from('sales_summary_monthly').select('*').order('source_month'),
        supabase.from('sales_summary_by_closer').select('*').order('source_month'),
        supabase.from('sales_summary_by_source').select('*').order('source_month'),
        supabase.from('sales_summary_by_channel').select('*').order('source_month'),
      ]);
      // 必須3ビュー（既存）。これが落ちたら営業タブ全体をエラー表示。
      const firstErr = m.error || c.error || s.error;
      if (firstErr) throw firstErr;
      setMonthly(m.data ?? []);
      setByCloser(c.data ?? []);
      setBySource(s.data ?? []);
      // 動線別ビューはマイグレーション未適用でも致命的にしない（未適用時は空＝「未入力」表示）
      setByChannel(ch.error ? [] : (ch.data ?? []));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchAll();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [fetchAll]);

  return { monthly, byCloser, bySource, byChannel, loading, error, refetch: fetchAll };
}
