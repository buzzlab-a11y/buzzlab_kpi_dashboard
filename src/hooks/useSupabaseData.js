import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  createInitialInputData,
  createInitialLinePhases,
  createInitialTaskData,
} from './useStorage';

const DEBOUNCE_MS = 1000;

export function useSupabaseData(userId) {
  const [inputData,  setInputData]  = useState(null);
  const [linePhases, setLinePhases] = useState(null);
  const [taskData,   setTaskData]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);

  // Pending write buffer + debounce timer
  const pending = useRef({});
  const timer   = useRef(null);

  // ── Load from Supabase ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('kpi_data')
        .select('input_data, line_phases, task_data')
        .eq('user_id', userId)
        .maybeSingle();

      if (err) {
        setError(err.message);
      } else if (data) {
        setInputData(data.input_data);
        setLinePhases(data.line_phases);
        setTaskData(data.task_data);
      } else {
        // First time — insert initial row
        const init = {
          user_id:     userId,
          input_data:  createInitialInputData(),
          line_phases: createInitialLinePhases(),
          task_data:   createInitialTaskData(),
        };
        const { error: insertErr } = await supabase.from('kpi_data').insert(init);
        if (insertErr) {
          setError(insertErr.message);
        } else {
          setInputData(init.input_data);
          setLinePhases(init.line_phases);
          setTaskData(init.task_data);
        }
      }
      setLoading(false);
    })();
  }, [userId]);

  // ── Debounced flush to Supabase ──────────────────────────────────────────
  const scheduleFlush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const patch = { ...pending.current };
      pending.current = {};
      if (!Object.keys(patch).length) return;

      setSaving(true);
      const { error: err } = await supabase
        .from('kpi_data')
        .update(patch)
        .eq('user_id', userId);
      if (err) setError(err.message);
      setSaving(false);
    }, DEBOUNCE_MS);
  }, [userId]);

  // ── Update helpers ───────────────────────────────────────────────────────
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
    setSaving(true);
    const { error: err } = await supabase
      .from('kpi_data')
      .update(init)
      .eq('user_id', userId);
    if (err) { setError(err.message); setSaving(false); return; }
    setInputData(init.input_data);
    setLinePhases(init.line_phases);
    setTaskData(init.task_data);
    pending.current = {};
    setSaving(false);
  }, [userId]);

  return {
    inputData, linePhases, taskData,
    loading, saving, error,
    updateInput, updatePhase, updateTask, resetAll,
  };
}
