import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useSalesMeetings } from '../hooks/useSalesMeetings';
import { G } from '../styles/theme';
import { fmtM } from '../lib/formatters';

// ── 共通の小コンポーネント（他ダッシュボードと同じスタイル）────────────────
function Card({ title, children, style }) {
  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radiusLg, padding: '20px', ...style }}>
      {title && <h3 style={{ fontSize: 14, fontWeight: 600, color: G.text1, marginBottom: 16 }}>{title}</h3>}
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub, color = G.primary, chip }) {
  return (
    <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radiusLg, padding: '20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, color: G.text2, fontWeight: 500 }}>{label}</span>
        {chip && <span style={{ background: color + '18', color, borderRadius: G.radiusPill, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{chip}</span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: G.text1, letterSpacing: -0.5, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: G.text3 }}>{sub}</div>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: G.surface, borderRadius: G.radiusMd, padding: '10px 14px', boxShadow: G.shadow3, border: `1px solid ${G.border}`, minWidth: 150 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: G.text1, marginBottom: 8 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: G.text2, flex: 1 }}>{p.name}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: G.text1 }}>
            {p.name === '成約率' ? `${p.value ?? 0}%` : (p.value ?? 0).toLocaleString?.()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────
const fmtMonth = (ym) => {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || '');
  return m ? `${m[1]}/${m[2]}` : (ym || '');
};
const pct = (contracts, held) => (held > 0 ? Math.round((contracts / held) * 1000) / 10 : 0);

const TYPE_LABEL = { jv: 'JV', seminar: 'セミナー', self: '自社', monthly: '月次', other: 'その他' };
const TYPE_COLOR = { jv: '#9c27b0', seminar: '#1a73e8', self: '#1e8e3e', monthly: '#5f6368', other: '#9aa0a6' };

// 指定キーで合算し、成約率を再計算
function groupBy(rows, keyField, extra = []) {
  const map = new Map();
  for (const r of rows) {
    const k = r[keyField] ?? '(未設定)';
    const cur = map.get(k) || { [keyField]: k, meetings: 0, held: 0, contracts: 0, revenue_in_tax: 0 };
    cur.meetings += r.meetings || 0;
    cur.held += r.held || 0;
    cur.contracts += r.contracts || 0;
    cur.revenue_in_tax += r.revenue_in_tax || 0;
    for (const e of extra) if (r[e] != null) cur[e] = r[e]; // source_type 等を保持
    map.set(k, cur);
  }
  return [...map.values()]
    .map(r => ({ ...r, contract_rate: pct(r.contracts, r.held) }))
    .sort((a, b) => b.contracts - a.contracts || b.held - a.held);
}

export default function SalesDashboard() {
  const { monthly, byCloser, bySource, loading, error } = useSalesMeetings();
  const { isMobile, isTablet } = useBreakpoint();
  const [month, setMonth] = useState('all');

  const months = useMemo(() => monthly.map(r => r.source_month).sort(), [monthly]);
  const scope = useMemo(
    () => (month === 'all' ? monthly : monthly.filter(r => r.source_month === month)),
    [monthly, month]
  );

  const kpi = useMemo(() => {
    const a = { meetings: 0, held: 0, contracts: 0, lost: 0, cancels: 0, noshows: 0, pendings: 0, cooloffs: 0, revenue: 0, received: 0 };
    for (const r of scope) {
      a.meetings += r.meetings || 0; a.held += r.held || 0; a.contracts += r.contracts || 0;
      a.lost += r.lost || 0; a.cancels += r.cancels || 0; a.noshows += r.noshows || 0;
      a.pendings += r.pendings || 0; a.cooloffs += r.cooloffs || 0;
      a.revenue += r.revenue_in_tax || 0; a.received += r.received_amount || 0;
    }
    return { ...a, rate: pct(a.contracts, a.held) };
  }, [scope]);

  const trend = useMemo(
    () => [...monthly].sort((a, b) => a.source_month.localeCompare(b.source_month)).map(r => ({
      month: fmtMonth(r.source_month),
      成約: r.contracts || 0, 失注: r.lost || 0, 検討中: r.pendings || 0,
      飛び: r.noshows || 0, キャンセル: r.cancels || 0, クーリングオフ: r.cooloffs || 0,
      成約率: r.contract_rate || 0,
    })),
    [monthly]
  );

  const sourceRows = useMemo(() => {
    const src = month === 'all' ? bySource : bySource.filter(r => r.source_month === month);
    return groupBy(src, 'source_sheet', ['source_type']);
  }, [bySource, month]);

  const closerRows = useMemo(() => {
    const src = month === 'all' ? byCloser : byCloser.filter(r => r.source_month === month);
    return groupBy(src, 'closer');
  }, [byCloser, month]);

  if (loading) return <Card><div style={{ color: G.text2, fontSize: 14 }}>営業データを読み込み中...</div></Card>;
  if (error) {
    const missing = /relation|does not exist|schema cache|find the table/i.test(error.message || '');
    return (
      <Card title="営業データを取得できませんでした">
        <div style={{ fontSize: 13, color: G.text2, lineHeight: 1.7 }}>
          {missing
            ? '集計ビュー（sales_summary_*）が見つかりません。Supabase に supabase_sales_meetings.sql を適用してください。'
            : `エラー: ${error.message}`}
        </div>
      </Card>
    );
  }
  if (!monthly.length) {
    return <Card title="営業・個別面談"><div style={{ fontSize: 13, color: G.text2 }}>まだデータがありません。CSV を取り込むと集計が表示されます。</div></Card>;
  }

  const kpiCols = isMobile ? 2 : isTablet ? 3 : 6;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 月セレクタ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: G.text3 }}>対象月:</span>
        {['all', ...months].map(m => {
          const active = month === m;
          return (
            <button key={m} onClick={() => setMonth(m)}
              style={{
                border: `1px solid ${active ? G.primary : G.border}`,
                background: active ? G.primaryContainer : G.surface,
                color: active ? G.primary : G.text2,
                borderRadius: G.radiusPill, padding: '5px 14px', fontSize: 12,
                fontWeight: active ? 700 : 500, cursor: 'pointer',
              }}>
              {m === 'all' ? '全期間' : fmtMonth(m)}
            </button>
          );
        })}
      </div>

      {/* KPIカード */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpiCols},1fr)`, gap: 12 }}>
        <MetricCard label="面談数" value={kpi.meetings.toLocaleString()} sub="全レコード" color={G.primary} />
        <MetricCard label="実施" value={kpi.held.toLocaleString()} sub="飛び/キャンセル除く" color={G.text1} />
        <MetricCard label="成約" value={kpi.contracts.toLocaleString()} sub={`失注 ${kpi.lost} / 検討 ${kpi.pendings}`} color={G.success} chip={`${kpi.rate}%`} />
        <MetricCard label="成約率" value={`${kpi.rate}%`} sub="成約 / 実施" color={G.success} />
        <MetricCard label="飛び+ｷｬﾝｾﾙ" value={(kpi.noshows + kpi.cancels).toLocaleString()} sub={`飛び ${kpi.noshows} / ｷｬﾝｾﾙ ${kpi.cancels}`} color={G.warning} />
        <MetricCard label="売上(税込)" value={fmtM(kpi.revenue)} sub={`着金 ${fmtM(kpi.received)}`} color={G.success} />
      </div>

      {/* 月次推移 */}
      <Card title="月次推移（面談結果の内訳 ＋ 成約率）">
        <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
          <ComposedChart data={trend} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 0" stroke={G.border} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: G.text3 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: G.text3 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} domain={[0, 100]} tick={{ fontSize: 10, fill: G.text3 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<ChartTooltip />} />
            <Bar yAxisId="left" dataKey="成約" stackId="a" fill={G.success} name="成約" />
            <Bar yAxisId="left" dataKey="検討中" stackId="a" fill={G.primary} name="検討中" />
            <Bar yAxisId="left" dataKey="失注" stackId="a" fill={G.text3} name="失注" />
            <Bar yAxisId="left" dataKey="飛び" stackId="a" fill={G.warning} name="飛び" />
            <Bar yAxisId="left" dataKey="キャンセル" stackId="a" fill={G.error} name="キャンセル" />
            <Bar yAxisId="left" dataKey="クーリングオフ" stackId="a" fill="#9c27b0" name="クーリングオフ" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="成約率" stroke="#0b8043" strokeWidth={2.5} dot={{ r: 3, fill: '#0b8043', strokeWidth: 0 }} name="成約率" />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* 獲得ソース別（JV/セミナー/自社/月次）*/}
      <Card title="獲得ソース別（JV・セミナー・自社・月次）" style={{ overflowX: 'auto' }}>
        <SrcTable rows={sourceRows} isSource />
      </Card>

      {/* 面談者別 */}
      <Card title="面談者（クローザー）別" style={{ overflowX: 'auto' }}>
        <SrcTable rows={closerRows} />
      </Card>
    </div>
  );
}

// 表（ソース別 / 面談者別 共用・列ヘッダークリックでソート）
const STR_KEYS = ['source_sheet', 'source_type', 'closer'];

function SrcTable({ rows, isSource = false }) {
  const cols = isSource
    ? [
        { key: 'source_sheet', label: 'ソース', align: 'left' },
        { key: 'source_type', label: '種別', align: 'center' },
        { key: 'meetings', label: '面談', align: 'center' },
        { key: 'held', label: '実施', align: 'center' },
        { key: 'contracts', label: '成約', align: 'center' },
        { key: 'contract_rate', label: '成約率', align: 'center' },
        { key: 'revenue_in_tax', label: '売上', align: 'right' },
      ]
    : [
        { key: 'closer', label: '面談者', align: 'left' },
        { key: 'meetings', label: '面談', align: 'center' },
        { key: 'held', label: '実施', align: 'center' },
        { key: 'contracts', label: '成約', align: 'center' },
        { key: 'contract_rate', label: '成約率', align: 'center' },
        { key: 'revenue_in_tax', label: '売上', align: 'right' },
      ];
  const [sortKey, setSortKey] = useState('contracts');
  const [dir, setDir] = useState('desc');

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      if (STR_KEYS.includes(sortKey)) {
        const av = (a[sortKey] ?? '').toString(), bv = (b[sortKey] ?? '').toString();
        return dir === 'asc' ? av.localeCompare(bv, 'ja') : bv.localeCompare(av, 'ja');
      }
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      return dir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [rows, sortKey, dir]);

  const onSort = (k) => {
    if (k === sortKey) setDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setDir(STR_KEYS.includes(k) ? 'asc' : 'desc'); }
  };

  if (!rows.length) return <div style={{ fontSize: 13, color: G.text3 }}>データなし</div>;
  const maxHeld = Math.max(1, ...rows.map(r => r.held || 0));

  const renderCell = (r, key) => {
    if (key === 'source_type') {
      return (
        <span style={{ background: (TYPE_COLOR[r.source_type] || G.text3) + '18', color: TYPE_COLOR[r.source_type] || G.text3, borderRadius: G.radiusPill, padding: '1px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {TYPE_LABEL[r.source_type] || r.source_type}
        </span>
      );
    }
    if (key === 'source_sheet' || key === 'closer') return <span style={{ fontWeight: 600, color: G.text1, whiteSpace: 'nowrap' }}>{r[key]}</span>;
    if (key === 'contracts') return <span style={{ color: G.success, fontWeight: 700 }}>{r.contracts}</span>;
    if (key === 'contract_rate') return <span style={{ color: G.text1, fontWeight: 600 }}>{r.contract_rate}%</span>;
    if (key === 'revenue_in_tax') return <span style={{ color: G.text1, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtM(r.revenue_in_tax)}</span>;
    return <span style={{ color: G.text2 }}>{r[key]}</span>;
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: isSource ? 660 : 540 }}>
      <thead>
        <tr style={{ background: G.surfaceVariant }}>
          {cols.map(c => (
            <th key={c.key} onClick={() => onSort(c.key)}
              title="クリックで並び替え"
              style={{ padding: '8px', textAlign: c.align, fontWeight: 600, color: sortKey === c.key ? G.primary : G.text2, whiteSpace: 'nowrap', borderBottom: `2px solid ${G.border}`, cursor: 'pointer', userSelect: 'none' }}>
              {c.label}{sortKey === c.key ? (dir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
            </th>
          ))}
          <th style={{ borderBottom: `2px solid ${G.border}` }}></th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${G.border}` }}>
            {cols.map(c => (
              <td key={c.key} style={{ padding: '8px', textAlign: c.align }}>{renderCell(r, c.key)}</td>
            ))}
            <td style={{ padding: '8px', width: '20%' }}>
              <div style={{ background: G.surfaceVariant, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((r.held / maxHeld) * 100)}%`, height: '100%', background: G.primary, borderRadius: 4 }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
