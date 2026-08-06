import { useState, useEffect, useCallback, useRef } from 'react';

// 受講生データ（PII）を PIN 認証つきで読み書きするフック。
// /api/students（Vercel Serverless・service_role）経由でのみ取得・更新する。
// PIN は MeetingForm.jsx の PIN_KEY と同一キーで sessionStorage を共有する。
const PIN_KEY = 'meeting_form_pin';

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [summary, setSummary]   = useState(null);
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
      const res = await fetch('/api/students', {
        headers: { 'x-form-pin': usePin },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(PIN_KEY);
        setNeedsPin(true);
        return false;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || `エラー (${res.status})`);
      }
      const data = await res.json();
      setStudents(data.students ?? []);
      setSummary(data.summary ?? null);
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

  const save = useCallback(async (record) => {
    const usePin = pinRef.current;
    const method = record?.id ? 'PATCH' : 'POST';
    const res = await fetch('/api/students', {
      method,
      headers: { 'Content-Type': 'application/json', 'x-form-pin': usePin },
      body: JSON.stringify(record),
    });
    if (res.status === 401) {
      sessionStorage.removeItem(PIN_KEY);
      setNeedsPin(true);
      throw new Error('PIN が違います');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.error || `エラー (${res.status})`);
    }
    await load(usePin); // 成功後に再取得
  }, [load]);

  return { students, summary, loading, error, needsPin, pin, setPin, load, save };
}
