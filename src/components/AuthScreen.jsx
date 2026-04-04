import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { G } from '../styles/theme';

export default function AuthScreen() {
  const [mode,     setMode]     = useState('login');   // 'login' | 'signup' | 'reset'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState(null);  // { type: 'error'|'success', text }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      setMessage(error
        ? { type: 'error', text: error.message }
        : { type: 'success', text: 'パスワードリセットメールを送信しました。' }
      );
      setLoading(false);
      return;
    }

    const fn = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { error } = await fn;
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else if (mode === 'signup') {
      setMessage({ type: 'success', text: '確認メールを送信しました。メールのリンクをクリックしてください。' });
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: G.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: G.surface,
        borderRadius: G.radiusLg,
        border: `1px solid ${G.border}`,
        boxShadow: G.shadow2,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 400,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: `linear-gradient(135deg, ${G.primary}, #4285f4)`,
            borderRadius: G.radiusMd,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 12px',
          }}>🚀</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: G.text1 }}>BuzzLab KPI</div>
          <div style={{ fontSize: 13, color: G.text3, marginTop: 4 }}>2026 ロードマップダッシュボード</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 24, borderRadius: G.radiusMd, background: G.bg, padding: 4 }}>
          {[['login', 'ログイン'], ['signup', '新規登録']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setMode(id); setMessage(null); }}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: G.radius,
                background: mode === id ? G.surface : 'transparent',
                color: mode === id ? G.text1 : G.text3,
                fontWeight: mode === id ? 600 : 400,
                fontSize: 14,
                boxShadow: mode === id ? G.shadow1 : 'none',
                transition: G.transition,
              }}
            >{label}</button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: G.radius,
            marginBottom: 16,
            fontSize: 13,
            background: message.type === 'error' ? G.errorContainer : G.successContainer,
            color: message.type === 'error' ? G.error : G.success,
            border: `1px solid ${message.type === 'error' ? G.error + '40' : G.success + '40'}`,
          }}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: G.text2, display: 'block', marginBottom: 6 }}>
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: G.radius,
                border: `1.5px solid ${G.border}`,
                fontSize: 14,
                color: G.text1,
                outline: 'none',
                transition: G.transition,
              }}
              onFocus={e => { e.target.style.borderColor = G.primary; e.target.style.boxShadow = `0 0 0 3px ${G.primary}22`; }}
              onBlur={e => { e.target.style.borderColor = G.border; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: G.text2, display: 'block', marginBottom: 6 }}>
                パスワード
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="6文字以上"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: G.radius,
                  border: `1.5px solid ${G.border}`,
                  fontSize: 14,
                  color: G.text1,
                  outline: 'none',
                  transition: G.transition,
                }}
                onFocus={e => { e.target.style.borderColor = G.primary; e.target.style.boxShadow = `0 0 0 3px ${G.primary}22`; }}
                onBlur={e => { e.target.style.borderColor = G.border; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px 0',
              borderRadius: G.radius,
              border: 'none',
              background: loading ? G.border : G.primary,
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              marginTop: 4,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : mode === 'signup' ? 'アカウント作成' : 'メール送信'}
          </button>
        </form>

        {/* Password reset link */}
        {mode === 'login' && (
          <button
            onClick={() => { setMode('reset'); setMessage(null); }}
            style={{
              display: 'block', width: '100%', marginTop: 16,
              background: 'none', border: 'none',
              color: G.primary, fontSize: 13, textAlign: 'center',
            }}
          >
            パスワードを忘れた場合
          </button>
        )}
        {mode === 'reset' && (
          <button
            onClick={() => { setMode('login'); setMessage(null); }}
            style={{
              display: 'block', width: '100%', marginTop: 16,
              background: 'none', border: 'none',
              color: G.text3, fontSize: 13, textAlign: 'center',
            }}
          >
            ← ログインに戻る
          </button>
        )}
      </div>
    </div>
  );
}
