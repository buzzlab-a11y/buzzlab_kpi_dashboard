import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

const MONTHS_ORDER = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const DEBOUNCE_MS  = 800;
const MAX_RETRIES  = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

// タブ閉鎖時も届く keepalive fetch（認証不要）
function keepalivePatch(patch) {
  if (!Object.keys(patch).length) return;
  fetch(`${SUPABASE_URL}/rest/v1/kpi_data?id=eq.main`, {
    method: 'PATCH',
    keepalive: true,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });
}

async function flushWithRetry(patch, retries = 0) {
  const { error } = await supabase
    .from('kpi_data')
    .update(patch)
    .eq('id', 'main');
  if (error && retries < MAX_RETRIES) {
    await new Promise(r => setTimeout(r, RETRY_DELAYS[retries]));
    return flushWithRetry(patch, retries + 1);
  }
  return error;
}

// 月次ターゲット配列 → ROADMAP_DATA 互換オブジェクト配列に変換
function buildRoadmapData(rows) {
  const byMonth = {};
  for (const row of rows) {
    if (!byMonth[row.month]) byMonth[row.month] = { month: row.month, sort_order: row.sort_order };
    byMonth[row.month][row.channel] = {
      acc:     Number(row.acc_count),
      lists:   Number(row.lists),
      revenue: Number(row.revenue),
    };
  }
  // 月の並び順でソート
  return MONTHS_ORDER
    .filter(m => byMonth[m])
    .map(m => {
      const row = byMonth[m];
      const total = ['instagram','x','threads','youtube','jv'].reduce(
        (s, ch) => s + (row[ch]?.revenue || 0), 0
      );
      return { ...row, total };
    })
    .map((row, i, arr) => ({
      ...row,
      cumulative: arr.slice(0, i + 1).reduce((s, r) => s + r.total, 0),
    }));
}

// チャンネルごとの年間集計を計算（DBから派生）
function buildChannelAnnual(roadmapData, channelConfigs) {
  const result = {};
  for (const ch of ['instagram','x','threads','youtube','jv']) {
    const lists   = roadmapData.reduce((s, r) => s + (r[ch]?.lists   || 0), 0);
    const revenue = roadmapData.reduce((s, r) => s + (r[ch]?.revenue || 0), 0);
    const cfg     = channelConfigs[ch];
    result[ch] = { lists, revenue, listPrice: cfg?.list_price || 0 };
  }
  return result;
}

// month_kpi 行配列 → { '4月': { instagram: '...', ... }, ... } に変換
function buildMonthKpi(rows) {
  const result = {};
  for (const row of rows) {
    if (!result[row.month]) result[row.month] = {};
    result[row.month][row.channel] = row.kpi_text || '';
  }
  return result;
}

// weekly_task_defs 行配列 → { instagram: ['第1週', '第2週', ...], ... } に変換
function buildWeeklyTasks(rows) {
  const result = {};
  for (const row of rows) {
    if (!result[row.channel]) result[row.channel] = ['','','',''];
    result[row.channel][row.week_number - 1] = row.task_text || '';
  }
  return result;
}

// kpi_data の初期値を生成
function makeInitialInputData() {
  const data = {};
  MONTHS_ORDER.forEach(month => {
    data[month] = {};
    ['instagram','x','threads','youtube','jv'].forEach(ch => {
      data[month][ch] = { w1: 0, w2: 0, w3: 0, w4: 0 };
    });
  });
  return data;
}

function makeInitialLinePhasesStatus(phaseNames) {
  const data = {};
  phaseNames.forEach(p => { data[p] = { done: false, memo: '', improvement: '' }; });
  return data;
}

function makeInitialTaskData() {
  const data = {};
  MONTHS_ORDER.forEach(month => {
    data[month] = {};
    ['instagram','x','threads','youtube','jv'].forEach(ch => {
      data[month][ch] = { w1: '', w2: '', w3: '', w4: '' };
    });
  });
  return data;
}

export function useAppData() {
  // 静的マスターデータ
  const [channelConfigs,  setChannelConfigs]  = useState(null);
  const [roadmapData,     setRoadmapData]     = useState(null);
  const [monthKpi,        setMonthKpi]        = useState(null);
  const [linePhaseDefs,   setLinePhaseDefs]   = useState(null);
  const [weeklyTaskDefs,  setWeeklyTaskDefs]  = useState(null);

  // ユーザー入力データ
  const [inputData,         setInputData]         = useState(null);
  const [linePhasesStatus,  setLinePhasesStatus]  = useState(null);
  const [taskData,          setTaskData]          = useState(null);

  const [loading,     setLoading]     = useState(true);
  const [saveStatus,  setSaveStatus]  = useState('idle');

  const pending = useRef({});
  const timer   = useRef(null);

  // ── 全データ初回ロード ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);

      // 静的マスターデータを並列取得
      const [
        { data: cfgRows  },
        { data: tgtRows  },
        { data: kpiRows  },
        { data: phaseRows},
        { data: taskRows },
        { data: userData },
      ] = await Promise.all([
        supabase.from('channel_configs').select('*').order('sort_order'),
        supabase.from('monthly_targets').select('*').order('sort_order'),
        supabase.from('month_kpi').select('*'),
        supabase.from('line_phase_defs').select('*').order('sort_order'),
        supabase.from('weekly_task_defs').select('*').order('channel, week_number'),
        supabase.from('kpi_data').select('*').eq('id', 'main').maybeSingle(),
      ]);

      // 静的データを変換してセット
      const cfgMap = Object.fromEntries((cfgRows || []).map(r => [r.id, r]));
      setChannelConfigs(cfgMap);
      setRoadmapData(buildRoadmapData(tgtRows || []));
      setMonthKpi(buildMonthKpi(kpiRows || []));
      setLinePhaseDefs(phaseRows || []);
      setWeeklyTaskDefs(buildWeeklyTasks(taskRows || []));

      // ユーザー入力データ
      const phaseNames = (phaseRows || []).map(p => p.phase);
      if (userData) {
        setInputData(userData.input_data  || makeInitialInputData());
        setLinePhasesStatus(userData.line_phases_status || makeInitialLinePhasesStatus(phaseNames));
        setTaskData(userData.task_data    || makeInitialTaskData());
      } else {
        // kpi_data 行がなければ upsert で初期データ作成
        const init = {
          id: 'main',
          input_data: makeInitialInputData(),
          line_phases_status: makeInitialLinePhasesStatus(phaseNames),
          task_data: makeInitialTaskData(),
        };
        await supabase.from('kpi_data').upsert(init, { onConflict: 'id' });
        setInputData(init.input_data);
        setLinePhasesStatus(init.line_phases_status);
        setTaskData(init.task_data);
      }

      setLoading(false);
    })();
  }, []);

  // ── タブ閉鎖時の強制フラッシュ ─────────────────────────────────────────
  useEffect(() => {
    const onUnload = () => {
      if (timer.current) clearTimeout(timer.current);
      keepalivePatch(pending.current);
      pending.current = {};
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  // ── debounce フラッシュ ─────────────────────────────────────────────────
  const scheduleFlush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const patch = { ...pending.current };
      pending.current = {};
      if (!Object.keys(patch).length) return;

      setSaveStatus('saving');
      const err = await flushWithRetry(patch);
      setSaveStatus(err ? 'error' : 'saved');
      if (!err) setTimeout(() => setSaveStatus(s => s === 'saved' ? 'idle' : s), 3000);
    }, DEBOUNCE_MS);
  }, []);

  // ── 更新ヘルパー ───────────────────────────────────────────────────────
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
    setLinePhasesStatus(prev => {
      const next = { ...prev, [phase]: { ...(prev[phase] || {}), [field]: value } };
      pending.current.line_phases_status = next;
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
    const phaseNames = (linePhaseDefs || []).map(p => p.phase);
    const init = {
      input_data:         makeInitialInputData(),
      line_phases_status: makeInitialLinePhasesStatus(phaseNames),
      task_data:          makeInitialTaskData(),
    };
    setSaveStatus('saving');
    const err = await flushWithRetry(init);
    if (!err) {
      setInputData(init.input_data);
      setLinePhasesStatus(init.line_phases_status);
      setTaskData(init.task_data);
      pending.current = {};
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(s => s === 'saved' ? 'idle' : s), 3000);
    } else {
      setSaveStatus('error');
    }
  }, [linePhaseDefs]);

  // 年間集計（派生データ・計算済み）
  const channelAnnual = useMemo(
    () => channelConfigs && roadmapData ? buildChannelAnnual(roadmapData, channelConfigs) : null,
    [channelConfigs, roadmapData]
  );

  return {
    // マスターデータ
    channelConfigs,
    roadmapData,
    channelAnnual,
    monthKpi,
    linePhaseDefs,
    weeklyTaskDefs,
    // ユーザー入力
    inputData,
    linePhasesStatus,
    taskData,
    // 状態
    loading,
    saveStatus,
    // 操作
    updateInput,
    updatePhase,
    updateTask,
    resetAll,
  };
}
