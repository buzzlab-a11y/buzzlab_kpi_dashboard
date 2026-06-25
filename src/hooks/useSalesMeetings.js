import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 営業・個別面談の集計ビュー（PIIなし）を取得する軽量フック。
// 生テーブル sales_meetings は anon 非公開のため、集計ビュー(sales_summary_*)のみ参照。
export function useSalesMeetings() {
  const [monthly, setMonthly]   = useState([]);
  const [byCloser, setByCloser] = useState([]);
  const [bySource, setBySource] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [m, c, s] = await Promise.all([
          supabase.from('sales_summary_monthly').select('*').order('source_month'),
          supabase.from('sales_summary_by_closer').select('*').order('source_month'),
          supabase.from('sales_summary_by_source').select('*').order('source_month'),
        ]);
        const firstErr = m.error || c.error || s.error;
        if (firstErr) throw firstErr;
        if (!cancelled) {
          setMonthly(m.data ?? []);
          setByCloser(c.data ?? []);
          setBySource(s.data ?? []);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { monthly, byCloser, bySource, loading, error };
}
