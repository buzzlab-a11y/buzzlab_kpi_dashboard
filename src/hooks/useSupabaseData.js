import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import {
  createInitialInputData,
  createInitialLinePhases,
  createInitialTaskData,
} from './useStorage';

const DEBOUNCE_MS  = 800;
const MAX_RETRIES  = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

// keepalive fetch for beforeunload (通常の fetch は tab 閉鎖時に中断される)
function keepalivePatch(userId, accessToken, patch) {
  if (!Object.keys(patch).length) return;
  fetch(
    `${SUPABASE_URL}/rest/v1/kpi_data?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      keepalive: true,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    }
  );
}

async function flushToSupabase(userId, patch, retries = 0) {
  const { error } = await supabase
    .from('kpi_data')
    .update(patch)
    .eq('user_id', userId);

  if (error && retries < MAX_RETRIES) {
    await new Promise(r => setTimeout(r, RETRY_DELAYS[retries]));
    return flushToSupabase(userId, patch, retries + 1);
  }
  return error;
}

// userId と accessToken を受け取る
// accessToken は App.jsx の session.access_token から渡す
export function useSupabaseData(userId, accessToken) {
  const [inputData,  setInputData]  = useState(null);
  const [linePhases, setLinePhases] = useState(null);
  const [taskData,   setTaskData]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  // 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');

  const pending      = useRef({});
  const timer        = useRef(null);
  const accessTokRef = useRef(accessToken);

  // accessToken が変わったら ref も更新
  useEffect(() => { accessTokRef.current = accessToken; }, [accessToken]);

  // ── 初回ロード ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('kpi_data')
        .select('input_data, line_phases, task_data')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        setSaveStatus('error');
        setLoading(false);
        return;
      }

      if (data) {
        // 既存データをロード
        setInputData(data.input_data  || createInitialInputData());
        setLinePhases(data.line_phases || createInitialLinePhases());
        setTaskData(data.task_data    || createInitialTaskData());
      } else {
        // 初回: upsert で初期データを作成（race condition 対策で insert ではなく upsert）
        const init = {
          user_id:     userId,
          input_data:  createInitialInputData(),
          line_phases: createInitialLinePhases(),
          task_data:   createInitialTaskData(),
        };
        const { error: upsertErr } = await supabase
          .from('kpi_data')
          .upsert(init, { onConflict: 'user_id' });

        if (!upsertErr) {
          setInputData(init.input_data);
          setLinePhases(init.line_phases);
          setTaskData(init.task_data);
        } else {
          setSaveStatus('error');
        }
      }
      setLoading(false);
    })();
  }, [userId]);

  // ── tab 閉鎖時に pending を強制フラッシュ ───────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const onUnload = () => {
      if (timer.current) clearTimeout(timer.current);
      keepalivePatch(userId, accessTokRef.current, pending.current);
      pending.current = {};
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [userId]);

  // ── debounce フラッシュ ──────────────────────────────────────────────────
  const scheduleFlush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const patch = { ...pending.current };
      pending.current = {};
      if (!Object.keys(patch).length) return;

      setSaveStatus('saving');
      const err = await flushToSupabase(userId, patch);
      setSaveStatus(err ? 'error' : 'saved');

      // 3秒後に 'saved' → 'idle' に戻す
      if (!err) setTimeout(() => setSaveStatus(s => s === 'saved' ? 'idle' : s), 3000);
    }, DEBOUNCE_MS);
  }, [userId]);

  // ── 更新ヘルパー ─────────────────────────────────────────────────────────
  const updateInput = useCallback((month, channel, field, value) => {
    setInputData(prev => {
      const next = {
        ...prev,
        [month]: {
          ...prev[month],
          [channel]: {
            ...(prev[month]?.[channel] || {}),
            [field]: value === '' ? 0 : Number(value),
          },
        },
      };
      pending.current.input_data = next;
      scheduleFlush();
      return next;
    });
  }, [scheduleFlush]);

  const updatePhase = useCallback((phase, field, value) => {
    setLinePhases(prev => {
      const next = { ...prev, [phase]: { ...(prev[phase] || {}), [field]: value } };
      pending.current.line_phases = next;
      scheduleFlush();
      return next;
    });
  }, [scheduleFlush]);

  const updateTask = useCallback((month, channel, week, value) => {
    setTaskData(prev => {
      const next = {
        ...prev,
        [month]: {
          ...prev[month],
          [channel]: { ...(prev[month]?.[channel] || {}), [week]: value },
        },
      };
      pending.current.task_data = next;
      scheduleFlush();
      return next;
    });
  }, [scheduleFlush]);

  const resetAll = useCallback(async () => {
    const init = {
      input_data:  createInitialInputData(),
      line_phases: createInitialLinePhases(),
      task_data:   createInitialTaskData(),
    };
    setSaveStatus('saving');
    const err = await flushToSupabase(userId, init);
    if (!err) {
      setInputData(init.input_data);
      setLinePhases(init.line_phases);
      setTaskData(init.task_data);
      pending.current = {};
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(s => s === 'saved' ? 'idle' : s), 3000);
    } else {
      setSaveStatus('error');
    }
  }, [userId]);

  return {
    inputData, linePhases, taskData,
    loading, saveStatus,
    updateInput, updatePhase, updateTask, resetAll,
  };
}
