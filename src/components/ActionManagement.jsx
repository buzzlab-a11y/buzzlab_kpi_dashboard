import React from 'react';
import { COLORS, MONTHS, WEEKLY_TASKS, MONTH_KPI, CHANNEL_CONFIGS } from '../data/constants';

const CHANNELS_ORDER = ['instagram', 'youtube', 'threads', 'jv', 'line'];

export default function ActionManagement({ taskData, onUpdate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.darkBlue})`,
        borderRadius: 20,
        padding: '28px 32px',
        color: '#fff',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>行動管理シート</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>各担当者の月別・週次タスク管理 | ミーティングで確認</div>
      </div>

      {/* Channel Legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {CHANNELS_ORDER.map(ch => {
          const cfg = CHANNEL_CONFIGS[ch];
          return (
            <div key={ch} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', borderRadius: 20, padding: '6px 14px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              border: `1.5px solid ${cfg.color}40`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy }}>{cfg.icon} {cfg.name}</span>
              <span style={{ fontSize: 11, color: '#888' }}>{cfg.manager}</span>
            </div>
          );
        })}
      </div>

      {/* Month Blocks */}
      {MONTHS.map(month => (
        <div key={month} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {/* Month Header */}
          <div style={{
            background: COLORS.navy,
            padding: '14px 20px',
            color: '#fff',
            fontWeight: 800,
            fontSize: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{month}</span>
          </div>

          {/* Channel Rows */}
          <div>
            {CHANNELS_ORDER.map((ch, ci) => {
              const cfg = CHANNEL_CONFIGS[ch];
              const tasks = WEEKLY_TASKS[ch];
              const kpi = MONTH_KPI[month]?.[ch] || '-';
              const stored = taskData?.[month]?.[ch] || {};

              return (
                <div key={ch} style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr 1fr 1fr 1fr 180px',
                  borderBottom: ci < CHANNELS_ORDER.length - 1 ? `1px solid #f5f5f5` : 'none',
                  minHeight: 80,
                }}>
                  {/* Channel Label */}
                  <div style={{
                    background: cfg.color,
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '10px 14px',
                  }}>
                    <div style={{ fontSize: 16 }}>{cfg.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{cfg.name}</div>
                    <div style={{ fontSize: 10, opacity: 0.85 }}>{cfg.manager}</div>
                  </div>

                  {/* Week Tasks */}
                  {[0, 1, 2, 3].map(wi => {
                    const wk = `w${wi + 1}`;
                    const placeholder = tasks?.[wi] || `第${wi + 1}週タスク`;
                    return (
                      <div key={wi} style={{ padding: '8px 10px', borderLeft: '1px solid #f5f5f5' }}>
                        <div style={{
                          display: 'inline-block',
                          background: [COLORS.instagram, COLORS.pink, COLORS.orange, COLORS.yellow][wi] + '20',
                          color: [COLORS.instagram, COLORS.pink, COLORS.orange, '#B8860B'][wi],
                          borderRadius: 6, padding: '1px 7px', fontSize: 10, fontWeight: 700, marginBottom: 4,
                        }}>
                          第{wi + 1}週
                        </div>
                        <div style={{ fontSize: 10, color: '#aaa', marginBottom: 4, whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                          {placeholder.split('\n')[0]}
                        </div>
                        <textarea
                          value={stored[wk] || ''}
                          onChange={e => onUpdate(month, ch, wk, e.target.value)}
                          placeholder="進捗・メモを入力..."
                          rows={2}
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '6px 8px', borderRadius: 8,
                            border: '1.5px solid #eee',
                            background: stored[wk] ? COLORS.lightPurple : '#fafafa',
                            fontSize: 11, resize: 'none',
                            color: COLORS.navy, outline: 'none',
                            transition: 'border-color 0.2s',
                            lineHeight: 1.4,
                          }}
                          onFocus={e => { e.target.style.borderColor = cfg.color; }}
                          onBlur={e => { e.target.style.borderColor = '#eee'; }}
                        />
                      </div>
                    );
                  })}

                  {/* KPI Goal */}
                  <div style={{
                    background: COLORS.lightPurple,
                    padding: '10px 14px',
                    borderLeft: '1px solid #f0e5ff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 4, fontWeight: 600 }}>月間KPI目標</div>
                    <div style={{ fontSize: 11, color: COLORS.navy, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{kpi}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
