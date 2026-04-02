import React, { useState } from 'react';
import { COLORS, MONTHS, WEEKLY_TASKS, MONTH_KPI, CHANNEL_CONFIGS } from '../data/constants';
import { useBreakpoint } from '../hooks/useBreakpoint';

const CHANNELS_ORDER = ['instagram', 'youtube', 'threads', 'jv', 'line'];

// モバイル: 月単位で折りたたみ表示
function MobileMonthBlock({ month, taskData, onUpdate }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', border: 'none',
          background: COLORS.navy,
          padding: '13px 16px',
          color: '#fff', fontWeight: 800, fontSize: 15,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <span>{month}</span>
        <span style={{ fontSize: 18, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
      </button>

      {open && (
        <div style={{ padding: '12px' }}>
          {CHANNELS_ORDER.map(ch => {
            const cfg = CHANNEL_CONFIGS[ch];
            const tasks = WEEKLY_TASKS[ch];
            const kpi = MONTH_KPI[month]?.[ch] || '-';
            const stored = taskData?.[month]?.[ch] || {};

            return (
              <div key={ch} style={{ marginBottom: 14 }}>
                {/* Channel label */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: cfg.color, color: '#fff',
                  borderRadius: 10, padding: '7px 12px', marginBottom: 8,
                }}>
                  <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{cfg.name}</span>
                  <span style={{ fontSize: 11, opacity: 0.85 }}>{cfg.manager}</span>
                </div>

                {/* KPI */}
                <div style={{
                  background: COLORS.lightPurple, borderRadius: 8,
                  padding: '8px 12px', marginBottom: 8,
                  borderLeft: `3px solid ${cfg.color}`,
                  fontSize: 11, color: COLORS.navy, whiteSpace: 'pre-line', lineHeight: 1.5,
                }}>
                  <span style={{ fontWeight: 600, color: '#888', fontSize: 10 }}>月間KPI目標: </span>{kpi}
                </div>

                {/* Week inputs 2x2 grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[0, 1, 2, 3].map(wi => {
                    const wk = `w${wi + 1}`;
                    const placeholder = tasks?.[wi]?.split('\n')[0] || `第${wi + 1}週タスク`;
                    return (
                      <div key={wi}>
                        <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>
                          <span style={{
                            background: [COLORS.instagram, COLORS.pink, COLORS.orange, COLORS.yellow][wi] + '30',
                            color: [COLORS.instagram, COLORS.pink, COLORS.orange, '#B8860B'][wi],
                            borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700,
                          }}>第{wi + 1}週</span>
                          {' '}{placeholder}
                        </div>
                        <textarea
                          value={stored[wk] || ''}
                          onChange={e => onUpdate(month, ch, wk, e.target.value)}
                          placeholder="進捗を入力..."
                          rows={2}
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '6px 8px', borderRadius: 8,
                            border: '1.5px solid #eee',
                            background: stored[wk] ? COLORS.lightPurple : '#fafafa',
                            fontSize: 11, resize: 'none', color: COLORS.navy, outline: 'none',
                            lineHeight: 1.4,
                          }}
                          onFocus={e => { e.target.style.borderColor = cfg.color; }}
                          onBlur={e => { e.target.style.borderColor = '#eee'; }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ActionManagement({ taskData, onUpdate }) {
  const { isMobile, isTablet } = useBreakpoint();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.darkBlue})`,
        borderRadius: isMobile ? 16 : 20,
        padding: isMobile ? '20px' : '28px 32px',
        color: '#fff',
      }}>
        <div style={{ fontSize: isMobile ? 24 : 32, marginBottom: 6 }}>✅</div>
        <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800 }}>行動管理シート</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>各担当者の月別・週次タスク管理 | ミーティングで確認</div>
      </div>

      {/* Channel Legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CHANNELS_ORDER.map(ch => {
          const cfg = CHANNEL_CONFIGS[ch];
          return (
            <div key={ch} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', borderRadius: 20, padding: '5px 12px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              border: `1.5px solid ${cfg.color}40`,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />
              <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: COLORS.navy }}>{cfg.icon} {cfg.name}</span>
              {!isMobile && <span style={{ fontSize: 10, color: '#888' }}>{cfg.manager}</span>}
            </div>
          );
        })}
      </div>

      {/* Mobile: accordion */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MONTHS.map(month => (
            <MobileMonthBlock key={month} month={month} taskData={taskData} onUpdate={onUpdate} />
          ))}
        </div>
      ) : (
        /* Tablet & Desktop: full table */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {MONTHS.map(month => (
            <div key={month} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ background: COLORS.navy, padding: '12px 18px', color: '#fff', fontWeight: 800, fontSize: 15 }}>
                {month}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: isTablet ? 700 : 'auto' }}>
                  {CHANNELS_ORDER.map((ch, ci) => {
                    const cfg = CHANNEL_CONFIGS[ch];
                    const tasks = WEEKLY_TASKS[ch];
                    const kpi = MONTH_KPI[month]?.[ch] || '-';
                    const stored = taskData?.[month]?.[ch] || {};

                    return (
                      <div key={ch} style={{
                        display: 'grid',
                        gridTemplateColumns: isTablet ? '120px 1fr 1fr 1fr 1fr 150px' : '140px 1fr 1fr 1fr 1fr 180px',
                        borderBottom: ci < CHANNELS_ORDER.length - 1 ? '1px solid #f5f5f5' : 'none',
                        minHeight: 80,
                      }}>
                        {/* Channel Label */}
                        <div style={{
                          background: cfg.color, color: '#fff',
                          display: 'flex', flexDirection: 'column', justifyContent: 'center',
                          padding: '10px 12px',
                        }}>
                          <div style={{ fontSize: 15 }}>{cfg.icon}</div>
                          <div style={{ fontSize: isTablet ? 11 : 12, fontWeight: 700, lineHeight: 1.3 }}>{cfg.name}</div>
                          <div style={{ fontSize: 9, opacity: 0.85 }}>{cfg.manager}</div>
                        </div>

                        {/* Week columns */}
                        {[0, 1, 2, 3].map(wi => {
                          const wk = `w${wi + 1}`;
                          const placeholder = tasks?.[wi] || `第${wi + 1}週タスク`;
                          return (
                            <div key={wi} style={{ padding: '8px 8px', borderLeft: '1px solid #f5f5f5' }}>
                              <div style={{
                                display: 'inline-block',
                                background: [COLORS.instagram, COLORS.pink, COLORS.orange, COLORS.yellow][wi] + '20',
                                color: [COLORS.instagram, COLORS.pink, COLORS.orange, '#B8860B'][wi],
                                borderRadius: 5, padding: '1px 6px', fontSize: 9, fontWeight: 700, marginBottom: 3,
                              }}>第{wi + 1}週</div>
                              <div style={{ fontSize: 9, color: '#bbb', marginBottom: 4, whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                                {placeholder.split('\n')[0]}
                              </div>
                              <textarea
                                value={stored[wk] || ''}
                                onChange={e => onUpdate(month, ch, wk, e.target.value)}
                                placeholder="進捗・メモ..."
                                rows={2}
                                style={{
                                  width: '100%', boxSizing: 'border-box',
                                  padding: '5px 7px', borderRadius: 7,
                                  border: '1.5px solid #eee',
                                  background: stored[wk] ? COLORS.lightPurple : '#fafafa',
                                  fontSize: 11, resize: 'none', color: COLORS.navy, outline: 'none',
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
                          background: COLORS.lightPurple, padding: '10px 12px',
                          borderLeft: '1px solid #f0e5ff',
                          display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        }}>
                          <div style={{ fontSize: 9, color: '#888', marginBottom: 3, fontWeight: 600 }}>月間KPI目標</div>
                          <div style={{ fontSize: isTablet ? 10 : 11, color: COLORS.navy, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{kpi}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
