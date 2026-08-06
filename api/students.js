// 受講生データ（PIIあり）を PIN 認証つきで読み書きする Vercel Serverless Function。
// service_role キーはサーバ env のみ（フロントには出さない）。共有 PIN で簡易ゲート。
// submit-meeting.js と同じ方針（pinOk/timingSafeEqual・env の扱い・エラー形）を踏襲。
// students / student_sources は RLS で anon/authenticated を完全遮断しているため、
// 読み書きは常に service_role（このファイル経由）のみ。anon キーは使わない。
//
// 必要な Vercel 環境変数（Production+Preview・VITE_ 接頭辞を付けないこと）:
//   SUPABASE_URL / SUPABASE_SERVICE_KEY / MEETING_FORM_PIN
import { timingSafeEqual, createHash } from 'node:crypto';

const ALLOWED_PLAN = new Set(['standard', 'premium', 'vip', 'vip_plus', 'monitor', 'unknown']);
const ALLOWED_STATUS = new Set(['leading', 'active', 'slowing', 'silent', 'left', 'unknown']);

// 名簿ソース名の定数（直書きを散らさないため）。DB の student_sources.source と一致させること。
const SOURCE = { PAYMENT: 'payment', ROSTER: 'roster', TASKTOOL: 'tasktool' };

// 名寄せの基準にする2ソース（roster/tasktool）。summary の both/*_only はこの2値限定の内訳。
// by_source は未知のソース（payment等）が増えても壊れないよう全ソースを動的に集計する。
const PRIMARY_SOURCES = [SOURCE.ROSTER, SOURCE.TASKTOOL];

// 書き込みを許可する列のホワイトリスト（型タグ付き）。id/created_at/updated_at は更新対象外。
const COLUMNS = {
  name: 'string',
  first_meeting_date: 'date',
  sales_closer: 'string',
  plan: 'plan',
  contract_months: 'int',
  discord_joined: 'bool',
  threads_url: 'string',
  last_post_date: 'date',
  posts_7d: 'int',
  followers: 'int',
  list_count: 'int',
  status: 'status',
  // 集計対象フラグ。運営・講師アカウントを UI のトグルで集計から外すために更新を許可する
  // （取込スクリプトは書き込まない＝人間の判断を上書きしない）
  tracked: 'bool',
  recovery_closer: 'string',
  recovery_meeting_date: 'date',
  notes: 'string',
  // v2（タスク管理ツール由来）
  match_key: 'string',
  email: 'string',
  enrolled_date: 'date',
  course_start_date: 'date',
  course_end_date: 'date',
  progress_pct: 'int',
  phase: 'string',
  mentor: 'string',
  tool_status: 'string',
  last_active_date: 'date',
  weekly_post_goal: 'int',
  weekly_post_actual: 'int',
  posts_total: 'int',
  reels_total: 'int',
  instagram_handle: 'string',
  threads_handle: 'string',
  // v3（決済CSV由来のサマリー。明細は student_sources(source='payment').data.orders）
  paid_total: 'int',
  payment_plan: 'plan',
  payment_state: 'string', // 許可値は paid|expired|cancelled|mixed。範囲外を丸めず DB の CHECK 制約に任せる
  payment_count: 'int',
  first_order_date: 'date',
};

function str(v) {
  const s = String(v ?? '').trim();
  return s || null;
}

// 日付は YYYY-MM-DD のみ受理。空文字・不一致は null。
function parseDate(v) {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v).trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// カンマ除去して整数化。空文字は null。
function parseIntCol(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

// 'true'/'false' の文字列も受理。空文字は null。
function parseBool(v) {
  if (v === '' || v == null) return null;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return null;
}

function convertValue(type, raw) {
  switch (type) {
    case 'string': return str(raw);
    case 'date': return parseDate(raw);
    case 'int': return parseIntCol(raw);
    case 'bool': return parseBool(raw);
    case 'plan': {
      const v = String(raw ?? '').trim();
      return ALLOWED_PLAN.has(v) ? v : 'unknown';
    }
    case 'status': {
      const v = String(raw ?? '').trim();
      return ALLOWED_STATUS.has(v) ? v : 'unknown';
    }
    default: return null;
  }
}

// body からホワイトリスト列だけを抽出・変換する。含まれないキーは黙って捨てる。
function pickColumns(body) {
  const out = {};
  for (const key of Object.keys(COLUMNS)) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      out[key] = convertValue(COLUMNS[key], body[key]);
    }
  }
  return out;
}

// ── 名寄せキー（match_key）正規化 ──────────────────────────────────────
// collector/import_students.py と同一仕様。片方だけ変更すると名寄せが壊れるので要注意。
//   1. NFKC 正規化
//   2. 装飾（｜ | / ／ ( （ 【 [ ＠ @ ・ ＿ のいずれか）が最初に現れた位置より後ろを切り捨て
//   3. 空白（半角/全角/タブ）を全て除去
//   4. 記号・絵文字（\p{So}\p{Sk}）を除去
//   5. 小文字化
const CUT_CHARS = ['｜', '|', '/', '／', '(', '（', '【', '[', '＠', '@', '・', '＿'];

function cutDecoration(s) {
  let cutAt = s.length;
  for (const ch of CUT_CHARS) {
    const idx = s.indexOf(ch);
    if (idx !== -1 && idx < cutAt) cutAt = idx;
  }
  return s.slice(0, cutAt);
}

function normalizeName(raw) {
  let s = String(raw ?? '').normalize('NFKC');
  s = cutDecoration(s);
  s = s.replace(/[\s\u3000]+/g, ''); // \u3000 は全角スペース（JS の \s にも含まれるが意図を明示）
  s = s.replace(/\p{So}|\p{Sk}/gu, '');
  return s.toLowerCase();
}

// id = sha1(match_key) の先頭16桁。
function matchKeyId(matchKey) {
  return createHash('sha1').update(matchKey, 'utf8').digest('hex').slice(0, 16);
}

function pinOk(provided, expected) {
  if (!expected) return false;
  const a = Buffer.from(String(provided ?? ''));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function sendSupabaseError(res, r) {
  const text = await r.text();
  res.status(502).json({ error: 'supabase_error', status: r.status, detail: text.slice(0, 500) });
}

// ── 業務フローのステージ判定（決済 → 初回面談 → ツール登録）───────────────
// sources（payment/roster/tasktool）から、その人が業務フロー上どこにいるかを1つに確定する。
// UI 側では再計算せず、ここで確定した flow_stage をそのまま表示に使うこと。
const FLOW_STAGE = {
  COMPLETE: 'complete',                   // 決済・初回面談・ツール登録すべて確認できる
  MEETING_NO_TOOL: 'meeting_no_tool',     // 決済・初回面談はあるがツール未登録
  NO_MEETING_RECORD: 'no_meeting_record', // 決済・ツール登録はあるが棚卸しシートに初回面談の記録がない
  PAYMENT_ONLY: 'payment_only',           // 決済のみ。面談・ツールどちらの記録もない（最優先で確認すべき状態）
  NO_PAYMENT: 'no_payment',               // 棚卸しシートには載っているが決済CSVに見当たらない（別経路決済の可能性）
  TOOL_ONLY: 'tool_only',                 // タスク管理ツールにのみ登録がある（運営・講師アカウント等が混ざる）
  UNKNOWN: 'unknown',                     // どの名簿にも載っていない
};
const FLOW_STAGE_ORDER = [
  FLOW_STAGE.COMPLETE, FLOW_STAGE.MEETING_NO_TOOL, FLOW_STAGE.NO_MEETING_RECORD,
  FLOW_STAGE.PAYMENT_ONLY, FLOW_STAGE.NO_PAYMENT, FLOW_STAGE.TOOL_ONLY, FLOW_STAGE.UNKNOWN,
];

function computeFlowStage(sources) {
  const hasPayment = sources.includes(SOURCE.PAYMENT);
  const hasRoster = sources.includes(SOURCE.ROSTER);
  const hasTasktool = sources.includes(SOURCE.TASKTOOL);

  if (hasPayment && hasRoster && hasTasktool) return FLOW_STAGE.COMPLETE;
  if (hasPayment && hasRoster) return FLOW_STAGE.MEETING_NO_TOOL;
  if (hasPayment && hasTasktool) return FLOW_STAGE.NO_MEETING_RECORD;
  if (hasPayment) return FLOW_STAGE.PAYMENT_ONLY;
  if (hasRoster) return FLOW_STAGE.NO_PAYMENT;
  if (hasTasktool) return FLOW_STAGE.TOOL_ONLY;
  return FLOW_STAGE.UNKNOWN;
}

// sources 配列から summary（by_source 動的集計 + roster/tasktool の内訳 + ソース組合せ + 決済照合 + 業務フロー）を計算する。
function computeSummary(students) {
  const total = students.length;
  const bySource = {};
  let both = 0;
  let rosterOnly = 0;
  let tasktoolOnly = 0;
  // ソース名をソートして+で連結したキー別の人数。ソースが増えてもハードコード不要。
  const combos = {};
  let paymentWithoutTasktool = 0;
  let tasktoolWithoutPayment = 0;

  // 業務フロー集計（決済 → 初回面談 → ツール登録）
  let paid = 0;
  let paidAndMeeting = 0;
  let paidMeetingTool = 0;
  const byStage = Object.fromEntries(FLOW_STAGE_ORDER.map((k) => [k, 0]));

  for (const s of students) {
    const sources = s.sources || [];
    for (const src of sources) {
      bySource[src] = (bySource[src] || 0) + 1;
    }
    const [hasRoster, hasTasktool] = PRIMARY_SOURCES.map((p) => sources.includes(p));
    if (hasRoster && hasTasktool) both += 1;
    else if (hasRoster) rosterOnly += 1;
    else if (hasTasktool) tasktoolOnly += 1;

    const hasPayment = sources.includes(SOURCE.PAYMENT);
    if (hasPayment && !hasTasktool) paymentWithoutTasktool += 1;
    if (hasTasktool && !hasPayment) tasktoolWithoutPayment += 1;

    if (sources.length > 0) {
      const comboKey = [...new Set(sources)].sort().join('+');
      combos[comboKey] = (combos[comboKey] || 0) + 1;
    }

    if (hasPayment) paid += 1;
    if (hasPayment && hasRoster) paidAndMeeting += 1;
    if (hasPayment && hasRoster && hasTasktool) paidMeetingTool += 1;

    const stage = s.flow_stage || computeFlowStage(sources);
    byStage[stage] = (byStage[stage] || 0) + 1;
  }

  return {
    total,
    by_source: bySource,
    both,
    roster_only: rosterOnly,
    tasktool_only: tasktoolOnly,
    combos,
    payment_without_tasktool: paymentWithoutTasktool,
    tasktool_without_payment: tasktoolWithoutPayment,
    flow: {
      paid,
      paid_and_meeting: paidAndMeeting,
      paid_meeting_tool: paidMeetingTool,
      drop_at_meeting: paid - paidAndMeeting,
      drop_at_tool: paidAndMeeting - paidMeetingTool,
      by_stage: byStage,
    },
  };
}

export default async function handler(req, res) {
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!pinOk(req.headers['x-form-pin'], process.env.MEETING_FORM_PIN)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    res.status(500).json({ error: 'server_misconfigured' });
    return;
  }

  const authHeaders = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  if (req.method === 'GET') {
    const [studentsRes, sourcesRes] = await Promise.all([
      fetch(`${url}/rest/v1/students?select=*&order=first_meeting_date.asc.nullslast`, { headers: authHeaders }),
      fetch(`${url}/rest/v1/student_sources?select=student_id,source`, { headers: authHeaders }),
    ]);
    if (!studentsRes.ok) { await sendSupabaseError(res, studentsRes); return; }
    if (!sourcesRes.ok) { await sendSupabaseError(res, sourcesRes); return; }

    const studentsData = await studentsRes.json();
    const sourcesData = await sourcesRes.json();

    // student_id → その人が載っているソース名一覧
    const sourcesByStudent = new Map();
    for (const row of sourcesData) {
      const list = sourcesByStudent.get(row.student_id) || [];
      list.push(row.source);
      sourcesByStudent.set(row.student_id, list);
    }

    const students = studentsData.map((s) => {
      const sources = sourcesByStudent.get(s.id) || [];
      return { ...s, sources, flow_stage: computeFlowStage(sources) };
    });
    const summary = computeSummary(students);
    res.status(200).json({ students, summary });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  if (req.method === 'POST') {
    const name = str(body.name);
    if (!name) {
      res.status(400).json({ error: 'missing_required', detail: 'name が必要です' });
      return;
    }
    const matchKey = normalizeName(name);
    const id = matchKeyId(matchKey);
    // id / match_key は常に name から再計算した値で確定させる（body の値は信用しない）
    const record = { ...pickColumns(body), id, match_key: matchKey };

    const r = await fetch(`${url}/rest/v1/students`, {
      method: 'POST',
      headers: { ...authHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(record),
    });
    if (!r.ok) { await sendSupabaseError(res, r); return; }
    res.status(200).json({ ok: true, id: record.id });
    return;
  }

  // PATCH
  const id = str(body.id);
  if (!id) {
    res.status(400).json({ error: 'missing_required', detail: 'id が必要です' });
    return;
  }
  const record = pickColumns(body);
  if (Object.keys(record).length === 0) {
    res.status(400).json({ error: 'no_fields', detail: '更新対象のフィールドがありません' });
    return;
  }

  const r = await fetch(`${url}/rest/v1/students?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...authHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify(record),
  });
  if (!r.ok) { await sendSupabaseError(res, r); return; }
  res.status(200).json({ ok: true, id });
}
