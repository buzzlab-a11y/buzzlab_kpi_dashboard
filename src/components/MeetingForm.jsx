import React, { useState } from 'react';
import { G } from '../styles/theme';

// 営業の面談入力フォーム。/api/submit-meeting（Vercel Serverless）へ POST し、
// service_role での書き込みはサーバ側で行う。認証は共有 PIN（x-form-pin ヘッダ）。
// PIN は sessionStorage に保持（タブを閉じると消える）。

const PIN_KEY = 'meeting_form_pin';

const CHANNEL_OPTS = [
  ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['threads', 'Threads'],
  ['line', 'LINE'], ['referral', '紹介 / JV'], ['other', 'その他'], ['unknown', '不明'],
];
const SOURCE_TYPE_OPTS = [
  ['jv', 'JV'], ['seminar', 'セミナー'], ['self', '自社'], ['monthly', '月次'], ['other', 'その他'],
];
// status は生文字列で送り、サーバの categorize が分類する（部分一致）
const STATUS_OPTS = ['成約', '失注', '検討中', 'キャンセル', '飛び・不参加', 'クーリングオフ', 'ブラックリスト', '無効商談'];

const EMPTY = {
  meeting_date: '', prospect_name: '', closer: '', lead_channel: '',
  referrer: '', source_type: 'other', source_sheet: '',
  status: '', meeting_type: '',
  price_in_tax: '', price_ex_tax: '', received_amount: '',
  contract_date: '', payment_date: '', payment_status: '',
  assignee: '', notes: '',
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13,
  border: `1px solid ${G.border}`, borderRadius: G.radius, background: G.surface,
  color: G.text1, outline: 'none',
};
const labelStyle = { fontSize: 11, fontWeight: 600, color: G.text2, marginBottom: 4, display: 'block' };

function Field({ label, required, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>{label}{required && <span style={{ color: G.error }}> *</span>}</span>
      {children}
    </label>
  );
}

export default function MeetingForm({ onSubmitted, onClose }) {
  const [pin, setPin] = useState(() => sessionStorage.getItem(PIN_KEY) || '');
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState('idle'); // idle | submitting | success | error
  const [msg, setMsg] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!pin) { setState('error'); setMsg('PIN を入力してください'); return; }
    if (!form.meeting_date && !form.prospect_name) {
      setState('error'); setMsg('実施日 か お名前 のいずれかは必須です'); return;
    }
    setState('submitting'); setMsg('');
    try {
      const res = await fetch('/api/submit-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-form-pin': pin },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) { setState('error'); setMsg('PIN が違います'); return; }
        setState('error'); setMsg(data.detail || data.error || `エラー (${res.status})`); return;
      }
      sessionStorage.setItem(PIN_KEY, pin); // 成功した PIN だけ保持
      setState('success'); setMsg('保存しました');
      setForm(EMPTY);
      onSubmitted?.();
    } catch (err) {
      setState('error'); setMsg(`通信エラー: ${err.message}`);
    }
  };

  const col2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* PIN */}
      <Field label="入力PIN（営業共有）" required>
        <input type="password" value={pin} autoComplete="off"
          onChange={(e) => setPin(e.target.value)} style={inputStyle} placeholder="共有PIN" />
      </Field>

      <div style={col2}>
        <Field label="実施日" required>
          <input type="date" value={form.meeting_date} onChange={set('meeting_date')} style={inputStyle} />
        </Field>
        <Field label="お名前" required>
          <input type="text" value={form.prospect_name} onChange={set('prospect_name')} style={inputStyle} />
        </Field>
      </div>

      <div style={col2}>
        <Field label="面談者（クローザー）" required>
          <input type="text" value={form.closer} onChange={set('closer')} style={inputStyle} placeholder="例: 平野" />
        </Field>
        <Field label="流入元（動線）" required>
          <select value={form.lead_channel} onChange={set('lead_channel')} style={inputStyle}>
            <option value="">選択してください</option>
            {CHANNEL_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </div>

      <div style={col2}>
        <Field label="獲得ソース種別">
          <select value={form.source_type} onChange={set('source_type')} style={inputStyle}>
            {SOURCE_TYPE_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="経由者（紹介元・JVパートナー）">
          <input type="text" value={form.referrer} onChange={set('referrer')} style={inputStyle} placeholder="例: 白澤さんJV" />
        </Field>
      </div>

      <div style={col2}>
        <Field label="ソース名（任意・未入力なら「手入力」）">
          <input type="text" value={form.source_sheet} onChange={set('source_sheet')} style={inputStyle} placeholder="例: 白澤さんJV(6月)" />
        </Field>
        <Field label="状況">
          <select value={form.status} onChange={set('status')} style={inputStyle}>
            <option value="">未選択</option>
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div style={col2}>
        <Field label="価格（税込）">
          <input type="number" value={form.price_in_tax} onChange={set('price_in_tax')} style={inputStyle} placeholder="円" />
        </Field>
        <Field label="着金額">
          <input type="number" value={form.received_amount} onChange={set('received_amount')} style={inputStyle} placeholder="円" />
        </Field>
      </div>

      <div style={col2}>
        <Field label="成約日">
          <input type="date" value={form.contract_date} onChange={set('contract_date')} style={inputStyle} />
        </Field>
        <Field label="決済日">
          <input type="date" value={form.payment_date} onChange={set('payment_date')} style={inputStyle} />
        </Field>
      </div>

      <Field label="備考">
        <textarea value={form.notes} onChange={set('notes')} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      </Field>

      {msg && (
        <div style={{
          fontSize: 12, fontWeight: 600, padding: '8px 12px', borderRadius: G.radius,
          color: state === 'success' ? G.success : G.error,
          background: (state === 'success' ? G.successContainer : G.errorContainer),
        }}>{msg}</div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        {onClose && (
          <button type="button" onClick={onClose}
            style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, color: G.text2, background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radius, cursor: 'pointer' }}>
            閉じる
          </button>
        )}
        <button type="submit" disabled={state === 'submitting'}
          style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, color: G.onPrimary, background: state === 'submitting' ? G.text3 : G.primary, border: 'none', borderRadius: G.radius, cursor: state === 'submitting' ? 'default' : 'pointer' }}>
          {state === 'submitting' ? '保存中...' : '面談を保存'}
        </button>
      </div>
    </form>
  );
}
