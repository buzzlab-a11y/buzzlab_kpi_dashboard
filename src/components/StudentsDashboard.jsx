import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useStudents } from '../hooks/useStudents';
import { G } from '../styles/theme';
import StudentForm from './StudentForm';

// ── 共通の小コンポーネント（SalesDashboard と同じスタイル）────────────────
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

// 業務フローのファネル：1段（決済/初回面談/ツール登録）を表す箱。クリックで一覧を絞り込む。
function FunnelStageBox({ label, count, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        flex: 1, textAlign: 'center', cursor: 'pointer', minWidth: 0,
        background: active ? G.primaryContainer : G.surface,
        border: `1px solid ${active ? G.primary : G.border}`,
        borderRadius: G.radiusLg, padding: '18px 12px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
      <span style={{ fontSize: 12, color: G.text2, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: 30, fontWeight: 700, color: G.text1, letterSpacing: -0.5, lineHeight: 1.1 }}>
        {count.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 500, color: G.text3, marginLeft: 2 }}>名</span>
      </span>
    </button>
  );
}

// ファネルの段と段の間：脱落数。0名は「問題なし」トーンで控えめに、脱落があれば警告色で目立たせる。
function FunnelDrop({ count, active, onClick, isMobile }) {
  const hasDrop = count > 0;
  const color = hasDrop ? G.error : G.text3;
  const bg = hasDrop ? G.errorContainer : G.surfaceVariant;
  return (
    <button onClick={onClick}
      style={{
        cursor: 'pointer', border: `1px solid ${active ? color : 'transparent'}`, background: 'transparent',
        borderRadius: G.radiusMd, flexShrink: 0,
        display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', justifyContent: 'center',
        gap: 4, padding: isMobile ? '6px 10px' : '4px 10px', minWidth: isMobile ? 'auto' : 92,
      }}>
      <span style={{ fontSize: 16, color: G.text3, lineHeight: 1 }}>{isMobile ? '▼' : '→'}</span>
      <span style={{
        fontSize: 11, fontWeight: 700, color, background: bg,
        borderRadius: G.radiusPill, padding: '2px 8px', whiteSpace: 'nowrap',
      }}>
        {hasDrop ? `${count}名脱落` : '脱落なし'}
      </span>
    </button>
  );
}

// flow_stage 別の内訳バッジ（ファネル下の内訳・一覧テーブルの「ステージ」列で共用）。クリックで一覧を絞り込む。
function StageFilterChip({ stageKey, count, active, onClick }) {
  const meta = FLOW_STAGE_META[stageKey];
  return (
    <button onClick={onClick} title={meta.desc}
      style={{
        cursor: 'pointer', textAlign: 'left',
        background: active ? meta.color + '22' : meta.color + '14',
        border: `1px solid ${active ? meta.color : 'transparent'}`,
        borderRadius: G.radiusPill, padding: '6px 12px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{count}名</span>
    </button>
  );
}

function FlowStageBadge({ stage }) {
  const meta = FLOW_STAGE_META[stage] || FLOW_STAGE_META.unknown;
  return (
    <span title={meta.desc} style={{ background: meta.color + '18', color: meta.color, borderRadius: G.radiusPill, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {meta.label}
    </span>
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
          <span style={{ fontSize: 12, fontWeight: 600, color: G.text1 }}>{(p.value ?? 0).toLocaleString?.()}</span>
        </div>
      ))}
    </div>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{
        border: `1px solid ${active ? G.primary : G.border}`,
        background: active ? G.primaryContainer : G.surface,
        color: active ? G.primary : G.text2,
        borderRadius: G.radiusPill, padding: '5px 14px', fontSize: 12,
        fontWeight: active ? 700 : 500, cursor: 'pointer',
      }}>
      {children}
    </button>
  );
}

// ── 値の定義（DB制約と一致。増やさない）────────────────────────────────
const PLAN = {
  standard: 'スタンダード', premium: 'プレミアム', vip: 'VIP',
  vip_plus: 'VIP+', monitor: 'モニター', unknown: '未設定',
};
const STATUS = {
  leading: { label: '先頭（売上変換待ち）', color: '#1a73e8' },
  active:  { label: '動いている',          color: '#1e8e3e' },
  slowing: { label: '止まりかけ',          color: '#e37400' },
  silent:  { label: '沈黙',                color: '#d93025' },
  left:    { label: '離脱',                color: '#5f6368' },
  unknown: { label: '未分類',              color: '#9aa0a6' },
};
const STATUS_ORDER = ['leading', 'active', 'slowing', 'silent', 'left', 'unknown'];
const CONTRACT_MONTHS_DEFAULT = 6;

// 名簿ソース（roster/tasktool が主要2ソース。payment 等が増えても素通しで表示する）
const PRIMARY_SOURCES = ['roster', 'tasktool'];
const SOURCE_LABELS = { roster: '棚卸', tasktool: 'ツール', payment: '決済' };
const SOURCE_COLOR = { roster: '#1a73e8', tasktool: '#9c27b0', payment: '#1e8e3e' };

// ── 業務フロー（決済 → 初回面談 → ツール登録）のステージ定義 ────────────
// api/students.js の FLOW_STAGE と一致させること（サーバ側で確定した flow_stage をそのまま使う）。
const FLOW_STAGE_ORDER = ['complete', 'meeting_no_tool', 'no_meeting_record', 'payment_only', 'no_payment', 'tool_only', 'unknown'];
const FLOW_STAGE_META = {
  complete: {
    label: '完走', color: G.success,
    desc: '決済・初回面談・ツール登録のすべてが確認できています。',
  },
  meeting_no_tool: {
    label: 'ツール未登録', color: G.warning,
    desc: '決済・初回面談は確認できていますが、タスク管理ツールに登録がありません。',
  },
  no_meeting_record: {
    label: '面談記録なし', color: '#f9ab00',
    desc: '決済とツール登録は確認できていますが、棚卸しシートに初回面談の記録が見当たりません（棚卸しシートは手作業のため漏れの可能性あり）。',
  },
  payment_only: {
    label: '決済のみ', color: G.error,
    desc: '決済のみ確認できています。お金を受け取っているのに初回面談・ツール登録のどちらの記録もありません。最優先で確認してください。',
  },
  no_payment: {
    label: '決済未確認', color: G.ig.main,
    desc: '棚卸しシートには載っていますが、Buzz Lab決済CSVには見当たりません（別経路決済の可能性）。',
  },
  tool_only: {
    label: 'ツールのみ', color: G.text2,
    desc: 'タスク管理ツールにのみ登録があります（運営・講師アカウント等が混ざっている可能性）。',
  },
  unknown: {
    label: '不明', color: G.text3,
    desc: 'どの名簿にも該当が確認できていません。',
  },
};

// ファネルの各段・脱落矢印が束ねる flow_stage の組み合わせ（人数はこの集合の合算と一致する）
const FUNNEL_STAGE_GROUPS = {
  paid: ['complete', 'meeting_no_tool', 'no_meeting_record', 'payment_only'],
  paid_meeting: ['complete', 'meeting_no_tool'],
  paid_meeting_tool: ['complete'],
  drop_at_meeting: ['no_meeting_record', 'payment_only'],
  drop_at_tool: ['meeting_no_tool'],
};
const FLOW_FILTER_LABEL = {
  paid: '① 決済',
  paid_meeting: '② 初回面談の記録あり',
  paid_meeting_tool: '③ ツール登録あり',
  drop_at_meeting: '①→②の脱落（初回面談の記録なし）',
  drop_at_tool: '②→③の脱落（ツール登録なし）',
  ...Object.fromEntries(FLOW_STAGE_ORDER.map((k) => [k, FLOW_STAGE_META[k].label])),
};

// filter は 'all' | FUNNEL_STAGE_GROUPS のキー | flow_stage 個別キー
function matchesFlowFilter(s, filter) {
  if (filter === 'all') return true;
  const group = FUNNEL_STAGE_GROUPS[filter];
  if (group) return group.includes(s.flow_stage);
  return s.flow_stage === filter;
}

// 決済状態バッジ（DB CHECK 制約 paid|expired|cancelled|mixed と一致）
const PAYMENT_STATE = {
  paid:      { label: '支払済',   color: G.success },
  expired:   { label: '期限切れ', color: G.warning },
  cancelled: { label: 'キャンセル', color: G.error },
  mixed:     { label: '一部支払', color: '#f9ab00' },
};

// 金額を「¥1,234,567」形式で表示（fmtM は億・万の丸め表示のため決済額の実額表示には使わない）
const fmtYen = (v) => (v == null ? '—' : `¥${v.toLocaleString()}`);

// 受講プラン(plan)と決済プラン(payment_plan)が両方入っていて食い違う場合に true
function hasPlanMismatch(s) {
  return !!s.plan && s.plan !== 'unknown' && !!s.payment_plan && s.payment_plan !== 'unknown' && s.plan !== s.payment_plan;
}

// ── helpers ─────────────────────────────────────────────────────────────
const isUnassessed = (s) => !s.status || s.status === 'unknown';
const isTracked = (s) => s.tracked !== false;
const fmtDate = (d) => (d ? d.replaceAll('-', '/') : '—');

// 満了日: course_end_date（実データ）が最優先。無ければ 初回面談日＋契約期間 で推定
function contractEndInfo(student) {
  if (student.course_end_date) {
    const d = new Date(`${student.course_end_date}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return { date: d, estimated: false };
  }
  if (!student.first_meeting_date) return { date: null, estimated: false };
  const d = new Date(`${student.first_meeting_date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { date: null, estimated: false };
  d.setMonth(d.getMonth() + (student.contract_months ?? CONTRACT_MONTHS_DEFAULT));
  return { date: d, estimated: true };
}
function daysUntil(date, today) {
  if (!date) return null;
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}
function daysSince(dateStr, today) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((today.getTime() - d.getTime()) / 86400000);
}
function ExpiryBadge({ days, estimated }) {
  if (days == null) return <span style={{ color: G.text3, fontSize: 12 }}>—</span>;
  const isError = days <= 30;
  const isWarn = !isError && days <= 60;
  const color = isError ? G.error : isWarn ? G.warning : G.text2;
  const bg = isError ? G.errorContainer : isWarn ? G.warningContainer : 'transparent';
  const label = days < 0 ? `${Math.abs(days)}日超過` : `残り${days}日`;
  return (
    <span style={{ background: bg, color, borderRadius: G.radiusPill, padding: bg !== 'transparent' ? '2px 8px' : 0, fontSize: 11, fontWeight: (isError || isWarn) ? 700 : 500, whiteSpace: 'nowrap' }}>
      {label}{estimated && <span style={{ fontWeight: 500, opacity: 0.75 }}> (推定)</span>}
    </span>
  );
}

// 最終アクティブからの経過日数。14日以上=警告、30日以上=エラー（沈黙の一次シグナル）
function LastActiveBadge({ days }) {
  if (days == null) return <span style={{ color: G.text3, fontSize: 12 }}>—</span>;
  const isError = days >= 30;
  const isWarn = !isError && days >= 14;
  const color = isError ? G.error : isWarn ? G.warning : G.text2;
  const bg = isError ? G.errorContainer : isWarn ? G.warningContainer : 'transparent';
  return (
    <span style={{ background: bg, color, borderRadius: G.radiusPill, padding: bg !== 'transparent' ? '2px 8px' : 0, fontSize: 11, fontWeight: (isError || isWarn) ? 700 : 500, whiteSpace: 'nowrap' }}>
      {days}日前
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.unknown;
  return (
    <span style={{ background: s.color + '18', color: s.color, borderRadius: G.radiusPill, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// 名簿バッジ: roster/tasktool は常に枠を出し、無ければ薄く表示（欠けが一目で分かる）。
// 未知のソース（payment 等）が来ても素通しで追加表示する。
function SourceBadges({ sources }) {
  const set = new Set(sources || []);
  const extra = (sources || []).filter((s) => !PRIMARY_SOURCES.includes(s));
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {PRIMARY_SOURCES.map((src) => {
        const has = set.has(src);
        const color = has ? (SOURCE_COLOR[src] || G.text3) : G.text3;
        return (
          <span key={src} style={{
            background: has ? color + '18' : 'transparent',
            color, border: has ? 'none' : `1px dashed ${G.border}`,
            borderRadius: G.radiusPill, padding: '1px 8px', fontSize: 10, fontWeight: has ? 700 : 500,
            whiteSpace: 'nowrap', opacity: has ? 1 : 0.65,
          }}>
            {SOURCE_LABELS[src] || src}
          </span>
        );
      })}
      {extra.map((src) => (
        <span key={src} style={{ background: (SOURCE_COLOR[src] || G.text3) + '18', color: SOURCE_COLOR[src] || G.text3, borderRadius: G.radiusPill, padding: '1px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {SOURCE_LABELS[src] || src}
        </span>
      ))}
    </div>
  );
}

function ProgressBar({ pct }) {
  const v = pct == null ? null : Math.max(0, Math.min(100, pct));
  const barColor = v == null ? G.border : v >= 80 ? G.success : v >= 40 ? G.primary : G.warning;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 90 }}>
      <div style={{ flex: 1, background: G.surfaceVariant, borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${v ?? 0}%`, height: '100%', background: barColor, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color: G.text2, minWidth: 30, textAlign: 'right' }}>{v == null ? '—' : `${v}%`}</span>
    </div>
  );
}

function DetailField({ label, value }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: G.text3, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: G.text1, lineHeight: 1.5 }}>{empty ? '—' : value}</div>
    </div>
  );
}

// ── 詳細モーダル（一覧に出しきれない残りの項目を表示。編集はここから遷移）──
function StudentDetailModal({ student: s, onClose, onEdit }) {
  const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: G.surface, borderRadius: G.radiusLg, padding: 24, width: '100%', maxWidth: 640, boxShadow: G.shadow3, margin: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: G.text1 }}>{s.name}</h3>
          <StatusBadge status={s.status} />
        </div>
        <div style={{ marginBottom: 16 }}><SourceBadges sources={s.sources} /></div>

        <div style={{ ...grid, marginBottom: 14 }}>
          <DetailField label="メール" value={s.email} />
          <DetailField label="面談担当" value={s.sales_closer} />
          <DetailField label="初回面談申込日" value={fmtDate(s.first_meeting_date)} />
          <DetailField label="入会日" value={fmtDate(s.enrolled_date)} />
          <DetailField label="コース開始日" value={fmtDate(s.course_start_date)} />
          <DetailField label="コース終了日" value={s.course_end_date ? fmtDate(s.course_end_date) : `未入力（初回面談日＋${s.contract_months ?? CONTRACT_MONTHS_DEFAULT}ヶ月で推定表示）`} />
          <DetailField label="フェーズ" value={s.phase} />
          <DetailField label="担当メンター" value={s.mentor} />
          <DetailField label="ツールステータス" value={s.tool_status} />
          <DetailField label="Discord参加" value={s.discord_joined === true ? '参加' : s.discord_joined === false ? '未参加' : '未設定'} />
          <DetailField label="Threads URL" value={s.threads_url} />
          <DetailField label="Threadsハンドル" value={s.threads_handle} />
          <DetailField label="Instagramハンドル" value={s.instagram_handle} />
          <DetailField label="直近投稿日" value={fmtDate(s.last_post_date)} />
          <DetailField label="直近7日投稿数" value={s.posts_7d} />
          <DetailField label="総投稿数" value={s.posts_total} />
          <DetailField label="リール数" value={s.reels_total} />
          <DetailField label="週次投稿目標" value={s.weekly_post_goal} />
          <DetailField label="週次投稿実績" value={s.weekly_post_actual} />
          <DetailField label="フォロワー数" value={s.followers} />
          <DetailField label="リカバリー面談担当" value={s.recovery_closer} />
          <DetailField label="リカバリー面談実施日" value={fmtDate(s.recovery_meeting_date)} />
          <DetailField label="集計対象" value={s.tracked !== false ? '対象' : '対象外'} />
          <DetailField label="決済プラン" value={s.payment_plan ? (PLAN[s.payment_plan] || s.payment_plan) : null} />
          <DetailField label="決済回数" value={s.payment_count} />
          <DetailField label="初回申込日（決済）" value={fmtDate(s.first_order_date)} />
        </div>

        <DetailField label="つまずき・メモ" value={s.notes ? <span style={{ whiteSpace: 'pre-wrap' }}>{s.notes}</span> : '—'} />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" onClick={onClose}
            style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, color: G.text2, background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radius, cursor: 'pointer' }}>
            閉じる
          </button>
          <button type="button" onClick={onEdit}
            style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, color: G.onPrimary, background: G.primary, border: 'none', borderRadius: G.radius, cursor: 'pointer' }}>
            編集する
          </button>
        </div>
      </div>
    </div>
  );
}

// ── テーブル列定義（主要列のみ。残りは行クリックで詳細モーダル）──────────
const COLS = [
  { key: 'name', label: '名前', align: 'left' },
  { key: '_sourceCount', label: '名簿', align: 'left' },
  { key: 'flow_stage', label: 'ステージ', align: 'center' },
  { key: 'plan', label: 'プラン', align: 'center' },
  { key: 'status', label: '状態', align: 'center' },
  { key: 'progress_pct', label: '進捗率', align: 'left' },
  { key: '_lastActiveDays', label: '最終アクティブ', align: 'center' },
  { key: 'list_count', label: 'リスト', align: 'right' },
  { key: 'paid_total', label: '決済額', align: 'right' },
  { key: 'payment_state', label: '決済状況', align: 'center' },
  { key: '_daysLeft', label: '満了まで', align: 'center' },
  { key: '_tracked', label: '集計対象', align: 'center' },
];
const NUMERIC_KEYS = ['_sourceCount', 'progress_pct', '_lastActiveDays', 'list_count', 'paid_total', '_daysLeft', '_tracked'];

function StudentsTable({ rows, onEdit, onRowClick, onToggleTracked }) {
  const [sortKey, setSortKey] = useState('_daysLeft');
  const [dir, setDir] = useState('asc');

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      if (NUMERIC_KEYS.includes(sortKey)) {
        const an = a[sortKey] ?? Infinity, bn = b[sortKey] ?? Infinity;
        return dir === 'asc' ? an - bn : bn - an;
      }
      const as = (a[sortKey] ?? '').toString(), bs = (b[sortKey] ?? '').toString();
      return dir === 'asc' ? as.localeCompare(bs, 'ja') : bs.localeCompare(as, 'ja');
    });
    return arr;
  }, [rows, sortKey, dir]);

  const onSort = (k) => {
    if (k === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setDir(NUMERIC_KEYS.includes(k) ? 'desc' : 'asc'); }
  };

  if (!rows.length) return <div style={{ fontSize: 13, color: G.text3 }}>条件に一致する受講生がいません</div>;

  const renderCell = (r, key) => {
    if (key === 'name') return <span style={{ fontWeight: 600, color: G.text1, whiteSpace: 'nowrap' }}>{r.name}</span>;
    if (key === '_sourceCount') return <SourceBadges sources={r.sources} />;
    if (key === 'flow_stage') return <FlowStageBadge stage={r.flow_stage} />;
    if (key === 'plan') {
      const mismatch = hasPlanMismatch(r);
      const title = mismatch
        ? `受講プラン: ${PLAN[r.plan] || PLAN.unknown} / 決済プラン: ${PLAN[r.payment_plan] || PLAN.unknown}`
        : undefined;
      return (
        <span style={{ color: G.text2, whiteSpace: 'nowrap' }} title={title}>
          {PLAN[r.plan] || PLAN.unknown}{mismatch && <span style={{ marginLeft: 4 }}>⚠️</span>}
        </span>
      );
    }
    if (key === 'status') return <StatusBadge status={r.status} />;
    if (key === 'progress_pct') return <ProgressBar pct={r.progress_pct} />;
    if (key === '_lastActiveDays') return <LastActiveBadge days={r._lastActiveDays} />;
    if (key === 'list_count') return <span style={{ color: G.text1, fontWeight: 600 }}>{r.list_count == null ? '—' : r.list_count.toLocaleString()}</span>;
    if (key === 'paid_total') return <span style={{ color: G.text1, fontWeight: 600 }}>{fmtYen(r.paid_total)}</span>;
    if (key === 'payment_state') {
      const info = PAYMENT_STATE[r.payment_state];
      if (!info) return <span style={{ color: G.text3, fontSize: 12 }}>—</span>;
      return (
        <span style={{ background: info.color + '18', color: info.color, borderRadius: G.radiusPill, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {info.label}
        </span>
      );
    }
    if (key === '_daysLeft') return <ExpiryBadge days={r._daysLeft} estimated={r._estimatedEnd} />;
    if (key === '_tracked') {
      return (
        <input type="checkbox" checked={r._tracked}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => { e.stopPropagation(); onToggleTracked(r); }}
          style={{ width: 16, height: 16, cursor: 'pointer' }} />
      );
    }
    return <span style={{ color: G.text2 }}>{r[key] ?? '—'}</span>;
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 820 }}>
      <thead>
        <tr style={{ background: G.surfaceVariant }}>
          {COLS.map((c) => (
            <th key={c.key} onClick={() => onSort(c.key)} title="クリックで並び替え"
              style={{ padding: '8px', textAlign: c.align, fontWeight: 600, color: sortKey === c.key ? G.primary : G.text2, whiteSpace: 'nowrap', borderBottom: `2px solid ${G.border}`, cursor: 'pointer', userSelect: 'none' }}>
              {c.label}{sortKey === c.key ? (dir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
            </th>
          ))}
          <th style={{ borderBottom: `2px solid ${G.border}` }}></th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => (
          <tr key={r.id} onClick={() => onRowClick(r)}
            style={{ borderBottom: `1px solid ${G.border}`, cursor: 'pointer', opacity: r._tracked ? 1 : 0.55, background: r._unassessed ? G.warningContainer : 'transparent' }}>
            {COLS.map((c) => (
              <td key={c.key} style={{ padding: '8px', textAlign: c.align }}>{renderCell(r, c.key)}</td>
            ))}
            <td style={{ padding: '8px' }}>
              <button onClick={(e) => { e.stopPropagation(); onEdit(r); }}
                style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, color: G.primary, background: G.primaryContainer, border: 'none', borderRadius: G.radiusPill, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                編集
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function StudentsDashboard() {
  const { students, summary, loading, error, needsPin, pin, setPin, load, save } = useStudents();
  const { isMobile, isTablet } = useBreakpoint();

  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [pinFailed, setPinFailed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailStudent, setDetailStudent] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [flowFilter, setFlowFilter] = useState('all'); // all | FUNNEL_STAGE_GROUPS key | flow_stage key
  const [trackedViewFilter, setTrackedViewFilter] = useState('all'); // all | untracked

  const list = students;
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const tableRows = useMemo(() => list.map((s) => {
    const { date: end, estimated } = contractEndInfo(s);
    return {
      ...s,
      _endDate: end,
      _estimatedEnd: estimated,
      _daysLeft: daysUntil(end, today),
      _unassessed: isUnassessed(s),
      _tracked: isTracked(s),
      _lastActiveDays: daysSince(s.last_active_date, today),
      _sourceCount: (s.sources || []).length,
    };
  }), [list, today]);

  // 集計対象（tracked !== false）だけをサマリー・グラフ・満了アラートに使う
  const trackedRows = useMemo(() => tableRows.filter((s) => s._tracked), [tableRows]);
  const untrackedCount = tableRows.length - trackedRows.length;

  const summaryMetrics = useMemo(() => {
    const a = { total: 0, leading: 0, active: 0, slowing: 0, silent: 0, left: 0, unassessed: 0, recoveryDone: 0, listSum: 0, listCount: 0, paidTotalSum: 0, paidTotalCount: 0 };
    for (const s of trackedRows) {
      a.total++;
      if (s._unassessed) a.unassessed++;
      else if (a[s.status] !== undefined) a[s.status]++;
      if (s.recovery_meeting_date) a.recoveryDone++;
      if (s.list_count != null) { a.listSum += s.list_count; a.listCount++; }
      if (s.paid_total != null) { a.paidTotalSum += s.paid_total; a.paidTotalCount++; }
    }
    const assessed = a.total - a.unassessed;
    return {
      ...a, assessed,
      assessedRate: a.total > 0 ? Math.round((assessed / a.total) * 1000) / 10 : 0,
      recoveryPending: a.total - a.recoveryDone,
      listAvg: a.listCount > 0 ? Math.round((a.listSum / a.listCount) * 10) / 10 : 0,
    };
  }, [trackedRows]);

  const expiry = useMemo(() => {
    const withEnd = trackedRows.filter((s) => s._daysLeft != null);
    const byMonth = new Map();
    for (const s of withEnd) {
      const end = s._endDate;
      const key = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
      const cur = byMonth.get(key) || { count: 0, minDays: Infinity, year: end.getFullYear(), month: end.getMonth() + 1 };
      cur.count++;
      cur.minDays = Math.min(cur.minDays, s._daysLeft);
      byMonth.set(key, cur);
    }
    const months = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
    return {
      months,
      within30: withEnd.filter((s) => s._daysLeft <= 30).length,
      within60: withEnd.filter((s) => s._daysLeft <= 60).length,
      hasEstimated: withEnd.some((s) => s._estimatedEnd),
    };
  }, [trackedRows]);

  const statusChartData = useMemo(() => STATUS_ORDER.map((key) => ({
    name: STATUS[key].label,
    color: STATUS[key].color,
    人数: key === 'unknown' ? summaryMetrics.unassessed : summaryMetrics[key],
  })), [summaryMetrics]);

  const filteredRows = useMemo(() => tableRows.filter((s) => {
    const statusOk = statusFilter === 'all' || (statusFilter === 'unknown' ? s._unassessed : s.status === statusFilter);
    const planOk = planFilter === 'all' || (planFilter === 'unknown' ? (!s.plan || s.plan === 'unknown') : s.plan === planFilter);
    const flowOk = matchesFlowFilter(s, flowFilter);
    const trackedOk = trackedViewFilter === 'untracked' ? !s._tracked : true;
    return statusOk && planOk && flowOk && trackedOk;
  }), [tableRows, statusFilter, planFilter, flowFilter, trackedViewFilter]);

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (s) => { setEditing(s); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };
  const handleSaved = () => { closeForm(); };

  const openDetail = (s) => setDetailStudent(s);
  const closeDetail = () => setDetailStudent(null);
  const editFromDetail = () => { const s = detailStudent; closeDetail(); openEdit(s); };

  const handleToggleTracked = async (s) => {
    try {
      await save({ id: s.id, tracked: !s._tracked });
    } catch {
      // PIN切れ等は save 内で needsPin に遷移するため、ここでは何もしない
    }
  };

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
          <h3 style={{ fontSize: 15, fontWeight: 700, color: G.text1, marginBottom: 8 }}>受講生情報を表示</h3>
          <p style={{ fontSize: 13, color: G.text2, marginBottom: 16, lineHeight: 1.6 }}>
            受講生情報（実名）を表示するには共有PINを入力してください。
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
          <p style={{ fontSize: 11, color: G.text3, marginTop: 12 }}>※ 営業タブの面談入力と同じ共有PINです</p>
        </Card>
      </div>
    );
  }

  if (loading) return <Card><div style={{ color: G.text2, fontSize: 14 }}>受講生データを読み込み中...</div></Card>;
  if (error) {
    const missing = /relation|does not exist|schema cache|find the table/i.test(error.message || '');
    return (
      <Card title="受講生データを取得できませんでした">
        <div style={{ fontSize: 13, color: G.text2, lineHeight: 1.7 }}>
          {missing
            ? 'students テーブルが見つかりません。Supabase に 2026-08-07_students.sql を適用してください。'
            : `エラー: ${error.message}`}
        </div>
      </Card>
    );
  }

  const kpiCols = isMobile ? 2 : isTablet ? 3 : 6;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ヘッダー行 ＋ 入力ボタン */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: G.text3 }}>受講生棚卸し（実名・共有PIN保護）</span>
        <button onClick={openAdd}
          style={{ marginLeft: 'auto', padding: '7px 16px', fontSize: 13, fontWeight: 700, color: G.onPrimary, background: G.primary, border: 'none', borderRadius: G.radiusPill, cursor: 'pointer' }}>
          ＋受講生を追加
        </button>
      </div>

      {/* 入力/編集モーダル */}
      {showForm && (
        <div onClick={closeForm}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: G.surface, borderRadius: G.radiusLg, padding: 24, width: '100%', maxWidth: 560, boxShadow: G.shadow3, margin: 'auto' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: G.text1, marginBottom: 16 }}>
              {editing ? `${editing.name} さんを編集` : '受講生を追加'}
            </h3>
            <StudentForm student={editing} save={save} onSaved={handleSaved} onClose={closeForm} />
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {detailStudent && (
        <StudentDetailModal student={detailStudent} onClose={closeDetail} onEdit={editFromDetail} />
      )}

      {list.length === 0 ? (
        <Card><div style={{ fontSize: 13, color: G.text2 }}>まだ受講生が登録されていません。「＋受講生を追加」から登録してください。</div></Card>
      ) : (
        <>
          {/* ⭐ 契約満了アラート */}
          <Card title="⚠ 契約満了アラート" style={{
            border: `1px solid ${expiry.within30 > 0 ? G.error : expiry.within60 > 0 ? G.warning : G.border}`,
            background: expiry.within30 > 0 ? G.errorContainer : expiry.within60 > 0 ? G.warningContainer : G.surface,
          }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: G.text2 }}>30日以内に満了</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: G.error }}>{expiry.within30}名</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: G.text2 }}>60日以内に満了</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: G.warning }}>{expiry.within60}名</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {expiry.months.map(([key, info]) => {
                const isError = info.minDays <= 30;
                const isWarn = !isError && info.minDays <= 60;
                const color = isError ? G.error : isWarn ? G.warning : G.text2;
                const bg = isError ? G.errorContainer : isWarn ? G.warningContainer : G.surfaceVariant;
                return (
                  <span key={key} style={{ background: bg, color, borderRadius: G.radiusPill, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                    {info.year}年{info.month}月満了: {info.count}名
                  </span>
                );
              })}
              {!expiry.months.length && <span style={{ fontSize: 13, color: G.text3 }}>初回面談日・コース終了日が未入力のため満了予定を算出できません</span>}
            </div>
            {expiry.hasEstimated && (
              <div style={{ marginTop: 10, fontSize: 11, color: G.text3 }}>
                ※ コース終了日が未登録の受講生は、初回面談日＋契約期間から推定しています（バッジの「(推定)」表記）。
              </div>
            )}
          </Card>

          {/* サマリー */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpiCols},1fr)`, gap: 12 }}>
            <MetricCard label="受講生数" value={summaryMetrics.total.toLocaleString()} sub={untrackedCount > 0 ? `集計対象外 ${untrackedCount}名を除く` : '全員集計対象'} color={G.primary} />
            <MetricCard label={STATUS.leading.label} value={summaryMetrics.leading.toLocaleString()} color={STATUS.leading.color} />
            <MetricCard label={STATUS.active.label} value={summaryMetrics.active.toLocaleString()} color={STATUS.active.color} />
            <MetricCard label={STATUS.slowing.label} value={summaryMetrics.slowing.toLocaleString()} color={STATUS.slowing.color} />
            <MetricCard label={STATUS.silent.label} value={summaryMetrics.silent.toLocaleString()} color={STATUS.silent.color} />
            <MetricCard label="未棚卸し" value={summaryMetrics.unassessed.toLocaleString()} sub="状態未入力" color={summaryMetrics.unassessed > 0 ? G.warning : G.text3} />
            <MetricCard label="棚卸し進捗" value={`${summaryMetrics.assessed}/${summaryMetrics.total}`} sub="状態入力済み" color={G.primary} chip={`${summaryMetrics.assessedRate}%`} />
            <MetricCard label="リカバリー面談 実施済み" value={summaryMetrics.recoveryDone.toLocaleString()} sub={`未実施 ${summaryMetrics.recoveryPending}名`} color={G.success} />
            <MetricCard label="リスト数" value={summaryMetrics.listSum.toLocaleString()} sub={`平均 ${summaryMetrics.listAvg}件/人`} color={G.text1} />
            <MetricCard label="決済総額" value={fmtYen(summaryMetrics.paidTotalSum)} sub={`集計対象 ${summaryMetrics.paidTotalCount}名の支払い合計`} color={G.success} />
          </div>

          {/* 受講フロー：決済 → 初回面談 → ツール登録。どこで落ちたのかを一目で見せる */}
          {summary?.flow && (
            <Card title="受講フロー（決済 → 初回面談 → ツール登録）" style={{
              border: `1px solid ${summary.flow.by_stage.payment_only > 0 ? G.error
                : (summary.flow.drop_at_meeting > 0 || summary.flow.drop_at_tool > 0) ? G.warning : G.border}`,
            }}>
              <div style={{ fontSize: 12, color: G.text2, marginBottom: 16, lineHeight: 1.6 }}>
                決済CSV（payment）・棚卸しシート（roster、初回面談申込日を保持）・タスク管理ツール（tasktool）の3つの名簿から、業務フロー上どこで止まっているかを可視化しています。段・矢印・下のバッジをクリックすると一覧を絞り込めます。
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch', gap: isMobile ? 4 : 0 }}>
                <FunnelStageBox label="① 決済" count={summary.flow.paid}
                  active={flowFilter === 'paid'} onClick={() => setFlowFilter((f) => (f === 'paid' ? 'all' : 'paid'))} />
                <FunnelDrop count={summary.flow.drop_at_meeting} isMobile={isMobile}
                  active={flowFilter === 'drop_at_meeting'} onClick={() => setFlowFilter((f) => (f === 'drop_at_meeting' ? 'all' : 'drop_at_meeting'))} />
                <FunnelStageBox label="② 初回面談の記録あり" count={summary.flow.paid_and_meeting}
                  active={flowFilter === 'paid_meeting'} onClick={() => setFlowFilter((f) => (f === 'paid_meeting' ? 'all' : 'paid_meeting'))} />
                <FunnelDrop count={summary.flow.drop_at_tool} isMobile={isMobile}
                  active={flowFilter === 'drop_at_tool'} onClick={() => setFlowFilter((f) => (f === 'drop_at_tool' ? 'all' : 'drop_at_tool'))} />
                <FunnelStageBox label="③ ツール登録あり" count={summary.flow.paid_meeting_tool}
                  active={flowFilter === 'paid_meeting_tool'} onClick={() => setFlowFilter((f) => (f === 'paid_meeting_tool' ? 'all' : 'paid_meeting_tool'))} />
              </div>

              <div style={{ marginTop: 20, marginBottom: 8, fontSize: 12, fontWeight: 600, color: G.text2 }}>
                到達ステージ別の内訳（全{summary.total}名）
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FLOW_STAGE_ORDER.map((key) => (
                  <StageFilterChip key={key} stageKey={key} count={summary.flow.by_stage[key] ?? 0}
                    active={flowFilter === key} onClick={() => setFlowFilter((f) => (f === key ? 'all' : key))} />
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: G.text3, lineHeight: 1.6 }}>
                「面談記録なし」「決済未確認」は棚卸しシート（手作業のため漏れがあり得る）に載っていないという事実を示すもので、面談や決済が「無かった」ことの断定ではありません。「決済のみ」は、お金を受け取っているのに初回面談・ツール登録のどちらの記録もない状態で、最優先の確認対象です。
              </div>

              {flowFilter !== 'all' && (
                <div style={{ marginTop: 12, fontSize: 12, color: G.primary, fontWeight: 600 }}>
                  一覧を「{FLOW_FILTER_LABEL[flowFilter]}」で絞り込み中
                  <button onClick={() => setFlowFilter('all')}
                    style={{ marginLeft: 8, border: 'none', background: 'transparent', color: G.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                    解除
                  </button>
                </div>
              )}
            </Card>
          )}

          {/* 状態別の内訳 */}
          <Card title="状態別の内訳">
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 260}>
              <ComposedChart data={statusChartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 0" stroke={G.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: G.text3 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: G.text3 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="人数" name="人数" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          {/* 一覧テーブル */}
          <Card title="受講生一覧" style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: G.text3, alignSelf: 'center' }}>状態:</span>
              <FilterPill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>すべて</FilterPill>
              {STATUS_ORDER.map((k) => (
                <FilterPill key={k} active={statusFilter === k} onClick={() => setStatusFilter(k)}>{STATUS[k].label}</FilterPill>
              ))}
              <span style={{ fontSize: 12, color: G.text3, alignSelf: 'center', marginLeft: 12 }}>プラン:</span>
              <FilterPill active={planFilter === 'all'} onClick={() => setPlanFilter('all')}>すべて</FilterPill>
              {Object.keys(PLAN).map((k) => (
                <FilterPill key={k} active={planFilter === k} onClick={() => setPlanFilter(k)}>{PLAN[k]}</FilterPill>
              ))}
              <span style={{ fontSize: 12, color: G.text3, alignSelf: 'center', marginLeft: 12 }}>その他:</span>
              <FilterPill active={trackedViewFilter === 'untracked'} onClick={() => setTrackedViewFilter((f) => (f === 'untracked' ? 'all' : 'untracked'))}>
                集計対象外のみ（{untrackedCount}）
              </FilterPill>
              {flowFilter !== 'all' && (
                <FilterPill active onClick={() => setFlowFilter('all')}>
                  フロー:{FLOW_FILTER_LABEL[flowFilter]} ×
                </FilterPill>
              )}
            </div>
            <StudentsTable rows={filteredRows} onEdit={openEdit} onRowClick={openDetail} onToggleTracked={handleToggleTracked} />
          </Card>
        </>
      )}
    </div>
  );
}
