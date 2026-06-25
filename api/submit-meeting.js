// 営業の面談入力フォーム → sales_meetings へ upsert する Vercel Serverless Function。
// service_role キーはサーバ env のみ（フロントには出さない）。共有 PIN で簡易ゲート。
//
// 必要な Vercel 環境変数（Production+Preview・VITE_ 接頭辞を付けないこと）:
//   SUPABASE_URL / SUPABASE_SERVICE_KEY / MEETING_FORM_PIN
import { timingSafeEqual } from 'node:crypto';
import { categorize } from './_lib/categorize.js';
import { normalizeChannel, normalizeCloser } from './_lib/channel.js';
import { meetingId } from './_lib/id.js';

const ALLOWED_SOURCE_TYPE = new Set(['jv', 'seminar', 'self', 'monthly', 'other']);
const ALLOWED_CHANNEL = new Set(['instagram', 'youtube', 'threads', 'line', 'referral', 'other', 'unknown']);

// 価格パース（¥ , 空白 円 を除去）。import_sales_meetings.py の parse_int と同等。
function parseIntYen(v) {
  if (v == null) return null;
  const s = String(v).replace(/[¥,\s円]/g, '');
  if (s === '' || s === '-' || s === 'ー' || s === '—') return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

// 日付は YYYY-MM-DD のみ受理（フォームの <input type="date"> 前提）。
function parseDate(v) {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v).trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function str(v) {
  const s = String(v ?? '').trim();
  return s || null;
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const meetingDate = parseDate(body.meeting_date);
  const prospectName = str(body.prospect_name);
  const closerRaw = String(body.closer ?? '').trim();
  if (!meetingDate && !prospectName) {
    res.status(400).json({ error: 'missing_required', detail: '実施日 か お名前 が必要です' });
    return;
  }

  const sourceMonth = meetingDate ? meetingDate.slice(0, 7) : str(body.source_month);
  if (!sourceMonth) {
    res.status(400).json({ error: 'missing_month', detail: '実施日(YYYY-MM-DD)が必要です' });
    return;
  }

  // 手入力面談はタブ概念が無いので source_sheet は既定「手入力」
  const sourceSheet = str(body.source_sheet) || '手入力';

  let sourceType = String(body.source_type ?? '').trim();
  if (!ALLOWED_SOURCE_TYPE.has(sourceType)) sourceType = 'other';

  let leadChannel = normalizeChannel(body.lead_channel);
  if (!ALLOWED_CHANNEL.has(leadChannel)) leadChannel = 'unknown';

  const status = str(body.status);
  const paymentStatus = str(body.payment_status);
  const contractDate = parseDate(body.contract_date);

  const record = {
    id: meetingId(sourceSheet, meetingDate || '', prospectName || '', closerRaw),
    source_month: sourceMonth,
    source_sheet: sourceSheet,
    source_type: sourceType,
    lead_channel: leadChannel,
    meeting_date: meetingDate,
    prospect_name: prospectName,
    closer: closerRaw ? normalizeCloser(closerRaw) : null,
    referrer: str(body.referrer),
    meeting_type: str(body.meeting_type),
    detail: str(body.detail),
    status,
    status_category: categorize(status, paymentStatus, contractDate),
    payment_status: paymentStatus,
    contract_date: contractDate,
    payment_date: parseDate(body.payment_date),
    price_ex_tax: parseIntYen(body.price_ex_tax),
    price_in_tax: parseIntYen(body.price_in_tax),
    received_amount: parseIntYen(body.received_amount),
    notes: str(body.notes),
    assignee: str(body.assignee),
    raw: { ...body, _via: 'form' },
  };

  const r = await fetch(`${url}/rest/v1/sales_meetings`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(record),
  });

  if (!r.ok) {
    const text = await r.text();
    res.status(502).json({ error: 'supabase_error', status: r.status, detail: text.slice(0, 500) });
    return;
  }
  res.status(200).json({ ok: true, id: record.id });
}
