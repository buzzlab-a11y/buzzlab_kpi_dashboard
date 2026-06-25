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
const rate = (contracts, meetings) =>
  meetings > 0 ? Math.round((contracts / meetings) * 1000) / 10 : 0;

// 配列を key（closer/referrer）でまとめ直し、件数を合算して成約率を再計算
function groupBy(rows, keyField) {
  const map = new Map();
  for (const r of rows) {
    const k = r[keyField] ?? '(未設定)';
    const cur = map.get(k) || { [keyField]: k, meetings: 0, contracts: 0, revenue_in_tax: 0 };
    cur.meetings += r.meetings || 0;
    cur.contracts += r.contracts || 0;
    cur.revenue_in_tax += r.revenue_in_tax || 0;
    map.set(k, cur);
  }
  return [...map.values()]
    .map(r => ({ ...r, contract_rate: rate(r.contracts, r.meetings) }))
    .sort((a, b) => b.meetings - a.meetings);
}

export default function SalesDashboard() {
  const { monthly, byCloser, byChannel, loading, error } = useSalesMeetings();
  const { isMobile, isTablet } = useBreakpoint();
  const [month, setMonth] = useState('all'); // 'all' | 'YYYY-MM'

  const months = useMemo(
    () => [...monthly].map(r => r.source_month).sort(),
    [monthly]
  );

  // 選択スコープの月次行（'all' は全月）
  const scopeMonthly = useMemo(
    () => (month === 'all' ? monthly : monthly.filter(r => r.source_month === month)),
    [monthly, month]
  );

  // KPI 合算
  const kpi = useMemo(() => {
    const acc = { meetings: 0, contracts: 0, cancels: 0, noshows: 0, pendings: 0, revenue: 0, received: 0 };
    for (const r of scopeMonthly) {
      acc.meetings += r.meetings || 0;
      acc.contracts += r.contracts || 0;
      acc.cancels += r.cancels || 0;
      acc.noshows += r.noshows || 0;
      acc.pendings += r.pendings || 0;
      acc.revenue += r.revenue_in_tax || 0;
      acc.received += r.received_amount || 0;
    }
    return { ...acc, rate: rate(acc.contracts, acc.meetings) };
  }, [scopeMonthly]);

  // 月次推移チャート（常に全月。'all'以外でも全体推移を見せる）
  const trend = useMemo(
    () => [...monthly].sort((a, b) => a.source_month.localeCompare(b.source_month)).map(r => ({
      month: fmtMonth(r.source_month),
      成約: r.contracts || 0,
      キャンセル: r.cancels || 0,
      不参加: r.noshows || 0,
      成約率: r.contract_rate || 0,
    })),
    [monthly]
  );

  const closerRows = useMemo(() => {
    const src = month === 'all' ? byCloser : byCloser.filter(r => r.source_month === month);
    return groupBy(src, 'closer');
  }, [byCloser, month]);

  const channelRows = useMemo(() => {
    const src = month === 'all' ? byChannel : byChannel.filter(r => r.source_month === month);
    return groupBy(src, 'referrer');
  }, [byChannel, month]);

  // ── 状態別レンダリング ───────────────────────────────────────────────
  if (loading) {
    return <Card><div style={{ color: G.text2, fontSize: 14 }}>営業データを読み込み中...</div></Card>;
  }
  if (error) {
    const missing = /relation|does not exist|schema cache|find the table/i.test(error.message || '');
    return (
      <Card title="営業データを取得できませんでした">
        <div style={{ fontSize: 13, color: G.text2, lineHeight: 1.7 }}>
          {missing
            ? '集計ビュー（sales_summary_*）がまだ作成されていない可能性があります。Supabase に supabase_sales_meetings.sql を適用してください。'
            : `エラー: ${error.message}`}
        </div>
      </Card>
    );
  }
  if (!monthly.length) {
    return (
      <Card title="営業・個別面談">
        <div style={{ fontSize: 13, color: G.text2 }}>
          まだデータがありません。CSV を取り込むとここに集計が表示されます。
        </div>
      </Card>
    );
  }

  const kpiCols = isMobile ? 2 : isTablet ? 3 : 6;
  const tableCols = isMobile ? '1fr' : '1fr 1fr';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 月セレクタ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: G.text3 }}>対象月:</span>
        {['all', ...months].map(m => {
          const active = month === m;
          return (
            <button
              key={m}
              onClick={() => setMonth(m)}
              style={{
                border: `1px solid ${active ? G.primary : G.border}`,
                background: active ? G.primaryContainer : G.surface,
                color: active ? G.primary : G.text2,
                borderRadius: G.radiusPill, padding: '5px 14px', fontSize: 12,
                fontWeight: active ? 700 : 500, cursor: 'pointer',
              }}
            >
              {m === 'all' ? '全期間' : fmtMonth(m)}
            </button>
          );
        })}
      </div>

      {/* KPI カード */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpiCols},1fr)`, gap: 12 }}>
        <MetricCard label="面談数" value={kpi.meetings.toLocaleString()} sub="実施・予定含む" color={G.primary} />
        <MetricCard label="成約数" value={kpi.contracts.toLocaleString()} sub={`成約率 ${kpi.rate}%`} color={G.success} chip={`${kpi.rate}%`} />
        <MetricCard label="キャンセル" value={kpi.cancels.toLocaleString()} sub="状況=キャンセル" color={G.error} />
        <MetricCard label="不参加" value={kpi.noshows.toLocaleString()} sub="ノーショー" color={G.warning} />
        <MetricCard label="売上(税込)" value={fmtM(kpi.revenue)} sub="成約分の合計" color={G.success} />
        <MetricCard label="着金額" value={fmtM(kpi.received)} sub="入金確認分" color={G.text1} />
      </div>

      {/* 月次推移 */}
      <Card title="月次推移（成約 / キャンセル / 不参加・成約率）">
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
          <ComposedChart data={trend} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 0" stroke={G.border} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: G.text3 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: G.text3 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} domain={[0, 100]} tick={{ fontSize: 10, fill: G.text3 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<ChartTooltip />} />
            <Bar yAxisId="left" dataKey="成約" fill={G.success} radius={[4, 4, 0, 0]} name="成約" />
            <Bar yAxisId="left" dataKey="キャンセル" fill={G.error} radius={[4, 4, 0, 0]} name="キャンセル" />
            <Bar yAxisId="left" dataKey="不参加" fill={G.warning} radius={[4, 4, 0, 0]} name="不参加" />
            <Line yAxisId="right" type="monotone" dataKey="成約率" stroke={G.primary} strokeWidth={2.5} dot={{ r: 3, fill: G.primary, strokeWidth: 0 }} name="成約率" />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* 面談者別 / 経由者別 */}
      <div style={{ display: 'grid', gridTemplateColumns: tableCols, gap: 16 }}>
        <BreakdownCard title="面談者別" keyLabel="面談者" rows={closerRows} keyField="closer" />
        <BreakdownCard title="経由者別" keyLabel="経由者" rows={channelRows} keyField="referrer" />
      </div>
    </div>
  );
}

// ── 内訳カード（表＋横棒）──────────────────────────────────────────────
function BreakdownCard({ title, keyLabel, rows, keyField }) {
  const maxMeetings = Math.max(1, ...rows.map(r => r.meetings || 0));
  return (
    <Card title={title} style={{ overflowX: 'auto' }}>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: G.text3 }}>データなし</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: G.surfaceVariant }}>
              {[keyLabel, '面談', '成約', '成約率', ''].map((h, i) => (
                <th key={i} style={{ padding: '8px', textAlign: i === 0 ? 'left' : (i === 4 ? 'left' : 'center'), fontWeight: 600, color: G.text2, whiteSpace: 'nowrap', borderBottom: `2px solid ${G.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${G.border}` }}>
                <td style={{ padding: '8px', fontWeight: 600, color: G.text1, whiteSpace: 'nowrap' }}>{r[keyField]}</td>
                <td style={{ padding: '8px', textAlign: 'center', color: G.text2 }}>{r.meetings}</td>
                <td style={{ padding: '8px', textAlign: 'center', color: G.success, fontWeight: 600 }}>{r.contracts}</td>
                <td style={{ padding: '8px', textAlign: 'center', color: G.text1, fontWeight: 600 }}>{r.contract_rate}%</td>
                <td style={{ padding: '8px', width: '30%' }}>
                  <div style={{ background: G.surfaceVariant, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((r.meetings / maxMeetings) * 100)}%`, height: '100%', background: G.primary, borderRadius: 4 }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
