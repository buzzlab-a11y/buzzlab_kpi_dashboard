// JVパートナー経由の商談成績 ＋ 獲得した受講生のその後 を集計する Vercel Serverless Function。
// PIN認証つきの GET のみ。sales_meetings / students はどちらも RLS で anon 非公開のため、
// service_role で読み、返すのは集計結果のみ（個人名は突き合わせにのみ使い、レスポンスには含めない）。
// students.js と同じ方針（pinOk/timingSafeEqual・env の扱い・エラー形）を踏襲する。
//
// 必要な Vercel 環境変数（Production+Preview・VITE_ 接頭辞を付けないこと）:
//   SUPABASE_URL / SUPABASE_SERVICE_KEY / MEETING_FORM_PIN
import { timingSafeEqual } from 'node:crypto';

// ── 経由者名の正規化（入力ミスの吸収）───────────────────────────────────
const REFERRER_ALIASES = { 'こうようV': 'こうようJV' };

function normalizeReferrer(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '(直接)';
  return REFERRER_ALIASES[s] ?? s;
}

// ── 名寄せキー（match_key）正規化 ──────────────────────────────────────
// api/students.js の normalizeName() と同一仕様。片方だけ変更すると突き合わせが壊れるので要注意。
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

// 異体字を揃えたキー（渡邊/渡邉 のような表記ゆれを吸収するため）。
// normalizeName() 済みの文字列に対して1文字ずつ置換する。
const VARIANTS = {
  髙: '高',﨑: '崎', 邉: '辺', 邊: '辺', 濵: '浜', 澤: '沢',
  齋: '斎', 齊: '斉', 冨: '富', 廣: '広', 栁: '柳', 桒: '桑', 瀨: '瀬',
};

function toLooseKey(normalizedKey) {
  let out = '';
  for (const ch of normalizedKey) out += VARIANTS[ch] ?? ch;
  return out;
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

// ── 面談ステータスの判定 ────────────────────────────────────────────────
// held = status_category が noshow / cancel / blacklist / invalid 以外。contract = 成約。
// ⚠️ supabase_sales_meetings.sql の sales_summary_* ビュー（営業/面談タブ）と同じ除外条件にすること。
//    ここだけ条件が違うと同じダッシュボード内で営業タブとJVタブの数字が食い違う。
const EXCLUDED_HELD = new Set(['noshow', 'cancel', 'blacklist', 'invalid']);
const isHeld = (m) => !EXCLUDED_HELD.has(m.status_category);
const isContract = (m) => m.status_category === 'contract';

// ── 日付ヘルパー（今日は00:00基準）──────────────────────────────────────
function startOfDayMs(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function daysUntil(dateStr, todayMs) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - todayMs) / 86400000);
}
function daysSince(dateStr, todayMs) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((todayMs - d.getTime()) / 86400000);
}
const isEndingSoon = (dateStr, todayMs) => {
  const d = daysUntil(dateStr, todayMs);
  return d != null && d <= 60;
};
const isStale = (dateStr, todayMs) => {
  const d = daysSince(dateStr, todayMs);
  return d != null && d >= 30;
};

// ── 集計バケツ（経由者ごと・全体合計ともに同じ形で積み上げる）────────────
function newBucket() {
  return {
    meetings: 0,
    held: 0,
    contracts: 0,
    revenueInTax: 0,
    receivedAmount: 0,
    sourceTypeCounts: new Map(),
    matchedStudentIds: new Set(),
    months: new Map(), // source_month -> { meetings, held, contracts, revenueInTax, receivedAmount }
  };
}

function bumpMeeting(bucket, m) {
  const held = isHeld(m);
  const contract = isContract(m);

  bucket.meetings += 1;
  if (held) bucket.held += 1;
  if (contract) bucket.contracts += 1;
  if (contract) bucket.revenueInTax += m.price_in_tax || 0;
  bucket.receivedAmount += m.received_amount || 0;
  if (m.source_type) {
    bucket.sourceTypeCounts.set(m.source_type, (bucket.sourceTypeCounts.get(m.source_type) || 0) + 1);
  }

  const monthKey = m.source_month || '(不明)';
  let mb = bucket.months.get(monthKey);
  if (!mb) {
    mb = { meetings: 0, held: 0, contracts: 0, revenueInTax: 0, receivedAmount: 0 };
    bucket.months.set(monthKey, mb);
  }
  mb.meetings += 1;
  if (held) mb.held += 1;
  if (contract) { mb.contracts += 1; mb.revenueInTax += m.price_in_tax || 0; }
  mb.receivedAmount += m.received_amount || 0;
}

const contractRateOf = (contracts, held) => (held > 0 ? Math.round((contracts / held) * 1000) / 10 : 0);

function modeSourceType(counts) {
  let best = null;
  let bestCount = -1;
  for (const [type, count] of counts) {
    if (count > bestCount) { best = type; bestCount = count; }
  }
  return best;
}

function finalizeBucket(bucket, studentsById, todayMs) {
  const matched = [...bucket.matchedStudentIds].map((id) => studentsById.get(id)).filter(Boolean);
  const progressValues = matched.map((s) => s.progress_pct).filter((v) => v != null);
  const avgProgress = progressValues.length
    ? Math.round((progressValues.reduce((a, b) => a + b, 0) / progressValues.length) * 10) / 10
    : null;

  const months = {};
  for (const [key, mb] of [...bucket.months.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    months[key] = {
      meetings: mb.meetings,
      held: mb.held,
      contracts: mb.contracts,
      contract_rate: contractRateOf(mb.contracts, mb.held),
      revenue_in_tax: mb.revenueInTax,
      received_amount: mb.receivedAmount,
    };
  }

  return {
    meetings: bucket.meetings,
    held: bucket.held,
    contracts: bucket.contracts,
    contract_rate: contractRateOf(bucket.contracts, bucket.held),
    revenue_in_tax: bucket.revenueInTax,
    received_amount: bucket.receivedAmount,
    students_matched: matched.length,
    avg_progress: avgProgress,
    paid_count: matched.filter((s) => s.payment_state === 'paid').length,
    ending_soon: matched.filter((s) => isEndingSoon(s.course_end_date, todayMs)).length,
    stale_count: matched.filter((s) => isStale(s.last_active_date, todayMs)).length,
    months,
  };
}

// ── 商談(sales_meetings) × 受講生(students) を集計してレスポンスの形にする（純関数・テスト用に export）──
export function buildJvReport(meetings, students, nowMs = Date.now()) {
  const todayMs = startOfDayMs(nowMs);
  const studentsById = new Map(students.map((s) => [s.id, s]));
  const studentsByLooseKey = new Map();
  for (const s of students) {
    const lk = toLooseKey(s.match_key || '');
    if (lk && !studentsByLooseKey.has(lk)) studentsByLooseKey.set(lk, s);
  }

  const buckets = new Map();
  const totalBucket = newBucket();
  let meetingDateMax = null;

  for (const m of meetings) {
    if (m.meeting_date && (!meetingDateMax || m.meeting_date > meetingDateMax)) meetingDateMax = m.meeting_date;

    const referrer = normalizeReferrer(m.referrer);
    let bucket = buckets.get(referrer);
    if (!bucket) { bucket = newBucket(); buckets.set(referrer, bucket); }

    bumpMeeting(bucket, m);
    bumpMeeting(totalBucket, m);

    if (isContract(m)) {
      const lk = toLooseKey(normalizeName(m.prospect_name || ''));
      const student = lk ? studentsByLooseKey.get(lk) : null;
      if (student) {
        bucket.matchedStudentIds.add(student.id);
        totalBucket.matchedStudentIds.add(student.id);
      }
    }
  }

  const partners = [...buckets.entries()]
    .map(([referrer, bucket]) => ({
      referrer,
      source_type: modeSourceType(bucket.sourceTypeCounts),
      ...finalizeBucket(bucket, studentsById, todayMs),
    }))
    .sort((a, b) => b.contracts - a.contracts || b.meetings - a.meetings);

  return {
    as_of: { meeting_date_max: meetingDateMax, meeting_count: meetings.length },
    partners,
    totals: finalizeBucket(totalBucket, studentsById, todayMs),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

  const [meetingsRes, studentsRes] = await Promise.all([
    fetch(`${url}/rest/v1/sales_meetings?select=prospect_name,referrer,source_type,status_category,price_in_tax,received_amount,meeting_date,source_month`, { headers: authHeaders }),
    fetch(`${url}/rest/v1/students?select=id,match_key,progress_pct,payment_state,course_end_date,last_active_date,tracked,status`, { headers: authHeaders }),
  ]);
  if (!meetingsRes.ok) { await sendSupabaseError(res, meetingsRes); return; }
  if (!studentsRes.ok) { await sendSupabaseError(res, studentsRes); return; }

  const meetings = await meetingsRes.json();
  const students = await studentsRes.json();

  res.status(200).json(buildJvReport(meetings, students));
}
