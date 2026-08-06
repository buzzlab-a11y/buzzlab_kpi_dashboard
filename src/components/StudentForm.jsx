import React, { useState } from 'react';
import { G } from '../styles/theme';

// 受講生1名分の編集フォーム。PINでの認証は StudentsDashboard 側のゲートで完了済みの前提。
// 保存は props で受け取った useStudents の save() を直接呼ぶ（record.id があれば更新、無ければ新規）。

const PLAN_OPTS = [
  ['standard', 'スタンダード'], ['premium', 'プレミアム'], ['vip', 'VIP'],
  ['vip_plus', 'VIP+'], ['monitor', 'モニター'], ['unknown', '未設定'],
];
const STATUS_OPTS = [
  ['leading', '先頭（売上変換待ち）'], ['active', '動いている'], ['slowing', '止まりかけ'],
  ['silent', '沈黙'], ['left', '離脱'], ['unknown', '未分類'],
];
const DISCORD_OPTS = [['', '未設定'], ['true', '参加'], ['false', '未参加']];
const PAYMENT_STATE_OPTS = [
  ['', '未設定'], ['paid', '支払済'], ['expired', '期限切れ'], ['cancelled', 'キャンセル'], ['mixed', '一部支払'],
];

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13,
  border: `1px solid ${G.border}`, borderRadius: G.radius, background: G.surface,
  color: G.text1, outline: 'none',
};
const labelStyle = { fontSize: 11, fontWeight: 600, color: G.text2, marginBottom: 4, display: 'block' };

function Field({ label, required, note, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>{label}{required && <span style={{ color: G.error }}> *</span>}</span>
      {children}
      {note && <span style={{ fontSize: 10, color: G.text3, marginTop: 2, display: 'block' }}>{note}</span>}
    </label>
  );
}

function emptyForm(student) {
  return {
    name: student?.name || '',
    plan: student?.plan || 'unknown',
    status: student?.status || 'unknown',
    first_meeting_date: student?.first_meeting_date || '',
    sales_closer: student?.sales_closer || '',
    discord_joined: student?.discord_joined === true ? 'true' : student?.discord_joined === false ? 'false' : '',
    threads_url: student?.threads_url || '',
    last_post_date: student?.last_post_date || '',
    posts_7d: student?.posts_7d ?? '',
    followers: student?.followers ?? '',
    list_count: student?.list_count ?? '',
    recovery_closer: student?.recovery_closer || '',
    recovery_meeting_date: student?.recovery_meeting_date || '',
    notes: student?.notes || '',
    // v2（タスク管理ツール由来）
    email: student?.email || '',
    enrolled_date: student?.enrolled_date || '',
    course_start_date: student?.course_start_date || '',
    course_end_date: student?.course_end_date || '',
    progress_pct: student?.progress_pct ?? '',
    phase: student?.phase || '',
    mentor: student?.mentor || '',
    tool_status: student?.tool_status || '',
    last_active_date: student?.last_active_date || '',
    weekly_post_goal: student?.weekly_post_goal ?? '',
    weekly_post_actual: student?.weekly_post_actual ?? '',
    posts_total: student?.posts_total ?? '',
    reels_total: student?.reels_total ?? '',
    instagram_handle: student?.instagram_handle || '',
    threads_handle: student?.threads_handle || '',
    // v3（決済CSV由来のサマリー。通常は取込で入るため編集不要）
    paid_total: student?.paid_total ?? '',
    payment_plan: student?.payment_plan || 'unknown',
    payment_state: student?.payment_state || '',
    payment_count: student?.payment_count ?? '',
    first_order_date: student?.first_order_date || '',
  };
}

export default function StudentForm({ student, save, onSaved, onClose }) {
  const isEdit = !!student?.id;
  const [form, setForm] = useState(() => emptyForm(student));
  const [state, setState] = useState('idle'); // idle | submitting | success | error
  const [msg, setMsg] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setState('error'); setMsg('名前は必須です'); return; }
    setState('submitting'); setMsg('');
    try {
      const record = {
        ...(isEdit ? { id: student.id } : {}),
        name: form.name.trim(),
        plan: form.plan,
        status: form.status,
        first_meeting_date: form.first_meeting_date || null,
        sales_closer: form.sales_closer || null,
        discord_joined: form.discord_joined === '' ? null : form.discord_joined === 'true',
        threads_url: form.threads_url || null,
        last_post_date: form.last_post_date || null,
        posts_7d: form.posts_7d === '' ? null : Number(form.posts_7d),
        followers: form.followers === '' ? null : Number(form.followers),
        list_count: form.list_count === '' ? null : Number(form.list_count),
        recovery_closer: form.recovery_closer || null,
        recovery_meeting_date: form.recovery_meeting_date || null,
        notes: form.notes || null,
        // v2（タスク管理ツール由来）
        email: form.email || null,
        enrolled_date: form.enrolled_date || null,
        course_start_date: form.course_start_date || null,
        course_end_date: form.course_end_date || null,
        progress_pct: form.progress_pct === '' ? null : Number(form.progress_pct),
        phase: form.phase || null,
        mentor: form.mentor || null,
        tool_status: form.tool_status || null,
        last_active_date: form.last_active_date || null,
        weekly_post_goal: form.weekly_post_goal === '' ? null : Number(form.weekly_post_goal),
        weekly_post_actual: form.weekly_post_actual === '' ? null : Number(form.weekly_post_actual),
        posts_total: form.posts_total === '' ? null : Number(form.posts_total),
        reels_total: form.reels_total === '' ? null : Number(form.reels_total),
        instagram_handle: form.instagram_handle || null,
        threads_handle: form.threads_handle || null,
        // v3（決済CSV由来のサマリー）
        paid_total: form.paid_total === '' ? null : Number(form.paid_total),
        payment_plan: form.payment_plan,
        payment_state: form.payment_state || null,
        payment_count: form.payment_count === '' ? null : Number(form.payment_count),
        first_order_date: form.first_order_date || null,
      };
      await save(record);
      setState('success'); setMsg('保存しました');
      onSaved?.();
    } catch (err) {
      setState('error'); setMsg(`保存エラー: ${err.message}`);
    }
  };

  const col2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="名前" required note={isEdit ? '既存の受講生は名前を変更できません（IDが名前ベースのため）' : undefined}>
        <input type="text" value={form.name} onChange={set('name')} style={inputStyle} readOnly={isEdit} disabled={isEdit} />
      </Field>

      <div style={col2}>
        <Field label="プラン">
          <select value={form.plan} onChange={set('plan')} style={inputStyle}>
            {PLAN_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="状態">
          <select value={form.status} onChange={set('status')} style={inputStyle}>
            {STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </div>

      <div style={col2}>
        <Field label="初回面談申込日">
          <input type="date" value={form.first_meeting_date} onChange={set('first_meeting_date')} style={inputStyle} />
        </Field>
        <Field label="面談担当">
          <input type="text" value={form.sales_closer} onChange={set('sales_closer')} style={inputStyle} placeholder="例: 講師：レオ" />
        </Field>
      </div>

      <div style={col2}>
        <Field label="Discord参加">
          <select value={form.discord_joined} onChange={set('discord_joined')} style={inputStyle}>
            {DISCORD_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Threads URL">
          <input type="text" value={form.threads_url} onChange={set('threads_url')} style={inputStyle} placeholder="https://www.threads.net/@..." />
        </Field>
      </div>

      <div style={col2}>
        <Field label="直近投稿日">
          <input type="date" value={form.last_post_date} onChange={set('last_post_date')} style={inputStyle} />
        </Field>
        <Field label="直近7日投稿数">
          <input type="number" value={form.posts_7d} onChange={set('posts_7d')} style={inputStyle} placeholder="件" />
        </Field>
      </div>

      <div style={col2}>
        <Field label="フォロワー数">
          <input type="number" value={form.followers} onChange={set('followers')} style={inputStyle} placeholder="人" />
        </Field>
        <Field label="リスト数">
          <input type="number" value={form.list_count} onChange={set('list_count')} style={inputStyle} placeholder="件" />
        </Field>
      </div>

      <div style={col2}>
        <Field label="リカバリー面談担当">
          <input type="text" value={form.recovery_closer} onChange={set('recovery_closer')} style={inputStyle} />
        </Field>
        <Field label="面談実施日">
          <input type="date" value={form.recovery_meeting_date} onChange={set('recovery_meeting_date')} style={inputStyle} />
        </Field>
      </div>

      {/* v2: タスク管理ツール由来のデータ */}
      <div style={col2}>
        <Field label="メールアドレス">
          <input type="email" value={form.email} onChange={set('email')} style={inputStyle} />
        </Field>
        <Field label="担当メンター">
          <input type="text" value={form.mentor} onChange={set('mentor')} style={inputStyle} />
        </Field>
      </div>

      <div style={col2}>
        <Field label="入会日">
          <input type="date" value={form.enrolled_date} onChange={set('enrolled_date')} style={inputStyle} />
        </Field>
        <Field label="コース開始日">
          <input type="date" value={form.course_start_date} onChange={set('course_start_date')} style={inputStyle} />
        </Field>
      </div>

      <div style={col2}>
        <Field label="コース終了日" note="未入力の場合は初回面談申込日＋契約期間で自動推定されます">
          <input type="date" value={form.course_end_date} onChange={set('course_end_date')} style={inputStyle} />
        </Field>
        <Field label="ツールステータス">
          <input type="text" value={form.tool_status} onChange={set('tool_status')} style={inputStyle} placeholder="例: 受講中" />
        </Field>
      </div>

      <div style={col2}>
        <Field label="フェーズ">
          <input type="text" value={form.phase} onChange={set('phase')} style={inputStyle} placeholder="例: Instagram" />
        </Field>
        <Field label="タスク進捗率(%)">
          <input type="number" min="0" max="100" value={form.progress_pct} onChange={set('progress_pct')} style={inputStyle} />
        </Field>
      </div>

      <div style={col2}>
        <Field label="最終アクティブ日">
          <input type="date" value={form.last_active_date} onChange={set('last_active_date')} style={inputStyle} />
        </Field>
        <Field label="総投稿数">
          <input type="number" value={form.posts_total} onChange={set('posts_total')} style={inputStyle} placeholder="件" />
        </Field>
      </div>

      <div style={col2}>
        <Field label="リール数">
          <input type="number" value={form.reels_total} onChange={set('reels_total')} style={inputStyle} placeholder="件" />
        </Field>
        <Field label="週次投稿目標">
          <input type="number" value={form.weekly_post_goal} onChange={set('weekly_post_goal')} style={inputStyle} placeholder="件/週" />
        </Field>
      </div>

      <div style={col2}>
        <Field label="週次投稿実績">
          <input type="number" value={form.weekly_post_actual} onChange={set('weekly_post_actual')} style={inputStyle} placeholder="件/週" />
        </Field>
        <Field label="Instagramハンドル">
          <input type="text" value={form.instagram_handle} onChange={set('instagram_handle')} style={inputStyle} placeholder="@..." />
        </Field>
      </div>

      <Field label="Threadsハンドル">
        <input type="text" value={form.threads_handle} onChange={set('threads_handle')} style={inputStyle} placeholder="@..." />
      </Field>

      {/* v3: 決済CSV由来のサマリー（通常は取込で入るため編集不要。手入力は例外対応時のみ） */}
      <div style={{ fontSize: 11, fontWeight: 600, color: G.text3, marginTop: 4 }}>
        決済サマリー（決済CSV由来・通常は編集不要）
      </div>
      <div style={col2}>
        <Field label="決済額（税込・合計）">
          <input type="number" value={form.paid_total} onChange={set('paid_total')} style={inputStyle} placeholder="円" />
        </Field>
        <Field label="決済プラン">
          <select value={form.payment_plan} onChange={set('payment_plan')} style={inputStyle}>
            {PLAN_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </div>

      <div style={col2}>
        <Field label="決済状況">
          <select value={form.payment_state} onChange={set('payment_state')} style={inputStyle}>
            {PAYMENT_STATE_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="決済回数">
          <input type="number" value={form.payment_count} onChange={set('payment_count')} style={inputStyle} placeholder="件" />
        </Field>
      </div>

      <Field label="初回申込日（決済）">
        <input type="date" value={form.first_order_date} onChange={set('first_order_date')} style={inputStyle} />
      </Field>

      <Field label="つまずき・メモ">
        <textarea value={form.notes} onChange={set('notes')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
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
          {state === 'submitting' ? '保存中...' : (isEdit ? '保存' : '受講生を追加')}
        </button>
      </div>
    </form>
  );
}
