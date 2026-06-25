import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 営業・個別面談の集計ビュー（PIIなし）を取得する。
// タブを開いた時だけ呼ばれる軽量フック。生テーブル sales_meetings は anon 非公開のため
// ここでは集計ビュー（sales_summary_*）のみ参照する。
export function useSalesMeetings() {
  const [monthly, setMonthly]     = useState([]);
  const [byCloser, setByCloser]   = useState([]);
  const [byChannel, setByChannel] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [m, c, ch] = await Promise.all([
          supabase.from('sales_summary_monthly').select('*').order('source_month'),
          supabase.from('sales_summary_by_closer').select('*').order('source_month'),
          supabase.from('sales_summary_by_channel').select('*').order('source_month'),
        ]);
        const firstErr = m.error || c.error || ch.error;
        if (firstErr) throw firstErr;
        if (!cancelled) {
          setMonthly(m.data ?? []);
          setByCloser(c.data ?? []);
          setByChannel(ch.data ?? []);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { monthly, byCloser, byChannel, loading, error };
}
