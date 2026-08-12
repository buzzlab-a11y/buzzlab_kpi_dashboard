import { useState, useEffect, useCallback, useRef } from 'react';

// JV（ジョイントベンチャー）パートナー経由の商談成績・獲得受講生データを PIN 認証つきで取得するフック。
// /api/jv（Vercel Serverless・service_role）経由でのみ取得する。
// PIN は useStudents.js の PIN_KEY と同一キーで sessionStorage を共有する（営業/受講生タブと共通PIN）。
const PIN_KEY = 'meeting_form_pin';

export function useJv() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [needsPin, setNeedsPin] = useState(false);
  const [pin, setPin]           = useState(() => sessionStorage.getItem(PIN_KEY) || '');

  // load 内から常に「今の pin」を参照するための ref（load 自体の identity は固定したい）
  const pinRef = useRef(pin);
  pinRef.current = pin;

  const load = useCallback(async (pinOverride) => {
    const usePin = pinOverride ?? pinRef.current;
    if (!usePin) {
      setNeedsPin(true);
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/jv', {
        headers: { 'x-form-pin': usePin },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(PIN_KEY);
        setNeedsPin(true);
        return false;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || `エラー (${res.status})`);
      }
      const body = await res.json();
      setData(body);
      sessionStorage.setItem(PIN_KEY, usePin); // 成功した PIN だけ保持
      setPin(usePin);
      setNeedsPin(false);
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回マウント時: sessionStorage に PIN があれば自動ロード。無ければ待機。
  useEffect(() => {
    const saved = sessionStorage.getItem(PIN_KEY);
    if (saved) {
      load(saved);
    } else {
      setNeedsPin(true);
    }
  }, [load]);

  return { data, loading, error, needsPin, pin, setPin, load };
}
