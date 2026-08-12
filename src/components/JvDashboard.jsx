import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useJv } from '../hooks/useJv';
import { G } from '../styles/theme';
import { fmtM } from '../lib/formatters';

// ── 共通の小コンポーネント（SalesDashboard / StudentsDashboard と同じスタイル）────
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

// ── 種別バッジ（sales_meetings.source_type。api/submit-meeting.js の ALLOWED_SOURCE_TYPE と一致）──
const TYPE_LABEL = { jv: 'JV', seminar: 'セミナー', self: '自社', monthly: '月次', other: 'その他' };
const TYPE_COLOR = { jv: '#9c27b0', seminar: '#1a73e8', self: '#1e8e3e', monthly: '#5f6368', other: '#9aa0a6' };

function TypeBadge({ type }) {
  if (!type) return <span style={{ color: G.text3, fontSize: 11 }}>—</span>;
  const color = TYPE_COLOR[type] || G.text3;
  return (
    <span style={{ background: color + '18', color, borderRadius: G.radiusPill, padding: '1px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {TYPE_LABEL[type] || type}
    </span>
  );
}

// 平均進捗プログレスバー。warn=true（全体平均より明確に低い）のときは警告色で強調する。
function ProgressBar({ pct, warn }) {
  const v = pct == null ? null : Math.max(0, Math.min(100, pct));
  const barColor = v == null ? G.border : warn ? G.error : v >= 80 ? G.success : v >= 40 ? G.primary : G.warning;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 110 }}>
      <div style={{ flex: 1, background: G.surfaceVariant, borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${v ?? 0}%`, height: '100%', background: barColor, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color: warn ? G.error : G.text2, fontWeight: warn ? 700 : 400, minWidth: 34, textAlign: 'right' }}>
        {v == null ? '—' : `${v}%`}
      </span>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────
const fmtDateSlash = (d) => (d ? d.replaceAll('-', '/') : '—');
const fmtMonth = (ym) => {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || '');
  return m ? `${m[1]}/${m[2]}` : (ym || '');
};
// meeting_date_max の翌月ラベル（「6月以降は未取込」のような注記に使う）
function nextMonthLabel(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
  if (!m) return null;
  const month = Number(m[2]);
  return `${month === 12 ? 1 : month + 1}月`;
}
// avg_progress が全体平均よりこの差以上低い場合に警告色にする
const LOW_PROGRESS_MARGIN = 15;
// 成約率の表示。held(実施)が0のときは「0.0%」ではなく分母なしとわかる表記にする
// （実施0件で成約率0%だと「実施したのに決まらなかった」と誤読されるため）。
const fmtRate = (rate, held) => (held > 0 ? `${rate}%` : '−');

// ── 月別内訳（行クリックで展開）──────────────────────────────────────────
function MonthsTable({ months }) {
  const rows = Object.entries(months || {}).sort(([a], [b]) => a.localeCompare(b));
  if (!rows.length) return <div style={{ fontSize: 12, color: G.text3, padding: '8px 4px' }}>月別データがありません</div>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginTop: 4 }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '4px 8px', color: G.text3, fontWeight: 600 }}>月</th>
          <th style={{ textAlign: 'center', padding: '4px 8px', color: G.text3, fontWeight: 600 }}>商談</th>
          <th style={{ textAlign: 'center', padding: '4px 8px', color: G.text3, fontWeight: 600 }}>実施</th>
          <th style={{ textAlign: 'center', padding: '4px 8px', color: G.text3, fontWeight: 600 }}>成約</th>
          <th style={{ textAlign: 'center', padding: '4px 8px', color: G.text3, fontWeight: 600 }}>成約率</th>
          <th style={{ textAlign: 'right', padding: '4px 8px', color: G.text3, fontWeight: 600 }}>売上</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([month, v]) => (
          <tr key={month} style={{ borderTop: `1px solid ${G.border}` }}>
            <td style={{ padding: '4px 8px', color: G.text1, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtMonth(month)}</td>
            <td style={{ padding: '4px 8px', textAlign: 'center', color: G.text2 }}>{v.meetings}</td>
            <td style={{ padding: '4px 8px', textAlign: 'center', color: G.text2 }}>{v.held}</td>
            <td style={{ padding: '4px 8px', textAlign: 'center', color: G.success, fontWeight: 700 }}>{v.contracts}</td>
            <td style={{ padding: '4px 8px', textAlign: 'center', color: G.text1 }}>{fmtRate(v.contract_rate, v.held)}</td>
            <td style={{ padding: '4px 8px', textAlign: 'right', color: G.text1, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtM(v.revenue_in_tax)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── メインの表（列ヘッダークリックでソート・行クリックで月別内訳を展開）────
const STR_KEYS = ['referrer', 'source_type'];
const COLS = [
  { key: 'referrer', label: '経由者', align: 'left' },
  { key: 'source_type', label: '種別', align: 'center' },
  { key: 'meetings', label: '商談', align: 'center' },
  { key: 'held', label: '実施', align: 'center' },
  { key: 'contracts', label: '成約', align: 'center' },
  { key: 'contract_rate', label: '成約率', align: 'center' },
  { key: 'revenue_in_tax', label: '売上', align: 'right' },
  { key: 'students_matched', label: '獲得受講生', align: 'center' },
  { key: 'avg_progress', label: '平均進捗', align: 'left' },
  { key: 'ending_soon', label: '満了間近', align: 'center' },
  { key: 'stale_count', label: '停滞', align: 'center' },
];

function JvTable({ rows, overallAvgProgress, expandedReferrer, onToggleExpand }) {
  const [sortKey, setSortKey] = useState('contracts');
  const [dir, setDir] = useState('desc');

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      if (STR_KEYS.includes(sortKey)) {
        const av = (a[sortKey] ?? '').toString(), bv = (b[sortKey] ?? '').toString();
        return dir === 'asc' ? av.localeCompare(bv, 'ja') : bv.localeCompare(av, 'ja');
      }
      const av = a[sortKey] ?? -Infinity, bv = b[sortKey] ?? -Infinity;
      return dir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [rows, sortKey, dir]);

  const onSort = (k) => {
    if (k === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setDir(STR_KEYS.includes(k) ? 'asc' : 'desc'); }
  };

  if (!rows.length) return <div style={{ fontSize: 13, color: G.text3 }}>データがありません</div>;

  const renderCell = (r, key) => {
    if (key === 'referrer') return <span style={{ fontWeight: 600, color: G.text1, whiteSpace: 'nowrap' }}>{r.referrer}</span>;
    if (key === 'source_type') return <TypeBadge type={r.source_type} />;
    if (key === 'contracts') return <span style={{ color: r.contracts > 0 ? G.success : G.text3, fontWeight: 700 }}>{r.contracts}</span>;
    if (key === 'contract_rate') return <span style={{ color: r.held > 0 ? G.text1 : G.text3, fontWeight: 600 }}>{fmtRate(r.contract_rate, r.held)}</span>;
    if (key === 'revenue_in_tax') return <span style={{ color: G.text1, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtM(r.revenue_in_tax)}</span>;
    if (key === 'students_matched') return <span style={{ color: G.text1, fontWeight: 600 }}>{r.students_matched}</span>;
    if (key === 'avg_progress') {
      const warn = r.avg_progress != null && overallAvgProgress != null && r.avg_progress < overallAvgProgress - LOW_PROGRESS_MARGIN;
      return <ProgressBar pct={r.avg_progress} warn={warn} />;
    }
    if (key === 'ending_soon' || key === 'stale_count') {
      const v = r[key];
      const isEndingSoon = key === 'ending_soon';
      const bg = isEndingSoon ? G.warningContainer : G.errorContainer;
      const color = isEndingSoon ? G.warning : G.error;
      return v > 0
        ? <span style={{ background: bg, color, borderRadius: G.radiusPill, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{v}</span>
        : <span style={{ color: G.text3 }}>0</span>;
    }
    return <span style={{ color: G.text2 }}>{r[key] ?? '—'}</span>;
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 940 }}>
      <thead>
        <tr style={{ background: G.surfaceVariant }}>
          {COLS.map((c) => (
            <th key={c.key} onClick={() => onSort(c.key)} title="クリックで並び替え"
              style={{ padding: '8px', textAlign: c.align, fontWeight: 600, color: sortKey === c.key ? G.primary : G.text2, whiteSpace: 'nowrap', borderBottom: `2px solid ${G.border}`, cursor: 'pointer', userSelect: 'none' }}>
              {c.label}{sortKey === c.key ? (dir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => {
          const isOpen = expandedReferrer === r.referrer;
          return (
            <React.Fragment key={r.referrer}>
              <tr onClick={() => onToggleExpand(r.referrer)} title="クリックで月別内訳を表示"
                style={{ borderBottom: `1px solid ${G.border}`, cursor: 'pointer', background: isOpen ? G.primaryContainer : 'transparent' }}>
                {COLS.map((c) => (
                  <td key={c.key} style={{ padding: '8px', textAlign: c.align }}>{renderCell(r, c.key)}</td>
                ))}
              </tr>
              {isOpen && (
                <tr>
                  <td colSpan={COLS.length} style={{ padding: '0 8px 12px', background: G.surfaceVariant }}>
                    <MonthsTable months={r.months} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

export default function JvDashboard() {
  const { data, loading, error, needsPin, pin, setPin, load } = useJv();
  const { isMobile, isTablet } = useBreakpoint();

  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [pinFailed, setPinFailed] = useState(false);
  const [expandedReferrer, setExpandedReferrer] = useState(null);

  const partners = useMemo(() => data?.partners ?? [], [data]);
  const totals = data?.totals ?? null;
  const asOf = data?.as_of ?? null;

  const chartData = useMemo(() => partners.map((p) => ({
    name: p.referrer,
    color: TYPE_COLOR[p.source_type] || G.text3,
    成約: p.contracts,
    成約率: p.contract_rate,
  })), [partners]);

  const toggleExpand = (referrer) => setExpandedReferrer((cur) => (cur === referrer ? null : referrer));

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinSubmitting(true); setPinFailed(false);
    const ok = await load(pin);
    setPinSubmitting(false);
    if (!ok) setPinFailed(true);
  };

  // ── PINゲート ──────────────────────────────────────────────────────────
  if (needsPin) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 48 }}>
        <Card style={{ maxWidth: 380, width: '100%' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: G.text1, marginBottom: 8 }}>JV実績を表示</h3>
          <p style={{ fontSize: 13, color: G.text2, marginBottom: 16, lineHeight: 1.6 }}>
            JVパートナー経由の商談・受講生データを表示するには共有PINを入力してください。
          </p>
          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="password" value={pin} autoComplete="off" onChange={(e) => setPin(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: `1px solid ${G.border}`, borderRadius: G.radius, background: G.surface, color: G.text1, outline: 'none' }}
              placeholder="共有PIN" />
            {pinFailed && <div style={{ fontSize: 12, fontWeight: 600, color: G.error, background: G.errorContainer, borderRadius: G.radius, padding: '6px 10px' }}>PINが違います</div>}
            <button type="submit" disabled={pinSubmitting}
              style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, color: G.onPrimary, background: pinSubmitting ? G.text3 : G.primary, border: 'none', borderRadius: G.radius, cursor: pinSubmitting ? 'default' : 'pointer' }}>
              {pinSubmitting ? '確認中...' : '表示する'}
            </button>
          </form>
          <p style={{ fontSize: 11, color: G.text3, marginTop: 12 }}>※ 営業タブ・受講生タブと同じ共有PINです</p>
        </Card>
      </div>
    );
  }

  if (loading) return <Card><div style={{ color: G.text2, fontSize: 14 }}>JVデータを読み込み中...</div></Card>;
  if (error) {
    const missing = /relation|does not exist|schema cache|find the table/i.test(error.message || '');
    return (
      <Card title="JVデータを取得できませんでした">
        <div style={{ fontSize: 13, color: G.text2, lineHeight: 1.7 }}>
          {missing
            ? 'sales_meetings / students テーブルが見つかりません。Supabase にマイグレーションを適用してください。'
            : `エラー: ${error.message}`}
        </div>
      </Card>
    );
  }

  const kpiCols = isMobile ? 2 : isTablet ? 3 : 6;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* データ鮮度の注記（最上部・数字の誤読を防ぐため必須）*/}
      {asOf && (
        <div style={{ background: G.warningContainer, border: `1px solid ${G.warning}`, borderRadius: G.radiusMd, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: G.text1 }}>
          ⚠ 商談データは {fmtDateSlash(asOf.meeting_date_max)} まで（{nextMonthLabel(asOf.meeting_date_max)}以降は未取込）
        </div>
      )}

      {partners.length === 0 ? (
        <Card title="JV"><div style={{ fontSize: 13, color: G.text2 }}>まだデータがありません。</div></Card>
      ) : (
        <>
          {/* サマリー */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpiCols},1fr)`, gap: 12 }}>
            <MetricCard label="商談総数" value={totals.meetings.toLocaleString()} sub="全パートナー合算" color={G.primary} />
            <MetricCard label="成約数" value={totals.contracts.toLocaleString()} sub={`実施 ${totals.held.toLocaleString()}件中`} color={G.success} chip={fmtRate(totals.contract_rate, totals.held)} />
            <MetricCard label="成約率" value={fmtRate(totals.contract_rate, totals.held)} sub="成約 / 実施" color={G.success} />
            <MetricCard label="売上合計" value={fmtM(totals.revenue_in_tax)} sub="成約分（税込）" color={G.success} />
            <MetricCard label="獲得受講生数" value={totals.students_matched.toLocaleString()} sub="成約者のうち受講生DBに紐づいた人数" color={G.primary} />
            <MetricCard label="平均進捗" value={totals.avg_progress == null ? '—' : `${totals.avg_progress}%`} sub="受講生DB紐づけ者のみ" color={G.text1} />
          </div>

          {/* 経由者別グラフ */}
          <Card title="経由者別（成約数・成約率）" style={{ overflowX: 'auto' }}>
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
              <ComposedChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 0" stroke={G.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: G.text3 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: G.text3 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} domain={[0, 100]} tick={{ fontSize: 10, fill: G.text3 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Bar yAxisId="left" dataKey="成約" name="成約" radius={[4, 4, 0, 0]}>
                  {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="成約率" stroke="#0b8043" strokeWidth={2.5} dot={{ r: 3, fill: '#0b8043', strokeWidth: 0 }} name="成約率" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          {/* 一覧テーブル */}
          <Card title="パートナー別（クリックで月別内訳）" style={{ overflowX: 'auto' }}>
            <JvTable rows={partners} overallAvgProgress={totals.avg_progress} expandedReferrer={expandedReferrer} onToggleExpand={toggleExpand} />
            <div style={{ marginTop: 12, fontSize: 11, color: G.text3, lineHeight: 1.6 }}>
              ※ 平均進捗はタスク管理ツールの進捗率で、受講生としてDBに紐づいた人だけの平均です。「成約したが受講生DBに見つからない人」は含まれません。
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
